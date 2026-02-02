"use client";

import { useState } from "react";
import { StockForm } from "@/components/inventory/stock-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, XCircle, ArrowUpCircle, ArrowDownCircle, Warehouse } from "lucide-react";
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
        fetch("/api/stock")
            .then((res) => res.json())
            .then((data) => setTransactions(data))
            .catch(console.error);
    };

    return (
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
                    <Warehouse className="h-6 w-6 text-indigo-600" />
                    Stock Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Track and manage your inventory levels
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Products</p>
                                <p className="text-2xl font-semibold mt-1">{stats.totalProducts}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-indigo-100">
                                <Package className="h-5 w-5 text-indigo-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-700">Low Stock</p>
                                <p className="text-2xl font-semibold mt-1 text-amber-900">{stats.lowStockCount}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-200">
                                <AlertTriangle className="h-5 w-5 text-amber-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-700">Out of Stock</p>
                                <p className="text-2xl font-semibold mt-1 text-red-900">{stats.outOfStockCount}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-200">
                                <XCircle className="h-5 w-5 text-red-700" />
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
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {transactions.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">
                                No transactions yet
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            {transaction.quantity > 0 ? (
                                                <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
                                            ) : (
                                                <ArrowDownCircle className="h-5 w-5 text-red-600" />
                                            )}
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">
                                                    {transaction.product.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {transaction.transactionType}
                                                    {transaction.notes && ` · ${transaction.notes}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-semibold ${transaction.quantity > 0 ? "text-emerald-600" : "text-red-600"}`}>
                                                {transaction.quantity > 0 ? "+" : ""}{transaction.quantity}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {format(new Date(transaction.createdAt), "MMM dd, HH:mm")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
