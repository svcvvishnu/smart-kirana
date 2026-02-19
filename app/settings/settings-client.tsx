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
import { Plus, Pencil, Trash2, Settings, Ruler } from "lucide-react";

interface Seller {
    id: string;
    shopName: string;
    defaultPricingMode: string;
    defaultMarkupPercentage: number;
}

interface Unit {
    id: string;
    name: string;
    abbreviation: string;
    sellerId: string | null;
    _count: { products: number };
}

interface SettingsClientProps {
    seller: Seller;
    units: Unit[];
}

export function SettingsClient({ seller: initialSeller, units: initialUnits }: SettingsClientProps) {
    const router = useRouter();
    const [seller, setSeller] = useState(initialSeller);
    const [units, setUnits] = useState(initialUnits);
    const [pricingMode, setPricingMode] = useState(seller.defaultPricingMode);
    const [markupPercentage, setMarkupPercentage] = useState(seller.defaultMarkupPercentage);
    const [savingPricing, setSavingPricing] = useState(false);
    const [pricingSaved, setPricingSaved] = useState(false);

    // Unit management
    const [unitDialogOpen, setUnitDialogOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [editUnitDialogOpen, setEditUnitDialogOpen] = useState(false);
    const [newUnitName, setNewUnitName] = useState("");
    const [newUnitAbbr, setNewUnitAbbr] = useState("");
    const [editUnitName, setEditUnitName] = useState("");
    const [editUnitAbbr, setEditUnitAbbr] = useState("");
    const [unitLoading, setUnitLoading] = useState(false);

    const handleSavePricing = async () => {
        setSavingPricing(true);
        setPricingSaved(false);
        try {
            const res = await fetch("/api/sellers/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    defaultPricingMode: pricingMode,
                    defaultMarkupPercentage: markupPercentage,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || "Failed to save settings");
                return;
            }
            setPricingSaved(true);
            setTimeout(() => setPricingSaved(false), 3000);
            router.refresh();
        } catch {
            alert("Failed to save settings");
        } finally {
            setSavingPricing(false);
        }
    };

    const handleCreateUnit = async () => {
        if (!newUnitName.trim() || !newUnitAbbr.trim()) return;
        setUnitLoading(true);
        try {
            const res = await fetch("/api/units", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newUnitName.trim(), abbreviation: newUnitAbbr.trim() }),
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || "Failed to create unit");
                return;
            }
            setNewUnitName("");
            setNewUnitAbbr("");
            setUnitDialogOpen(false);
            router.refresh();
        } catch {
            alert("Failed to create unit");
        } finally {
            setUnitLoading(false);
        }
    };

    const handleEditUnit = async () => {
        if (!editingUnit || !editUnitName.trim() || !editUnitAbbr.trim()) return;
        setUnitLoading(true);
        try {
            const res = await fetch(`/api/units/${editingUnit.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editUnitName.trim(), abbreviation: editUnitAbbr.trim() }),
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || "Failed to update unit");
                return;
            }
            setEditUnitDialogOpen(false);
            setEditingUnit(null);
            router.refresh();
        } catch {
            alert("Failed to update unit");
        } finally {
            setUnitLoading(false);
        }
    };

    const handleDeleteUnit = async (unit: Unit) => {
        if (unit._count.products > 0) {
            alert(`Cannot delete "${unit.name}". ${unit._count.products} product(s) are using it.`);
            return;
        }
        if (!confirm(`Delete unit "${unit.name}"?`)) return;
        try {
            const res = await fetch(`/api/units/${unit.id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || "Failed to delete unit");
                return;
            }
            router.refresh();
        } catch {
            alert("Failed to delete unit");
        }
    };

    const systemUnits = initialUnits.filter((u) => u.sellerId === null);
    const customUnits = initialUnits.filter((u) => u.sellerId !== null);

    return (
        <div className="p-6">
            <PageHeader
                title="Settings"
                description="Configure your shop preferences"
            />

            <div className="space-y-6 max-w-2xl">
                {/* Default Pricing Rules */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Default Pricing Rules
                        </CardTitle>
                        <CardDescription>
                            Set default pricing mode for new products. Individual products can override this.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <Label>Pricing Mode</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="defaultPricingMode"
                                        value="FIXED"
                                        checked={pricingMode === "FIXED"}
                                        onChange={() => setPricingMode("FIXED")}
                                        className="accent-indigo-600"
                                    />
                                    <span className="text-sm">Fixed Selling Price</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="defaultPricingMode"
                                        value="MARKUP"
                                        checked={pricingMode === "MARKUP"}
                                        onChange={() => setPricingMode("MARKUP")}
                                        className="accent-indigo-600"
                                    />
                                    <span className="text-sm">Markup Percentage</span>
                                </label>
                            </div>
                        </div>

                        {pricingMode === "MARKUP" && (
                            <div className="space-y-2">
                                <Label htmlFor="markup">Default Markup Percentage (%)</Label>
                                <Input
                                    id="markup"
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={markupPercentage}
                                    onChange={(e) => setMarkupPercentage(parseFloat(e.target.value) || 0)}
                                    className="max-w-xs"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Selling price = Purchase price × (1 + {markupPercentage}%)
                                </p>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <Button onClick={handleSavePricing} disabled={savingPricing}>
                                {savingPricing ? "Saving..." : "Save Pricing Rules"}
                            </Button>
                            {pricingSaved && (
                                <span className="text-sm text-green-600">Saved successfully!</span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Unit Management */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Ruler className="h-5 w-5" />
                                    Units of Measurement
                                </CardTitle>
                                <CardDescription>
                                    System defaults are available to all sellers. Create custom units for your shop.
                                </CardDescription>
                            </div>
                            <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Unit
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Custom Unit</DialogTitle>
                                        <DialogDescription>Create a new unit for your products.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="space-y-2">
                                            <Label>Unit Name</Label>
                                            <Input
                                                value={newUnitName}
                                                onChange={(e) => setNewUnitName(e.target.value)}
                                                placeholder="e.g., Bottle"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Abbreviation</Label>
                                            <Input
                                                value={newUnitAbbr}
                                                onChange={(e) => setNewUnitAbbr(e.target.value)}
                                                placeholder="e.g., btl"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setUnitDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleCreateUnit} disabled={unitLoading || !newUnitName.trim() || !newUnitAbbr.trim()}>
                                            {unitLoading ? "Creating..." : "Create"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">System Defaults</h4>
                            <div className="flex flex-wrap gap-2">
                                {systemUnits.map((unit) => (
                                    <span
                                        key={unit.id}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-md text-sm"
                                    >
                                        {unit.name}
                                        <span className="text-muted-foreground">({unit.abbreviation})</span>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {customUnits.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Custom Units</h4>
                                <div className="space-y-2">
                                    {customUnits.map((unit) => (
                                        <div key={unit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                            <div>
                                                <span className="font-medium">{unit.name}</span>
                                                <span className="text-muted-foreground ml-2">({unit.abbreviation})</span>
                                                {unit._count.products > 0 && (
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        {unit._count.products} product{unit._count.products !== 1 ? "s" : ""}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => {
                                                        setEditingUnit(unit);
                                                        setEditUnitName(unit.name);
                                                        setEditUnitAbbr(unit.abbreviation);
                                                        setEditUnitDialogOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDeleteUnit(unit)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit Unit Dialog */}
            <Dialog open={editUnitDialogOpen} onOpenChange={setEditUnitDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Unit</DialogTitle>
                        <DialogDescription>Update this unit&apos;s name or abbreviation.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Unit Name</Label>
                            <Input value={editUnitName} onChange={(e) => setEditUnitName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Abbreviation</Label>
                            <Input value={editUnitAbbr} onChange={(e) => setEditUnitAbbr(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditUnitDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditUnit} disabled={unitLoading || !editUnitName.trim() || !editUnitAbbr.trim()}>
                            {unitLoading ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
