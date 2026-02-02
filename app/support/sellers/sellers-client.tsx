"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Store, Search, Eye } from "lucide-react";

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
        customers: number;
    };
}

interface SupportSellersClientProps {
    sellers: Seller[];
}

export function SupportSellersClient({ sellers }: SupportSellersClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Filter sellers
    const filteredSellers = sellers.filter((seller) => {
        const matchesSearch =
            seller.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            seller.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            seller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            seller.phone.includes(searchQuery);
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && seller.isActive) ||
            (statusFilter === "inactive" && !seller.isActive);
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Sellers</h1>
                <p className="text-slate-400 mt-1">View seller information (read-only)</p>
            </div>

            {/* Filters */}
            <Card className="mb-6 bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by shop name, owner, email, or phone..."
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
                                        <TableHead className="text-slate-300">Contact</TableHead>
                                        <TableHead className="text-slate-300">Plan</TableHead>
                                        <TableHead className="text-slate-300">Status</TableHead>
                                        <TableHead className="text-slate-300">Stats</TableHead>
                                        <TableHead className="text-slate-300 text-right">View</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSellers.map((seller) => (
                                        <TableRow key={seller.id} className="border-slate-700">
                                            <TableCell className="text-white font-medium">
                                                <div>
                                                    <p>{seller.shopName}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {seller.businessType.replace("_", " ")}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                {seller.ownerName}
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                <div>
                                                    <p className="text-sm">{seller.email}</p>
                                                    <p className="text-xs text-slate-500">{seller.phone}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-300">
                                                    {seller.subscription?.plan.tier || "FREE"}
                                                </span>
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
                                            <TableCell className="text-slate-300">
                                                <div className="text-xs">
                                                    <p>{seller._count.products} products</p>
                                                    <p>{seller._count.sales} sales</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/support/sellers/${seller.id}`}>
                                                    <Button variant="ghost" size="sm" className="text-cyan-400">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
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
