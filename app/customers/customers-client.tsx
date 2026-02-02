"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";
import { CustomerList } from "@/components/customers/customer-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users } from "lucide-react";
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
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
                        <Users className="h-6 w-6 text-indigo-600" />
                        Customers
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage customer information and history
                    </p>
                </div>
                <CustomerForm
                    onSubmit={handleCreateCustomer}
                    trigger={
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Customer
                        </Button>
                    }
                />
            </div>

            {/* Search */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
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
    );
}
