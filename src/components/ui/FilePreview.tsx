import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
    src?: string;
    onRemove?: () => void;
    className?: string;
}

export default function FilePreview({
    src,
    onRemove,
    className,
}: FilePreviewProps) {
    if (!src) return null;

    return (
        <div className={`relative inline-block ${className}`}>
            <img
                src={src}
                alt="Preview"
                className="h-40 w-40 rounded-lg border object-cover"
            />

            {onRemove && (
                <Button
                    size="icon"
                    variant="destructive"
                    className="absolute right-2 top-2 h-7 w-7 rounded-full"
                    onClick={onRemove}
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}