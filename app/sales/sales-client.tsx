"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { 
    Receipt, 
    Home, 
    Search, 
    Eye, 
    TrendingUp, 
    ShoppingCart,
    Calendar
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Sale {
    id: string;
    saleNumber: string;
    subtotal: number;
    discountAmount: number;
    total: number;
    profit: number;
    createdAt: Date;
    customer: {
        id: string;
        name: string;
        phone: string;
    } | null;
    _count: {
        items: number;
    };
}

interface Customer {
    id: string;
    name: string;
    phone: string;
}

interface SalesClientProps {
    initialSales: Sale[];
    customers: Customer[];
    stats: {
        todaySales: number;
        todayProfit: number;
        todayCount: number;
        totalCount: number;
    };
    userRole: string;
}

export function SalesClient({ 
    initialSales, 
    customers, 
    stats,
    userRole 
}: SalesClientProps) {
    const [sales, setSales] = useState(initialSales);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
    const [dateFilter, setDateFilter] = useState<string>("all");
    const [loading, setLoading] = useState(false);

    const handleFilter = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCustomer && selectedCustomer !== "all") {
                params.set("customerId", selectedCustomer);
            }
            
            const res = await fetch(`/api/sales?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setSales(data);
            }
        } catch (error) {
            console.error("Failed to fetch sales:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter sales based on search and date
    const filteredSales = sales.filter((sale) => {
        const matchesSearch = 
            sale.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sale.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sale.customer?.phone.includes(searchQuery);

        let matchesDate = true;
        if (dateFilter !== "all") {
            const saleDate = new Date(sale.createdAt);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (dateFilter === "today") {
                matchesDate = saleDate >= today;
            } else if (dateFilter === "week") {
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                matchesDate = saleDate >= weekAgo;
            } else if (dateFilter === "month") {
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                matchesDate = saleDate >= monthAgo;
            }
        }

        return matchesSearch && matchesDate;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
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
                                    <Receipt className="h-8 w-8" />
                                    Sales History
                                </h1>
                                <p className="text-emerald-100 mt-1">
                                    View and manage all your sales records
                                </p>
                            </div>
                        </div>
                        <Link href="/billing">
                            <Button variant="secondary" size="lg">
                                <ShoppingCart className="h-5 w-5 mr-2" />
                                New Sale
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid gap-6 md:grid-cols-4 mb-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Today&apos;s Sales
                                    </p>
                                    <p className="text-2xl font-bold mt-2">
                                        {formatCurrency(stats.todaySales)}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-100">
                                    <ShoppingCart className="h-5 w-5 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {userRole === "OWNER" && (
                        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-emerald-800">
                                            Today&apos;s Profit
                                        </p>
                                        <p className="text-2xl font-bold mt-2 text-emerald-900">
                                            {formatCurrency(stats.todayProfit)}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-emerald-200">
                                        <TrendingUp className="h-5 w-5 text-emerald-700" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Today&apos;s Orders
                                    </p>
                                    <p className="text-2xl font-bold mt-2">{stats.todayCount}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-100">
                                    <Receipt className="h-5 w-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Total Orders
                                    </p>
                                    <p className="text-2xl font-bold mt-2">{stats.totalCount}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-purple-100">
                                    <Calendar className="h-5 w-5 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by invoice number, customer name or phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select
                                value={selectedCustomer || "all"}
                                onValueChange={(value) => {
                                    setSelectedCustomer(value === "all" ? null : value);
                                }}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="All Customers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Customers</SelectItem>
                                    {customers.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.id}>
                                            {customer.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={dateFilter}
                                onValueChange={setDateFilter}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="All Time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="week">This Week</SelectItem>
                                    <SelectItem value="month">This Month</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleFilter} disabled={loading}>
                                {loading ? "Loading..." : "Apply Filters"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Sales Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sales Records ({filteredSales.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredSales.length === 0 ? (
                            <div className="text-center py-12">
                                <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-muted-foreground">No sales found.</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Start by creating a new sale.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice #</TableHead>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                            <TableHead className="text-right">Discount</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            {userRole === "OWNER" && (
                                                <TableHead className="text-right">Profit</TableHead>
                                            )}
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredSales.map((sale) => (
                                            <TableRow key={sale.id}>
                                                <TableCell className="font-medium">
                                                    {sale.saleNumber}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDateTime(sale.createdAt)}
                                                </TableCell>
                                                <TableCell>
                                                    {sale.customer ? (
                                                        <div>
                                                            <p className="font-medium">{sale.customer.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {sale.customer.phone}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">Walk-in</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{sale._count.items}</TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(sale.subtotal)}
                                                </TableCell>
                                                <TableCell className="text-right text-green-600">
                                                    {sale.discountAmount > 0
                                                        ? `-${formatCurrency(sale.discountAmount)}`
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {formatCurrency(sale.total)}
                                                </TableCell>
                                                {userRole === "OWNER" && (
                                                    <TableCell className="text-right text-emerald-600 font-medium">
                                                        {formatCurrency(sale.profit)}
                                                    </TableCell>
                                                )}
                                                <TableCell className="text-right">
                                                    <Link href={`/sales/${sale.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
