import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { BillingClient } from "./billing-client";
import { AppShell } from "@/components/layout";

export default async function BillingPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    // Check if user is OWNER or OPERATIONS
    if (session.user.role !== "OWNER" && session.user.role !== "OPERATIONS") {
        redirect("/dashboard");
    }

    if (!session.user.sellerId) {
        redirect("/dashboard");
    }

    // Fetch data
    const [products, categories, customers] = await Promise.all([
        prisma.product.findMany({
            where: {
                sellerId: session.user.sellerId,
                isActive: true,
                currentStock: {
                    gt: 0,
                },
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
                name: "asc",
            },
        }),
        prisma.category.findMany({
            where: {
                sellerId: session.user.sellerId,
            },
            orderBy: {
                name: "asc",
            },
        }),
        prisma.customer.findMany({
            where: {
                sellerId: session.user.sellerId,
            },
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

    return (
        <AppShell user={{ name: session.user.name || "User", role: session.user.role as "OWNER" | "OPERATIONS" }}>
            <BillingClient products={products} categories={categories} customers={customers} />
        </AppShell>
    );
}
