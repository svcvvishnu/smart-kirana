import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SalesClient } from "./sales-client";
import { AppShell } from "@/components/layout";

export default async function SalesPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    // Only OWNER and OPERATIONS can view sales
    if (session.user.role !== "OWNER" && session.user.role !== "OPERATIONS") {
        redirect("/dashboard");
    }

    const sellerId = session.user.sellerId;
    if (!sellerId) {
        redirect("/dashboard");
    }

    // Fetch initial sales data
    const [sales, customers] = await Promise.all([
        prisma.sale.findMany({
            where: { sellerId },
            include: {
                customer: {
                    select: {
                        id: true,
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
            take: 50,
        }),
        prisma.customer.findMany({
            where: { sellerId },
            select: {
                id: true,
                name: true,
                phone: true,
            },
            orderBy: {
                name: "asc",
            },
        }),
    ]);

    // Get sales stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todaySales, totalSalesCount] = await Promise.all([
        prisma.sale.aggregate({
            where: {
                sellerId,
                createdAt: { gte: today },
            },
            _sum: { total: true, profit: true },
            _count: true,
        }),
        prisma.sale.count({ where: { sellerId } }),
    ]);

    const stats = {
        todaySales: todaySales._sum.total || 0,
        todayProfit: todaySales._sum.profit || 0,
        todayCount: todaySales._count,
        totalCount: totalSalesCount,
    };

    return (
        <AppShell user={{ name: session.user.name || "User", role: session.user.role as "OWNER" | "OPERATIONS" }}>
            <SalesClient 
                initialSales={sales} 
                customers={customers} 
                stats={stats}
                userRole={session.user.role}
            />
        </AppShell>
    );
}
