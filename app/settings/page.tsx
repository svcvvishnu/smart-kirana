import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user?.sellerId) {
        redirect("/login");
    }

    if (session.user.role !== "OWNER") {
        redirect("/dashboard");
    }

    const [seller, units] = await Promise.all([
        prisma.seller.findUnique({
            where: { id: session.user.sellerId },
            select: {
                id: true,
                shopName: true,
                defaultPricingMode: true,
                defaultMarkupPercentage: true,
            },
        }),
        prisma.unit.findMany({
            where: {
                OR: [
                    { sellerId: null },
                    { sellerId: session.user.sellerId },
                ],
            },
            include: {
                _count: { select: { products: true } },
            },
            orderBy: { name: "asc" },
        }),
    ]);

    if (!seller) {
        redirect("/dashboard");
    }

    return (
        <AppShell user={{ name: session.user.name || "", role: session.user.role }}>
            <SettingsClient seller={seller} units={units} />
        </AppShell>
    );
}
