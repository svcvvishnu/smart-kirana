// Business calculation utilities

export interface DiscountCalculation {
    subtotal: number
    discountAmount: number
    total: number
}

export function calculateDiscount(
    subtotal: number,
    discountType: 'PERCENTAGE' | 'FLAT' | null,
    discountValue: number
): DiscountCalculation {
    let discountAmount = 0

    if (discountType === 'PERCENTAGE') {
        discountAmount = (subtotal * discountValue) / 100
    } else if (discountType === 'FLAT') {
        discountAmount = Math.min(discountValue, subtotal) // Can't discount more than subtotal
    }

    return {
        subtotal,
        discountAmount,
        total: subtotal - discountAmount,
    }
}

export function calculateProfit(
    sellingPrice: number,
    purchasePrice: number,
    quantity: number
): number {
    return (sellingPrice - purchasePrice) * quantity
}

export function calculateProfitMargin(
    sellingPrice: number,
    purchasePrice: number
): number {
    if (purchasePrice === 0) return 0
    return ((sellingPrice - purchasePrice) / purchasePrice) * 100
}

export function generateInvoiceNumber(): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')
    return `INV-${timestamp}-${random}`
}
