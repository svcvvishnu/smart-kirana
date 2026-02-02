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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Store,
    Plus,
    Search,
    Eye,
    ToggleLeft,
    ToggleRight,
} from "lucide-react";
import { format } from "date-fns";

interface Seller {
    id: string;
    shopName: string;
    businessType: string;
    ownerName: string;
    phone: string;
    email: string;
    address: string | null;
    isActive: boolean;
    createdAt: Date;
    subscription: {
        plan: {
            id: string;
            name: string;
            tier: string;
        };
    } | null;
    _count: {
        users: number;
        products: number;
        sales: number;
    };
}

interface SubscriptionPlan {
    id: string;
    name: string;
    tier: string;
    price: number;
}

interface SellersClientProps {
    initialSellers: Seller[];
    subscriptionPlans: SubscriptionPlan[];
}

const BUSINESS_TYPES = [
    { value: "BAKERY", label: "Bakery" },
    { value: "VEGETABLES", label: "Vegetables" },
    { value: "FRUITS", label: "Fruits" },
    { value: "GENERAL_STORE", label: "General Store" },
    { value: "OTHER", label: "Other" },
];

export function SellersClient({ initialSellers, subscriptionPlans }: SellersClientProps) {
    const router = useRouter();
    const [sellers, setSellers] = useState(initialSellers);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        shopName: "",
        businessType: "GENERAL_STORE",
        ownerName: "",
        phone: "",
        email: "",
        address: "",
        ownerEmail: "",
        ownerPassword: "",
        subscriptionPlanId: "",
    });

    const resetForm = () => {
        setFormData({
            shopName: "",
            businessType: "GENERAL_STORE",
            ownerName: "",
            phone: "",
            email: "",
            address: "",
            ownerEmail: "",
            ownerPassword: "",
            subscriptionPlanId: "",
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/admin/sellers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create seller");
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

    const handleToggleStatus = async (sellerId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/sellers/${sellerId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (!res.ok) {
                throw new Error("Failed to update seller status");
            }

            setSellers(
                sellers.map((s) =>
                    s.id === sellerId ? { ...s, isActive: !currentStatus } : s
                )
            );
        } catch (error: any) {
            alert(error.message);
        }
    };

    // Filter sellers
    const filteredSellers = sellers.filter((seller) => {
        const matchesSearch =
            seller.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            seller.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            seller.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && seller.isActive) ||
            (statusFilter === "inactive" && !seller.isActive);
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Sellers</h1>
                    <p className="text-slate-400 mt-1">Manage seller accounts</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Onboard Seller
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>Onboard New Seller</DialogTitle>
                                <DialogDescription>
                                    Create a new seller account with owner credentials
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Shop Name *</Label>
                                        <Input
                                            value={formData.shopName}
                                            onChange={(e) =>
                                                setFormData({ ...formData, shopName: e.target.value })
                                            }
                                            placeholder="Enter shop name"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Business Type *</Label>
                                        <Select
                                            value={formData.businessType}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, businessType: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {BUSINESS_TYPES.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Owner Name *</Label>
                                        <Input
                                            value={formData.ownerName}
                                            onChange={(e) =>
                                                setFormData({ ...formData, ownerName: e.target.value })
                                            }
                                            placeholder="Enter owner name"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone *</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) =>
                                                setFormData({ ...formData, phone: e.target.value })
                                            }
                                            placeholder="+91 XXXXX XXXXX"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Business Email *</Label>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) =>
                                                setFormData({ ...formData, email: e.target.value })
                                            }
                                            placeholder="business@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Address</Label>
                                        <Input
                                            value={formData.address}
                                            onChange={(e) =>
                                                setFormData({ ...formData, address: e.target.value })
                                            }
                                            placeholder="Shop address"
                                        />
                                    </div>
                                </div>
                                <hr className="my-2" />
                                <p className="text-sm font-medium">Owner Login Credentials</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Owner Login Email *</Label>
                                        <Input
                                            type="email"
                                            value={formData.ownerEmail}
                                            onChange={(e) =>
                                                setFormData({ ...formData, ownerEmail: e.target.value })
                                            }
                                            placeholder="owner@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Password *</Label>
                                        <Input
                                            type="password"
                                            value={formData.ownerPassword}
                                            onChange={(e) =>
                                                setFormData({ ...formData, ownerPassword: e.target.value })
                                            }
                                            placeholder="Min 8 characters"
                                            required
                                            minLength={8}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Subscription Plan</Label>
                                    <Select
                                        value={formData.subscriptionPlanId || "free"}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                subscriptionPlanId: value === "free" ? "" : value,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="free">Free (Default)</SelectItem>
                                            {subscriptionPlans.map((plan) => (
                                                <SelectItem key={plan.id} value={plan.id}>
                                                    {plan.name} - ₹{plan.price}/month
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                    {loading ? "Creating..." : "Create Seller"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <Card className="mb-6 bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by shop name, owner, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-slate-700 border-slate-600 text-white"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Sellers Table */}
            <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                    <CardTitle className="text-white">
                        Sellers ({filteredSellers.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredSellers.length === 0 ? (
                        <div className="text-center py-12">
                            <Store className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No sellers found</p>
                        </div>
                    ) : (
                        <div className="rounded-md border border-slate-700">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-700">
                                        <TableHead className="text-slate-300">Shop Name</TableHead>
                                        <TableHead className="text-slate-300">Owner</TableHead>
                                        <TableHead className="text-slate-300">Type</TableHead>
                                        <TableHead className="text-slate-300">Plan</TableHead>
                                        <TableHead className="text-slate-300">Products</TableHead>
                                        <TableHead className="text-slate-300">Sales</TableHead>
                                        <TableHead className="text-slate-300">Status</TableHead>
                                        <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSellers.map((seller) => (
                                        <TableRow key={seller.id} className="border-slate-700">
                                            <TableCell className="text-white font-medium">
                                                {seller.shopName}
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                <div>
                                                    <p>{seller.ownerName}</p>
                                                    <p className="text-xs text-slate-500">{seller.email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                {seller.businessType.replace("_", " ")}
                                            </TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-300">
                                                    {seller.subscription?.plan.tier || "FREE"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                {seller._count.products}
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                {seller._count.sales}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`px-2 py-1 rounded text-xs ${
                                                        seller.isActive
                                                            ? "bg-emerald-500/20 text-emerald-400"
                                                            : "bg-red-500/20 text-red-400"
                                                    }`}
                                                >
                                                    {seller.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/admin/sellers/${seller.id}`}>
                                                        <Button variant="ghost" size="sm" className="text-slate-300">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(seller.id, seller.isActive)}
                                                        className="text-slate-300"
                                                    >
                                                        {seller.isActive ? (
                                                            <ToggleRight className="h-4 w-4 text-emerald-400" />
                                                        ) : (
                                                            <ToggleLeft className="h-4 w-4 text-red-400" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
