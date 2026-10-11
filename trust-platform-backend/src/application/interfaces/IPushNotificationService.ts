export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  deviceToken?: string;
}

export interface PushNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Port Contract: External Push Notification Gateway (e.g. Firebase Cloud Messaging).
 */
export interface IPushNotificationService {
  /**
   * Dispatches a push notification to user's registered device tokens.
   */
  sendPushNotification(payload: PushNotificationPayload): Promise<PushNotificationResult>;
}
