import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SellersClient } from "./sellers-client";

export default async function AdminSellersPage() {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        redirect("/login");
    }

    // Fetch sellers
    const sellers = await prisma.seller.findMany({
        include: {
            subscription: {
                include: {
                    plan: true,
                },
            },
            _count: {
                select: {
                    users: true,
                    products: true,
                    sales: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // Fetch subscription plans
    const plans = await prisma.subscriptionPlan.findMany({
        orderBy: {
            price: "asc",
        },
    });

    return <SellersClient initialSellers={sellers} subscriptionPlans={plans} />;
}
