import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SupportSellersClient } from "./sellers-client";

export default async function SupportSellersPage() {
    const session = await auth();

    if (!session || session.user.role !== "SUPPORT") {
        redirect("/login");
    }

    // Fetch all sellers (read-only)
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
                    customers: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return <SupportSellersClient sellers={sellers} />;
}
