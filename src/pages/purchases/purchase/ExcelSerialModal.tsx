import { useState, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  ClipboardPaste,
  FileUp,
  X,
  Trash2,
} from "lucide-react";
import {
  parseSerialFile,
  parseCsvOrTextSerials,
  downloadSerialTemplate,
} from "@/utils/excelSerialParser";
import { toast } from "sonner";

interface ExcelSerialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName?: string;
  currentQuantity: number;
  onApplySerials: (serials: string[], updateQuantity: boolean) => void;
}

export default function ExcelSerialModal({
  open,
  onOpenChange,
  productName,
  currentQuantity,
  onApplySerials,
}: ExcelSerialModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const [pastedText, setPastedText] = useState("");
  const [parsedSerials, setParsedSerials] = useState<string[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [deduplicate, setDeduplicate] = useState(true);
  const [syncQuantity, setSyncQuantity] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setPastedText("");
    setParsedSerials([]);
    setUploadedFileName(null);
    setErrorMsg(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleFileUpload = async (file: File) => {
    setErrorMsg(null);
    setIsProcessing(true);
    setUploadedFileName(file.name);

    try {
      const serials = await parseSerialFile(file);
      if (serials.length === 0) {
        setErrorMsg("No valid serial numbers found in the file. Ensure values are listed in rows or columns.");
      } else {
        setParsedSerials(serials);
      }
    } catch (err: any) {
      console.error("Error reading serial file:", err);
      setErrorMsg("Failed to read file. Please ensure it is a valid .xlsx or .csv file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasteChange = (text: string) => {
    setPastedText(text);
    setErrorMsg(null);
    if (!text.trim()) {
      setParsedSerials([]);
      return;
    }
    const serials = parseCsvOrTextSerials(text);
    setParsedSerials(serials);
  };

  // Final serials after deduplication
  const finalSerials = useMemo(() => {
    if (!deduplicate) return parsedSerials;
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const s of parsedSerials) {
      const lower = s.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(s);
      }
    }
    return unique;
  }, [parsedSerials, deduplicate]);

  const duplicateCount = parsedSerials.length - finalSerials.length;

  const handleRemoveOne = (indexToRemove: number) => {
    setParsedSerials((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleApply = () => {
    if (finalSerials.length === 0) {
      setErrorMsg("No valid serial numbers to import.");
      return;
    }

    onApplySerials(finalSerials, syncQuantity);
    toast.success(`Successfully imported ${finalSerials.length} serial numbers!`);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => (!val ? handleClose() : onOpenChange(val))}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Import Serial Numbers from Excel
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {productName ? `For product: ${productName}` : "Insert multiple serials via Excel file or paste"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Selector */}
        <div className="flex items-center rounded-lg bg-muted p-1 text-xs font-semibold gap-1 mt-2">
          <button
            type="button"
            onClick={() => setActiveTab("file")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-colors ${
              activeTab === "file"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileUp className="size-3.5" />
            Upload File (.xlsx, .csv)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-colors ${
              activeTab === "paste"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardPaste className="size-3.5" />
            Paste from Excel
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2 mt-2">
          {activeTab === "file" ? (
            <div className="space-y-3">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-border/80 hover:border-emerald-500/60 rounded-xl p-6 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-emerald-500/5 flex flex-col items-center justify-center gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110">
                  <UploadCloud className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {uploadedFileName ? uploadedFileName : "Click or drag & drop Excel / CSV file"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv, .txt)
                  </p>
                </div>
                {isProcessing && (
                  <p className="text-xs font-medium text-emerald-600 animate-pulse">
                    Reading and parsing serials...
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-muted-foreground text-[11px]">
                  Need a template format?
                </span>
                <button
                  type="button"
                  onClick={downloadSerialTemplate}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  <Download className="size-3" />
                  Download Sample Template (.csv)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Paste records from Excel</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  Copy cells in Excel (Ctrl+C) and paste here (Ctrl+V)
                </span>
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder={"SN-10001\nSN-10002\nSN-10003\nSN-10004..."}
                rows={5}
                className="w-full rounded-xl border border-input bg-background p-3 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 resize-none"
              />
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Options & Preview */}
          {finalSerials.length > 0 && (
            <div className="space-y-3 border-t border-border/60 pt-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/30 p-2.5 rounded-lg border border-border/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-foreground">
                    {finalSerials.length} serial numbers detected
                  </span>
                  {duplicateCount > 0 && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
                      {duplicateCount} duplicates removed
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={deduplicate}
                      onChange={(e) => setDeduplicate(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span>Deduplicate</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={syncQuantity}
                      onChange={(e) => setSyncQuantity(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span>
                      Set item quantity to {finalSerials.length}
                    </span>
                  </label>
                </div>
              </div>

              {/* Preview Chips */}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Preview ({finalSerials.length} records)
                </p>
                <div className="max-h-36 overflow-y-auto p-2 bg-background border border-border/60 rounded-lg flex flex-wrap gap-1.5">
                  {finalSerials.slice(0, 100).map((serial, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono border border-border/50 text-foreground"
                    >
                      <span>{serial}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOne(i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  {finalSerials.length > 100 && (
                    <span className="text-[11px] text-muted-foreground self-center px-1">
                      + {finalSerials.length - 100} more records...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 pt-3 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetState}
            disabled={parsedSerials.length === 0}
            className="text-xs text-muted-foreground"
          >
            Clear all
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              disabled={finalSerials.length === 0}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Apply {finalSerials.length > 0 ? `(${finalSerials.length}) Serials` : ""}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
