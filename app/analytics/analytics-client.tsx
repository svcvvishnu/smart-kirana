"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    BarChart3,
    Home,
    TrendingUp,
    ShoppingCart,
    Users,
    Package,
    Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts";

interface AnalyticsData {
    period: string;
    overview: {
        totalSales: number;
        totalProfit: number;
        totalOrders: number;
        averageOrderValue: number;
    };
    topSellingProducts: Array<{
        productId: string;
        name: string;
        category: string;
        quantitySold: number;
        totalSales: number;
        totalProfit: number;
    }>;
    topProfitableProducts: Array<{
        productId: string;
        name: string;
        category: string;
        quantitySold: number;
        totalSales: number;
        totalProfit: number;
    }>;
    topCustomers: Array<{
        customerId: string;
        name: string;
        phone: string;
        totalSpent: number;
        totalProfit: number;
        orderCount: number;
    }>;
    categoryStats: Array<{
        id: string;
        name: string;
        totalQuantity: number;
        totalSales: number;
        totalProfit: number;
    }>;
    salesTrend: Array<{
        date: string;
        sales: number;
        profit: number;
        orders: number;
    }>;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export function AnalyticsClient() {
    const [period, setPeriod] = useState<string>("month");
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/analytics?period=${period}`);
            if (res.ok) {
                const analyticsData = await res.json();
                setData(analyticsData);
            }
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    const getPeriodLabel = () => {
        switch (period) {
            case "day":
                return "Today";
            case "week":
                return "Last 7 Days";
            case "month":
                return "Last 30 Days";
            case "all":
                return "All Time";
            default:
                return "";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <div className="border-b border-purple-500/20 bg-black/20 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-purple-200 hover:bg-purple-500/20"
                                >
                                    <Home className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
                                    <BarChart3 className="h-8 w-8 text-purple-400" />
                                    Analytics Dashboard
                                </h1>
                                <p className="text-purple-300 mt-1">
                                    Insights and performance metrics
                                </p>
                            </div>
                        </div>
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-[180px] bg-purple-500/20 border-purple-500/30 text-white">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="day">Today</SelectItem>
                                <SelectItem value="week">Last 7 Days</SelectItem>
                                <SelectItem value="month">Last 30 Days</SelectItem>
                                <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                    </div>
                ) : data ? (
                    <div className="space-y-6">
                        {/* Overview Stats */}
                        <div className="grid gap-6 md:grid-cols-4">
                            <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-emerald-500/30">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-emerald-200">
                                                Total Sales
                                            </p>
                                            <p className="text-2xl font-bold mt-2 text-white">
                                                {formatCurrency(data.overview.totalSales)}
                                            </p>
                                            <p className="text-xs text-emerald-300 mt-1">
                                                {getPeriodLabel()}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-emerald-500/30">
                                            <ShoppingCart className="h-6 w-6 text-emerald-300" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-purple-200">
                                                Total Profit
                                            </p>
                                            <p className="text-2xl font-bold mt-2 text-white">
                                                {formatCurrency(data.overview.totalProfit)}
                                            </p>
                                            <p className="text-xs text-purple-300 mt-1">
                                                {getPeriodLabel()}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-purple-500/30">
                                            <TrendingUp className="h-6 w-6 text-purple-300" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-blue-200">
                                                Total Orders
                                            </p>
                                            <p className="text-2xl font-bold mt-2 text-white">
                                                {data.overview.totalOrders}
                                            </p>
                                            <p className="text-xs text-blue-300 mt-1">
                                                {getPeriodLabel()}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-blue-500/30">
                                            <Package className="h-6 w-6 text-blue-300" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 border-amber-500/30">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-amber-200">
                                                Avg. Order Value
                                            </p>
                                            <p className="text-2xl font-bold mt-2 text-white">
                                                {formatCurrency(data.overview.averageOrderValue)}
                                            </p>
                                            <p className="text-xs text-amber-300 mt-1">
                                                {getPeriodLabel()}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-amber-500/30">
                                            <Users className="h-6 w-6 text-amber-300" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sales Trend Chart */}
                        <Card className="bg-black/20 border-purple-500/20">
                            <CardHeader>
                                <CardTitle className="text-white">Sales Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data.salesTrend}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#4c1d95" />
                                            <XAxis
                                                dataKey="date"
                                                stroke="#a78bfa"
                                                tick={{ fill: "#a78bfa", fontSize: 12 }}
                                                tickFormatter={(value) => {
                                                    const date = new Date(value);
                                                    return `${date.getDate()}/${date.getMonth() + 1}`;
                                                }}
                                            />
                                            <YAxis
                                                stroke="#a78bfa"
                                                tick={{ fill: "#a78bfa", fontSize: 12 }}
                                                tickFormatter={(value) => `₹${value / 1000}k`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "#1e1b4b",
                                                    border: "1px solid #7c3aed",
                                                    borderRadius: "8px",
                                                }}
                                                labelStyle={{ color: "#a78bfa" }}
                                                formatter={(value) => [formatCurrency(value as number), ""]}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="sales"
                                                name="Sales"
                                                stroke="#10b981"
                                                strokeWidth={2}
                                                dot={{ fill: "#10b981", strokeWidth: 2 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="profit"
                                                name="Profit"
                                                stroke="#8b5cf6"
                                                strokeWidth={2}
                                                dot={{ fill: "#8b5cf6", strokeWidth: 2 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Top Selling Products */}
                            <Card className="bg-black/20 border-purple-500/20">
                                <CardHeader>
                                    <CardTitle className="text-white">
                                        Top Selling Products (by Quantity)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={data.topSellingProducts.slice(0, 5)}
                                                layout="vertical"
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#4c1d95" />
                                                <XAxis
                                                    type="number"
                                                    stroke="#a78bfa"
                                                    tick={{ fill: "#a78bfa", fontSize: 12 }}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    stroke="#a78bfa"
                                                    tick={{ fill: "#a78bfa", fontSize: 12 }}
                                                    width={100}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "#1e1b4b",
                                                        border: "1px solid #7c3aed",
                                                        borderRadius: "8px",
                                                    }}
                                                />
                                                <Bar
                                                    dataKey="quantitySold"
                                                    name="Quantity Sold"
                                                    fill="#10b981"
                                                    radius={[0, 4, 4, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Top Profitable Products */}
                            <Card className="bg-black/20 border-purple-500/20">
                                <CardHeader>
                                    <CardTitle className="text-white">
                                        Most Profitable Products
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={data.topProfitableProducts.slice(0, 5)}
                                                layout="vertical"
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#4c1d95" />
                                                <XAxis
                                                    type="number"
                                                    stroke="#a78bfa"
                                                    tick={{ fill: "#a78bfa", fontSize: 12 }}
                                                    tickFormatter={(value) => `₹${value}`}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    stroke="#a78bfa"
                                                    tick={{ fill: "#a78bfa", fontSize: 12 }}
                                                    width={100}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "#1e1b4b",
                                                        border: "1px solid #7c3aed",
                                                        borderRadius: "8px",
                                                    }}
                                                    formatter={(value) => [formatCurrency(value as number), ""]}
                                                />
                                                <Bar
                                                    dataKey="totalProfit"
                                                    name="Total Profit"
                                                    fill="#8b5cf6"
                                                    radius={[0, 4, 4, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Top Customers */}
                            <Card className="bg-black/20 border-purple-500/20">
                                <CardHeader>
                                    <CardTitle className="text-white">
                                        Most Valuable Customers
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {data.topCustomers.length === 0 ? (
                                            <p className="text-purple-300 text-center py-8">
                                                No customer data available
                                            </p>
                                        ) : (
                                            data.topCustomers.slice(0, 5).map((customer, index) => (
                                                <div
                                                    key={customer.customerId}
                                                    className="flex items-center justify-between p-4 rounded-lg bg-purple-500/10 border border-purple-500/20"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white">
                                                                {customer.name}
                                                            </p>
                                                            <p className="text-sm text-purple-300">
                                                                {customer.orderCount} orders
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-emerald-400">
                                                            {formatCurrency(customer.totalSpent)}
                                                        </p>
                                                        <p className="text-xs text-purple-300">
                                                            Profit: {formatCurrency(customer.totalProfit)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Category Insights */}
                            <Card className="bg-black/20 border-purple-500/20">
                                <CardHeader>
                                    <CardTitle className="text-white">Category Performance</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] flex items-center">
                                        {data.categoryStats.length === 0 ? (
                                            <p className="text-purple-300 text-center w-full">
                                                No category data available
                                            </p>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={data.categoryStats.filter(c => c.totalSales > 0)}
                                                        dataKey="totalSales"
                                                        nameKey="name"
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={100}
                                                        label={({ name, percent }: { name?: string; percent?: number }) =>
                                                            `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`
                                                        }
                                                        labelLine={{ stroke: "#a78bfa" }}
                                                    >
                                                        {data.categoryStats.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={COLORS[index % COLORS.length]}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: "#1e1b4b",
                                                            border: "1px solid #7c3aed",
                                                            borderRadius: "8px",
                                                        }}
                                                        formatter={(value) => [formatCurrency(value as number), "Sales"]}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-purple-300">Failed to load analytics data</p>
                    </div>
                )}
            </div>
        </div>
    );
}
