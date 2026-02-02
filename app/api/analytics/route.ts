import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/analytics - Fetch analytics data
export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only OWNER can view analytics
        if (session.user.role !== "OWNER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "month"; // day, week, month, all

        // Calculate date range
        const now = new Date();
        let startDate: Date | undefined;

        if (period === "day") {
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
        } else if (period === "week") {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
        } else if (period === "month") {
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 1);
            startDate.setHours(0, 0, 0, 0);
        }
        // If "all", startDate is undefined (no filter)

        const dateFilter = startDate ? { createdAt: { gte: startDate } } : {};
        const sellerId = session.user.sellerId;

        // Fetch all analytics data in parallel
        const [
            topSellingProducts,
            topProfitableProducts,
            topCustomers,
            categoryStats,
            overviewStats,
            salesTrend,
        ] = await Promise.all([
            // Top Selling Products (by quantity)
            prisma.saleItem.groupBy({
                by: ["productId"],
                where: {
                    sale: {
                        sellerId,
                        ...dateFilter,
                    },
                },
                _sum: {
                    quantity: true,
                    subtotal: true,
                    profit: true,
                },
                orderBy: {
                    _sum: {
                        quantity: "desc",
                    },
                },
                take: 10,
            }),

            // Top Profitable Products (by profit)
            prisma.saleItem.groupBy({
                by: ["productId"],
                where: {
                    sale: {
                        sellerId,
                        ...dateFilter,
                    },
                },
                _sum: {
                    quantity: true,
                    subtotal: true,
                    profit: true,
                },
                orderBy: {
                    _sum: {
                        profit: "desc",
                    },
                },
                take: 10,
            }),

            // Top Customers (by total spending)
            prisma.sale.groupBy({
                by: ["customerId"],
                where: {
                    sellerId,
                    customerId: { not: null },
                    ...dateFilter,
                },
                _sum: {
                    total: true,
                    profit: true,
                },
                _count: true,
                orderBy: {
                    _sum: {
                        total: "desc",
                    },
                },
                take: 10,
            }),

            // Category Stats - get categories with their sales
            getCategoryStats(sellerId, startDate),

            // Overview Stats
            prisma.sale.aggregate({
                where: {
                    sellerId,
                    ...dateFilter,
                },
                _sum: {
                    total: true,
                    profit: true,
                },
                _count: true,
            }),

            // Daily sales trend (last 7 days for day/week, last 30 days for month)
            getSalesTrend(sellerId, period),
        ]);

        // Get product names for top selling products
        const topSellingProductIds = topSellingProducts.map((p) => p.productId);
        const topProfitableProductIds = topProfitableProducts.map((p) => p.productId);
        const allProductIds = [...new Set([...topSellingProductIds, ...topProfitableProductIds])];

        const products = await prisma.product.findMany({
            where: {
                id: { in: allProductIds },
            },
            select: {
                id: true,
                name: true,
                category: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));

        // Get customer names for top customers
        const customerIds = topCustomers
            .map((c) => c.customerId)
            .filter((id): id is string => id !== null);

        const customers = await prisma.customer.findMany({
            where: {
                id: { in: customerIds },
            },
            select: {
                id: true,
                name: true,
                phone: true,
            },
        });

        const customerMap = new Map(customers.map((c) => [c.id, c]));

        // Format response
        const response = {
            period,
            overview: {
                totalSales: overviewStats._sum.total || 0,
                totalProfit: overviewStats._sum.profit || 0,
                totalOrders: overviewStats._count,
                averageOrderValue: overviewStats._count > 0 
                    ? (overviewStats._sum.total || 0) / overviewStats._count 
                    : 0,
            },
            topSellingProducts: topSellingProducts.map((p) => ({
                productId: p.productId,
                name: productMap.get(p.productId)?.name || "Unknown",
                category: productMap.get(p.productId)?.category?.name || "Unknown",
                quantitySold: p._sum.quantity || 0,
                totalSales: p._sum.subtotal || 0,
                totalProfit: p._sum.profit || 0,
            })),
            topProfitableProducts: topProfitableProducts.map((p) => ({
                productId: p.productId,
                name: productMap.get(p.productId)?.name || "Unknown",
                category: productMap.get(p.productId)?.category?.name || "Unknown",
                quantitySold: p._sum.quantity || 0,
                totalSales: p._sum.subtotal || 0,
                totalProfit: p._sum.profit || 0,
            })),
            topCustomers: topCustomers.map((c) => ({
                customerId: c.customerId,
                name: customerMap.get(c.customerId!)?.name || "Unknown",
                phone: customerMap.get(c.customerId!)?.phone || "",
                totalSpent: c._sum.total || 0,
                totalProfit: c._sum.profit || 0,
                orderCount: c._count,
            })),
            categoryStats: categoryStats as Array<{
                id: string;
                name: string;
                totalQuantity: number;
                totalSales: number;
                totalProfit: number;
            }>,
            salesTrend,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}

async function getCategoryStats(sellerId: string, startDate?: Date) {
    const categories = await prisma.category.findMany({
        where: { sellerId },
        select: {
            id: true,
            name: true,
            products: {
                select: {
                    saleItems: {
                        where: startDate ? {
                            sale: {
                                createdAt: { gte: startDate },
                            },
                        } : undefined,
                        select: {
                            quantity: true,
                            subtotal: true,
                            profit: true,
                        },
                    },
                },
            },
        },
    });

    return categories.map((category) => {
        const allItems = category.products.flatMap((p) => p.saleItems);
        return {
            id: category.id,
            name: category.name,
            totalQuantity: allItems.reduce((sum, item) => sum + item.quantity, 0),
            totalSales: allItems.reduce((sum, item) => sum + item.subtotal, 0),
            totalProfit: allItems.reduce((sum, item) => sum + item.profit, 0),
        };
    }).sort((a, b) => b.totalSales - a.totalSales);
}

async function getSalesTrend(sellerId: string, period: string) {
    const now = new Date();
    const days = period === "day" ? 1 : period === "week" ? 7 : 30;
    
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const sales = await prisma.sale.findMany({
        where: {
            sellerId,
            createdAt: { gte: startDate },
        },
        select: {
            total: true,
            profit: true,
            createdAt: true,
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    // Group by date
    const trendMap = new Map<string, { date: string; sales: number; profit: number; orders: number }>();
    
    // Initialize all days
    for (let i = 0; i <= days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];
        trendMap.set(dateStr, { date: dateStr, sales: 0, profit: 0, orders: 0 });
    }

    // Fill in actual data
    for (const sale of sales) {
        const dateStr = new Date(sale.createdAt).toISOString().split("T")[0];
        const existing = trendMap.get(dateStr);
        if (existing) {
            existing.sales += sale.total;
            existing.profit += sale.profit;
            existing.orders += 1;
        }
    }

    return Array.from(trendMap.values());
}
