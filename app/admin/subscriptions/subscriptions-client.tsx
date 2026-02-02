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
import { CreditCard, Plus, Edit, Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

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

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Subscriptions</h1>
                    <p className="text-slate-400 mt-1">Manage plans and assignments</p>
                </div>
                <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
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
                            <Button onClick={handleAssignSubscription} disabled={loading}>
                                {loading ? "Assigning..." : "Assign"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tab Buttons */}
            <div className="flex gap-2 mb-6">
                <Button
                    variant={activeTab === "plans" ? "default" : "outline"}
                    onClick={() => setActiveTab("plans")}
                    className={activeTab !== "plans" ? "text-slate-300" : ""}
                >
                    Subscription Plans
                </Button>
                <Button
                    variant={activeTab === "assignments" ? "default" : "outline"}
                    onClick={() => setActiveTab("assignments")}
                    className={activeTab !== "assignments" ? "text-slate-300" : ""}
                >
                    Assignments ({subscriptions.length})
                </Button>
            </div>

            {/* Plans Tab */}
            {activeTab === "plans" && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {plans.map((plan) => (
                        <Card key={plan.id} className="bg-slate-800 border-slate-700">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-white">{plan.name}</CardTitle>
                                    <span className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300">
                                        {plan.tier}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-3xl font-bold text-white">
                                        {formatCurrency(plan.price)}
                                        <span className="text-sm text-slate-400">/mo</span>
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {plan._count.subscriptions} active subscribers
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Max Products</span>
                                        <span className="text-white">
                                            {plan.maxProducts || "Unlimited"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Max Users</span>
                                        <span className="text-white">
                                            {plan.maxUsers || "Unlimited"}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-700 space-y-2">
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
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Subscription Assignments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {subscriptions.length === 0 ? (
                            <div className="text-center py-12">
                                <CreditCard className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">No subscriptions yet</p>
                            </div>
                        ) : (
                            <div className="rounded-md border border-slate-700">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-slate-700">
                                            <TableHead className="text-slate-300">Seller</TableHead>
                                            <TableHead className="text-slate-300">Current Plan</TableHead>
                                            <TableHead className="text-slate-300">Status</TableHead>
                                            <TableHead className="text-slate-300">Since</TableHead>
                                            <TableHead className="text-slate-300">Change Plan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subscriptions.map((sub) => (
                                            <TableRow key={sub.id} className="border-slate-700">
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-white">
                                                            {sub.seller.shopName}
                                                        </p>
                                                        <p className="text-sm text-slate-400">
                                                            {sub.seller.ownerName}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-300">
                                                        {sub.plan.name}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs ${
                                                            sub.isActive
                                                                ? "bg-emerald-500/20 text-emerald-400"
                                                                : "bg-red-500/20 text-red-400"
                                                        }`}
                                                    >
                                                        {sub.isActive ? "Active" : "Inactive"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-slate-300">
                                                    {format(new Date(sub.createdAt), "MMM dd, yyyy")}
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={sub.planId}
                                                        onValueChange={(value) =>
                                                            handleChangePlan(sub.id, value)
                                                        }
                                                    >
                                                        <SelectTrigger className="w-[140px] bg-slate-700 border-slate-600 text-white">
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
                            </div>
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
                <Check className="h-4 w-4 text-emerald-400" />
            ) : (
                <X className="h-4 w-4 text-slate-500" />
            )}
            <span className={enabled ? "text-white" : "text-slate-500"}>{label}</span>
        </div>
    );
}
