import type { FileUploadResponse } from "@/types/File";
import api from "../lib/axios";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8081/api/v1";

export const fileService = {
    async uploadFile(file: File, bucketName: string = "default"): Promise<{ payload: FileUploadResponse }> {
        const formData = new FormData();

        formData.append("file", file);

        const response = await api.post<{ payload: FileUploadResponse }>(
            `/files/upload-file?bucketName=${bucketName}`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        return response.data;
    },

    getPreviewUrl(bucketName: string, fileName: string): string {
        return `${baseUrl}/files/preview-file/${fileName}?bucketName=${bucketName}`;
    },

    getDownloadUrl(fileName: string, bucketName: string): string {
        return `${baseUrl}/files/download-file?bucketName=${bucketName}&fileName=${fileName}`;
    },

    async downloadFile(fileName: string, bucketName: string) {
        const response = await api.get(
            `${baseUrl}/files/download-file?bucketName=${bucketName}&fileName=${fileName}`,
            {
                responseType: "blob",
            }
        );

        const blobUrl = URL.createObjectURL(response.data);

        const link = document.createElement("a");

        link.href = blobUrl;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(blobUrl);
    },
};