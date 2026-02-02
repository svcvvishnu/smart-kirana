"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
    Wallet,
    Home,
    Plus,
    Trash2,
    Edit,
    Search,
    Receipt,
    Building,
    Zap,
    Users,
    Truck,
    Wrench,
    MoreHorizontal,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface Expense {
    id: string;
    category: string;
    amount: number;
    description: string | null;
    date: Date;
}

interface ExpensesClientProps {
    initialExpenses: Expense[];
    stats: {
        monthlyTotal: number;
        monthlyCount: number;
        allTimeTotal: number;
        allTimeCount: number;
        categoryBreakdown: Array<{
            category: string;
            amount: number;
            count: number;
        }>;
    };
}

const EXPENSE_CATEGORIES = [
    { value: "PURCHASE", label: "Stock Purchase", icon: Receipt },
    { value: "RENT", label: "Rent", icon: Building },
    { value: "UTILITIES", label: "Utilities", icon: Zap },
    { value: "SALARY", label: "Salary", icon: Users },
    { value: "TRANSPORT", label: "Transport", icon: Truck },
    { value: "MAINTENANCE", label: "Maintenance", icon: Wrench },
    { value: "OTHER", label: "Other", icon: MoreHorizontal },
];

export function ExpensesClient({ initialExpenses, stats }: ExpensesClientProps) {
    const router = useRouter();
    const [expenses, setExpenses] = useState(initialExpenses);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [loading, setLoading] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        category: "OTHER",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
    });

    const resetForm = () => {
        setFormData({
            category: "OTHER",
            amount: "",
            description: "",
            date: new Date().toISOString().split("T")[0],
        });
        setEditingExpense(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                category: formData.category,
                amount: parseFloat(formData.amount),
                description: formData.description || null,
                date: formData.date,
            };

            const url = editingExpense
                ? `/api/expenses/${editingExpense.id}`
                : "/api/expenses";
            const method = editingExpense ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to save expense");
            }

            setIsDialogOpen(false);
            resetForm();
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setFormData({
            category: expense.category,
            amount: expense.amount.toString(),
            description: expense.description || "",
            date: new Date(expense.date).toISOString().split("T")[0],
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/expenses/${deleteId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete expense");
            }

            setDeleteId(null);
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter expenses
    const filteredExpenses = expenses.filter((expense) => {
        const matchesSearch =
            expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            expense.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter
            ? expense.category === categoryFilter
            : true;
        return matchesSearch && matchesCategory;
    });

    const getCategoryIcon = (category: string) => {
        const cat = EXPENSE_CATEGORIES.find((c) => c.value === category);
        if (cat) {
            const Icon = cat.icon;
            return <Icon className="h-4 w-4" />;
        }
        return <MoreHorizontal className="h-4 w-4" />;
    };

    const getCategoryLabel = (category: string) => {
        return EXPENSE_CATEGORIES.find((c) => c.value === category)?.label || category;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-pink-50">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg">
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
                                    <Wallet className="h-8 w-8" />
                                    Expenses
                                </h1>
                                <p className="text-rose-100 mt-1">
                                    Track your business expenses
                                </p>
                            </div>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) resetForm();
                        }}>
                            <DialogTrigger asChild>
                                <Button variant="secondary" size="lg">
                                    <Plus className="h-5 w-5 mr-2" />
                                    Add Expense
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <form onSubmit={handleSubmit}>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingExpense ? "Edit Expense" : "Add New Expense"}
                                        </DialogTitle>
                                        <DialogDescription>
                                            Record your business expense
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Category *</Label>
                                            <Select
                                                value={formData.category}
                                                onValueChange={(value) =>
                                                    setFormData({ ...formData, category: value })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {EXPENSE_CATEGORIES.map((cat) => (
                                                        <SelectItem key={cat.value} value={cat.value}>
                                                            <div className="flex items-center gap-2">
                                                                <cat.icon className="h-4 w-4" />
                                                                {cat.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Amount (₹) *</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.amount}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, amount: e.target.value })
                                                }
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date *</Label>
                                            <Input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, date: e.target.value })
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description (Optional)</Label>
                                            <Input
                                                value={formData.description}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, description: e.target.value })
                                                }
                                                placeholder="Enter description..."
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setIsDialogOpen(false);
                                                resetForm();
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={loading}>
                                            {loading ? "Saving..." : editingExpense ? "Update" : "Add Expense"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid gap-6 md:grid-cols-4 mb-6">
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-muted-foreground">
                                This Month
                            </p>
                            <p className="text-2xl font-bold mt-2 text-rose-600">
                                {formatCurrency(stats.monthlyTotal)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats.monthlyCount} expense(s)
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-muted-foreground">
                                All Time
                            </p>
                            <p className="text-2xl font-bold mt-2">
                                {formatCurrency(stats.allTimeTotal)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats.allTimeCount} expense(s)
                            </p>
                        </CardContent>
                    </Card>
                    {stats.categoryBreakdown.slice(0, 2).map((cat) => (
                        <Card key={cat.category}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    {getCategoryIcon(cat.category)}
                                    {getCategoryLabel(cat.category)}
                                </div>
                                <p className="text-2xl font-bold mt-2">
                                    {formatCurrency(cat.amount)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    This month
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search expenses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select
                                value={categoryFilter || "all"}
                                onValueChange={(value) =>
                                    setCategoryFilter(value === "all" ? null : value)
                                }
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {EXPENSE_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Expenses List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Expense Records ({filteredExpenses.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredExpenses.length === 0 ? (
                            <div className="text-center py-12">
                                <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-muted-foreground">No expenses found.</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Add your first expense to get started.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredExpenses.map((expense) => (
                                    <div
                                        key={expense.id}
                                        className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                                                {getCategoryIcon(expense.category)}
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {getCategoryLabel(expense.category)}
                                                </p>
                                                {expense.description && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {expense.description}
                                                    </p>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(expense.date), "MMM dd, yyyy")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-semibold text-rose-600">
                                                -{formatCurrency(expense.amount)}
                                            </p>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(expense)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteId(expense.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Expense</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this expense? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteId(null)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            {loading ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
