"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Printer } from "lucide-react";

interface SaleInvoiceProps {
    sale: {
        saleNumber: string;
        createdAt: Date;
        subtotal: number;
        discountAmount: number;
        total: number;
        customer?: {
            name: string;
            phone: string;
        } | null;
        seller: {
            shopName: string;
            address?: string | null;
            phone?: string | null;
            gstNumber?: string | null;
        };
        items: Array<{
            product: {
                name: string;
            };
            quantity: number;
            sellingPrice: number;
            subtotal: number;
        }>;
    };
}

export function SaleInvoice({ sale }: SaleInvoiceProps) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-white p-8 rounded-lg border max-w-4xl mx-auto">
            {/* Print Button - Hidden in print */}
            <div className="mb-6 print:hidden">
                <Button onClick={handlePrint} className="w-full">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Invoice
                </Button>
            </div>

            {/* Invoice Content - Print optimized */}
            <div className="space-y-6">
                {/* Header */}
                <div className="text-center border-b pb-4">
                    <h1 className="text-3xl font-bold">{sale.seller.shopName}</h1>
                    {sale.seller.address && (
                        <p className="text-sm text-muted-foreground mt-1">
                            {sale.seller.address}
                        </p>
                    )}
                    {sale.seller.phone && (
                        <p className="text-sm text-muted-foreground">
                            Phone: {sale.seller.phone}
                        </p>
                    )}
                    {sale.seller.gstNumber && (
                        <p className="text-sm text-muted-foreground">
                            GST: {sale.seller.gstNumber}
                        </p>
                    )}
                </div>

                {/* Invoice Details */}
                <div className="flex justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Invoice Number</p>
                        <p className="font-semibold text-lg">{sale.saleNumber}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-semibold">
                            {format(new Date(sale.createdAt), "MMM dd, yyyy HH:mm")}
                        </p>
                    </div>
                </div>

                {/* Customer Details */}
                {sale.customer && (
                    <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-1">Bill To:</p>
                        <p className="font-semibold">{sale.customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {sale.customer.phone}
                        </p>
                    </div>
                )}

                {/* Items Table */}
                <div className="border-t pt-4">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2">Item</th>
                                <th className="text-center py-2">Qty</th>
                                <th className="text-right py-2">Price</th>
                                <th className="text-right py-2">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items.map((item, index) => (
                                <tr key={index} className="border-b">
                                    <td className="py-3">{item.product.name}</td>
                                    <td className="text-center py-3">{item.quantity}</td>
                                    <td className="text-right py-3">
                                        {formatCurrency(item.sellingPrice)}
                                    </td>
                                    <td className="text-right py-3">
                                        {formatCurrency(item.subtotal)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-semibold">
                            {formatCurrency(sale.subtotal)}
                        </span>
                    </div>
                    {sale.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Discount:</span>
                            <span className="font-semibold">
                                -{formatCurrency(sale.discountAmount)}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-bold border-t pt-2">
                        <span>Total:</span>
                        <span>{formatCurrency(sale.total)}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t pt-4 text-center text-sm text-muted-foreground">
                    <p>Thank you for your business!</p>
                </div>
            </div>
        </div>
    );
}
