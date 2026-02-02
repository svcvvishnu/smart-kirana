import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Store, Users, Package, Receipt, TrendingUp, MapPin, Phone, Mail } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface SellerDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function SupportSellerDetailPage({ params }: SellerDetailPageProps) {
    const session = await auth();
    const { id } = await params;

    if (!session || session.user.role !== "SUPPORT") {
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

    // Get sales summary (read-only)
    const salesSummary = await prisma.sale.aggregate({
        where: { sellerId: id },
        _sum: { total: true },
        _count: true,
    });

    return (
        <div className="p-8">
            <div className="mb-8">
                <Link href="/support/sellers">
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
                            <Receipt className="h-8 w-8 text-cyan-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Orders</p>
                                <p className="text-2xl font-bold text-white mt-2">
                                    {salesSummary._count}
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
                        <CardTitle className="text-white">Seller Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50">
                            <Mail className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-sm text-slate-400">Email</p>
                                <p className="text-white">{seller.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50">
                            <Phone className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-sm text-slate-400">Phone</p>
                                <p className="text-white">{seller.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50">
                            <MapPin className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-sm text-slate-400">Address</p>
                                <p className="text-white">{seller.address || "Not provided"}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                            <div>
                                <p className="text-sm text-slate-400">Subscription Plan</p>
                                <p className="text-white font-medium">
                                    {seller.subscription?.plan.name || "No Plan"}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {seller.subscription?.plan.tier || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Member Since</p>
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
                                    <div className="text-right">
                                        <span className="px-2 py-1 rounded text-xs bg-slate-600 text-slate-300">
                                            {user.role}
                                        </span>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {format(new Date(user.createdAt), "MMM dd, yyyy")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {seller.users.length === 0 && (
                                <p className="text-slate-400 text-center py-4">No users found</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Read-only notice */}
            <div className="mt-6 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-center">
                <p className="text-cyan-400 text-sm">
                    This is a read-only view. Contact an administrator to make changes.
                </p>
            </div>
        </div>
    );
}
