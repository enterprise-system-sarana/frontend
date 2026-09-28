import * as React from "react";
import {
    Download,
    ExternalLink,
    ImageIcon,
    Maximize2,
    RotateCw,
    ZoomIn,
    ZoomOut,
    X,
    RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fileService } from "@/services/file/file.service";
import api from "@/services/lib/axios";

const imageCache = new Map<string, string>();

interface ImageCellProps {
    fileName?: string;
    name: string;
    bucketName?: string;
    className?: string;
    imageClassName?: string;
    aspectRatio?: "square" | "video" | "auto";
    preview?: boolean;
    fit?: "contain" | "cover" | "fill";
    showBorder?: boolean;
}

export const ImageCell = ({
    fileName,
    name,
    bucketName = "default",
    className = "h-10 w-10",
    imageClassName,
    aspectRatio = "square",
    preview = true,
    fit = "cover",
    showBorder = true,
}: ImageCellProps) => {
    const [open, setOpen] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [zoom, setZoom] = React.useState(1);
    const [rotation, setRotation] = React.useState(0);
    const [blobUrl, setBlobUrl] = React.useState<string | null>(null);

    const hasValidFile = Boolean(fileName?.trim());

    React.useEffect(() => {
        setHasError(false);
        setIsLoaded(false);

        if (!hasValidFile || !fileName) {
            setBlobUrl(null);
            return;
        }

        if (fileName.startsWith("blob:") || fileName.startsWith("data:")) {
            setBlobUrl(fileName);
            return;
        }

        let isMounted = true;

        const fetchImage = async () => {
            const rawUrl = fileName.startsWith("http")
                ? fileName
                : fileService.getPreviewUrl(bucketName, fileName);

            if (imageCache.has(rawUrl)) {
                if (isMounted) {
                    setBlobUrl(imageCache.get(rawUrl)!);
                }
                return;
            }

            try {
                const response = await api.get(rawUrl, { responseType: "blob" });
                if (isMounted) {
                    const objectUrl = URL.createObjectURL(response.data);
                    imageCache.set(rawUrl, objectUrl);
                    setBlobUrl(objectUrl);
                }
            } catch (err) {
                // If authenticated fetch fails, fallback to direct rawUrl
                if (isMounted) {
                    setBlobUrl(rawUrl);
                }
            }
        };

        fetchImage();

        return () => {
            isMounted = false;
        };
    }, [fileName, bucketName, hasValidFile]);

    const imageUrl = blobUrl || "";

    const resetView = React.useCallback(() => {
        setZoom(1);
        setRotation(0);
    }, []);

    const handleOpen = (event: React.MouseEvent) => {
        event.stopPropagation();

        resetView();
        setOpen(true);
    };

    const zoomIn = () => {
        setZoom((value) => Math.min(Number((value + 0.25).toFixed(2)), 3));
    };

    const zoomOut = () => {
        setZoom((value) => Math.max(Number((value - 0.25).toFixed(2)), 0.5));
    };

    const rotate = () => {
        setRotation((value) => (value + 90) % 360);
    };

    const handleDoubleClick = () => {
        setZoom((value) => (value === 1 ? 1.8 : 1));
    };

    const handleDownload = async () => {
        if (!fileName) return;

        try {
            if (
                fileName.startsWith("http") ||
                fileName.startsWith("data:") ||
                fileName.startsWith("blob:")
            ) {
                const link = document.createElement("a");
                link.href = fileName;
                link.download = `${name || "image"}.png`;
                link.target = "_blank";

                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                await fileService.downloadFile(fileName, bucketName);
            }

            toast.success("Image download started");
        } catch {
            toast.error("Failed to download image");
        }
    };

    const handleOpenNewTab = () => {
        if (!imageUrl) return;

        window.open(imageUrl, "_blank", "noopener,noreferrer");
    };

    React.useEffect(() => {
        if (!open) return;

        const handleKeyboard = (event: KeyboardEvent) => {
            switch (event.key) {
                case "Escape":
                    setOpen(false);
                    break;

                case "+":
                case "=":
                    event.preventDefault();
                    zoomIn();
                    break;

                case "-":
                    event.preventDefault();
                    zoomOut();
                    break;

                case "r":
                case "R":
                    rotate();
                    break;

                case "0":
                    resetView();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyboard);

        return () => {
            window.removeEventListener("keydown", handleKeyboard);
        };
    }, [open]);

    /*
     * Empty / invalid image
     */
    if (!hasValidFile || !imageUrl || hasError) {
        return (
            <div
                className={cn(
                    "group relative flex shrink-0 items-center justify-center",
                    showBorder && "rounded-xl border border-border/60 bg-muted/30 shadow-sm",
                    "text-muted-foreground/50",
                    className,
                    aspectRatio === "video" && "aspect-video h-auto",
                    aspectRatio === "auto" && "h-auto",
                )}
                title={`${name} - No image`}
            >
                <ImageIcon
                    className="size-5 opacity-40 transition-transform duration-200 group-hover:scale-110"
                    strokeWidth={1.5}
                />
            </div>
        );
    }

    if (!preview) {
        return (
            <div
                className={cn(
                    "relative block shrink-0 overflow-hidden",
                    showBorder && "rounded-xl border border-border/60 bg-muted/30 shadow-xs",
                    className,
                    aspectRatio === "video" && "aspect-video h-auto",
                    aspectRatio === "auto" && "h-auto",
                )}
                title={name}
            >
                {!isLoaded && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/40 animate-pulse">
                        <ImageIcon className="size-4 text-muted-foreground/40" />
                    </div>
                )}
                <img
                    src={imageUrl}
                    alt={name}
                    loading="lazy"
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setHasError(true)}
                    className={cn(
                        "h-full w-full",
                        fit === "contain"
                            ? "object-contain"
                            : fit === "fill"
                              ? "object-fill"
                              : "object-cover",
                        "transition-all duration-300",
                        isLoaded ? "opacity-100" : "opacity-0",
                        imageClassName
                    )}
                />
            </div>
        );
    }

    return (
        <>
            {/* =========================================================
          THUMBNAIL
      ========================================================= */}
            <button
                type="button"
                onClick={handleOpen}
                className={cn(
                    "group relative block shrink-0 overflow-hidden",
                    "rounded-xl border border-border/60 bg-muted/30",
                    "shadow-sm",
                    "transition-all duration-200",
                    "hover:border-primary/50 hover:shadow-md",
                    "focus-visible:outline-none focus-visible:ring-2",
                    "focus-visible:ring-primary focus-visible:ring-offset-2",
                    className,
                    aspectRatio === "video" && "aspect-video h-auto",
                    aspectRatio === "auto" && "h-auto",
                )}
                title={`Preview ${name}`}
            >
                {/* Loading */}
                {!isLoaded && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted animate-pulse">
                        <ImageIcon className="size-4 text-muted-foreground/40" />
                    </div>
                )}

                {/* Image */}
                <img
                    src={imageUrl}
                    alt={name}
                    loading="lazy"
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setHasError(true)}
                    className={cn(
                        "h-full w-full object-cover",
                        "transition-all duration-300",
                        "group-hover:scale-105",
                        isLoaded ? "opacity-100" : "opacity-0",
                    )}
                />

                {/* Hover overlay */}
                <div
                    className={cn(
                        "absolute inset-0 flex items-center justify-center",
                        "bg-black/0 transition-all duration-200",
                        "group-hover:bg-black/35",
                    )}
                >
                    <div
                        className={cn(
                            "flex size-7 items-center justify-center rounded-full",
                            "bg-white/90 text-black shadow-lg",
                            "scale-75 opacity-0 transition-all duration-200",
                            "group-hover:scale-100 group-hover:opacity-100",
                        )}
                    >
                        <Maximize2 className="size-3.5" />
                    </div>
                </div>
            </button>

            {/* =========================================================
          IMAGE LIGHTBOX
      ========================================================= */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    className={cn(
                        "h-[92vh] w-[96vw] max-w-[1400px]",
                        "gap-0 overflow-hidden p-0",
                        "border-white/10 bg-[#0b0b0c]",
                        "shadow-2xl",
                        "sm:rounded-2xl",
                    )}
                    showCloseButton={false}
                >
                    <DialogTitle className="sr-only">
                        Preview image {name}
                    </DialogTitle>

                    <div className="relative flex h-full min-w-0 flex-col overflow-hidden">
                        {/* =====================================================
                TOP BAR
            ===================================================== */}
                        <div
                            className={cn(
                                "absolute inset-x-0 top-0 z-30",
                                "flex items-center justify-between",
                                "px-3 py-3 sm:px-5",
                                "bg-gradient-to-b from-black/70 to-transparent",
                            )}
                        >
                            {/* Image info */}
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md sm:flex">
                                    <ImageIcon className="size-4 text-white/80" />
                                </div>

                                <div className="min-w-0">
                                    <p className="max-w-[180px] truncate text-sm font-medium text-white sm:max-w-[350px]">
                                        {name}
                                    </p>

                                    <div className="mt-0.5 flex items-center gap-2">
                                        <Badge
                                            variant="secondary"
                                            className="h-5 border-white/10 bg-white/10 px-1.5 text-[10px] text-white/70"
                                        >
                                            {bucketName}
                                        </Badge>

                                        <span className="hidden max-w-[250px] truncate text-[10px] text-white/40 sm:block">
                                            {fileName}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Close */}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setOpen(false)}
                                className={cn(
                                    "size-9 shrink-0 rounded-full",
                                    "bg-white/10 text-white/80",
                                    "hover:bg-white/20 hover:text-white",
                                    "backdrop-blur-md",
                                )}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>

                        {/* =====================================================
                IMAGE AREA
            ===================================================== */}
                        <div
                            className={cn(
                                "relative flex min-h-0 min-w-0 flex-1",
                                "items-center justify-center",
                                "overflow-hidden",
                                "bg-[#09090b]",
                            )}
                            style={{
                                backgroundImage: `
                  linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)
                `,
                                backgroundSize: "24px 24px",
                            }}
                        >
                            {/* Image */}
                            <img
                                src={imageUrl}
                                alt={name}
                                onDoubleClick={handleDoubleClick}
                                className={cn(
                                    "max-h-full max-w-full object-contain",
                                    "select-none rounded-lg",
                                    "transition-transform duration-300 ease-out",
                                    zoom > 1
                                        ? "cursor-zoom-out"
                                        : "cursor-zoom-in",
                                )}
                                style={{
                                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                }}
                                draggable={false}
                            />

                            {/* Zoom indicator */}
                            <div
                                className={cn(
                                    "absolute left-1/2 top-1/2",
                                    "-translate-x-1/2 -translate-y-1/2",
                                    "pointer-events-none",
                                    "rounded-full bg-black/60 px-3 py-1.5",
                                    "text-xs font-medium text-white",
                                    "backdrop-blur-md",
                                    "opacity-0 transition-opacity",
                                )}
                            >
                                {Math.round(zoom * 100)}%
                            </div>
                        </div>

                        {/* =====================================================
                BOTTOM TOOLBAR
            ===================================================== */}
                        <div
                            className={cn(
                                "absolute inset-x-0 bottom-0 z-30",
                                "flex items-center justify-center",
                                "px-3 pb-4 sm:pb-5",
                                "bg-gradient-to-t from-black/80 to-transparent",
                            )}
                        >
                            <div
                                className={cn(
                                    "flex items-center gap-1",
                                    "rounded-2xl border border-white/10",
                                    "bg-black/60 p-1.5",
                                    "shadow-2xl backdrop-blur-xl",
                                )}
                            >
                                {/* Zoom out */}
                                <ViewerButton
                                    icon={<ZoomOut />}
                                    label="Zoom out"
                                    onClick={zoomOut}
                                    disabled={zoom <= 0.5}
                                />

                                {/* Zoom level */}
                                <button
                                    type="button"
                                    onClick={resetView}
                                    className={cn(
                                        "flex h-9 min-w-[52px] items-center justify-center",
                                        "rounded-xl px-2",
                                        "text-xs font-medium text-white/70",
                                        "transition-colors hover:bg-white/10 hover:text-white",
                                    )}
                                    title="Reset zoom"
                                >
                                    {Math.round(zoom * 100)}%
                                </button>

                                {/* Zoom in */}
                                <ViewerButton
                                    icon={<ZoomIn />}
                                    label="Zoom in"
                                    onClick={zoomIn}
                                    disabled={zoom >= 3}
                                />

                                <ToolbarDivider />

                                {/* Rotate */}
                                <ViewerButton
                                    icon={<RotateCw />}
                                    label="Rotate"
                                    onClick={rotate}
                                />

                                {/* Reset */}
                                <ViewerButton
                                    icon={<RotateCcw />}
                                    label="Reset"
                                    onClick={resetView}
                                    disabled={zoom === 1 && rotation === 0}
                                />

                                <ToolbarDivider />

                                {/* Open */}
                                <ViewerButton
                                    icon={<ExternalLink />}
                                    label="Open in new tab"
                                    onClick={handleOpenNewTab}
                                />

                                {/* Download */}
                                <ViewerButton
                                    icon={<Download />}
                                    label="Download"
                                    onClick={handleDownload}
                                />
                            </div>
                        </div>

                        {/* Keyboard shortcuts */}
                        <div className="absolute bottom-5 left-5 hidden text-[10px] text-white/30 lg:block">
                            ESC close · + / − zoom · R rotate · 0 reset
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

/* ===============================================================
   SMALL VIEWER BUTTON
================================================================ */

interface ViewerButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

function ViewerButton({
    icon,
    label,
    onClick,
    disabled,
}: ViewerButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={label}
            aria-label={label}
            className={cn(
                "flex size-9 items-center justify-center rounded-xl",
                "text-white/70",
                "transition-all duration-150",
                "hover:bg-white/10 hover:text-white",
                "active:scale-95",
                "disabled:pointer-events-none disabled:opacity-25",
            )}
        >
            {React.cloneElement(icon as React.ReactElement, {
                className: "size-4",
            })}
        </button>
    );
}

function ToolbarDivider() {
    return <div className="mx-1 h-5 w-px bg-white/10" />;
}

export default ImageCell;