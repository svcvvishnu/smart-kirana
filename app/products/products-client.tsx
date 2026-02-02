"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import { ProductList } from "@/components/products/product-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    categoryId: string;
    category: {
        id: string;
        name: string;
    };
    purchasePrice: number;
    sellingPrice: number;
    currentStock: number;
    minStockLevel: number;
    description?: string | null;
}

interface ProductsClientProps {
    initialProducts: Product[];
    initialCategories: Category[];
}

export function ProductsClient({
    initialProducts,
    initialCategories,
}: ProductsClientProps) {
    const router = useRouter();
    const [products, setProducts] = useState(initialProducts);
    const [categories, setCategories] = useState(initialCategories);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const handleCreateProduct = async (data: Partial<Product>) => {
        const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to create product");
        }

        router.refresh();
    };

    const handleUpdateProduct = async (id: string, data: Partial<Product>) => {
        const res = await fetch(`/api/products/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to update product");
        }

        router.refresh();
    };

    const handleDeleteProduct = async (id: string) => {
        const res = await fetch(`/api/products/${id}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to delete product");
        }

        router.refresh();
    };

    const handleCreateCategory = async (name: string) => {
        const res = await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to create category");
        }

        const newCategory = await res.json();
        setCategories([...categories, newCategory]);
        router.refresh();
    };

    // Filter products
    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory
            ? product.categoryId === selectedCategory
            : true;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
                        <Package className="h-6 w-6 text-indigo-600" />
                        Products
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage your inventory and pricing
                    </p>
                </div>
                <ProductForm
                    categories={categories}
                    onSubmit={handleCreateProduct}
                    onCategoryCreate={handleCreateCategory}
                    trigger={
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Product
                        </Button>
                    }
                />
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={selectedCategory || "all"}
                            onValueChange={(value) =>
                                setSelectedCategory(value === "all" ? null : value)
                            }
                        >
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Products List */}
            <ProductList
                products={filteredProducts}
                categories={categories}
                onUpdate={handleUpdateProduct}
                onDelete={handleDeleteProduct}
                onCategoryCreate={handleCreateCategory}
            />
        </div>
    );
}
