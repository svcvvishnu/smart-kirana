import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { CategoriesClient } from "./categories-client";

export default async function CategoriesPage() {
    const session = await auth();

    if (!session?.user?.sellerId) {
        redirect("/login");
    }

    if (session.user.role !== "OWNER") {
        redirect("/dashboard");
    }

    const categories = await prisma.category.findMany({
        where: { sellerId: session.user.sellerId },
        include: {
            _count: { select: { products: true } },
        },
        orderBy: { name: "asc" },
    });

    return (
        <AppShell user={{ name: session.user.name || "", role: session.user.role }}>
            <CategoriesClient categories={categories} />
        </AppShell>
    );
}
