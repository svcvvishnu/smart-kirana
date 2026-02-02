import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/reports/profit-loss - Fetch profit & loss report
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

        // Fetch sales revenue and profit
        const salesData = await prisma.sale.aggregate({
            where: {
                sellerId,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                total: true,
                profit: true,
                discountAmount: true,
            },
            _count: true,
        });

        // Fetch expenses
        const expenses = await prisma.expense.findMany({
            where: {
                sellerId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: {
                date: "desc",
            },
        });

        // Group expenses by category
        const expensesByCategory = new Map<string, number>();
        let totalExpenses = 0;

        for (const expense of expenses) {
            const existing = expensesByCategory.get(expense.category) || 0;
            expensesByCategory.set(expense.category, existing + expense.amount);
            totalExpenses += expense.amount;
        }

        // Calculate net profit
        const grossProfit = salesData._sum.profit || 0;
        const netProfit = grossProfit - totalExpenses;

        // Daily breakdown
        const salesByDate = await prisma.sale.groupBy({
            by: ["createdAt"],
            where: {
                sellerId,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                total: true,
                profit: true,
            },
        });

        // Group by date
        const dailyData = new Map<string, { 
            date: string; 
            revenue: number; 
            profit: number; 
            expenses: number;
            netProfit: number;
        }>();

        // Initialize with expenses
        for (const expense of expenses) {
            const dateStr = new Date(expense.date).toISOString().split("T")[0];
            const existing = dailyData.get(dateStr) || { 
                date: dateStr, 
                revenue: 0, 
                profit: 0, 
                expenses: 0,
                netProfit: 0,
            };
            existing.expenses += expense.amount;
            dailyData.set(dateStr, existing);
        }

        // Add sales data
        for (const sale of salesByDate) {
            const dateStr = new Date(sale.createdAt).toISOString().split("T")[0];
            const existing = dailyData.get(dateStr) || { 
                date: dateStr, 
                revenue: 0, 
                profit: 0, 
                expenses: 0,
                netProfit: 0,
            };
            existing.revenue += sale._sum.total || 0;
            existing.profit += sale._sum.profit || 0;
            dailyData.set(dateStr, existing);
        }

        // Calculate net profit for each day
        for (const [key, data] of dailyData) {
            data.netProfit = data.profit - data.expenses;
            dailyData.set(key, data);
        }

        return NextResponse.json({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            summary: {
                totalRevenue: salesData._sum.total || 0,
                grossProfit: grossProfit,
                totalExpenses: totalExpenses,
                netProfit: netProfit,
                totalDiscounts: salesData._sum.discountAmount || 0,
                totalOrders: salesData._count,
                profitMargin: (salesData._sum.total || 0) > 0 
                    ? (netProfit / (salesData._sum.total || 1)) * 100 
                    : 0,
            },
            expensesByCategory: Array.from(expensesByCategory.entries()).map(([category, amount]) => ({
                category,
                amount,
            })),
            expenses: expenses.map((e) => ({
                id: e.id,
                category: e.category,
                amount: e.amount,
                description: e.description,
                date: e.date,
            })),
            dailyData: Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date)),
        });
    } catch (error) {
        console.error("Error fetching P&L report:", error);
        return NextResponse.json(
            { error: "Failed to fetch profit & loss report" },
            { status: 500 }
        );
    }
}
