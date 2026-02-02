import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SaleInvoice } from "@/components/billing/sale-invoice";
import { ArrowLeft, Receipt } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout";

interface SaleDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function SaleDetailPage({ params }: SaleDetailPageProps) {
    const session = await auth();
    const { id } = await params;

    if (!session) {
        redirect("/login");
    }

    if (session.user.role !== "OWNER" && session.user.role !== "OPERATIONS") {
        redirect("/dashboard");
    }

    const sellerId = session.user.sellerId;
    if (!sellerId) {
        redirect("/dashboard");
    }

    const sale = await prisma.sale.findFirst({
        where: {
            id,
            sellerId,
        },
        include: {
            customer: true,
            items: {
                include: {
                    product: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
            seller: {
                select: {
                    shopName: true,
                    address: true,
                    phone: true,
                },
            },
        },
    });

    if (!sale) {
        notFound();
    }

    return (
        <AppShell user={{ name: session.user.name || "User", role: session.user.role as "OWNER" | "OPERATIONS" }}>
            <div className="p-6">
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/sales">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Sales
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-indigo-600" />
                            Invoice {sale.saleNumber}
                        </h1>
                    </div>
                </div>

                <SaleInvoice sale={sale} />
            </div>
        </AppShell>
    );
}
