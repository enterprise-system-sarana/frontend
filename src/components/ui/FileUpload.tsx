import { useState, useRef, useEffect, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fileService } from "@/services/file/file.service";
import { Eye, Trash2, Plus, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export interface FileUploadProps {
  bucketName?: string;
  defaultBucket?: string;
  value?: string;
  onUploaded?: (fileName: string, previewUrl?: string) => void;
  onRemove?: () => void;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
  showCardOnly?: boolean;
}

export function FileUpload({
  bucketName,
  defaultBucket = "product",
  value,
  onUploaded,
  onRemove,
  label,
  accept = "image/*",
  maxSizeMB = 10,
  disabled = false,
  className = "",
}: FileUploadProps) {
  const activeBucket = bucketName || defaultBucket;
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(value || null);
  const [serverPreviewUrl, setServerPreviewUrl] = useState<string | null>(
    value ? fileService.getPreviewUrl(activeBucket, value) : null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      setUploadedFileName(value);
      setServerPreviewUrl(
        value.startsWith("http") || value.startsWith("blob:") || value.startsWith("data:")
          ? value
          : fileService.getPreviewUrl(activeBucket, value)
      );
    } else if (!file) {
      setUploadedFileName(null);
      setServerPreviewUrl(null);
    }
  }, [value, activeBucket]);

  const handleFileSelect = async (selectedFile: File | undefined) => {
    if (!selectedFile) return;

    if (accept === "image/*" && !selectedFile.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP, SVG).");
      return;
    }

    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size exceeds maximum limit of ${maxSizeMB}MB.`);
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setLocalPreview(objectUrl);

    await uploadSelectedFile(selectedFile);
  };

  const uploadSelectedFile = async (fileToUpload: File) => {
    try {
      setLoading(true);
      const response = await fileService.uploadFile(fileToUpload, activeBucket);
      const fileName = response.payload.fileName;
      const previewUrl = fileService.getPreviewUrl(activeBucket, fileName);

      setUploadedFileName(fileName);
      setServerPreviewUrl(previewUrl);
      toast.success("Image uploaded successfully!");

      if (onUploaded) {
        onUploaded(fileName, previewUrl);
      }
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error(error?.response?.data?.message || "Failed to upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    handleFileSelect(selectedFile);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const selectedFile = e.dataTransfer.files?.[0];
    handleFileSelect(selectedFile);
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFile(null);
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
    setUploadedFileName(null);
    setServerPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onRemove) {
      onRemove();
    }
    if (onUploaded) {
      onUploaded("");
    }
  };

  const activePreview = serverPreviewUrl || localPreview;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
          {label}
        </label>
      )}

      {/* Ant Design Picture Card Container */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Uploaded Picture Card */}
        {activePreview && (
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-2xl border border-border/80 bg-card p-1 shadow-xs overflow-hidden group transition-all duration-200 hover:border-primary/50">
            {/* Image */}
            <img
              src={activePreview}
              alt="Uploaded thumbnail"
              className="h-full w-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                if (localPreview && activePreview !== localPreview) {
                  (e.target as HTMLImageElement).src = localPreview;
                }
              }}
            />

            {/* Loading state overlay */}
            {loading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center gap-1 z-20">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="text-[10px] font-medium text-foreground">Uploading</span>
              </div>
            )}

            {/* Ant Design Hover Overlay with Eye (Preview) and Trash (Delete) */}
            {!loading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 text-white z-10">
                {/* Preview Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                  title="Preview image"
                >
                  <Eye className="h-5 w-5" />
                </button>

                {/* Delete Button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 rounded-lg text-white/90 hover:text-red-400 hover:bg-white/20 transition-all cursor-pointer"
                    title="Remove image"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Ant Design "+ Upload" Trigger Card */}
        {(!activePreview || loading) && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !disabled && !loading && fileInputRef.current?.click()}
            className={`h-24 w-24 sm:h-28 sm:w-28 shrink-0 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-1.5 text-center transition-all duration-200 select-none cursor-pointer ${
              disabled
                ? "opacity-50 cursor-not-allowed border-border/50 bg-muted/20"
                : isDragging
                ? "border-primary bg-primary/10 scale-105 shadow-md ring-2 ring-primary/20"
                : "border-border/80 hover:border-primary hover:bg-primary/5 bg-muted/20 hover:text-primary text-muted-foreground"
            }`}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-1 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-[11px] font-medium">Uploading</span>
              </div>
            ) : (
              <>
                <Plus className="h-5 w-5 stroke-[2.2]" />
                <span className="text-xs font-semibold tracking-tight">Upload</span>
              </>
            )}
          </div>
        )}

        {/* Hidden native input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          disabled={disabled || loading}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Image Preview Modal (Dialog) */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl p-2 sm:p-4 bg-card/95 backdrop-blur-md overflow-hidden border-border/80">
          <DialogHeader className="px-2 pt-2">
            <DialogTitle className="text-sm font-semibold text-foreground font-mono truncate">
              {uploadedFileName || file?.name || "Image Preview"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-2 max-h-[70vh] overflow-hidden rounded-xl bg-muted/30">
            {activePreview && (
              <img
                src={activePreview}
                alt="Enlarged Preview"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FileUpload;