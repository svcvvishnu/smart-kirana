"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Printer, MessageCircle, Mail, Share2, Loader2 } from "lucide-react";

interface SaleInvoiceProps {
    sale: {
        id?: string;
        saleNumber: string;
        createdAt: Date;
        subtotal: number;
        discountAmount: number;
        total: number;
        paymentMethod?: string;
        customer?: {
            name: string;
            phone: string;
            email?: string | null;
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
                unit?: { name: string; abbreviation: string } | null;
            };
            quantity: number;
            sellingPrice: number;
            subtotal: number;
        }>;
    };
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    CASH: "Cash",
    UPI: "UPI",
    CARD: "Card",
    BANK_TRANSFER: "Bank Transfer",
    CREDIT: "Credit",
};

export function SaleInvoice({ sale }: SaleInvoiceProps) {
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [email, setEmail] = useState(sale.customer?.email || "");
    const [sending, setSending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const paymentLabel = sale.paymentMethod ? PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod : "Cash";

    const handlePrint = () => {
        window.print();
    };

    const handleWhatsAppShare = () => {
        const itemsList = sale.items
            .map((item) => {
                const unitStr = item.product.unit ? ` ${item.product.unit.abbreviation}` : "";
                return `• ${item.product.name} x ${item.quantity}${unitStr} = ${formatCurrency(item.subtotal)}`;
            })
            .join("\n");

        const message = `
*Invoice from ${sale.seller.shopName}*
Invoice #: ${sale.saleNumber}
Date: ${format(new Date(sale.createdAt), "MMM dd, yyyy HH:mm")}

*Items:*
${itemsList}

Subtotal: ${formatCurrency(sale.subtotal)}
${sale.discountAmount > 0 ? `Discount: -${formatCurrency(sale.discountAmount)}` : ""}
*Total: ${formatCurrency(sale.total)}*
Payment: ${paymentLabel}

Thank you for your business!
        `.trim();

        // WhatsApp web/app URL
        const whatsappUrl = sale.customer?.phone
            ? `https://wa.me/${sale.customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
            : `https://wa.me/?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, "_blank");
    };

    const handleEmailShare = async () => {
        if (!email || !email.includes("@")) {
            alert("Please enter a valid email address");
            return;
        }

        if (!sale.id) {
            alert("Cannot share this invoice via email");
            return;
        }

        setSending(true);
        try {
            const res = await fetch(`/api/sales/${sale.id}/share`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "email", email }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to send email");
            }

            setEmailSent(true);
            setTimeout(() => {
                setEmailDialogOpen(false);
                setEmailSent(false);
            }, 2000);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg border max-w-4xl mx-auto">
            {/* Action Buttons - Hidden in print */}
            <div className="mb-6 print:hidden space-y-3">
                <Button onClick={handlePrint} className="w-full">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Invoice
                </Button>
                
                <div className="flex gap-3">
                    <Button
                        onClick={handleWhatsAppShare}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Share via WhatsApp
                    </Button>
                    
                    <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1">
                                <Mail className="h-4 w-4 mr-2" />
                                Share via Email
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Send Invoice via Email</DialogTitle>
                                <DialogDescription>
                                    Enter the email address to send the invoice to.
                                </DialogDescription>
                            </DialogHeader>
                            {emailSent ? (
                                <div className="py-8 text-center">
                                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                        <Mail className="h-6 w-6 text-green-600" />
                                    </div>
                                    <p className="text-green-600 font-medium">Email sent successfully!</p>
                                </div>
                            ) : (
                                <>
                                    <div className="py-4">
                                        <Input
                                            type="email"
                                            placeholder="customer@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => setEmailDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button onClick={handleEmailShare} disabled={sending}>
                                            {sending ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Share2 className="h-4 w-4 mr-2" />
                                                    Send Invoice
                                                </>
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
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
                                    <td className="text-center py-3">
                                        {item.quantity}{item.product.unit ? ` ${item.product.unit.abbreviation}` : ""}
                                    </td>
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

                {/* Payment Method */}
                {sale.paymentMethod && (
                    <div className="border-t pt-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Payment Method:</span>
                            <span className="font-medium">{paymentLabel}</span>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="border-t pt-4 text-center text-sm text-muted-foreground">
                    <p>Thank you for your business!</p>
                </div>
            </div>
        </div>
    );
}
