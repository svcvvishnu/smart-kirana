"use client";

import { useState } from "react";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface Category {
    id: string;
    name: string;
}

interface Product {
    id?: string;
    name: string;
    categoryId: string;
    purchasePrice: number;
    sellingPrice: number;
    currentStock: number;
    minStockLevel: number;
    description?: string | null;
}

interface ProductFormProps {
    product?: Product;
    categories: Category[];
    onSubmit: (product: Partial<Product>) => Promise<void>;
    onCategoryCreate: (name: string) => Promise<void>;
    trigger?: React.ReactNode;
}

export function ProductForm({
    product,
    categories,
    onSubmit,
    onCategoryCreate,
    trigger,
}: ProductFormProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const [formData, setFormData] = useState<Partial<Product>>(
        product || {
            name: "",
            categoryId: "",
            purchasePrice: 0,
            sellingPrice: 0,
            currentStock: 0,
            minStockLevel: 10,
            description: "",
        }
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
            setOpen(false);
            setFormData({
                name: "",
                categoryId: "",
                purchasePrice: 0,
                sellingPrice: 0,
                currentStock: 0,
                minStockLevel: 10,
                description: "",
            });
        } catch (error) {
            console.error("Failed to submit:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;

        setLoading(true);
        try {
            await onCategoryCreate(newCategoryName);
            setNewCategoryName("");
            setShowCategoryDialog(false);
        } catch (error) {
            console.error("Failed to create category:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger || <Button>Add Product</Button>}
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {product ? "Edit Product" : "Add New Product"}
                        </DialogTitle>
                        <DialogDescription>
                            Fill in the product details below.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="category">Category *</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowCategoryDialog(true)}
                                        className="h-auto p-1"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Select
                                    value={formData.categoryId}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, categoryId: value })
                                    }
                                    required
                                >
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="purchasePrice">Purchase Price (₹) *</Label>
                                <Input
                                    id="purchasePrice"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.purchasePrice}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            purchasePrice: parseFloat(e.target.value),
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sellingPrice">Selling Price (₹) *</Label>
                                <Input
                                    id="sellingPrice"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.sellingPrice}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            sellingPrice: parseFloat(e.target.value),
                                        })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="currentStock">Current Stock</Label>
                                <Input
                                    id="currentStock"
                                    type="number"
                                    min="0"
                                    value={formData.currentStock}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            currentStock: parseInt(e.target.value),
                                        })
                                    }
                                    disabled={!!product}
                                />
                                {product && (
                                    <p className="text-xs text-muted-foreground">
                                        Use inventory page to adjust stock
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
                                <Input
                                    id="minStockLevel"
                                    type="number"
                                    min="0"
                                    value={formData.minStockLevel}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            minStockLevel: parseInt(e.target.value),
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Input
                                id="description"
                                value={formData.description ?? ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : product ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Category Creation Dialog */}
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                        <DialogDescription>
                            Create a new product category.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="categoryName">Category Name</Label>
                            <Input
                                id="categoryName"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="e.g., Beverages"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowCategoryDialog(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreateCategory} disabled={loading}>
                            {loading ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
