"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
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

interface ProductSelectorProps {
    products: Product[];
    categories: Category[];
    onAddProduct: (product: Product, quantity: number) => void;
}

export function ProductSelector({
    products,
    categories,
    onAddProduct,
}: ProductSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory
            ? product.categoryId === selectedCategory
            : true;
        return matchesSearch && matchesCategory && product.currentStock > 0;
    });

    return (
        <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={selectedCategory || "all"}
                    onValueChange={(value) =>
                        setSelectedCategory(value === "all" ? null : value)
                    }
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Product List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No products found
                    </p>
                ) : (
                    filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex-1">
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {product.category.name} • Stock: {product.currentStock}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <p className="font-semibold">
                                    {formatCurrency(product.sellingPrice)}
                                </p>
                                <Button
                                    size="sm"
                                    onClick={() => onAddProduct(product, 1)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
