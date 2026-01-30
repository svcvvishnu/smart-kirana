"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

interface Product {
    id: string;
    name: string;
    currentStock: number;
}

interface StockFormProps {
    products: Product[];
    onSubmit: () => void;
}

export function StockForm({ products, onSubmit }: StockFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        productId: "",
        transactionType: "PURCHASE" as "PURCHASE" | "ADJUSTMENT",
        quantity: 0,
        purchasePrice: 0,
        notes: "",
    });

    const selectedProduct = products.find((p) => p.id === formData.productId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/stock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to update stock");
            }

            // Reset form
            setFormData({
                productId: "",
                transactionType: "PURCHASE",
                quantity: 0,
                purchasePrice: 0,
                notes: "",
            });

            onSubmit();
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const newStock = selectedProduct
        ? selectedProduct.currentStock + formData.quantity
        : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Update Stock</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="product">Product *</Label>
                            <Select
                                value={formData.productId}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, productId: value })
                                }
                                required
                            >
                                <SelectTrigger id="product">
                                    <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                            {product.name} (Stock: {product.currentStock})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="transactionType">Type *</Label>
                            <Select
                                value={formData.transactionType}
                                onValueChange={(value: any) =>
                                    setFormData({ ...formData, transactionType: value })
                                }
                                required
                            >
                                <SelectTrigger id="transactionType">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PURCHASE">Purchase (Add Stock)</SelectItem>
                                    <SelectItem value="ADJUSTMENT">Adjustment (+/-)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">
                                Quantity * {formData.transactionType === "ADJUSTMENT" && "(use - for reduction)"}
                            </Label>
                            <Input
                                id="quantity"
                                type="number"
                                value={formData.quantity}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        quantity: parseInt(e.target.value) || 0,
                                    })
                                }
                                required
                            />
                        </div>

                        {formData.transactionType === "PURCHASE" && (
                            <div className="space-y-2">
                                <Label htmlFor="purchasePrice">Purchase Price (₹)</Label>
                                <Input
                                    id="purchasePrice"
                                    type="number"
                                    step="0.01"
                                    value={formData.purchasePrice}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            purchasePrice: parseFloat(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input
                            id="notes"
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData({ ...formData, notes: e.target.value })
                            }
                            placeholder="Reason for stock adjustment..."
                        />
                    </div>

                    {selectedProduct && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Stock Preview:</p>
                            <p className="text-lg font-semibold">
                                {selectedProduct.currentStock} → {newStock}
                            </p>
                        </div>
                    )}

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Updating..." : "Update Stock"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
