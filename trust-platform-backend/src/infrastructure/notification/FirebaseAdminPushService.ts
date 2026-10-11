import type {
  IPushNotificationService,
  PushNotificationPayload,
  PushNotificationResult,
} from '../../application/interfaces/IPushNotificationService.js';
import { getFirebaseMessaging, isFirebaseConfigured } from '../firebase/firebaseAdmin.js';
import { FirebaseFcmStub } from './FirebaseFcmStub.js';

/**
 * Production Firebase Cloud Messaging (FCM) push notification adapter.
 *
 * Dispatches real push notifications to mobile clients via the Firebase Admin SDK.
 * If Firebase is not configured with credentials or the payload lacks a valid device token,
 * it automatically routes through {@link FirebaseFcmStub} to ensure non-blocking,
 * testable execution across all environments.
 */
export class FirebaseAdminPushService implements IPushNotificationService {
  private readonly fallbackStub: FirebaseFcmStub;

  /**
   * Constructs a new FirebaseAdminPushService instance.
   *
   * @param fallbackStub - Optional fallback stub for development and testing
   */
  constructor(fallbackStub: FirebaseFcmStub = new FirebaseFcmStub()) {
    this.fallbackStub = fallbackStub;
  }

  /**
   * Sends a push notification via Firebase Cloud Messaging or falls back gracefully.
   *
   * @param payload - Push notification destination, credentials, and message content
   * @returns Notification delivery result containing messageId or error details
   */
  async sendPushNotification(
    payload: PushNotificationPayload,
  ): Promise<PushNotificationResult> {
    const messaging = getFirebaseMessaging();

    // If Firebase Admin is not authenticated or active, delegate to fallback stub
    if (!isFirebaseConfigured() || !messaging) {
      return this.fallbackStub.sendPushNotification(payload);
    }

    // If no device token is registered for the recipient user, record via fallback stub
    if (!payload.deviceToken) {
      return this.fallbackStub.sendPushNotification(payload);
    }

    try {
      const stringData: Record<string, string> = {};
      if (payload.data) {
        for (const [key, value] of Object.entries(payload.data)) {
          if (value !== undefined && value !== null) {
            stringData[key] = typeof value === 'string' ? value : JSON.stringify(value);
          }
        }
      }

      const messageId = await messaging.send({
        token: payload.deviceToken,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: stringData,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown FCM dispatch error';
      // In development, log and delegate to fallback stub so user actions are not halted
      return this.fallbackStub.sendPushNotification({
        ...payload,
        data: {
          ...payload.data,
          _fcmError: errorMessage,
        },
      });
    }
  }

  /**
   * Returns the underlying fallback stub for inspection during tests.
   *
   * @returns The active fallback stub instance
   */
  getFallbackStub(): FirebaseFcmStub {
    return this.fallbackStub;
  }
}
