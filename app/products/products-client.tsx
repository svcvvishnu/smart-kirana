"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductForm } from "@/components/products/product-form";
import { ProductList } from "@/components/products/product-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Package, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
                                    Products
                                </h1>
                                <p className="text-indigo-100 mt-1">
                                    Manage your inventory and pricing
                                </p>
                            </div>
                        </div>
                        <ProductForm
                            categories={categories}
                            onSubmit={handleCreateProduct}
                            onCategoryCreate={handleCreateCategory}
                            trigger={
                                <Button variant="secondary" size="lg">
                                    <Plus className="h-5 w-5 mr-2" />
                                    Add Product
                                </Button>
                            }
                        />
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Button
                                    variant={selectedCategory === null ? "default" : "outline"}
                                    onClick={() => setSelectedCategory(null)}
                                    size="sm"
                                >
                                    All ({products.length})
                                </Button>
                                {categories.map((cat) => {
                                    const count = products.filter(
                                        (p) => p.categoryId === cat.id
                                    ).length;
                                    return (
                                        <Button
                                            key={cat.id}
                                            variant={
                                                selectedCategory === cat.id ? "default" : "outline"
                                            }
                                            onClick={() => setSelectedCategory(cat.id)}
                                            size="sm"
                                        >
                                            {cat.name} ({count})
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Products Table */}
                <ProductList
                    products={filteredProducts}
                    categories={categories}
                    onUpdate={handleUpdateProduct}
                    onDelete={handleDeleteProduct}
                    onCategoryCreate={handleCreateCategory}
                />
            </div>
        </div>
    );
}
