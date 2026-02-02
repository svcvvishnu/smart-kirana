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
import { PageHeader } from "@/components/layout";

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
        <div className="p-6">
            <PageHeader
                title="Sellers"
                description="Manage seller accounts and onboarding"
                actions={
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-600 hover:bg-purple-700">
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
                                    <p className="text-sm font-medium text-gray-700">Owner Login Credentials</p>
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
                                    <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                                        {loading ? "Creating..." : "Create Seller"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by shop name, owner, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
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
            <Card>
                <CardHeader className="border-b">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                        All Sellers ({filteredSellers.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredSellers.length === 0 ? (
                        <div className="text-center py-12">
                            <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No sellers found</p>
                            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="font-semibold text-gray-700">Shop Name</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Owner</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Type</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Plan</TableHead>
                                    <TableHead className="font-semibold text-gray-700 text-center">Products</TableHead>
                                    <TableHead className="font-semibold text-gray-700 text-center">Sales</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                                    <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSellers.map((seller) => (
                                    <TableRow key={seller.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium text-gray-900">
                                            {seller.shopName}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-gray-900">{seller.ownerName}</p>
                                                <p className="text-xs text-gray-500">{seller.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {seller.businessType.replace("_", " ")}
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                {seller.subscription?.plan.tier || "FREE"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center text-gray-600">
                                            {seller._count.products}
                                        </TableCell>
                                        <TableCell className="text-center text-gray-600">
                                            {seller._count.sales}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                    seller.isActive
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                {seller.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link href={`/admin/sellers/${seller.id}`}>
                                                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(seller.id, seller.isActive)}
                                                    className="text-gray-600 hover:text-purple-600"
                                                >
                                                    {seller.isActive ? (
                                                        <ToggleRight className="h-4 w-4 text-emerald-500" />
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
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
