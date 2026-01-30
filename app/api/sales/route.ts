import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

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
        const lastSequence = parseInt(lastSale.saleNumber.split("-")[2]);
        sequence = lastSequence + 1;
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
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");
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

        const body = await request.json();
        const { items, customerId, discountType, discountValue } = body;

        // Validate items
        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: "At least one item is required" },
                { status: 400 }
            );
        }

        // Fetch all products to validate stock and prices
        const productIds = items.map((item: any) => item.productId);
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

        // Validate stock availability
        for (const item of items) {
            const product = products.find((p) => p.id === item.productId);
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
        }

        // Calculate totals
        let subtotal = 0;
        const saleItems = items.map((item: any) => {
            const product = products.find((p) => p.id === item.productId)!;
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
        if (discountType && discountValue) {
            if (discountType === "PERCENTAGE") {
                discountAmount = (subtotal * discountValue) / 100;
            } else if (discountType === "FLAT") {
                discountAmount = discountValue;
            }
        }

        const total = subtotal - discountAmount;
        const totalProfit = saleItems.reduce((sum, item) => sum + item.profit, 0);

        // Generate sale number
        const saleNumber = await generateSaleNumber(session.user.sellerId);

        // Create sale with items in a transaction
        const sale = await prisma.$transaction(async (tx) => {
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
                const product = products.find((p) => p.id === item.productId)!;

                // Update stock
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
    } catch (error) {
        console.error("Error creating sale:", error);
        return NextResponse.json(
            { error: "Failed to create sale" },
            { status: 500 }
        );
    }
}
