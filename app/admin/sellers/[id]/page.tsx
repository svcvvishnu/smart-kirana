import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Store, Users, Package, Receipt, TrendingUp, Mail, Phone, MapPin, Calendar, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout";

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
        <div className="p-6">
            <div className="mb-6">
                <Link href="/admin/sellers">
                    <Button variant="ghost" className="text-gray-600 hover:text-purple-600 mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Sellers
                    </Button>
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{seller.shopName}</h1>
                        <p className="text-gray-500 mt-1">
                            {seller.businessType.replace("_", " ")} • {seller.ownerName}
                        </p>
                    </div>
                    <span
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                            seller.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                        }`}
                    >
                        {seller.isActive ? "Active" : "Inactive"}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Sales</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {formatCurrency(salesSummary._sum.total || 0)}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Receipt className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-emerald-200 bg-emerald-50/50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Profit</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">
                                    {formatCurrency(salesSummary._sum.profit || 0)}
                                </p>
                            </div>
                            <div className="p-3 bg-emerald-100 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Products</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {seller._count.products}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <Package className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Customers</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {seller._count.customers}
                                </p>
                            </div>
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <Users className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Seller Details */}
                <Card>
                    <CardHeader className="border-b">
                        <CardTitle className="text-lg font-semibold text-gray-900">Seller Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                                    <p className="text-gray-900">{seller.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Phone</p>
                                    <p className="text-gray-900">{seller.phone}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">Address</p>
                                <p className="text-gray-900">{seller.address || "Not provided"}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                            <div className="flex items-start gap-3">
                                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Subscription</p>
                                    <p className="text-gray-900">
                                        {seller.subscription?.plan.name || "No Plan"}
                                        {seller.subscription && (
                                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                                                {seller.subscription.plan.tier}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Joined</p>
                                    <p className="text-gray-900">
                                        {format(new Date(seller.createdAt), "MMM dd, yyyy")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Users */}
                <Card>
                    <CardHeader className="border-b">
                        <CardTitle className="text-lg font-semibold text-gray-900">Users ({seller.users.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-3">
                            {seller.users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium">
                                            {user.name?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{user.name}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                        user.role === "OWNER" 
                                            ? "bg-purple-100 text-purple-700" 
                                            : "bg-gray-200 text-gray-700"
                                    }`}>
                                        {user.role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Sales */}
            <Card className="mt-6">
                <CardHeader className="border-b">
                    <CardTitle className="text-lg font-semibold text-gray-900">Recent Sales</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {recentSales.length === 0 ? (
                        <div className="text-center py-8">
                            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No sales yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentSales.map((sale) => (
                                <div
                                    key={sale.id}
                                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{sale.saleNumber}</p>
                                        <p className="text-sm text-gray-500">
                                            {sale.customer?.name || "Walk-in"} •{" "}
                                            {format(new Date(sale.createdAt), "MMM dd, yyyy")}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">
                                            {formatCurrency(sale.total)}
                                        </p>
                                        <p className="text-sm font-medium text-emerald-600">
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
