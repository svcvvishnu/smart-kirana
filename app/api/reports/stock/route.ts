import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/reports/stock - Fetch stock report data
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only OWNER can view reports
        if (session.user.role !== "OWNER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const sellerId = session.user.sellerId;

        // Fetch all products with stock info
        const products = await prisma.product.findMany({
            where: {
                sellerId,
                isActive: true,
            },
            include: {
                category: {
                    select: {
                        name: true,
                    },
                },
                stockTransactions: {
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 10,
                    select: {
                        quantity: true,
                        transactionType: true,
                        createdAt: true,
                        notes: true,
                    },
                },
            },
            orderBy: [
                {
                    currentStock: "asc",
                },
                {
                    name: "asc",
                },
            ],
        });

        // Calculate stock value
        const stockSummary = {
            totalProducts: products.length,
            totalStockValue: products.reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0),
            totalSellingValue: products.reduce((sum, p) => sum + (p.currentStock * p.sellingPrice), 0),
            potentialProfit: products.reduce((sum, p) => sum + (p.currentStock * (p.sellingPrice - p.purchasePrice)), 0),
            lowStockCount: products.filter(p => p.currentStock > 0 && p.currentStock < p.minStockLevel).length,
            outOfStockCount: products.filter(p => p.currentStock === 0).length,
            healthyStockCount: products.filter(p => p.currentStock >= p.minStockLevel).length,
        };

        // Category-wise stock
        const categoryStock = new Map<string, { 
            category: string; 
            products: number; 
            totalStock: number; 
            stockValue: number;
            lowStock: number;
            outOfStock: number;
        }>();

        for (const product of products) {
            const categoryName = product.category.name;
            const existing = categoryStock.get(categoryName) || {
                category: categoryName,
                products: 0,
                totalStock: 0,
                stockValue: 0,
                lowStock: 0,
                outOfStock: 0,
            };
            
            existing.products += 1;
            existing.totalStock += product.currentStock;
            existing.stockValue += product.currentStock * product.purchasePrice;
            
            if (product.currentStock === 0) {
                existing.outOfStock += 1;
            } else if (product.currentStock < product.minStockLevel) {
                existing.lowStock += 1;
            }
            
            categoryStock.set(categoryName, existing);
        }

        return NextResponse.json({
            summary: stockSummary,
            categoryStock: Array.from(categoryStock.values()),
            products: products.map((product) => ({
                id: product.id,
                name: product.name,
                category: product.category.name,
                currentStock: product.currentStock,
                minStockLevel: product.minStockLevel,
                purchasePrice: product.purchasePrice,
                sellingPrice: product.sellingPrice,
                stockValue: product.currentStock * product.purchasePrice,
                potentialProfit: product.currentStock * (product.sellingPrice - product.purchasePrice),
                status: product.currentStock === 0 
                    ? "OUT_OF_STOCK" 
                    : product.currentStock < product.minStockLevel 
                        ? "LOW_STOCK" 
                        : "HEALTHY",
                recentTransactions: product.stockTransactions,
            })),
        });
    } catch (error) {
        console.error("Error fetching stock report:", error);
        return NextResponse.json(
            { error: "Failed to fetch stock report" },
            { status: 500 }
        );
    }
}
