"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface CartItem {
    productId: string;
    name: string;
    sellingPrice: number;
    quantity: number;
    currentStock: number;
}

interface CartItemsProps {
    items: CartItem[];
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onRemoveItem: (productId: string) => void;
}

export function CartItems({ items, onUpdateQuantity, onRemoveItem }: CartItemsProps) {
    const subtotal = items.reduce(
        (sum, item) => sum + item.sellingPrice * item.quantity,
        0
    );

    if (items.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Cart is empty</p>
                <p className="text-sm text-muted-foreground mt-2">
                    Add products to create a sale
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {items.map((item) => {
                    const isOverStock = item.quantity > item.currentStock;

                    return (
                        <div
                            key={item.productId}
                            className={`flex items-center justify-between p-3 rounded-lg border ${isOverStock ? "border-red-300 bg-red-50" : "bg-white"
                                }`}
                        >
                            <div className="flex-1">
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatCurrency(item.sellingPrice)} × {item.quantity}
                                </p>
                                {isOverStock && (
                                    <p className="text-xs text-red-600 mt-1">
                                        Only {item.currentStock} available
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            onUpdateQuantity(
                                                item.productId,
                                                Math.max(1, item.quantity - 1)
                                            )
                                        }
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">
                                        {item.quantity}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            onUpdateQuantity(item.productId, item.quantity + 1)
                                        }
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                                <div className="text-right min-w-[80px]">
                                    <p className="font-semibold">
                                        {formatCurrency(item.sellingPrice * item.quantity)}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onRemoveItem(item.productId)}
                                >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Subtotal */}
            <div className="pt-4 border-t">
                <div className="flex justify-between text-lg font-semibold">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>
            </div>
        </div>
    );
}
