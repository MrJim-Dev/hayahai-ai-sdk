export interface UploadResult {
    url: string;
    key: string;
}
/**
 * Upload a file to S3 in the knowledge-base folder
 */
export declare function uploadFileToS3(buffer: Buffer, originalFilename: string, mimeType: string, agentId: string, tenantId?: number): Promise<UploadResult>;
/**
 * Save a file to the local context folder
 */
export declare function uploadFileToContextFolder(buffer: Buffer, originalFilename: string, agentId: string, tenantId?: number): Promise<UploadResult>;
/**
 * Upload multiple files to S3
 */
export declare function uploadFilesToS3(files: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
}[], agentId: string, tenantId?: number): Promise<{
    file: string;
    url: string;
    key: string;
}[]>;
export declare function uploadFilesToContextFolder(files: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
}[], agentId: string, tenantId?: number): Promise<{
    file: string;
    url: string;
    key: string;
}[]>;
/**
 * Delete a file from S3 or local storage
 */
export declare function deleteFileFromS3(key: string): Promise<void>;
//# sourceMappingURL=storage.d.ts.map