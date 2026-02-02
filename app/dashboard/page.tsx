import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, Users, AlertTriangle, ShoppingCart, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AppShell, PageHeader, StatCard, StatGrid } from "@/components/layout";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    const { user } = session;

    // Fetch dashboard data based on role
    const stats = await getDashboardStats(user.sellerId, user.role);

    return (
        <AppShell user={{ name: user.name || "User", role: user.role as "OWNER" | "OPERATIONS" }}>
            <div className="p-6">
                <PageHeader
                    title={`Welcome back, ${user.name}`}
                    description="Here's your business overview for today"
                />

                <StatGrid columns={4}>
                    <StatCard
                        title="Total Sales"
                        value={formatCurrency(stats.totalSales)}
                        icon={ShoppingCart}
                        trend={{ value: "+12%", type: "up" }}
                        subtitle="from last month"
                    />
                    <StatCard
                        title="Total Products"
                        value={stats.totalProducts.toString()}
                        icon={Package}
                        subtitle={`${stats.lowStockCount} low stock`}
                    />
                    {user.role === "OWNER" && (
                        <>
                            <StatCard
                                title="Total Profit"
                                value={formatCurrency(stats.totalProfit)}
                                icon={TrendingUp}
                                trend={{ value: "+8%", type: "up" }}
                                subtitle="from last month"
                                variant="primary"
                            />
                            <StatCard
                                title="Customers"
                                value={stats.totalCustomers.toString()}
                                icon={Users}
                                subtitle={`${stats.activeCustomers} active`}
                            />
                        </>
                    )}
                </StatGrid>

                {stats.lowStockCount > 0 && (
                    <Card className="mt-6 border-amber-200 bg-amber-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-amber-800 text-base">
                                <AlertTriangle className="h-5 w-5" />
                                Low Stock Alert
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-amber-700">
                                You have {stats.lowStockCount} product(s) running low on stock. 
                                <Link href="/inventory" className="ml-1 font-medium underline hover:no-underline">
                                    View inventory
                                </Link>
                            </p>
                        </CardContent>
                    </Card>
                )}

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart3 className="h-5 w-5 text-gray-500" />
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {(user.role === "OPERATIONS" || user.role === "OWNER") && (
                                <>
                                    <ActionButton href="/billing" label="Create New Bill" />
                                    <ActionButton href="/sales" label="View Sales History" />
                                </>
                            )}
                            {user.role === "OWNER" && (
                                <>
                                    <ActionButton href="/products" label="Manage Products" />
                                    <ActionButton href="/inventory" label="Update Stock" />
                                    <ActionButton href="/customers" label="View Customers" />
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Business Tools</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {user.role === "OWNER" && (
                                <>
                                    <ActionButton href="/analytics" label="View Analytics" />
                                    <ActionButton href="/reports" label="Generate Reports" />
                                    <ActionButton href="/expenses" label="Track Expenses" />
                                    <ActionButton href="/notifications" label="Notifications" />
                                </>
                            )}
                            {user.role === "OPERATIONS" && (
                                <p className="text-sm text-gray-500 py-4">
                                    Contact shop owner for access to analytics and reports.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppShell>
    );
}

function ActionButton({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium text-gray-700 group"
        >
            <span>{label}</span>
            <span className="text-gray-400 group-hover:text-gray-600 transition-colors">→</span>
        </Link>
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
        activeCustomers: Math.floor(customers * 0.7),
        lowStockCount,
    };
}
