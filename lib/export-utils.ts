import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

// Sales Report PDF Export
export function exportSalesReportPDF(data: {
    startDate: string;
    endDate: string;
    summary: {
        totalSales: number;
        totalProfit: number;
        totalDiscount: number;
        totalOrders: number;
        averageOrderValue: number;
    };
    sales: Array<{
        saleNumber: string;
        date: Date;
        customer: string;
        subtotal: number;
        discount: number;
        total: number;
        profit: number;
    }>;
}) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.text("Sales Report", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(
        `Period: ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}`,
        pageWidth / 2,
        28,
        { align: "center" }
    );

    // Summary
    doc.setFontSize(14);
    doc.text("Summary", 14, 45);
    
    doc.setFontSize(10);
    let y = 55;
    doc.text(`Total Sales: ₹${data.summary.totalSales.toFixed(2)}`, 14, y);
    doc.text(`Total Profit: ₹${data.summary.totalProfit.toFixed(2)}`, 100, y);
    y += 8;
    doc.text(`Total Orders: ${data.summary.totalOrders}`, 14, y);
    doc.text(`Avg. Order Value: ₹${data.summary.averageOrderValue.toFixed(2)}`, 100, y);
    y += 8;
    doc.text(`Total Discounts: ₹${data.summary.totalDiscount.toFixed(2)}`, 14, y);

    // Table header
    y += 20;
    doc.setFontSize(12);
    doc.text("Sales Details", 14, y);
    
    y += 10;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice #", 14, y);
    doc.text("Date", 45, y);
    doc.text("Customer", 75, y);
    doc.text("Total", 130, y);
    doc.text("Profit", 165, y);
    
    doc.setFont("helvetica", "normal");
    y += 5;
    doc.line(14, y, pageWidth - 14, y);
    y += 5;

    // Table rows
    for (const sale of data.sales.slice(0, 30)) {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        
        doc.text(sale.saleNumber, 14, y);
        doc.text(new Date(sale.date).toLocaleDateString(), 45, y);
        doc.text(sale.customer.slice(0, 20), 75, y);
        doc.text(`₹${sale.total.toFixed(2)}`, 130, y);
        doc.text(`₹${sale.profit.toFixed(2)}`, 165, y);
        y += 7;
    }

    // Footer
    doc.setFontSize(8);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 285);

    doc.save(`sales-report-${new Date().toISOString().split("T")[0]}.pdf`);
}

// Stock Report PDF Export
export function exportStockReportPDF(data: {
    summary: {
        totalProducts: number;
        totalStockValue: number;
        totalSellingValue: number;
        potentialProfit: number;
        lowStockCount: number;
        outOfStockCount: number;
        healthyStockCount: number;
    };
    products: Array<{
        name: string;
        category: string;
        currentStock: number;
        minStockLevel: number;
        purchasePrice: number;
        sellingPrice: number;
        stockValue: number;
        status: string;
    }>;
}) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.text("Stock Report", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: "center" });

    // Summary
    doc.setFontSize(14);
    doc.text("Summary", 14, 45);
    
    doc.setFontSize(10);
    let y = 55;
    doc.text(`Total Products: ${data.summary.totalProducts}`, 14, y);
    doc.text(`Stock Value: ₹${data.summary.totalStockValue.toFixed(2)}`, 100, y);
    y += 8;
    doc.text(`Potential Revenue: ₹${data.summary.totalSellingValue.toFixed(2)}`, 14, y);
    doc.text(`Potential Profit: ₹${data.summary.potentialProfit.toFixed(2)}`, 100, y);
    y += 8;
    doc.text(`Low Stock: ${data.summary.lowStockCount}`, 14, y);
    doc.text(`Out of Stock: ${data.summary.outOfStockCount}`, 70, y);
    doc.text(`Healthy: ${data.summary.healthyStockCount}`, 130, y);

    // Table header
    y += 20;
    doc.setFontSize(12);
    doc.text("Product Details", 14, y);
    
    y += 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Product", 14, y);
    doc.text("Category", 60, y);
    doc.text("Stock", 95, y);
    doc.text("Min", 115, y);
    doc.text("Value", 135, y);
    doc.text("Status", 165, y);
    
    doc.setFont("helvetica", "normal");
    y += 5;
    doc.line(14, y, pageWidth - 14, y);
    y += 5;

    // Table rows
    for (const product of data.products.slice(0, 40)) {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        
        doc.text(product.name.slice(0, 25), 14, y);
        doc.text(product.category.slice(0, 15), 60, y);
        doc.text(product.currentStock.toString(), 95, y);
        doc.text(product.minStockLevel.toString(), 115, y);
        doc.text(`₹${product.stockValue.toFixed(0)}`, 135, y);
        doc.text(product.status.replace("_", " "), 165, y);
        y += 6;
    }

    doc.save(`stock-report-${new Date().toISOString().split("T")[0]}.pdf`);
}

