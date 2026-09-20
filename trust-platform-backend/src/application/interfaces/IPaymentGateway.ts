/**
 * Order creation parameters for payment provider.
 */
export interface CreatePaymentOrderParams {
  /** Amount in smallest currency unit (paise) */
  amount: number;
  /** Currency code (default: 'INR') */
  currency?: string;
  /** Unique merchant receipt ID */
  receipt: string;
  /** Additional metadata */
  notes?: Record<string, string>;
}

/**
 * Result of creating an external payment order.
 */
export interface PaymentOrderResult {
  orderId: string;
  amount: number;
  currency: string;
}

/**
 * Verification parameters for completed payment.
 */
export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

/**
 * Refund parameters for reversing payment.
 */
export interface RefundPaymentParams {
  paymentId: string;
  amount?: number;
  notes?: Record<string, string>;
}

/**
 * Port interface for external payment gateway (e.g., Razorpay, Stripe).
 */
export interface IPaymentGateway {
  /**
   * Creates an order with the external payment provider.
   */
  createOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult>;

  /**
   * Verifies the cryptographic webhook or client signature of a payment.
   */
  verifyPaymentSignature(params: VerifyPaymentParams): boolean;

  /**
   * Initiates a refund for a previously captured payment.
   */
  processRefund(params: RefundPaymentParams): Promise<{ refundId: string; status: string }>;
}
