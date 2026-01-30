"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductSelector } from "@/components/billing/product-selector";
import { CartItems, CartItem } from "@/components/billing/cart-items";
import { CustomerForm } from "@/components/customers/customer-form";
import { SaleInvoice } from "@/components/billing/sale-invoice";
import { ShoppingCart, Home, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Product {
    id: string;
    name: string;
    categoryId: string;
    category: {
        id: string;
        name: string;
    };
    sellingPrice: number;
    currentStock: number;
}

interface Category {
    id: string;
    name: string;
}

interface Customer {
    id: string;
    name: string;
    phone: string;
}

interface BillingClientProps {
    products: Product[];
    categories: Category[];
    customers: Customer[];
}

export function BillingClient({
    products,
    categories,
    customers,
}: BillingClientProps) {
    const router = useRouter();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
    const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT" | null>(
        null
    );
    const [discountValue, setDiscountValue] = useState(0);
    const [createdSale, setCreatedSale] = useState<any>(null);
    const [creating, setCreating] = useState(false);

    const handleAddProduct = (product: Product, quantity: number) => {
        const existingItem = cart.find((item) => item.productId === product.id);

        if (existingItem) {
            setCart(
                cart.map((item) =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                )
            );
        } else {
            setCart([
                ...cart,
                {
                    productId: product.id,
                    name: product.name,
                    sellingPrice: product.sellingPrice,
                    quantity,
                    currentStock: product.currentStock,
                },
            ]);
        }
    };

    const handleUpdateQuantity = (productId: string, quantity: number) => {
        setCart(
            cart.map((item) =>
                item.productId === productId ? { ...item, quantity } : item
            )
        );
    };

    const handleRemoveItem = (productId: string) => {
        setCart(cart.filter((item) => item.productId !== productId));
    };

    const handleCreateCustomer = async (data: any) => {
        const res = await fetch("/api/customers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error);
        }

        const newCustomer = await res.json();
        setSelectedCustomer(newCustomer.id);
        router.refresh();
    };

    const calculateTotals = () => {
        const subtotal = cart.reduce(
            (sum, item) => sum + item.sellingPrice * item.quantity,
            0
        );

        let discountAmount = 0;
        if (discountType && discountValue) {
            if (discountType === "PERCENTAGE") {
                discountAmount = (subtotal * discountValue) / 100;
            } else {
                discountAmount = discountValue;
            }
        }

        const total = subtotal - discountAmount;

        return { subtotal, discountAmount, total };
    };

    const handleCreateSale = async () => {
        if (cart.length === 0) {
            alert("Please add items to cart");
            return;
        }

        // Check for stock issues
        const hasStockIssues = cart.some((item) => item.quantity > item.currentStock);
        if (hasStockIssues) {
            alert("Some items exceed available stock");
            return;
        }

        setCreating(true);

        try {
            const res = await fetch("/api/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: cart.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                    })),
                    customerId: selectedCustomer,
                    discountType,
                    discountValue,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }

            const sale = await res.json();

            // Fetch full sale details for invoice
            const detailRes = await fetch(`/api/sales/${sale.id}`);
            const saleDetails = await detailRes.json();

            setCreatedSale(saleDetails);

            // Clear cart
            setCart([]);
            setSelectedCustomer(null);
            setDiscountType(null);
            setDiscountValue(0);

            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setCreating(false);
        }
    };

    const { subtotal, discountAmount, total } = calculateTotals();

    // Show invoice if sale was created
    if (createdSale) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
                <div className="mb-6">
                    <Button onClick={() => setCreatedSale(null)} variant="outline">
                        ← Create Another Sale
                    </Button>
                </div>
                <SaleInvoice sale={createdSale} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg">
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
                                    <ShoppingCart className="h-8 w-8" />
                                    Billing
                                </h1>
                                <p className="text-indigo-100 mt-1">
                                    Create customer bills
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Product Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Products</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ProductSelector
                                products={products}
                                categories={categories}
                                onAddProduct={handleAddProduct}
                            />
                        </CardContent>
                    </Card>

                    {/* Cart & Checkout */}
                    <div className="space-y-6">
                        {/* Cart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Cart ({cart.length} items)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CartItems
                                    items={cart}
                                    onUpdateQuantity={handleUpdateQuantity}
                                    onRemoveItem={handleRemoveItem}
                                />
                            </CardContent>
                        </Card>

                        {/* Discount & Customer */}
                        {cart.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Discount & Customer</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Discount */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Discount Type</Label>
                                            <Select
                                                value={discountType || "none"}
                                                onValueChange={(value: any) =>
                                                    setDiscountType(
                                                        value === "none" ? null : value
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">
                                                        No Discount
                                                    </SelectItem>
                                                    <SelectItem value="PERCENTAGE">
                                                        Percentage (%)
                                                    </SelectItem>
                                                    <SelectItem value="FLAT">
                                                        Flat Amount (₹)
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {discountType && (
                                            <div className="space-y-2">
                                                <Label>Value</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={discountValue}
                                                    onChange={(e) =>
                                                        setDiscountValue(
                                                            parseFloat(e.target.value) || 0
                                                        )
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Customer */}
                                    <div className="space-y-2">
                                        <Label>Customer (Optional)</Label>
                                        <div className="flex gap-2">
                                            <Select
                                                value={selectedCustomer || "none"}
                                                onValueChange={(value) =>
                                                    setSelectedCustomer(
                                                        value === "none" ? null : value
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select customer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">
                                                        Walk-in Customer
                                                    </SelectItem>
                                                    {customers.map((customer) => (
                                                        <SelectItem
                                                            key={customer.id}
                                                            value={customer.id}
                                                        >
                                                            {customer.name} - {customer.phone}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <CustomerForm
                                                onSubmit={handleCreateCustomer}
                                                trigger={
                                                    <Button variant="outline" size="icon">
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Totals */}
                                    <div className="space-y-2 pt-4 border-t">
                                        <div className="flex justify-between">
                                            <span>Subtotal:</span>
                                            <span className="font-semibold">
                                                {formatCurrency(subtotal)}
                                            </span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Discount:</span>
                                                <span className="font-semibold">
                                                    -{formatCurrency(discountAmount)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-xl font-bold border-t pt-2">
                                            <span>Total:</span>
                                            <span>{formatCurrency(total)}</span>
                                        </div>
                                    </div>

                                    {/* Create Sale Button */}
                                    <Button
                                        onClick={handleCreateSale}
                                        disabled={creating}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {creating ? "Creating..." : "Create Sale"}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
