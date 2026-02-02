import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/reports/sales - Fetch sales report data
export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only OWNER can view reports
        if (session.user.role !== "OWNER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const startDateStr = searchParams.get("startDate");
        const endDateStr = searchParams.get("endDate");

        // Parse dates
        const startDate = startDateStr ? new Date(startDateStr) : new Date(new Date().setMonth(new Date().getMonth() - 1));
        const endDate = endDateStr ? new Date(endDateStr) : new Date();
        
        // Set end of day for end date
        endDate.setHours(23, 59, 59, 999);

        const sellerId = session.user.sellerId;

        // Fetch sales data
        const sales = await prisma.sale.findMany({
            where: {
                sellerId,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                customer: {
                    select: {
                        name: true,
                        phone: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                category: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Calculate summary
        const summary = {
            totalSales: sales.reduce((sum, sale) => sum + sale.total, 0),
            totalProfit: sales.reduce((sum, sale) => sum + sale.profit, 0),
            totalDiscount: sales.reduce((sum, sale) => sum + sale.discountAmount, 0),
            totalOrders: sales.length,
            averageOrderValue: sales.length > 0 
                ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length 
                : 0,
        };

        // Group by date for daily summary
        const dailySummary = new Map<string, { date: string; sales: number; profit: number; orders: number }>();
        
        for (const sale of sales) {
            const dateStr = new Date(sale.createdAt).toISOString().split("T")[0];
            const existing = dailySummary.get(dateStr) || { date: dateStr, sales: 0, profit: 0, orders: 0 };
            existing.sales += sale.total;
            existing.profit += sale.profit;
            existing.orders += 1;
            dailySummary.set(dateStr, existing);
        }

        return NextResponse.json({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            summary,
            dailySummary: Array.from(dailySummary.values()).sort((a, b) => a.date.localeCompare(b.date)),
            sales: sales.map((sale) => ({
                id: sale.id,
                saleNumber: sale.saleNumber,
                date: sale.createdAt,
                customer: sale.customer?.name || "Walk-in",
                subtotal: sale.subtotal,
                discount: sale.discountAmount,
                total: sale.total,
                profit: sale.profit,
                items: sale.items.map((item) => ({
                    product: item.product.name,
                    category: item.product.category.name,
                    quantity: item.quantity,
                    price: item.sellingPrice,
                    subtotal: item.subtotal,
                    profit: item.profit,
                })),
            })),
        });
    } catch (error) {
        console.error("Error fetching sales report:", error);
        return NextResponse.json(
            { error: "Failed to fetch sales report" },
            { status: 500 }
        );
    }
}
