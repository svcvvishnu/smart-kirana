import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SubscriptionsClient } from "./subscriptions-client";

export default async function AdminSubscriptionsPage() {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        redirect("/login");
    }

    // Fetch subscription plans with counts
    const plans = await prisma.subscriptionPlan.findMany({
        include: {
            _count: {
                select: {
                    subscriptions: true,
                },
            },
        },
        orderBy: {
            price: "asc",
        },
    });

    // Fetch all subscriptions
    const subscriptions = await prisma.subscription.findMany({
        include: {
            seller: {
                select: {
                    id: true,
                    shopName: true,
                    ownerName: true,
                    email: true,
                    isActive: true,
                },
            },
            plan: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // Fetch sellers without subscriptions
    const sellersWithoutSub = await prisma.seller.findMany({
        where: {
            subscription: null,
        },
        select: {
            id: true,
            shopName: true,
            ownerName: true,
        },
    });

    return (
        <SubscriptionsClient
            plans={plans}
            subscriptions={subscriptions}
            sellersWithoutSub={sellersWithoutSub}
        />
    );
}
