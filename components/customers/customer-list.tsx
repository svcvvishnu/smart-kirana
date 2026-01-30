"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CustomerForm } from "./customer-form";
import { Edit, Trash2, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    totalSpent: number;
    purchaseCount: number;
    lastPurchase: Date | null;
}

interface CustomerListProps {
    customers: Customer[];
    onUpdate: (id: string, data: Partial<Customer>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onView?: (id: string) => void;
}

export function CustomerList({
    customers,
    onUpdate,
    onDelete,
    onView,
}: CustomerListProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!deleteId) return;

        setDeleting(true);
        try {
            await onDelete(deleteId);
            setDeleteId(null);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setDeleting(false);
        }
    };

    if (customers.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No customers found.</p>
                <p className="text-sm text-muted-foreground mt-2">
                    Add your first customer to get started.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Total Spent</TableHead>
                            <TableHead>Purchases</TableHead>
                            <TableHead>Last Purchase</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.map((customer) => (
                            <TableRow key={customer.id}>
                                <TableCell className="font-medium">
                                    {customer.name}
                                </TableCell>
                                <TableCell>{customer.phone}</TableCell>
                                <TableCell>
                                    {customer.email || <span className="text-muted-foreground">-</span>}
                                </TableCell>
                                <TableCell>{formatCurrency(customer.totalSpent)}</TableCell>
                                <TableCell>{customer.purchaseCount}</TableCell>
                                <TableCell>
                                    {customer.lastPurchase
                                        ? format(new Date(customer.lastPurchase), "MMM dd, yyyy")
                                        : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {onView && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onView(customer.id)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <CustomerForm
                                            customer={customer}
                                            onSubmit={(data) => onUpdate(customer.id, data)}
                                            trigger={
                                                <Button variant="ghost" size="sm">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeleteId(customer.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Customer</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this customer? This action cannot be
                            undone. Customers with existing sales cannot be deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteId(null)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
