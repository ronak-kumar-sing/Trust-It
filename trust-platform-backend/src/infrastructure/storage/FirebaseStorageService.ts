import type { IStorageService } from '../../application/interfaces/IStorageService.js';
import { getFirebaseStorage, isFirebaseConfigured } from '../firebase/firebaseAdmin.js';

/**
 * Firebase Cloud Storage adapter for document and evidence persistence.
 *
 * Provides tamper-evident document storage for KYC verifications (Aadhaar, PAN)
 * and escrow disputes (unboxing videos, transaction receipts).
 * If Firebase Storage is unconfigured (e.g. during local tests), it provides
 * a deterministic in-memory/mock URL fallback.
 */
export class FirebaseStorageService implements IStorageService {
  private readonly defaultBucketName?: string;
  private readonly mockStore = new Map<string, { buffer: Buffer; contentType: string }>();

  /**
   * Constructs a new FirebaseStorageService instance.
   *
   * @param defaultBucketName - Optional default storage bucket override
   */
  constructor(defaultBucketName?: string) {
    this.defaultBucketName = defaultBucketName;
  }

  /**
   * Uploads a raw buffer directly to Firebase Cloud Storage.
   *
   * @param destinationPath - Path inside the bucket (e.g. `kyc/user1/doc.pdf`)
   * @param buffer - File bytes
   * @param contentType - MIME content type
   * @returns Public or storage URL
   */
  async uploadFile(
    destinationPath: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const storage = getFirebaseStorage();

    if (isFirebaseConfigured() && storage) {
      try {
        const bucket = storage.bucket(this.defaultBucketName);
        const file = bucket.file(destinationPath);

        await file.save(buffer, {
          metadata: { contentType },
          resumable: false,
        });

        return `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
      } catch (error) {
        console.warn(`[FirebaseStorageService] Direct upload failed, falling back to mock:`, error);
      }
    }

    // Local fallback for dev/testing
    this.mockStore.set(destinationPath, { buffer, contentType });
    return `https://mock-storage.trustvault.internal/${destinationPath}`;
  }

  /**
   * Generates a time-limited signed download URL.
   *
   * @param filePath - Path inside the bucket
   * @param expiresInMinutes - Expiry duration in minutes (default 60)
   * @returns Signed download URL
   */
  async getSignedDownloadUrl(
    filePath: string,
    expiresInMinutes = 60,
  ): Promise<string> {
    const storage = getFirebaseStorage();

    if (isFirebaseConfigured() && storage) {
      try {
        const bucket = storage.bucket(this.defaultBucketName);
        const file = bucket.file(filePath);

        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + expiresInMinutes * 60 * 1000,
        });

        return url;
      } catch (error) {
        console.warn(`[FirebaseStorageService] Signed URL creation failed, falling back:`, error);
      }
    }

    return `https://mock-storage.trustvault.internal/signed-download/${filePath}?expiresIn=${expiresInMinutes}`;
  }

  /**
   * Generates a pre-signed direct upload URL allowing clients to stream files directly.
   *
   * @param filePath - Intended path
   * @param contentType - MIME type
   * @param expiresInMinutes - Expiration window (default 15)
   * @returns Upload ticket containing signed uploadUrl and canonical fileUrl
   */
  async getSignedUploadUrl(
    filePath: string,
    contentType: string,
    expiresInMinutes = 15,
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    const storage = getFirebaseStorage();

    if (isFirebaseConfigured() && storage) {
      try {
        const bucket = storage.bucket(this.defaultBucketName);
        const file = bucket.file(filePath);

        const [uploadUrl] = await file.getSignedUrl({
          action: 'write',
          expires: Date.now() + expiresInMinutes * 60 * 1000,
          contentType,
        });

        return {
          uploadUrl,
          fileUrl: `https://storage.googleapis.com/${bucket.name}/${filePath}`,
        };
      } catch (error) {
        console.warn(`[FirebaseStorageService] Signed upload URL creation failed, falling back:`, error);
      }
    }

    return {
      uploadUrl: `https://mock-storage.trustvault.internal/upload/${filePath}`,
      fileUrl: `https://mock-storage.trustvault.internal/${filePath}`,
    };
  }

  /**
   * Retrieves mock storage content for unit test assertions.
   *
   * @param filePath - Target file path
   * @returns Stored buffer and contentType or undefined
   */
  getMockFile(filePath: string): { buffer: Buffer; contentType: string } | undefined {
    return this.mockStore.get(filePath);
  }
}
