import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Users, CreditCard, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
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
        // Get platform-wide sales stats
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
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-slate-400 mt-1">Platform overview and management</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-4 mb-8">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Total Sellers</p>
                                <p className="text-3xl font-bold text-white mt-2">{totalSellers}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {activeSellers} active
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/20">
                                <Store className="h-6 w-6 text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Total Users</p>
                                <p className="text-3xl font-bold text-white mt-2">{totalUsers}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-500/20">
                                <Users className="h-6 w-6 text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Platform Sales</p>
                                <p className="text-3xl font-bold text-white mt-2">
                                    {formatCurrency(platformStats._sum.total || 0)}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {platformStats._count} orders
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-500/20">
                                <TrendingUp className="h-6 w-6 text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Active Subscriptions</p>
                                <p className="text-3xl font-bold text-white mt-2">
                                    {subscriptionBreakdown.reduce((sum, s) => sum + s.count, 0)}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-500/20">
                                <CreditCard className="h-6 w-6 text-amber-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Subscription Breakdown */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Subscription Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {subscriptionBreakdown.map((sub) => (
                                <div
                                    key={sub.tier}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50"
                                >
                                    <div>
                                        <p className="font-medium text-white">{sub.plan}</p>
                                        <p className="text-sm text-slate-400">{sub.tier}</p>
                                    </div>
                                    <span className="text-2xl font-bold text-white">{sub.count}</span>
                                </div>
                            ))}
                            {subscriptionBreakdown.length === 0 && (
                                <p className="text-slate-400 text-center py-4">
                                    No subscriptions yet
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Sellers */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-white">Recent Sellers</CardTitle>
                        <Link
                            href="/admin/sellers"
                            className="text-sm text-blue-400 hover:text-blue-300"
                        >
                            View All →
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentSellers.map((seller) => (
                                <div
                                    key={seller.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50"
                                >
                                    <div>
                                        <p className="font-medium text-white">{seller.shopName}</p>
                                        <p className="text-sm text-slate-400">
                                            {seller.ownerName} • {seller._count.products} products
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${
                                                seller.isActive
                                                    ? "bg-emerald-500/20 text-emerald-400"
                                                    : "bg-red-500/20 text-red-400"
                                            }`}
                                        >
                                            {seller.isActive ? "Active" : "Inactive"}
                                        </span>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {seller.subscription?.plan.tier || "No Plan"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {recentSellers.length === 0 && (
                                <p className="text-slate-400 text-center py-4">No sellers yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
