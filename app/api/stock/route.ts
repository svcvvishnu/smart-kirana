import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "OWNER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { productId, quantity, transactionType, purchasePrice, notes } = body;

        // Validation
        if (!productId || !quantity || !transactionType) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (!["PURCHASE", "SALE", "ADJUSTMENT"].includes(transactionType)) {
            return NextResponse.json(
                { error: "Invalid transaction type" },
                { status: 400 }
            );
        }

        // Verify product belongs to seller
        const product = await prisma.product.findFirst({
            where: {
                id: productId,
                sellerId: session.user.sellerId,
                isActive: true,
            },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Calculate new stock
        const quantityChange = parseInt(quantity);
        const newStock = product.currentStock + quantityChange;

        if (newStock < 0) {
            return NextResponse.json(
                { error: "Insufficient stock" },
                { status: 400 }
            );
        }

        // Update product stock and create transaction in a transaction
        const [updatedProduct, stockTransaction] = await prisma.$transaction([
            prisma.product.update({
                where: { id: productId },
                data: {
                    currentStock: newStock,
                },
            }),
            prisma.stockTransaction.create({
                data: {
                    productId,
                    quantity: quantityChange,
                    purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
                    transactionType,
                    notes: notes || null,
                    createdBy: session.user.id,
                },
            }),
        ]);

        return NextResponse.json({
            product: updatedProduct,
            transaction: stockTransaction,
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating stock transaction:", error);
        return NextResponse.json(
            { error: "Failed to create stock transaction" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");
        const limit = parseInt(searchParams.get("limit") || "20");

        const transactions = await prisma.stockTransaction.findMany({
            where: {
                product: {
                    sellerId: session.user.sellerId,
                },
                ...(productId && { productId }),
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
        });

        return NextResponse.json(transactions);
    } catch (error) {
        console.error("Error fetching stock transactions:", error);
        return NextResponse.json(
            { error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}
