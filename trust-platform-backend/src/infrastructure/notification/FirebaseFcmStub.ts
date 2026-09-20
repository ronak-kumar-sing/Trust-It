import type {
  IPushNotificationService,
  PushNotificationPayload,
  PushNotificationResult,
} from '../../application/interfaces/IPushNotificationService.js';
import { nanoid } from 'nanoid';

/**
 * Free Tier / Local Development Stub for Firebase Cloud Messaging (FCM).
 * Records sent pushes in memory for testing and auditing without external network costs.
 */
export class FirebaseFcmStub implements IPushNotificationService {
  private readonly sentLog: Array<PushNotificationPayload & { timestamp: Date; messageId: string }> = [];

  /**
   * Simulates sending a push notification via Firebase FCM.
   *
   * @param payload - Push notification destination and body
   * @returns Success response with generated messageId
   */
  async sendPushNotification(
    payload: PushNotificationPayload,
  ): Promise<PushNotificationResult> {
    const messageId = `fcm_msg_${nanoid()}`;

    this.sentLog.push({
      ...payload,
      timestamp: new Date(),
      messageId,
    });

    return {
      success: true,
      messageId,
    };
  }

  /**
   * Retrieves log of sent notifications for test assertions.
   */
  getSentLog(): ReadonlyArray<PushNotificationPayload & { timestamp: Date; messageId: string }> {
    return [...this.sentLog];
  }

  /**
   * Clears in-memory sent history.
   */
  clear(): void {
    this.sentLog.length = 0;
  }
}
