import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, HelpCircle } from "lucide-react";
import { PageHeader, StatCard, StatGrid } from "@/components/layout";
import Link from "next/link";

export default async function SupportDashboardPage() {
    const session = await auth();

    if (!session || session.user.role !== "SUPPORT") {
        redirect("/login");
    }

    const [totalSellers, activeSellers, recentSellers] = await Promise.all([
        prisma.seller.count(),
        prisma.seller.count({ where: { isActive: true } }),
        prisma.seller.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                subscription: {
                    include: {
                        plan: true,
                    },
                },
            },
        }),
    ]);

    return (
        <div className="p-6">
            <PageHeader
                title="Support Dashboard"
                description="View and assist sellers"
            />

            <StatGrid columns={3}>
                <StatCard
                    title="Total Sellers"
                    value={totalSellers.toString()}
                    icon={Store}
                    subtitle={`${activeSellers} active`}
                    variant="primary"
                />
                <StatCard
                    title="Inactive Sellers"
                    value={(totalSellers - activeSellers).toString()}
                    icon={Users}
                    subtitle="May need assistance"
                />
                <StatCard
                    title="Support Queue"
                    value="0"
                    icon={HelpCircle}
                    subtitle="No pending tickets"
                />
            </StatGrid>

            <div className="mt-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Recent Sellers</CardTitle>
                        <Link
                            href="/support/sellers"
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            View All →
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentSellers.map((seller) => (
                                <Link
                                    key={seller.id}
                                    href={`/support/sellers/${seller.id}`}
                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{seller.shopName}</p>
                                        <p className="text-sm text-gray-500">
                                            {seller.ownerName} • {seller.phone}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span
                                            className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                                seller.isActive
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                        >
                                            {seller.isActive ? "Active" : "Inactive"}
                                        </span>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {seller.subscription?.plan.name || "No Plan"}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                            {recentSellers.length === 0 && (
                                <p className="text-gray-500 text-center py-4">No sellers yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
