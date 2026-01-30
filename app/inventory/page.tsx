import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { InventoryClient } from "./inventory-client";

export default async function InventoryPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    // Check if user is OWNER
    if (session.user.role !== "OWNER") {
        redirect("/dashboard");
    }

    if (!session.user.sellerId) {
        redirect("/dashboard");
    }

    // Fetch data
    const [products, transactions, stats] = await Promise.all([
        prisma.product.findMany({
            where: {
                sellerId: session.user.sellerId,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                currentStock: true,
                minStockLevel: true,
            },
            orderBy: {
                name: "asc",
            },
        }),
        prisma.stockTransaction.findMany({
            where: {
                product: {
                    sellerId: session.user.sellerId,
                },
            },
            include: {
                product: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 20,
        }),
        prisma.product.findMany({
            where: {
                sellerId: session.user.sellerId,
                isActive: true,
            },
            select: {
                currentStock: true,
                minStockLevel: true,
            },
        }),
    ]);

    const totalProducts = stats.length;
    const lowStockCount = stats.filter((p) => p.currentStock < p.minStockLevel).length;
    const outOfStockCount = stats.filter((p) => p.currentStock === 0).length;

    return (
        <InventoryClient
            products={products}
            initialTransactions={transactions}
            stats={{
                totalProducts,
                lowStockCount,
                outOfStockCount,
            }}
        />
    );
}
