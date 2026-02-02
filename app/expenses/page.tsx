import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ExpensesClient } from "./expenses-client";

export default async function ExpensesPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    // Only OWNER can view expenses
    if (session.user.role !== "OWNER") {
        redirect("/dashboard");
    }

    const sellerId = session.user.sellerId;
    if (!sellerId) {
        redirect("/dashboard");
    }

    // Fetch initial expenses
    const expenses = await prisma.expense.findMany({
        where: { sellerId },
        orderBy: { date: "desc" },
        take: 50,
    });

    // Get monthly summary
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyTotal = await prisma.expense.aggregate({
        where: {
            sellerId,
            date: { gte: startOfMonth },
        },
        _sum: { amount: true },
        _count: true,
    });

    // Get total all time
    const allTimeTotal = await prisma.expense.aggregate({
        where: { sellerId },
        _sum: { amount: true },
        _count: true,
    });

    // Category breakdown for this month
    const categoryBreakdown = await prisma.expense.groupBy({
        by: ["category"],
        where: {
            sellerId,
            date: { gte: startOfMonth },
        },
        _sum: { amount: true },
        _count: true,
    });

    const stats = {
        monthlyTotal: monthlyTotal._sum.amount || 0,
        monthlyCount: monthlyTotal._count,
        allTimeTotal: allTimeTotal._sum.amount || 0,
        allTimeCount: allTimeTotal._count,
        categoryBreakdown: categoryBreakdown.map((c) => ({
            category: c.category,
            amount: c._sum.amount || 0,
            count: c._count,
        })),
    };

    return <ExpensesClient initialExpenses={expenses} stats={stats} />;
}
