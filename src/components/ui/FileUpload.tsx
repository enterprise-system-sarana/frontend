import { Upload } from "lucide-react";

interface FileUploadProps {
    accept?: string;
    onChange: (file: File | null) => void;
    className?: string;
}

export default function FileUpload({
    accept = "image/*",
    onChange,
    className,
}: FileUploadProps) {
    return (
        <label
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 hover:bg-muted ${className}`}
        >
            <Upload className="mb-3 h-8 w-8" />

            <p className="text-sm text-muted-foreground">
                Click to upload
            </p>

            <input
                hidden
                type="file"
                accept={accept}
                onChange={(e) => {
                    onChange(e.target.files?.[0] ?? null);
                }}
            />
        </label>
    );
}