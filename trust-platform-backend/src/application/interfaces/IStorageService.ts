/**
 * Port Contract: External Cloud File Storage Gateway (e.g. Firebase Cloud Storage, S3).
 * Provides secure handling for KYC identity documents and escrow dispute evidence.
 */
export interface IStorageService {
  /**
   * Uploads a raw buffer directly to cloud storage.
   *
   * @param destinationPath - Storage path (e.g. `kyc/user123/aadhaar.pdf` or `disputes/escrow456/unboxing.mp4`)
   * @param buffer - File content buffer
   * @param contentType - MIME type of the file
   * @returns Public or storage URL of the uploaded file
   */
  uploadFile(
    destinationPath: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string>;

  /**
   * Generates a time-limited signed download URL for private files (e.g. KYC documents).
   *
   * @param filePath - Storage path within the bucket
   * @param expiresInMinutes - Duration in minutes before URL expiration (default 60)
   * @returns Signed download URL
   */
  getSignedDownloadUrl(
    filePath: string,
    expiresInMinutes?: number,
  ): Promise<string>;

  /**
   * Generates a pre-signed direct upload URL allowing clients (mobile app)
   * to upload large files (e.g. videos) directly to Cloud Storage securely.
   *
   * @param filePath - Intended storage path
   * @param contentType - MIME type expected for the file
   * @param expiresInMinutes - Duration before upload ticket expires (default 15)
   * @returns Direct upload URL and final storage path
   */
  getSignedUploadUrl(
    filePath: string,
    contentType: string,
    expiresInMinutes?: number,
  ): Promise<{ uploadUrl: string; fileUrl: string }>;
}
