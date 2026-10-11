import { describe, it, expect, beforeEach } from 'vitest';
import { FirebaseStorageService } from '../../../../src/infrastructure/storage/FirebaseStorageService.js';

describe('FirebaseStorageService', () => {
  let storageService: FirebaseStorageService;

  beforeEach(() => {
    storageService = new FirebaseStorageService('test-bucket.appspot.com');
  });

  it('uploads a file to mock store when in development/unconfigured mode', async () => {
    const buffer = Buffer.from('fake pdf content for kyc');
    const path = 'kyc/user_1/aadhaar.pdf';

    const url = await storageService.uploadFile(path, buffer, 'application/pdf');

    expect(url).toContain('https://mock-storage.trustvault.internal/kyc/user_1/aadhaar.pdf');
    const stored = storageService.getMockFile(path);
    expect(stored).toBeDefined();
    expect(stored?.contentType).toBe('application/pdf');
    expect(stored?.buffer.toString()).toBe('fake pdf content for kyc');
  });

  it('generates a mock signed download URL with expiration', async () => {
    const path = 'disputes/escrow_123/unboxing_video.mp4';
    const downloadUrl = await storageService.getSignedDownloadUrl(path, 30);

    expect(downloadUrl).toContain('mock-storage.trustvault.internal/signed-download');
    expect(downloadUrl).toContain('expiresIn=30');
  });

  it('generates a mock direct upload URL and canonical file URL', async () => {
    const path = 'kyc/user_2/pan_card.jpg';
    const ticket = await storageService.getSignedUploadUrl(path, 'image/jpeg', 15);

    expect(ticket.uploadUrl).toContain('mock-storage.trustvault.internal/upload/kyc/user_2/pan_card.jpg');
    expect(ticket.fileUrl).toContain('mock-storage.trustvault.internal/kyc/user_2/pan_card.jpg');
  });
});
