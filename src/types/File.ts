// "fileName": "7c6950bc-7a2d-4a17-9850-d26d0cfa7161.png",
//     "fileUrl": "http://localhost:8081/api/v2/files/preview-file/7c6950bc-7a2d-4a17-9850-d26d0cfa7161.png",
//         "fileType": "image/png",
//             "fileSize": 100763

export interface FileUploadResponse {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
}