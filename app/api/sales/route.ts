import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PrismaClient } from "@prisma/client";

type PrismaTransaction = Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// Generate unique sale number
async function generateSaleNumber(sellerId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD

    // Find the last sale number for today
    const lastSale = await prisma.sale.findFirst({
        where: {
            sellerId,
            saleNumber: {
                startsWith: `INV-${dateStr}`,
            },
        },
        orderBy: {
            saleNumber: "desc",
        },
    });

    let sequence = 1;
    if (lastSale) {
        const parts = lastSale.saleNumber.split("-");
        if (parts.length >= 3) {
            const lastSequence = parseInt(parts[2], 10);
            if (!isNaN(lastSequence) && lastSequence > 0) {
                sequence = lastSequence + 1;
            }
        }
    }

    return `INV-${dateStr}-${sequence.toString().padStart(3, "0")}`;
}

// GET /api/sales - Fetch all sales
export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get("limit");
        const offsetParam = searchParams.get("offset");
        const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 50)) : 50;
        const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10) || 0) : 0;
        const customerId = searchParams.get("customerId");

        const sales = await prisma.sale.findMany({
            where: {
                sellerId: session.user.sellerId,
                ...(customerId && { customerId }),
            },
            include: {
                customer: {
                    select: {
                        name: true,
                        phone: true,
                    },
                },
                _count: {
                    select: {
                        items: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
            skip: offset,
        });

        return NextResponse.json(sales);
    } catch (error) {
        console.error("Error fetching sales:", error);
        return NextResponse.json(
            { error: "Failed to fetch sales" },
            { status: 500 }
        );
    }
}

// POST /api/sales - Create a new sale
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId || !session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check role
        if (session.user.role !== "OWNER" && session.user.role !== "OPERATIONS") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        let body;
        try {
            body = await request.json();
        } catch (error) {
            return NextResponse.json(
                { error: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        const { items, customerId, discountType, discountValue } = body;

        // Validate items
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "At least one item is required" },
                { status: 400 }
            );
        }

        // Validate item structure and check for duplicates
        const seenProductIds = new Set<string>();
        for (const item of items) {
            if (!item || typeof item !== "object") {
                return NextResponse.json(
                    { error: "Invalid item structure" },
                    { status: 400 }
                );
            }
            if (!item.productId || typeof item.productId !== "string") {
                return NextResponse.json(
                    { error: "Each item must have a valid productId" },
                    { status: 400 }
                );
            }
            if (
                typeof item.quantity !== "number" ||
                item.quantity <= 0 ||
                !Number.isInteger(item.quantity)
            ) {
                return NextResponse.json(
                    { error: "Each item must have a positive integer quantity" },
                    { status: 400 }
                );
            }
            if (seenProductIds.has(item.productId)) {
                return NextResponse.json(
                    { error: `Duplicate productId: ${item.productId}` },
                    { status: 400 }
                );
            }
            seenProductIds.add(item.productId);
        }

        // Validate discount
        if (discountType && discountType !== "PERCENTAGE" && discountType !== "FLAT") {
            return NextResponse.json(
                { error: "discountType must be 'PERCENTAGE' or 'FLAT'" },
                { status: 400 }
            );
        }
        if (discountValue !== undefined && discountValue !== null) {
            if (typeof discountValue !== "number" || discountValue < 0) {
                return NextResponse.json(
                    { error: "discountValue must be a non-negative number" },
                    { status: 400 }
                );
            }
            if (discountType === "PERCENTAGE" && discountValue > 100) {
                return NextResponse.json(
                    { error: "Percentage discount cannot exceed 100" },
                    { status: 400 }
                );
            }
        }

        // Validate customerId if provided
        if (customerId !== undefined && customerId !== null) {
            if (typeof customerId !== "string") {
                return NextResponse.json(
                    { error: "customerId must be a string" },
                    { status: 400 }
                );
            }
            // Verify customer belongs to seller
            const customer = await prisma.customer.findFirst({
                where: {
                    id: customerId,
                    sellerId: session.user.sellerId,
                },
            });
            if (!customer) {
                return NextResponse.json(
                    { error: "Customer not found or does not belong to your seller account" },
                    { status: 404 }
                );
            }
        }

        // Fetch all products to validate stock and prices
        const productIds = items.map((item: { productId: string; quantity: number }) => item.productId);
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                sellerId: session.user.sellerId,
                isActive: true,
            },
        });

        if (products.length !== productIds.length) {
            return NextResponse.json(
                { error: "One or more products not found" },
                { status: 404 }
            );
        }

        // Validate stock availability and prices
        for (const item of items) {
            const product = products.find((p: typeof products[number]) => p.id === item.productId);
            if (!product) {
                return NextResponse.json(
                    { error: `Product ${item.productId} not found` },
                    { status: 404 }
                );
            }
            if (product.currentStock < item.quantity) {
                return NextResponse.json(
                    {
                        error: `Insufficient stock for ${product.name}. Available: ${product.currentStock}`,
                    },
                    { status: 400 }
                );
            }
            if (product.sellingPrice <= 0) {
                return NextResponse.json(
                    { error: `Product ${product.name} has invalid selling price` },
                    { status: 400 }
                );
            }
            if (product.purchasePrice < 0) {
                return NextResponse.json(
                    { error: `Product ${product.name} has invalid purchase price` },
                    { status: 400 }
                );
            }
        }

        // Calculate totals
        let subtotal = 0;
        const saleItems = items.map((item: { productId: string; quantity: number }) => {
            const product = products.find((p: typeof products[number]) => p.id === item.productId)!;
            const itemSubtotal = product.sellingPrice * item.quantity;
            const itemProfit =
                (product.sellingPrice - product.purchasePrice) * item.quantity;

            subtotal += itemSubtotal;

            return {
                productId: product.id,
                quantity: item.quantity,
                purchasePrice: product.purchasePrice,
                sellingPrice: product.sellingPrice,
                subtotal: itemSubtotal,
                profit: itemProfit,
            };
        });

        // Calculate discount
        let discountAmount = 0;
        if (discountType && discountValue !== undefined && discountValue !== null) {
            if (discountType === "PERCENTAGE") {
                discountAmount = (subtotal * discountValue) / 100;
            } else if (discountType === "FLAT") {
                discountAmount = discountValue;
            }
            // Ensure discount doesn't exceed subtotal
            if (discountAmount > subtotal) {
                discountAmount = subtotal;
            }
        }

        const total = Math.max(0, subtotal - discountAmount);
        const totalProfit = saleItems.reduce((sum: number, item: { profit: number }) => sum + item.profit, 0);

        // Generate sale number
        const saleNumber = await generateSaleNumber(session.user.sellerId);

        // Create sale with items in a transaction
        const sale = await prisma.$transaction(async (tx: PrismaTransaction) => {
            // Re-validate stock inside transaction to prevent race conditions
            for (const item of items) {
                const currentProduct = await tx.product.findUnique({
                    where: { id: item.productId },
                    select: { currentStock: true, name: true },
                });

                if (!currentProduct) {
                    throw new Error(`Product ${item.productId} not found`);
                }

                if (currentProduct.currentStock < item.quantity) {
                    throw new Error(
                        `Insufficient stock for ${currentProduct.name}. Available: ${currentProduct.currentStock}`
                    );
                }
            }

            // Create sale
            const newSale = await tx.sale.create({
                data: {
                    saleNumber,
                    sellerId: session.user.sellerId!,
                    customerId: customerId || null,
                    subtotal,
                    discountType: discountType || null,
                    discountValue: discountValue || 0,
                    discountAmount,
                    total,
                    profit: totalProfit,
                    createdBy: session.user.id!,
                    items: {
                        create: saleItems,
                    },
                },
                include: {
                    items: true,
                    customer: true,
                },
            });

            // Update product stock and create stock transactions
            for (const item of items) {
                // Update stock (this will fail if stock goes negative due to race condition)
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        currentStock: {
                            decrement: item.quantity,
                        },
                    },
                });

                // Create stock transaction
                await tx.stockTransaction.create({
                    data: {
                        productId: item.productId,
                        quantity: -item.quantity,
                        transactionType: "SALE",
                        notes: `Sale ${saleNumber}`,
                        createdBy: session.user.id!,
                    },
                });
            }

            return newSale;
        });

        return NextResponse.json(sale, { status: 201 });
    } catch (error: any) {
        console.error("Error creating sale:", error);
        
        // Handle specific Prisma errors
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "Sale number already exists. Please try again." },
                { status: 409 }
            );
        }
        
        // Handle validation errors from transaction
        if (error.message && typeof error.message === "string") {
            if (error.message.includes("Insufficient stock") || error.message.includes("not found")) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 400 }
                );
            }
        }
        
        return NextResponse.json(
            { error: "Failed to create sale" },
            { status: 500 }
        );
    }
}
