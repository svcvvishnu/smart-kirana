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
                unit: {
                    select: {
                        id: true,
                        name: true,
                        abbreviation: true,
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
            pricingMode,
            markupPercentage,
            unitId,
            currentStock,
            minStockLevel,
            description,
        } = body;

        // Validation
        if (!name || !categoryId || purchasePrice === undefined) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (purchasePrice < 0) {
            return NextResponse.json(
                { error: "Purchase price cannot be negative" },
                { status: 400 }
            );
        }

        // Determine final selling price based on pricing mode
        let finalSellingPrice = parseFloat(sellingPrice || 0);
        let finalPricingMode = pricingMode || "FIXED";
        let finalMarkup = markupPercentage != null ? parseFloat(markupPercentage) : null;

        if (finalPricingMode === "MARKUP" && finalMarkup != null) {
            finalSellingPrice = parseFloat(purchasePrice) * (1 + finalMarkup / 100);
        } else if (!sellingPrice && sellingPrice !== 0) {
            // Auto-apply seller defaults if no selling price provided
            const seller = await prisma.seller.findUnique({
                where: { id: session.user.sellerId },
                select: { defaultPricingMode: true, defaultMarkupPercentage: true },
            });
            if (seller?.defaultPricingMode === "MARKUP" && seller.defaultMarkupPercentage > 0) {
                finalPricingMode = "MARKUP";
                finalMarkup = seller.defaultMarkupPercentage;
                finalSellingPrice = parseFloat(purchasePrice) * (1 + finalMarkup / 100);
            }
        }

        if (finalSellingPrice < 0) {
            return NextResponse.json(
                { error: "Selling price cannot be negative" },
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
                sellingPrice: finalSellingPrice,
                pricingMode: finalPricingMode,
                markupPercentage: finalMarkup,
                unitId: unitId || null,
                currentStock: parseInt(currentStock) || 0,
                minStockLevel: parseInt(minStockLevel) || 10,
                description: description || null,
            },
            include: {
                category: true,
                unit: true,
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
