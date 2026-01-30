"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CustomerForm } from "@/components/customers/customer-form";
import { CustomerList } from "@/components/customers/customer-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    totalSpent: number;
    purchaseCount: number;
    lastPurchase: Date | null;
}

interface CustomersClientProps {
    initialCustomers: Customer[];
}

export function CustomersClient({ initialCustomers }: CustomersClientProps) {
    const router = useRouter();
    const [customers, setCustomers] = useState(initialCustomers);
    const [searchQuery, setSearchQuery] = useState("");

    const handleCreateCustomer = async (data: Partial<Customer>) => {
        const res = await fetch("/api/customers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to create customer");
        }

        router.refresh();
    };

    const handleUpdateCustomer = async (id: string, data: Partial<Customer>) => {
        const res = await fetch(`/api/customers/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to update customer");
        }

        router.refresh();
    };

    const handleDeleteCustomer = async (id: string) => {
        const res = await fetch(`/api/customers/${id}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to delete customer");
        }

        router.refresh();
    };

    // Filter customers
    const filteredCustomers = customers.filter((customer) => {
        const matchesSearch =
            customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.phone.includes(searchQuery);
        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                                    <Home className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-2">
                                    <Users className="h-8 w-8" />
                                    Customers
                                </h1>
                                <p className="text-indigo-100 mt-1">
                                    Manage customer information and history
                                </p>
                            </div>
                        </div>
                        <CustomerForm
                            onSubmit={handleCreateCustomer}
                            trigger={
                                <Button variant="secondary" size="lg">
                                    <Plus className="h-5 w-5 mr-2" />
                                    Add Customer
                                </Button>
                            }
                        />
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Search */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Customer List */}
                <CustomerList
                    customers={filteredCustomers}
                    onUpdate={handleUpdateCustomer}
                    onDelete={handleDeleteCustomer}
                />
            </div>
        </div>
    );
}
