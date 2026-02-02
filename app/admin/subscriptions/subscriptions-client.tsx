"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { CreditCard, Plus, Check, X, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout";

interface SubscriptionPlan {
    id: string;
    name: string;
    tier: string;
    price: number;
    maxProducts: number | null;
    maxUsers: number | null;
    hasAnalytics: boolean;
    hasReports: boolean;
    hasExports: boolean;
    hasCustomerInsights: boolean;
    _count: {
        subscriptions: number;
    };
}

interface Subscription {
    id: string;
    sellerId: string;
    planId: string;
    isActive: boolean;
    createdAt: Date;
    seller: {
        id: string;
        shopName: string;
        ownerName: string;
        email: string;
        isActive: boolean;
    };
    plan: {
        id: string;
        name: string;
        tier: string;
    };
}

interface SellerBasic {
    id: string;
    shopName: string;
    ownerName: string;
}

interface SubscriptionsClientProps {
    plans: SubscriptionPlan[];
    subscriptions: Subscription[];
    sellersWithoutSub: SellerBasic[];
}

export function SubscriptionsClient({
    plans,
    subscriptions,
    sellersWithoutSub,
}: SubscriptionsClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"plans" | "assignments">("plans");
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Assignment form
    const [assignForm, setAssignForm] = useState({
        sellerId: "",
        planId: "",
    });

    const handleAssignSubscription = async () => {
        if (!assignForm.sellerId || !assignForm.planId) {
            alert("Please select both seller and plan");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/subscriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(assignForm),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to assign subscription");
            }

            setAssignDialogOpen(false);
            setAssignForm({ sellerId: "", planId: "" });
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePlan = async (subscriptionId: string, newPlanId: string) => {
        try {
            const res = await fetch("/api/admin/subscriptions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscriptionId, planId: newPlanId }),
            });

            if (!res.ok) {
                throw new Error("Failed to update subscription");
            }

            router.refresh();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const getPlanColor = (tier: string) => {
        switch (tier) {
            case "FREE":
                return "from-gray-400 to-gray-500";
            case "BASIC":
                return "from-blue-400 to-blue-600";
            case "PRO":
                return "from-purple-500 to-purple-700";
            case "ENTERPRISE":
                return "from-amber-500 to-orange-600";
            default:
                return "from-gray-400 to-gray-500";
        }
    };

    const getPlanBadgeColor = (tier: string) => {
        switch (tier) {
            case "FREE":
                return "bg-gray-100 text-gray-700";
            case "BASIC":
                return "bg-blue-100 text-blue-700";
            case "PRO":
                return "bg-purple-100 text-purple-700";
            case "ENTERPRISE":
                return "bg-amber-100 text-amber-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="p-6">
            <PageHeader
                title="Subscriptions"
                description="Manage subscription plans and seller assignments"
                actions={
                    <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-600 hover:bg-purple-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Assign Subscription
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Assign Subscription</DialogTitle>
                                <DialogDescription>
                                    Assign a subscription plan to a seller
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Seller</Label>
                                    <Select
                                        value={assignForm.sellerId}
                                        onValueChange={(value) =>
                                            setAssignForm({ ...assignForm, sellerId: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select seller" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sellersWithoutSub.map((seller) => (
                                                <SelectItem key={seller.id} value={seller.id}>
                                                    {seller.shopName} - {seller.ownerName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Plan</Label>
                                    <Select
                                        value={assignForm.planId}
                                        onValueChange={(value) =>
                                            setAssignForm({ ...assignForm, planId: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {plans.map((plan) => (
                                                <SelectItem key={plan.id} value={plan.id}>
                                                    {plan.name} - {formatCurrency(plan.price)}/mo
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setAssignDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleAssignSubscription} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                                    {loading ? "Assigning..." : "Assign"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                }
            />

            {/* Tab Buttons */}
            <div className="flex gap-2 mb-6">
                <Button
                    variant={activeTab === "plans" ? "default" : "outline"}
                    onClick={() => setActiveTab("plans")}
                    className={activeTab === "plans" ? "bg-purple-600 hover:bg-purple-700" : ""}
                >
                    Subscription Plans
                </Button>
                <Button
                    variant={activeTab === "assignments" ? "default" : "outline"}
                    onClick={() => setActiveTab("assignments")}
                    className={activeTab === "assignments" ? "bg-purple-600 hover:bg-purple-700" : ""}
                >
                    Assignments ({subscriptions.length})
                </Button>
            </div>

            {/* Plans Tab */}
            {activeTab === "plans" && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {plans.map((plan) => (
                        <Card key={plan.id} className="relative overflow-hidden border-0 shadow-lg">
                            {/* Gradient header */}
                            <div className={`h-2 bg-gradient-to-r ${getPlanColor(plan.tier)}`} />
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-bold text-gray-900">{plan.name}</CardTitle>
                                    <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${getPlanBadgeColor(plan.tier)}`}>
                                        {plan.tier}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {formatCurrency(plan.price)}
                                        <span className="text-sm font-normal text-gray-500">/mo</span>
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {plan._count.subscriptions} active subscriber{plan._count.subscriptions !== 1 ? "s" : ""}
                                    </p>
                                </div>

                                <div className="space-y-2 py-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Max Products</span>
                                        <span className="font-medium text-gray-900">
                                            {plan.maxProducts || "Unlimited"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Max Users</span>
                                        <span className="font-medium text-gray-900">
                                            {plan.maxUsers || "Unlimited"}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 space-y-2">
                                    <Feature enabled={plan.hasAnalytics} label="Analytics" />
                                    <Feature enabled={plan.hasReports} label="Reports" />
                                    <Feature enabled={plan.hasExports} label="Exports" />
                                    <Feature enabled={plan.hasCustomerInsights} label="Customer Insights" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Assignments Tab */}
            {activeTab === "assignments" && (
                <Card>
                    <CardHeader className="border-b">
                        <CardTitle className="text-lg font-semibold text-gray-900">Subscription Assignments</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {subscriptions.length === 0 ? (
                            <div className="text-center py-12">
                                <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No subscriptions yet</p>
                                <p className="text-sm text-gray-400 mt-1">Assign a plan to a seller to get started</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold text-gray-700">Seller</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Current Plan</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Since</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Change Plan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {subscriptions.map((sub) => (
                                        <TableRow key={sub.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {sub.seller.shopName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {sub.seller.ownerName}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(sub.plan.tier)}`}>
                                                    {sub.plan.name}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        sub.isActive
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {sub.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                {format(new Date(sub.createdAt), "MMM dd, yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={sub.planId}
                                                    onValueChange={(value) =>
                                                        handleChangePlan(sub.id, value)
                                                    }
                                                >
                                                    <SelectTrigger className="w-[140px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {plans.map((plan) => (
                                                            <SelectItem key={plan.id} value={plan.id}>
                                                                {plan.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function Feature({ enabled, label }: { enabled: boolean; label: string }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            {enabled ? (
                <Check className="h-4 w-4 text-emerald-500" />
            ) : (
                <X className="h-4 w-4 text-gray-300" />
            )}
            <span className={enabled ? "text-gray-900" : "text-gray-400"}>{label}</span>
        </div>
    );
}
