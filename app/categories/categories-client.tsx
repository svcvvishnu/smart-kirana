"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Plus, Pencil, Trash2, Package, Search } from "lucide-react";

interface Category {
    id: string;
    name: string;
    _count: { products: number };
    createdAt: Date;
}

interface CategoriesClientProps {
    categories: Category[];
}

export function CategoriesClient({ categories: initialCategories }: CategoriesClientProps) {
    const router = useRouter();
    const [categories, setCategories] = useState(initialCategories);
    const [search, setSearch] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [newName, setNewName] = useState("");
    const [editName, setEditName] = useState("");
    const [loading, setLoading] = useState(false);

    const filtered = categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setLoading(true);
        try {
            const res = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName.trim() }),
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || "Failed to create category");
                return;
            }
            setNewName("");
            setAddOpen(false);
            router.refresh();
        } catch {
            alert("Failed to create category");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async () => {
        if (!editingCategory || !editName.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/categories/${editingCategory.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editName.trim() }),
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || "Failed to update category");
                return;
            }
            setEditOpen(false);
            setEditingCategory(null);
            router.refresh();
        } catch {
            alert("Failed to update category");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (category: Category) => {
        if (category._count.products > 0) {
            alert(`Cannot delete "${category.name}". ${category._count.products} product(s) are assigned to it. Reassign them first.`);
            return;
        }
        if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;

        try {
            const res = await fetch(`/api/categories/${category.id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || "Failed to delete category");
                return;
            }
            router.refresh();
        } catch {
            alert("Failed to delete category");
        }
    };

    return (
        <div>
            <PageHeader
                title="Categories"
                description="Manage your product categories"
            />

            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search categories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Category</DialogTitle>
                            <DialogDescription>
                                Create a new product category for your shop.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="categoryName">Category Name</Label>
                                <Input
                                    id="categoryName"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g., Dairy Products"
                                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={loading || !newName.trim()}>
                                {loading ? "Creating..." : "Create"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                            {search ? "No categories match your search" : "No categories yet. Create your first one!"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((category) => (
                        <Card key={category.id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{category.name}</CardTitle>
                                        <CardDescription>
                                            {category._count.products} product{category._count.products !== 1 ? "s" : ""}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => {
                                                setEditingCategory(category);
                                                setEditName(category.name);
                                                setEditOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(category)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                        <DialogDescription>
                            Rename this category.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="editCategoryName">Category Name</Label>
                            <Input
                                id="editCategoryName"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleEdit} disabled={loading || !editName.trim()}>
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
