import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Users, TrendingUp, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PageHeader, StatCard, StatGrid } from "@/components/layout";
import Link from "next/link";

export default async function AdminDashboardPage() {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        redirect("/login");
    }

    // Fetch admin stats
    const [
        totalSellers,
        activeSellers,
        totalUsers,
        subscriptionStats,
        recentSellers,
        platformStats,
    ] = await Promise.all([
        prisma.seller.count(),
        prisma.seller.count({ where: { isActive: true } }),
        prisma.user.count(),
        prisma.subscription.groupBy({
            by: ["planId"],
            _count: true,
        }),
        prisma.seller.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
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
        }),
        prisma.sale.aggregate({
            _sum: { total: true, profit: true },
            _count: true,
        }),
    ]);

    // Get subscription plan names
    const plans = await prisma.subscriptionPlan.findMany();
    const planMap = new Map(plans.map((p) => [p.id, p]));

    const subscriptionBreakdown = subscriptionStats.map((s) => ({
        plan: planMap.get(s.planId)?.name || "Unknown",
        tier: planMap.get(s.planId)?.tier || "Unknown",
        count: s._count,
    }));

    return (
        <div className="p-6">
            <PageHeader
                title="Admin Dashboard"
                description="Platform overview and management"
            />

            <StatGrid columns={4}>
                <StatCard
                    title="Total Sellers"
                    value={totalSellers.toString()}
                    icon={Store}
                    subtitle={`${activeSellers} active`}
                    variant="primary"
                />
                <StatCard
                    title="Total Users"
                    value={totalUsers.toString()}
                    icon={Users}
                />
                <StatCard
                    title="Platform Sales"
                    value={formatCurrency(platformStats._sum.total || 0)}
                    icon={TrendingUp}
                    subtitle={`${platformStats._count} orders`}
                    variant="success"
                />
                <StatCard
                    title="Active Subscriptions"
                    value={subscriptionBreakdown.reduce((sum, s) => sum + s.count, 0).toString()}
                    icon={CreditCard}
                />
            </StatGrid>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* Subscription Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Subscription Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {subscriptionBreakdown.map((sub) => (
                                <div
                                    key={sub.tier}
                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{sub.plan}</p>
                                        <p className="text-sm text-gray-500">{sub.tier}</p>
                                    </div>
                                    <span className="text-xl font-semibold text-gray-900">{sub.count}</span>
                                </div>
                            ))}
                            {subscriptionBreakdown.length === 0 && (
                                <p className="text-gray-500 text-center py-4">
                                    No subscriptions yet
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Sellers */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Recent Sellers</CardTitle>
                        <Link
                            href="/admin/sellers"
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            View All →
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentSellers.map((seller) => (
                                <div
                                    key={seller.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{seller.shopName}</p>
                                        <p className="text-sm text-gray-500">
                                            {seller.ownerName} • {seller._count.products} products
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
                                            {seller.subscription?.plan.tier || "No Plan"}
                                        </p>
                                    </div>
                                </div>
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
