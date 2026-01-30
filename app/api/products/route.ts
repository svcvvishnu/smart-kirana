import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");

        const products = await prisma.product.findMany({
            where: {
                sellerId: session.user.sellerId,
                isActive: true,
                ...(categoryId && { categoryId }),
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user has OWNER role
        if (session.user.role !== "OWNER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const {
            name,
            categoryId,
            purchasePrice,
            sellingPrice,
            currentStock,
            minStockLevel,
            description,
        } = body;

        // Validation
        if (!name || !categoryId || purchasePrice === undefined || sellingPrice === undefined) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (purchasePrice < 0 || sellingPrice < 0) {
            return NextResponse.json(
                { error: "Prices cannot be negative" },
                { status: 400 }
            );
        }

        // Check subscription limits
        const subscription = await prisma.subscription.findUnique({
            where: { sellerId: session.user.sellerId },
            include: { plan: true },
        });

        if (subscription?.plan.maxProducts) {
            const productCount = await prisma.product.count({
                where: {
                    sellerId: session.user.sellerId,
                    isActive: true,
                },
            });

            if (productCount >= subscription.plan.maxProducts) {
                return NextResponse.json(
                    { error: `Product limit reached (${subscription.plan.maxProducts}). Upgrade your plan.` },
                    { status: 403 }
                );
            }
        }

        // Create product
        const product = await prisma.product.create({
            data: {
                name,
                categoryId,
                sellerId: session.user.sellerId,
                purchasePrice: parseFloat(purchasePrice),
                sellingPrice: parseFloat(sellingPrice),
                currentStock: parseInt(currentStock) || 0,
                minStockLevel: parseInt(minStockLevel) || 10,
                description: description || null,
            },
            include: {
                category: true,
            },
        });

        // Create initial stock transaction if stock > 0
        if (product.currentStock > 0) {
            await prisma.stockTransaction.create({
                data: {
                    productId: product.id,
                    quantity: product.currentStock,
                    purchasePrice: product.purchasePrice,
                    transactionType: "PURCHASE",
                    notes: "Initial stock",
                    createdBy: session.user.id,
                },
            });
        }

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json(
            { error: "Failed to create product" },
            { status: 500 }
        );
    }
}
