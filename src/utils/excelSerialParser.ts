import { unzipSync, strFromU8 } from "fflate";

const HEADER_KEYWORDS = new Set([
  "serial",
  "serials",
  "serial_number",
  "serialnumber",
  "serial number",
  "sn",
  "imei",
  "barcode",
  "id",
  "no",
]);

/**
 * Parse serial numbers from raw CSV, TSV, or newline-separated text (such as clipboard paste from Excel)
 */
export function parseCsvOrTextSerials(text: string): string[] {
  const lines = text.split(/\r\n|\r|\n/);
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Split on tab, comma, or semicolon
    const parts = rawLine
      .split(/[\t,;]/)
      .map((part) => part.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);

    for (const part of parts) {
      if (!part) continue;

      // Skip header row if it contains keywords
      if (i === 0 && HEADER_KEYWORDS.has(part.toLowerCase())) {
        continue;
      }

      result.push(part);
    }
  }

  return result;
}

/**
 * Parse serial numbers from a native .xlsx Excel workbook
 */
export function parseXlsxSerials(buffer: ArrayBuffer): string[] {
  try {
    const unzipped = unzipSync(new Uint8Array(buffer));

    // 1. Extract shared strings if present
    const sharedStrings: string[] = [];
    const sstFile = unzipped["xl/sharedStrings.xml"];
    if (sstFile) {
      const sstXml = strFromU8(sstFile);
      const siMatches = sstXml.match(/<si[\s\S]*?<\/si>/g) || [];
      for (const si of siMatches) {
        const textMatches = Array.from(si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)).map(
          (m) => m[1]
        );
        sharedStrings.push(textMatches.join(""));
      }
    }

    // 2. Find first sheet file
    let sheetXml = "";
    for (const filename of Object.keys(unzipped)) {
      if (filename.startsWith("xl/worksheets/sheet") && filename.endsWith(".xml")) {
        sheetXml = strFromU8(unzipped[filename]);
        break;
      }
    }

    if (!sheetXml) return [];

    // 3. Extract cells from rows
    const serials: string[] = [];
    const rowMatches = sheetXml.match(/<row[\s\S]*?<\/row>/g) || [];

    for (let rowIndex = 0; rowIndex < rowMatches.length; rowIndex++) {
      const row = rowMatches[rowIndex];
      const cellMatches = row.match(/<c[\s\S]*?<\/c>/g) || [];

      for (const cell of cellMatches) {
        const isShared = cell.includes('t="s"');
        const isInline = cell.includes('t="inlineStr"');

        let val = "";
        if (isInline) {
          const tMatch = cell.match(/<t[^>]*>([\s\S]*?)<\/t>/);
          val = tMatch ? tMatch[1] : "";
        } else {
          const vMatch = cell.match(/<v>([\s\S]*?)<\/v>/);
          if (vMatch) {
            const raw = vMatch[1];
            if (isShared) {
              const idx = parseInt(raw, 10);
              val = sharedStrings[idx] ?? "";
            } else {
              val = raw;
            }
          }
        }

        val = val.trim();
        if (rowIndex === 0 && HEADER_KEYWORDS.has(val.toLowerCase())) {
          continue;
        }

        if (val) {
          serials.push(val);
        }
      }
    }

    return serials;
  } catch (err) {
    console.error("Failed to parse xlsx file:", err);
    return [];
  }
}

/**
 * Universal file reader for .xlsx, .xls, .csv, and .txt files
 */
export async function parseSerialFile(file: File): Promise<string[]> {
  const isXlsx = file.name.toLowerCase().endsWith(".xlsx");

  if (isXlsx) {
    const buffer = await file.arrayBuffer();
    const result = parseXlsxSerials(buffer);
    if (result.length > 0) return result;
  }

  // Fallback to text reading (handles .csv, .txt, .tsv, etc.)
  const text = await file.text();
  return parseCsvOrTextSerials(text);
}

/**
 * Generate and download a sample CSV/Excel template for serial numbers
 */
export function downloadSerialTemplate(filename: string = "serial_numbers_template.csv") {
  const content = "\uFEFFserial_number\nSN-100001\nSN-100002\nSN-100003\nSN-100004\nSN-100005\n";
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
