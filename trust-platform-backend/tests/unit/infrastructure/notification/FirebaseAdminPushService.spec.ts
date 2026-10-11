import { describe, it, expect, beforeEach } from 'vitest';
import { FirebaseAdminPushService } from '../../../../src/infrastructure/notification/FirebaseAdminPushService.js';
import { FirebaseFcmStub } from '../../../../src/infrastructure/notification/FirebaseFcmStub.js';

describe('FirebaseAdminPushService', () => {
  let fallbackStub: FirebaseFcmStub;
  let pushService: FirebaseAdminPushService;

  beforeEach(() => {
    fallbackStub = new FirebaseFcmStub();
    pushService = new FirebaseAdminPushService(fallbackStub);
  });

  it('delegates to fallback stub when Firebase is unconfigured', async () => {
    const result = await pushService.sendPushNotification({
      userId: 'usr_test_123',
      title: 'Escrow Funded',
      body: 'Buyer deposited ₹50,000 into escrow.',
      data: { escrowId: 'escrow_abc', amount: 50000 },
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();

    const sentLog = fallbackStub.getSentLog();
    expect(sentLog.length).toBe(1);
    expect(sentLog[0]?.title).toBe('Escrow Funded');
    expect(sentLog[0]?.userId).toBe('usr_test_123');
  });

  it('delegates to fallback stub when deviceToken is absent', async () => {
    const result = await pushService.sendPushNotification({
      userId: 'usr_no_token',
      title: 'Dispute Raised',
      body: 'Dispute filed for escrow_xyz',
    });

    expect(result.success).toBe(true);
    expect(fallbackStub.getSentLog().length).toBe(1);
  });

  it('exposes fallback stub instance for testing assertions', () => {
    expect(pushService.getFallbackStub()).toBe(fallbackStub);
  });
});
