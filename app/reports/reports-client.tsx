"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    FileText,
    Home,
    Download,
    FileSpreadsheet,
    Package,
    TrendingUp,
    Loader2,
    Receipt,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
    exportSalesReportPDF,
    exportSalesReportExcel,
    exportStockReportPDF,
    exportStockReportExcel,
    exportProfitLossReportPDF,
    exportProfitLossReportExcel,
} from "@/lib/export-utils";

export function ReportsClient() {
    const [activeTab, setActiveTab] = useState("sales");
    const [loading, setLoading] = useState(false);
    
    // Date range for reports
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const [startDate, setStartDate] = useState(monthAgo.toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

    // Report data states
    const [salesReport, setSalesReport] = useState<any>(null);
    const [stockReport, setStockReport] = useState<any>(null);
    const [plReport, setPLReport] = useState<any>(null);

    const fetchSalesReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/sales?startDate=${startDate}&endDate=${endDate}`);
            if (res.ok) {
                const data = await res.json();
                setSalesReport(data);
            }
        } catch (error) {
            console.error("Failed to fetch sales report:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStockReport = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/reports/stock");
            if (res.ok) {
                const data = await res.json();
                setStockReport(data);
            }
        } catch (error) {
            console.error("Failed to fetch stock report:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPLReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`);
            if (res.ok) {
                const data = await res.json();
                setPLReport(data);
            }
        } catch (error) {
            console.error("Failed to fetch P&L report:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        if (tab === "sales" && !salesReport) fetchSalesReport();
        if (tab === "stock" && !stockReport) fetchStockReport();
        if (tab === "profit-loss" && !plReport) fetchPLReport();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:bg-white/20"
                                >
                                    <Home className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-2">
                                    <FileText className="h-8 w-8" />
                                    Reports
                                </h1>
                                <p className="text-orange-100 mt-1">
                                    Generate and export business reports
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Date Range Filter */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={() => {
                                    if (activeTab === "sales") fetchSalesReport();
                                    if (activeTab === "profit-loss") fetchPLReport();
                                }}
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Generate Report
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Reports Tabs */}
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="sales" className="flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Sales Report
                        </TabsTrigger>
                        <TabsTrigger value="stock" className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Stock Report
                        </TabsTrigger>
                        <TabsTrigger value="profit-loss" className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Profit & Loss
                        </TabsTrigger>
                    </TabsList>

                    {/* Sales Report Tab */}
                    <TabsContent value="sales">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                            </div>
                        ) : salesReport ? (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid gap-4 md:grid-cols-4">
                                    <Card>
                                        <CardContent className="p-6">
                                            <p className="text-sm text-muted-foreground">Total Sales</p>
                                            <p className="text-2xl font-bold">{formatCurrency(salesReport.summary.totalSales)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-green-200 bg-green-50">
                                        <CardContent className="p-6">
                                            <p className="text-sm text-green-800">Total Profit</p>
                                            <p className="text-2xl font-bold text-green-900">{formatCurrency(salesReport.summary.totalProfit)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-6">
                                            <p className="text-sm text-muted-foreground">Total Orders</p>
                                            <p className="text-2xl font-bold">{salesReport.summary.totalOrders}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-6">
                                            <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                                            <p className="text-2xl font-bold">{formatCurrency(salesReport.summary.averageOrderValue)}</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Export Buttons */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Export Sales Report</CardTitle>
                                        <CardDescription>Download the report in your preferred format</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex gap-4">
                                        <Button
                                            onClick={() => exportSalesReportPDF(salesReport)}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        <Button
                                            onClick={() => exportSalesReportExcel(salesReport)}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                                            Download Excel
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Recent Sales */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Recent Sales ({salesReport.sales.length})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                            {salesReport.sales.slice(0, 20).map((sale: any) => (
                                                <div
                                                    key={sale.id}
                                                    className="flex items-center justify-between p-3 rounded-lg border bg-white"
                                                >
                                                    <div>
                                                        <p className="font-medium">{sale.saleNumber}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {sale.customer} • {new Date(sale.date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold">{formatCurrency(sale.total)}</p>
                                                        <p className="text-sm text-green-600">Profit: {formatCurrency(sale.profit)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-muted-foreground">Click &quot;Generate Report&quot; to view sales data</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Stock Report Tab */}
                    <TabsContent value="stock">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                            </div>
                        ) : stockReport ? (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid gap-4 md:grid-cols-4">
                                    <Card>
                                        <CardContent className="p-6">
                                            <p className="text-sm text-muted-foreground">Total Products</p>
                                            <p className="text-2xl font-bold">{stockReport.summary.totalProducts}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-blue-200 bg-blue-50">
                                        <CardContent className="p-6">
                                            <p className="text-sm text-blue-800">Stock Value</p>
                                            <p className="text-2xl font-bold text-blue-900">{formatCurrency(stockReport.summary.totalStockValue)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-yellow-200 bg-yellow-50">
                                        <CardContent className="p-6">
                                            <p className="text-sm text-yellow-800">Low Stock Items</p>
                                            <p className="text-2xl font-bold text-yellow-900">{stockReport.summary.lowStockCount}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-red-200 bg-red-50">
                                        <CardContent className="p-6">
                                            <p className="text-sm text-red-800">Out of Stock</p>
                                            <p className="text-2xl font-bold text-red-900">{stockReport.summary.outOfStockCount}</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Export Buttons */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Export Stock Report</CardTitle>
                                        <CardDescription>Download the report in your preferred format</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex gap-4">
                                        <Button
                                            onClick={() => exportStockReportPDF(stockReport)}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        <Button
                                            onClick={() => exportStockReportExcel(stockReport)}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                                            Download Excel
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Products List */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Inventory Status</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                            {stockReport.products.map((product: any) => (
                                                <div
                                                    key={product.id}
                                                    className={`flex items-center justify-between p-3 rounded-lg border ${
                                                        product.status === "OUT_OF_STOCK"
                                                            ? "bg-red-50 border-red-200"
                                                            : product.status === "LOW_STOCK"
                                                            ? "bg-yellow-50 border-yellow-200"
                                                            : "bg-white"
                                                    }`}
                                                >
                                                    <div>
                                                        <p className="font-medium">{product.name}</p>
                                                        <p className="text-sm text-muted-foreground">{product.category}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold">
                                                            Stock: {product.currentStock} / {product.minStockLevel}
                                                        </p>
                                                        <p className={`text-sm ${
                                                            product.status === "OUT_OF_STOCK"
                                                                ? "text-red-600"
                                                                : product.status === "LOW_STOCK"
                                                                ? "text-yellow-600"
                                                                : "text-green-600"
                                                        }`}>
                                                            {product.status.replace("_", " ")}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-muted-foreground">Loading stock data...</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Profit & Loss Tab */}
                    <TabsContent value="profit-loss">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                            </div>
                        ) : plReport ? (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid gap-4 md:grid-cols-4">
                                    <Card>
                                        <CardContent className="p-6">
                                            <p className="text-sm text-muted-foreground">Total Revenue</p>
                                            <p className="text-2xl font-bold">{formatCurrency(plReport.summary.totalRevenue)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-green-200 bg-green-50">
                                        <CardContent className="p-6">
                                            <p className="text-sm text-green-800">Gross Profit</p>
                                            <p className="text-2xl font-bold text-green-900">{formatCurrency(plReport.summary.grossProfit)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-red-200 bg-red-50">
                                        <CardContent className="p-6">
                                            <p className="text-sm text-red-800">Total Expenses</p>
                                            <p className="text-2xl font-bold text-red-900">{formatCurrency(plReport.summary.totalExpenses)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className={`border-2 ${plReport.summary.netProfit >= 0 ? "border-green-500 bg-green-100" : "border-red-500 bg-red-100"}`}>
                                        <CardContent className="p-6">
                                            <p className={`text-sm ${plReport.summary.netProfit >= 0 ? "text-green-800" : "text-red-800"}`}>Net Profit</p>
                                            <p className={`text-2xl font-bold ${plReport.summary.netProfit >= 0 ? "text-green-900" : "text-red-900"}`}>
                                                {formatCurrency(plReport.summary.netProfit)}
                                            </p>
                                            <p className={`text-sm ${plReport.summary.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}>
                                                {plReport.summary.profitMargin.toFixed(1)}% margin
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Export Buttons */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Export Profit & Loss Report</CardTitle>
                                        <CardDescription>Download the report in your preferred format</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex gap-4">
                                        <Button
                                            onClick={() => exportProfitLossReportPDF(plReport)}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        <Button
                                            onClick={() => exportProfitLossReportExcel(plReport)}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                                            Download Excel
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Expenses Breakdown */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Expenses by Category</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {plReport.expensesByCategory.length === 0 ? (
                                            <p className="text-muted-foreground text-center py-4">
                                                No expenses recorded for this period
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {plReport.expensesByCategory.map((expense: any) => (
                                                    <div
                                                        key={expense.category}
                                                        className="flex items-center justify-between p-3 rounded-lg border bg-white"
                                                    >
                                                        <p className="font-medium">{expense.category}</p>
                                                        <p className="font-semibold text-red-600">
                                                            {formatCurrency(expense.amount)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-muted-foreground">Click &quot;Generate Report&quot; to view profit & loss data</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
