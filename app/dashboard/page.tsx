import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, Users, AlertTriangle, ShoppingCart, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DashboardPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    const { user } = session;

    // Fetch dashboard data based on role
    const stats = await getDashboardStats(user.sellerId, user.role);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="border-b bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                                Smart Kirana
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Welcome back, {user.name}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-muted-foreground">Role</p>
                                <p className="text-lg font-semibold capitalize">{user.role.toLowerCase()}</p>
                            </div>
                            <LogoutButton />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Sales"
                        value={formatCurrency(stats.totalSales)}
                        icon={<ShoppingCart className="h-5 w-5" />}
                        trend="+12% from last month"
                    />
                    <StatCard
                        title="Total Products"
                        value={stats.totalProducts.toString()}
                        icon={<Package className="h-5 w-5" />}
                        trend={`${stats.lowStockCount} low stock`}
                    />
                    {user.role === "OWNER" && (
                        <>
                            <StatCard
                                title="Total Profit"
                                value={formatCurrency(stats.totalProfit)}
                                icon={<TrendingUp className="h-5 w-5" />}
                                trend="+8% from last month"
                                highlight
                            />
                            <StatCard
                                title="Customers"
                                value={stats.totalCustomers.toString()}
                                icon={<Users className="h-5 w-5" />}
                                trend={`${stats.activeCustomers} active`}
                            />
                        </>
                    )}
                </div>

                {stats.lowStockCount > 0 && (
                    <Card className="mt-6 border-yellow-200 bg-yellow-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-yellow-900">
                                <AlertTriangle className="h-5 w-5" />
                                Low Stock Alert
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-yellow-800">
                                You have {stats.lowStockCount} product(s) running low on stock. Please restock soon.
                            </p>
                        </CardContent>
                    </Card>
                )}

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {user.role === "OPERATIONS" || user.role === "OWNER" ? (
                                <ActionButton href="/billing" label="Create New Bill" />
                            ) : null}
                            {user.role === "OWNER" ? (
                                <>
                                    <ActionButton href="/products" label="Manage Products" />
                                    <ActionButton href="/inventory" label="Update Stock" />
                                    <ActionButton href="/customers" label="View Customers" />
                                </>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                No recent activity to display.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    trend,
    highlight = false
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: string;
    highlight?: boolean;
}) {
    return (
        <Card className={highlight ? "border-indigo-200 bg-gradient-to-br from-indigo-50 to-cyan-50" : ""}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold mt-2">{value}</p>
                        {trend && (
                            <p className="text-xs text-muted-foreground mt-2">{trend}</p>
                        )}
                    </div>
                    <div className={`p-3 rounded-xl ${highlight ? 'bg-gradient-to-br from-indigo-600 to-cyan-600' : 'bg-gray-100'}`}>
                        <div className={highlight ? 'text-white' : 'text-gray-600'}>
                            {icon}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ActionButton({ href, label }: { href: string; label: string }) {
    return (
        <a
            href={href}
            className="block px-4 py-3 bg-white hover:bg-gray-50 border rounded-lg transition-colors text-sm font-medium"
        >
            {label} →
        </a>
    );
}

async function getDashboardStats(sellerId: string | null, role: string) {
    if (!sellerId) {
        return {
            totalSales: 0,
            totalProducts: 0,
            totalProfit: 0,
            totalCustomers: 0,
            activeCustomers: 0,
            lowStockCount: 0,
        };
    }

    const [products, sales, customers] = await Promise.all([
        prisma.product.findMany({
            where: { sellerId },
            select: {
                currentStock: true,
                minStockLevel: true,
            },
        }),
        prisma.sale.findMany({
            where: { sellerId },
            select: {
                total: true,
                profit: true,
            },
        }),
        prisma.customer.count({
            where: { sellerId },
        }),
    ]);


    const totalSales = sales.reduce((sum: number, sale: { total: number }) => sum + sale.total, 0);
    const totalProfit = sales.reduce((sum: number, sale: { profit: number }) => sum + sale.profit, 0);
    const lowStockCount = products.filter(
        (p: { currentStock: number; minStockLevel: number }) => p.currentStock < p.minStockLevel
    ).length;

    return {
        totalSales,
        totalProducts: products.length,
        totalProfit,
        totalCustomers: customers,
        activeCustomers: Math.floor(customers * 0.7), // Mock data
        lowStockCount,
    };
}

