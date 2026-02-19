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
import { Receipt, Search, Eye, TrendingUp, ShoppingCart, Calendar, History } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Sale {
    id: string;
    saleNumber: string;
    subtotal: number;
    discountAmount: number;
    total: number;
    profit: number;
    paymentMethod?: string;
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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    CASH: "Cash",
    UPI: "UPI",
    CARD: "Card",
    BANK_TRANSFER: "Bank Transfer",
    CREDIT: "Credit",
};

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
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
                        <History className="h-6 w-6 text-indigo-600" />
                        Sales History
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        View and manage all your sales records
                    </p>
                </div>
                <Link href="/billing">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        New Sale
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Today&apos;s Sales</p>
                                <p className="text-2xl font-semibold mt-1">{formatCurrency(stats.todaySales)}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-emerald-100">
                                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {userRole === "OWNER" && (
                    <Card className="border-emerald-200 bg-emerald-50">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-emerald-700">Today&apos;s Profit</p>
                                    <p className="text-2xl font-semibold mt-1 text-emerald-900">{formatCurrency(stats.todayProfit)}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-emerald-200">
                                    <TrendingUp className="h-5 w-5 text-emerald-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Today&apos;s Orders</p>
                                <p className="text-2xl font-semibold mt-1">{stats.todayCount}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-100">
                                <Receipt className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                                <p className="text-2xl font-semibold mt-1">{stats.totalCount}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-purple-100">
                                <Calendar className="h-5 w-5 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by invoice number, customer name or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={selectedCustomer || "all"}
                            onValueChange={(value) => setSelectedCustomer(value === "all" ? null : value)}
                        >
                            <SelectTrigger className="w-full md:w-48">
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
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="w-full md:w-36">
                                <SelectValue placeholder="All Time" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleFilter} disabled={loading} variant="outline">
                            {loading ? "Loading..." : "Apply"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Sales Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Sales Records ({filteredSales.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredSales.length === 0 ? (
                        <div className="text-center py-12">
                            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No sales found.</p>
                            <p className="text-sm text-gray-400 mt-2">Start by creating a new sale.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-medium">Invoice #</TableHead>
                                        <TableHead className="font-medium">Date & Time</TableHead>
                                        <TableHead className="font-medium">Customer</TableHead>
                                        <TableHead className="font-medium">Items</TableHead>
                                        <TableHead className="text-right font-medium">Subtotal</TableHead>
                                        <TableHead className="text-right font-medium">Discount</TableHead>
                                        <TableHead className="text-right font-medium">Total</TableHead>
                                        <TableHead className="font-medium">Payment</TableHead>
                                        {userRole === "OWNER" && (
                                            <TableHead className="text-right font-medium">Profit</TableHead>
                                        )}
                                        <TableHead className="text-right font-medium">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSales.map((sale) => (
                                        <TableRow key={sale.id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-indigo-600">
                                                {sale.saleNumber}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {formatDateTime(sale.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                {sale.customer ? (
                                                    <div>
                                                        <p className="font-medium text-sm">{sale.customer.name}</p>
                                                        <p className="text-xs text-gray-500">{sale.customer.phone}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">Walk-in</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">{sale._count.items}</TableCell>
                                            <TableCell className="text-right text-sm">{formatCurrency(sale.subtotal)}</TableCell>
                                            <TableCell className="text-right text-sm text-emerald-600">
                                                {sale.discountAmount > 0 ? `-${formatCurrency(sale.discountAmount)}` : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(sale.total)}</TableCell>
                                            <TableCell className="text-sm">
                                                {PAYMENT_METHOD_LABELS[sale.paymentMethod || "CASH"] || sale.paymentMethod}
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
    );
}
