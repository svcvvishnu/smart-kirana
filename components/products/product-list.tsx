"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ProductForm } from "./product-form";
import { Edit, Trash2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

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

interface ProductListProps {
    products: Product[];
    categories: Category[];
    onUpdate: (id: string, data: Partial<Product>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onCategoryCreate: (name: string) => Promise<void>;
}

export function ProductList({
    products,
    categories,
    onUpdate,
    onDelete,
    onCategoryCreate,
}: ProductListProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!deleteId) return;

        setDeleting(true);
        try {
            await onDelete(deleteId);
            setDeleteId(null);
        } catch (error) {
            console.error("Failed to delete:", error);
        } finally {
            setDeleting(false);
        }
    };

    const calculateProfitMargin = (purchase: number, selling: number) => {
        if (purchase === 0) return 0;
        return ((selling - purchase) / purchase) * 100;
    };

    if (products.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No products found.</p>
                <p className="text-sm text-muted-foreground mt-2">
                    Add your first product to get started.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Purchase</TableHead>
                            <TableHead>Selling</TableHead>
                            <TableHead>Margin</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">
                                    {product.name}
                                </TableCell>
                                <TableCell>{product.category.name}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span>{product.currentStock}</span>
                                        {product.currentStock < product.minStockLevel && (
                                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{formatCurrency(product.purchasePrice)}</TableCell>
                                <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                                <TableCell>
                                    <span className="text-sm font-medium text-green-600">
                                        {calculateProfitMargin(
                                            product.purchasePrice,
                                            product.sellingPrice
                                        ).toFixed(1)}%
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <ProductForm
                                            product={product}
                                            categories={categories}
                                            onSubmit={(data) => onUpdate(product.id, data)}
                                            onCategoryCreate={onCategoryCreate}
                                            trigger={
                                                <Button variant="ghost" size="sm">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeleteId(product.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this product? This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteId(null)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
