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
        <div className="p-6">
            <PageHeader
                title="Sellers"
                description="View seller information (read-only access)"
            />

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by shop name, owner, email, or phone..."
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
                                    <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Plan</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Stats</TableHead>
                                    <TableHead className="font-semibold text-gray-700 text-right">View</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSellers.map((seller) => (
                                    <TableRow key={seller.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium text-gray-900">
                                            <div>
                                                <p>{seller.shopName}</p>
                                                <p className="text-xs text-gray-500">
                                                    {seller.businessType.replace("_", " ")}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {seller.ownerName}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="text-sm text-gray-900">{seller.email}</p>
                                                <p className="text-xs text-gray-500">{seller.phone}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700">
                                                {seller.subscription?.plan.tier || "FREE"}
                                            </span>
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
                                        <TableCell className="text-gray-600">
                                            <div className="text-xs">
                                                <p>{seller._count.products} products</p>
                                                <p>{seller._count.sales} sales</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/support/sellers/${seller.id}`}>
                                                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-cyan-600">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
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
