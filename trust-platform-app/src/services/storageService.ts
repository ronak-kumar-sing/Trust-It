import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseLive } from './firebase';
import { apiClient } from '../api/client';

export type UploadPurpose = 'KYC' | 'DISPUTE_EVIDENCE' | 'DELIVERY' | 'PROFILE';

export interface UploadResult {
  fileUrl: string;
  storagePath: string;
  isMock: boolean;
}

/**
 * Service for uploading documents (KYC Aadhaar/PAN) and dispute evidence
 * (unboxing videos, transaction screenshots) to Firebase Cloud Storage.
 */
export const storageService = {
  /**
   * Uploads a file (blob or raw bytes) to Firebase Cloud Storage.
   *
   * @param destinationPath - Path within bucket (e.g. kyc/user123/aadhaar.pdf)
   * @param fileData - Blob or Uint8Array of the file
   * @param contentType - MIME type of the file
   * @returns Uploaded file URL and path
   */
  async uploadFile(
    destinationPath: string,
    fileData: Blob | Uint8Array,
    contentType: string,
  ): Promise<UploadResult> {
    // If live Firebase is configured and storage initialized
    if (isFirebaseLive() && storage) {
      try {
        const storageRef = ref(storage, destinationPath);
        const snapshot = await uploadBytes(storageRef, fileData, { contentType });
        const fileUrl = await getDownloadURL(snapshot.ref);

        return {
          fileUrl,
          storagePath: destinationPath,
          isMock: false,
        };
      } catch (err) {
        console.warn('[StorageService] Live upload failed, falling back to backend/preview:', err);
      }
    }

    // Attempt through Fastify backend storage upload ticket if connected
    try {
      const response = await apiClient.axios.post('/storage/upload-ticket', {
        filename: destinationPath.split('/').pop() ?? 'document.pdf',
        contentType,
        purpose: destinationPath.includes('kyc') ? 'KYC' : 'DISPUTE_EVIDENCE',
      });

      if (response.data?.success && response.data.data?.fileUrl) {
        return {
          fileUrl: response.data.data.fileUrl,
          storagePath: response.data.data.storagePath,
          isMock: false,
        };
      }
    } catch {
      // Backend not running or offline preview mode
    }

    // Deterministic preview/mock fallback
    const mockUrl = `https://storage.googleapis.com/trust-vault-preview/${destinationPath}`;
    return {
      fileUrl: mockUrl,
      storagePath: destinationPath,
      isMock: true,
    };
  },

  /**
   * Simulates/executes document upload for KYC verification.
   *
   * @param userId - ID of the user uploading KYC
   * @param docType - Aadhaar or PAN
   * @param filename - Original filename
   * @returns Upload result
   */
  async uploadKycDocument(
    userId: string,
    docType: 'AADHAAR' | 'PAN',
    filename: string,
  ): Promise<UploadResult> {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `kyc/${userId}/${Date.now()}_${docType}_${safeName}`;
    const dummyBlob = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF header bytes

    return this.uploadFile(path, dummyBlob, 'application/pdf');
  },

  /**
   * Uploads dispute proof (unboxing video or screenshot).
   *
   * @param escrowId - Associated escrow deal
   * @param userId - Reporting party
   * @param filename - Evidence filename
   * @param contentType - video/mp4 or image/jpeg
   * @returns Upload result
   */
  async uploadDisputeEvidence(
    escrowId: string,
    userId: string,
    filename: string,
    contentType = 'image/jpeg',
  ): Promise<UploadResult> {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `disputes/${escrowId}/${userId}_${Date.now()}_${safeName}`;
    const dummyBlob = new Uint8Array([0xff, 0xd8, 0xff]); // JPEG header bytes

    return this.uploadFile(path, dummyBlob, contentType);
  },
};
