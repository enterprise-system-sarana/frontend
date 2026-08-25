import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import type { ColumnVisibilityItem } from "@/utils/PageFilter";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Raw CSV export given explicit headers.
 * Saves/downloads the file and opens it in a new tab/window.
 */
export function exportToCsv<T extends Record<string, any>>(
    data: T[],
    headers: { key: string; label: string }[],
    filename: string = "export.csv",
    openAfterSave: boolean = true
) {
    if (!data || !data.length) return;

    const safeFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    const headerRow = headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(",");
    const rows = data.map((item) =>
        headers
            .map((h) => {
                const val = item[h.key] ?? "";
                return `"${String(val).replace(/"/g, '""')}"`;
            })
            .join(",")
    );

    const csvContent = "\uFEFF" + [headerRow, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Trigger save/download
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", safeFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Open after save
    if (openAfterSave) {
        window.open(url, "_blank");
    }

    // Delay revoke so the new tab/window has time to load the content
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 60000);
}

/**
 * Raw PDF export given explicit headers.
 * Saves/downloads the PDF file.
 */
export function exportToPdf<T extends Record<string, any>>(
    data: T[],
    headers: { key: string; label: string }[],
    filename: string = "export.pdf",
    title: string = "Data Export"
) {
    if (!data || !data.length) return;

    const doc = new jsPDF({
        orientation: headers.length > 5 ? "landscape" : "portrait",
        unit: "pt",
        format: "a4",
    });

    const safeFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;

    // Add Document Title
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 40, 40);

    // Add Generation date/time
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    const dateStr = new Date().toLocaleString();
    doc.text(`Generated on: ${dateStr}`, 40, 55);

    const tableHeaders = [headers.map((h) => h.label)];
    const tableBody = data.map((item) =>
        headers.map((h) => {
            const val = item[h.key];
            if (val === null || val === undefined) return "-";
            if (typeof val === "object") return JSON.stringify(val);
            return String(val);
        })
    );

    autoTable(doc, {
        head: tableHeaders,
        body: tableBody,
        startY: 70,
        styles: {
            fontSize: 8,
            cellPadding: 6,
            textColor: [33, 37, 41],
            overflow: "linebreak",
        },
        headStyles: {
            fillColor: [11, 17, 32], // matching dark theme header #0B1120
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8.5,
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },
        margin: { top: 70, right: 40, bottom: 40, left: 40 },
        didDrawPage: (dataInfo) => {
            // Footer page numbers
            const pageCount = (doc as any).internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
            doc.text(
                `Page ${dataInfo.pageNumber} of ${pageCount}`,
                pageWidth - 40,
                pageHeight - 20,
                { align: "right" }
            );
        },
    });

    doc.save(safeFilename);
}

/**
 * Extracts a readable header title from a column definition
 */
export function getColumnHeaderLabel(column: any): string {
    if (typeof column.header === "string") {
        return column.header;
    }
    const key = column.accessorKey || column.id || "";
    if (typeof key === "string" && key) {
        return key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str: string) => str.toUpperCase())
            .trim();
    }
    return "Column";
}

/**
 * Automatically derives ColumnVisibilityItem[] for PageFilter from TanStack ColumnDef[]
 */
export function getColumnsForVisibility<TData>(
    columns: ColumnDef<TData, any>[],
    columnVisibility: VisibilityState = {}
): ColumnVisibilityItem[] {
    return columns
        .filter((col: any) => {
            const key = col.accessorKey || col.id;
            if (!key) return false;
            const lowerKey = String(key).toLowerCase();
            return lowerKey !== "action" && lowerKey !== "actions" && col.enableHiding !== false;
        })
        .map((col: any) => {
            const id = String(col.accessorKey || col.id);
            return {
                id,
                label: getColumnHeaderLabel(col),
                visible: columnVisibility[id] !== false,
            };
        });
}

/**
 * Automatically exports TanStack Table data to CSV using ColumnDef definitions.
 * Ignores 'Action', 'Actions', and columns without accessorKey/id.
 * Downloads the CSV file and automatically opens it.
 */
export function exportTableToCsv<TData>(
    data: TData[],
    columns: ColumnDef<TData, any>[],
    filename: string = "export.csv",
    openAfterSave: boolean = true
) {
    if (!data || !data.length) return;

    const exportableCols = columns.filter((col: any) => {
        const key = col.accessorKey || col.id;
        if (!key) return false;
        const lowerKey = String(key).toLowerCase();
        return lowerKey !== "action" && lowerKey !== "actions" && lowerKey !== "select";
    });

    const headers = exportableCols.map((col: any) => ({
        key: String(col.accessorKey || col.id),
        label: getColumnHeaderLabel(col),
    }));

    exportToCsv(data as any, headers, filename, openAfterSave);
}

/**
 * Automatically exports TanStack Table data to PDF using ColumnDef definitions.
 * Ignores 'Action', 'Actions', and columns without accessorKey/id.
 * Downloads the PDF file.
 */
export function exportTableToPdf<TData>(
    data: TData[],
    columns: ColumnDef<TData, any>[],
    filename: string = "export.pdf",
    title: string = "Document"
) {
    if (!data || !data.length) return;

    const exportableCols = columns.filter((col: any) => {
        const key = col.accessorKey || col.id;
        if (!key) return false;
        const lowerKey = String(key).toLowerCase();
        return lowerKey !== "action" && lowerKey !== "actions" && lowerKey !== "select";
    });

    const headers = exportableCols.map((col: any) => ({
        key: String(col.accessorKey || col.id),
        label: getColumnHeaderLabel(col),
    }));

    exportToPdf(data as any, headers, filename, title);
}

/**
 * Print helper with optional document title
 */
export function printTable(title: string = "Document") {
    const originalTitle = document.title;
    document.title = title;
    window.print();
    document.title = originalTitle;
}

