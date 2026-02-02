import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Users, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function SupportDashboardPage() {
    const session = await auth();

    if (!session || session.user.role !== "SUPPORT") {
        redirect("/login");
    }

    // Fetch support stats
    const [totalSellers, activeSellers, inactiveSellers, recentSellers] = await Promise.all([
        prisma.seller.count(),
        prisma.seller.count({ where: { isActive: true } }),
        prisma.seller.count({ where: { isActive: false } }),
        prisma.seller.findMany({
            take: 10,
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
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Support Dashboard</h1>
                <p className="text-slate-400 mt-1">View seller information and status</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-4 mb-8">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Total Sellers</p>
                                <p className="text-3xl font-bold text-white mt-2">{totalSellers}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-cyan-500/20">
                                <Store className="h-6 w-6 text-cyan-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Active Sellers</p>
                                <p className="text-3xl font-bold text-emerald-400 mt-2">{activeSellers}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-500/20">
                                <CheckCircle className="h-6 w-6 text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Inactive Sellers</p>
                                <p className="text-3xl font-bold text-red-400 mt-2">{inactiveSellers}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-red-500/20">
                                <AlertTriangle className="h-6 w-6 text-red-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">My Role</p>
                                <p className="text-xl font-bold text-white mt-2">Support Agent</p>
                                <p className="text-xs text-slate-500 mt-1">Read-only access</p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-500/20">
                                <Users className="h-6 w-6 text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Sellers */}
            <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white">Recent Sellers</CardTitle>
                    <Link
                        href="/support/sellers"
                        className="text-sm text-cyan-400 hover:text-cyan-300"
                    >
                        View All →
                    </Link>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentSellers.map((seller) => (
                            <Link
                                key={seller.id}
                                href={`/support/sellers/${seller.id}`}
                                className="block p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-white">{seller.shopName}</p>
                                        <p className="text-sm text-slate-400">
                                            {seller.ownerName} • {seller.email}
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
                            </Link>
                        ))}
                        {recentSellers.length === 0 && (
                            <p className="text-slate-400 text-center py-4">No sellers found</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