// Profit & Loss Report PDF Export
export function exportProfitLossReportPDF(data: {
    startDate: string;
    endDate: string;
    summary: {
        totalRevenue: number;
        grossProfit: number;
        totalExpenses: number;
        netProfit: number;
        totalDiscounts: number;
        totalOrders: number;
        profitMargin: number;
    };
    expensesByCategory: Array<{ category: string; amount: number }>;
}) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.text("Profit & Loss Statement", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(
        `Period: ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}`,
        pageWidth / 2,
        28,
        { align: "center" }
    );

    // Revenue Section
    let y = 50;
    doc.setFontSize(14);
    doc.text("Revenue", 14, y);
    
    doc.setFontSize(10);
    y += 10;
    doc.text(`Total Sales Revenue`, 20, y);
    doc.text(`₹${data.summary.totalRevenue.toFixed(2)}`, 150, y, { align: "right" });
    
    y += 8;
    doc.text(`Less: Discounts Given`, 20, y);
    doc.text(`-₹${data.summary.totalDiscounts.toFixed(2)}`, 150, y, { align: "right" });
    
    y += 5;
    doc.line(14, y, 160, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text(`Net Revenue`, 20, y);
    doc.text(`₹${(data.summary.totalRevenue - data.summary.totalDiscounts).toFixed(2)}`, 150, y, { align: "right" });
    doc.setFont("helvetica", "normal");

    // Gross Profit
    y += 15;
    doc.setFontSize(14);
    doc.text("Gross Profit", 14, y);
    
    doc.setFontSize(10);
    y += 10;
    doc.text(`Profit from Sales (after COGS)`, 20, y);
    doc.text(`₹${data.summary.grossProfit.toFixed(2)}`, 150, y, { align: "right" });

    // Expenses Section
    y += 15;
    doc.setFontSize(14);
    doc.text("Operating Expenses", 14, y);
    
    doc.setFontSize(10);
    y += 10;
    
    for (const expense of data.expensesByCategory) {
        doc.text(expense.category, 20, y);
        doc.text(`₹${expense.amount.toFixed(2)}`, 150, y, { align: "right" });
        y += 7;
    }
    
    y += 3;
    doc.line(14, y, 160, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text(`Total Expenses`, 20, y);
    doc.text(`₹${data.summary.totalExpenses.toFixed(2)}`, 150, y, { align: "right" });
    doc.setFont("helvetica", "normal");

    // Net Profit
    y += 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Net Profit", 14, y);
    
    doc.setFontSize(12);
    y += 10;
    const netProfitColor = data.summary.netProfit >= 0 ? [0, 128, 0] : [255, 0, 0];
    doc.setTextColor(...netProfitColor as [number, number, number]);
    doc.text(`₹${data.summary.netProfit.toFixed(2)}`, 150, y, { align: "right" });
    doc.setTextColor(0, 0, 0);
    
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Profit Margin: ${data.summary.profitMargin.toFixed(1)}%`, 20, y);

    // Footer
    doc.setFontSize(8);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 285);

    doc.save(`profit-loss-report-${new Date().toISOString().split("T")[0]}.pdf`);
}

// Excel Export Functions
export function exportSalesReportExcel(data: {
    summary: {
        totalSales: number;
        totalProfit: number;
        totalDiscount: number;
        totalOrders: number;
        averageOrderValue: number;
    };
    sales: Array<{
        saleNumber: string;
        date: Date;
        customer: string;
        subtotal: number;
        discount: number;
        total: number;
        profit: number;
    }>;
}) {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
        ["Sales Report Summary"],
        [],
        ["Metric", "Value"],
        ["Total Sales", data.summary.totalSales],
        ["Total Profit", data.summary.totalProfit],
        ["Total Discounts", data.summary.totalDiscount],
        ["Total Orders", data.summary.totalOrders],
        ["Average Order Value", data.summary.averageOrderValue],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    // Sales details sheet
    const salesData = [
        ["Invoice #", "Date", "Customer", "Subtotal", "Discount", "Total", "Profit"],
        ...data.sales.map((sale) => [
            sale.saleNumber,
            new Date(sale.date).toLocaleDateString(),
            sale.customer,
            sale.subtotal,
            sale.discount,
            sale.total,
            sale.profit,
        ]),
    ];
    const salesSheet = XLSX.utils.aoa_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, salesSheet, "Sales");

    XLSX.writeFile(wb, `sales-report-${new Date().toISOString().split("T")[0]}.xlsx`);
}

export function exportStockReportExcel(data: {
    summary: {
        totalProducts: number;
        totalStockValue: number;
        totalSellingValue: number;
        potentialProfit: number;
        lowStockCount: number;
        outOfStockCount: number;
        healthyStockCount: number;
    };
    products: Array<{
        name: string;
        category: string;
        currentStock: number;
        minStockLevel: number;
        purchasePrice: number;
        sellingPrice: number;
        stockValue: number;
        potentialProfit: number;
        status: string;
    }>;
}) {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
        ["Stock Report Summary"],
        [],
        ["Metric", "Value"],
        ["Total Products", data.summary.totalProducts],
        ["Total Stock Value", data.summary.totalStockValue],
        ["Potential Selling Value", data.summary.totalSellingValue],
        ["Potential Profit", data.summary.potentialProfit],
        ["Low Stock Items", data.summary.lowStockCount],
        ["Out of Stock Items", data.summary.outOfStockCount],
        ["Healthy Stock Items", data.summary.healthyStockCount],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    // Products sheet
    const productsData = [
        ["Product", "Category", "Current Stock", "Min Level", "Purchase Price", "Selling Price", "Stock Value", "Potential Profit", "Status"],
        ...data.products.map((p) => [
            p.name,
            p.category,
            p.currentStock,
            p.minStockLevel,
            p.purchasePrice,
            p.sellingPrice,
            p.stockValue,
            p.potentialProfit,
            p.status,
        ]),
    ];
    const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(wb, productsSheet, "Products");

    XLSX.writeFile(wb, `stock-report-${new Date().toISOString().split("T")[0]}.xlsx`);
}

export function exportProfitLossReportExcel(data: {
    summary: {
        totalRevenue: number;
        grossProfit: number;
        totalExpenses: number;
        netProfit: number;
        totalDiscounts: number;
        totalOrders: number;
        profitMargin: number;
    };
    expensesByCategory: Array<{ category: string; amount: number }>;
    dailyData: Array<{
        date: string;
        revenue: number;
        profit: number;
        expenses: number;
        netProfit: number;
    }>;
}) {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
        ["Profit & Loss Summary"],
        [],
        ["Revenue"],
        ["Total Revenue", data.summary.totalRevenue],
        ["Total Discounts", data.summary.totalDiscounts],
        [],
        ["Profit"],
        ["Gross Profit", data.summary.grossProfit],
        ["Total Expenses", data.summary.totalExpenses],
        ["Net Profit", data.summary.netProfit],
        ["Profit Margin %", data.summary.profitMargin],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    // Expenses sheet
    const expensesData = [
        ["Expenses by Category"],
        [],
        ["Category", "Amount"],
        ...data.expensesByCategory.map((e) => [e.category, e.amount]),
    ];
    const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(wb, expensesSheet, "Expenses");

    // Daily Data sheet
    const dailySheetData = [
        ["Date", "Revenue", "Profit", "Expenses", "Net Profit"],
        ...data.dailyData.map((d) => [d.date, d.revenue, d.profit, d.expenses, d.netProfit]),
    ];
    const dailySheet = XLSX.utils.aoa_to_sheet(dailySheetData);
    XLSX.utils.book_append_sheet(wb, dailySheet, "Daily Data");

    XLSX.writeFile(wb, `profit-loss-report-${new Date().toISOString().split("T")[0]}.xlsx`);
}
