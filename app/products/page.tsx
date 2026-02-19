import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductsClient } from "./products-client";
import { AppShell } from "@/components/layout";

export default async function ProductsPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    if (session.user.role !== "OWNER") {
        redirect("/dashboard");
    }

    if (!session.user.sellerId) {
        redirect("/dashboard");
    }

    const [products, categories, units, seller] = await Promise.all([
        prisma.product.findMany({
            where: {
                sellerId: session.user.sellerId,
                isActive: true,
            },
            include: {
                category: {
                    select: { id: true, name: true },
                },
                unit: {
                    select: { id: true, name: true, abbreviation: true },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.category.findMany({
            where: { sellerId: session.user.sellerId },
            orderBy: { name: "asc" },
        }),
        prisma.unit.findMany({
            where: {
                OR: [
                    { sellerId: null },
                    { sellerId: session.user.sellerId },
                ],
            },
            orderBy: { name: "asc" },
        }),
        prisma.seller.findUnique({
            where: { id: session.user.sellerId },
            select: { defaultPricingMode: true, defaultMarkupPercentage: true },
        }),
    ]);

    return (
        <AppShell user={{ name: session.user.name || "User", role: session.user.role as "OWNER" }}>
            <ProductsClient
                initialProducts={products}
                initialCategories={categories}
                initialUnits={units}
                sellerDefaults={seller || { defaultPricingMode: "FIXED", defaultMarkupPercentage: 0 }}
            />
        </AppShell>
    );
}
