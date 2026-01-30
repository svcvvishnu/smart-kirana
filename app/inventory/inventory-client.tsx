"use client";

import { useState } from "react";
import Link from "next/link";
import { StockForm } from "@/components/inventory/stock-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Package, AlertTriangle, TrendingUp, ArrowUpCircle, ArrowDownCircle, Home } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface Product {
    id: string;
    name: string;
    currentStock: number;
    minStockLevel: number;
}

interface Transaction {
    id: string;
    productId: string;
    product: {
        name: string;
    };
    quantity: number;
    purchasePrice: number | null;
    transactionType: string;
    notes: string | null;
    createdAt: Date;
}

interface InventoryClientProps {
    products: Product[];
    initialTransactions: Transaction[];
    stats: {
        totalProducts: number;
        lowStockCount: number;
        outOfStockCount: number;
    };
}

export function InventoryClient({
    products,
    initialTransactions,
    stats,
}: InventoryClientProps) {
    const [transactions, setTransactions] = useState(initialTransactions);

    const handleStockUpdate = () => {
        // Refresh transactions list
        fetch("/api/stock")
            .then((res) => res.json())
            .then((data) => setTransactions(data))
            .catch(console.error);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                                    <Home className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-2">
                                    <Package className="h-8 w-8" />
                                    Inventory Management
                                </h1>
                                <p className="text-indigo-100 mt-1">
                                    Track and manage your stock levels
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid gap-6 md:grid-cols-3 mb-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Total Products
                                    </p>
                                    <p className="text-2xl font-bold mt-2">{stats.totalProducts}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-indigo-100">
                                    <Package className="h-5 w-5 text-indigo-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">Low Stock</p>
                                    <p className="text-2xl font-bold mt-2 text-yellow-900">
                                        {stats.lowStockCount}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-yellow-200">
                                    <AlertTriangle className="h-5 w-5 text-yellow-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-red-800">Out of Stock</p>
                                    <p className="text-2xl font-bold mt-2 text-red-900">
                                        {stats.outOfStockCount}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-red-200">
                                    <TrendingUp className="h-5 w-5 text-red-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Stock Form */}
                    <StockForm products={products} onSubmit={handleStockUpdate} />

                    {/* Recent Transactions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {transactions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No transactions yet
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {transactions.map((transaction) => (
                                            <div
                                                key={transaction.id}
                                                className="flex items-center justify-between p-3 rounded-lg border bg-white"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {transaction.quantity > 0 ? (
                                                        <ArrowUpCircle className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <ArrowDownCircle className="h-5 w-5 text-red-600" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {transaction.product.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {transaction.transactionType}
                                                            {transaction.notes && ` · ${transaction.notes}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p
                                                        className={`font-semibold ${transaction.quantity > 0
                                                            ? "text-green-600"
                                                            : "text-red-600"
                                                            }`}
                                                    >
                                                        {transaction.quantity > 0 ? "+" : ""}
                                                        {transaction.quantity}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(transaction.createdAt), "MMM dd, HH:mm")}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
