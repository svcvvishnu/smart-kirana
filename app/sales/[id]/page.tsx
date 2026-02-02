import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SaleInvoice } from "@/components/billing/sale-invoice";
import { ArrowLeft, Receipt } from "lucide-react";

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/sales">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:bg-white/20"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Sales
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-2">
                                    <Receipt className="h-8 w-8" />
                                    Invoice {sale.saleNumber}
                                </h1>
                                <p className="text-emerald-100 mt-1">
                                    Sale details and invoice
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <SaleInvoice sale={sale} />
            </div>
        </div>
    );
}
