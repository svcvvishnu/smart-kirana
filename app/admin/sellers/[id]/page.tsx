import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Store, Users, Package, Receipt, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface SellerDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function SellerDetailPage({ params }: SellerDetailPageProps) {
    const session = await auth();
    const { id } = await params;

    if (!session || session.user.role !== "ADMIN") {
        redirect("/login");
    }

    const seller = await prisma.seller.findUnique({
        where: { id },
        include: {
            subscription: {
                include: {
                    plan: true,
                },
            },
            users: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    createdAt: true,
                },
            },
            _count: {
                select: {
                    products: true,
                    sales: true,
                    customers: true,
                },
            },
        },
    });

    if (!seller) {
        notFound();
    }

    // Get sales summary
    const salesSummary = await prisma.sale.aggregate({
        where: { sellerId: id },
        _sum: { total: true, profit: true },
        _count: true,
    });

    // Get recent sales
    const recentSales = await prisma.sale.findMany({
        where: { sellerId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
            customer: true,
        },
    });

    return (
        <div className="p-8">
            <div className="mb-8">
                <Link href="/admin/sellers">
                    <Button variant="ghost" className="text-slate-300 mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Sellers
                    </Button>
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">{seller.shopName}</h1>
                        <p className="text-slate-400 mt-1">
                            {seller.businessType.replace("_", " ")} • {seller.ownerName}
                        </p>
                    </div>
                    <span
                        className={`px-3 py-1 rounded-full text-sm ${
                            seller.isActive
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-red-500/20 text-red-400"
                        }`}
                    >
                        {seller.isActive ? "Active" : "Inactive"}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-4 mb-8">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Total Sales</p>
                                <p className="text-2xl font-bold text-white mt-2">
                                    {formatCurrency(salesSummary._sum.total || 0)}
                                </p>
                            </div>
                            <Receipt className="h-8 w-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Total Profit</p>
                                <p className="text-2xl font-bold text-emerald-400 mt-2">
                                    {formatCurrency(salesSummary._sum.profit || 0)}
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-emerald-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Products</p>
                                <p className="text-2xl font-bold text-white mt-2">
                                    {seller._count.products}
                                </p>
                            </div>
                            <Package className="h-8 w-8 text-purple-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Customers</p>
                                <p className="text-2xl font-bold text-white mt-2">
                                    {seller._count.customers}
                                </p>
                            </div>
                            <Users className="h-8 w-8 text-amber-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Seller Details */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Seller Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-400">Email</p>
                                <p className="text-white">{seller.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Phone</p>
                                <p className="text-white">{seller.phone}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Address</p>
                            <p className="text-white">{seller.address || "Not provided"}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-400">Subscription</p>
                                <p className="text-white">
                                    {seller.subscription?.plan.name || "No Plan"} (
                                    {seller.subscription?.plan.tier || "N/A"})
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Joined</p>
                                <p className="text-white">
                                    {format(new Date(seller.createdAt), "MMM dd, yyyy")}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Users */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Users ({seller.users.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {seller.users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50"
                                >
                                    <div>
                                        <p className="font-medium text-white">{user.name}</p>
                                        <p className="text-sm text-slate-400">{user.email}</p>
                                    </div>
                                    <span className="px-2 py-1 rounded text-xs bg-slate-600 text-slate-300">
                                        {user.role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Sales */}
            <Card className="mt-6 bg-slate-800 border-slate-700">
                <CardHeader>
                    <CardTitle className="text-white">Recent Sales</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentSales.length === 0 ? (
                        <p className="text-slate-400 text-center py-8">No sales yet</p>
                    ) : (
                        <div className="space-y-3">
                            {recentSales.map((sale) => (
                                <div
                                    key={sale.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50"
                                >
                                    <div>
                                        <p className="font-medium text-white">{sale.saleNumber}</p>
                                        <p className="text-sm text-slate-400">
                                            {sale.customer?.name || "Walk-in"} •{" "}
                                            {format(new Date(sale.createdAt), "MMM dd, yyyy")}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-white">
                                            {formatCurrency(sale.total)}
                                        </p>
                                        <p className="text-sm text-emerald-400">
                                            +{formatCurrency(sale.profit)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
