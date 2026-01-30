import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductsClient } from "./products-client";

export default async function ProductsPage() {
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

    // Fetch products and categories
    const [products, categories] = await Promise.all([
        prisma.product.findMany({
            where: {
                sellerId: session.user.sellerId,
                isActive: true,
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
                createdAt: "desc",
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
    ]);

    return <ProductsClient initialProducts={products} initialCategories={categories} />;
}
