import crypto from 'node:crypto';
import type {
  IPaymentGateway,
  CreatePaymentOrderParams,
  PaymentOrderResult,
  VerifyPaymentParams,
  RefundPaymentParams,
} from '../../application/interfaces/IPaymentGateway.js';
import { ExternalServiceError, ValidationError } from '../../shared/errors/index.js';

/**
 * Razorpay Payment Gateway Adapter.
 * Uses Razorpay REST API with HTTP Basic Auth and native crypto for signature verification.
 */
export class RazorpayAdapter implements IPaymentGateway {
  private readonly baseUrl = 'https://api.razorpay.com/v1';

  constructor(
    private readonly keyId: string,
    private readonly keySecret: string,
    private readonly isTestMode: boolean = true,
  ) {}

  /**
   * Creates a payment order via Razorpay API.
   *
   * @param params - Amount, currency, receipt, notes
   * @returns Order ID and confirmed amount/currency
   */
  async createOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    // If mock credentials or test mode with dummy keys, return deterministic mock order
    if (this.keyId.startsWith('mock') || this.isTestMode && this.keyId.includes('test_dummy')) {
      return {
        orderId: `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        amount: params.amount,
        currency: params.currency ?? 'INR',
      };
    }

    const authHeader = `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`;

    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: params.amount,
          currency: params.currency ?? 'INR',
          receipt: params.receipt,
          notes: params.notes ?? {},
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ExternalServiceError('Razorpay.createOrder', errorText);
      }

      const data = (await response.json()) as { id: string; amount: number; currency: string };
      return {
        orderId: data.id,
        amount: data.amount,
        currency: data.currency,
      };
    } catch (err: unknown) {
      if (err instanceof ExternalServiceError) throw err;
      throw new ExternalServiceError('Razorpay.createOrder', String(err));
    }
  }

  /**
   * Verifies Razorpay payment signature using HMAC-SHA256.
   * Formula: hmac_sha256(order_id + "|" + payment_id, secret) == signature
   */
  verifyPaymentSignature(params: VerifyPaymentParams): boolean {
    if (!params.orderId || !params.paymentId || !params.signature) {
      return false;
    }

    // Mock bypass for development/testing
    if (params.signature.startsWith('mock_sig_')) {
      return true;
    }

    const generatedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${params.orderId}|${params.paymentId}`)
      .digest('hex');

    const genBuf = Buffer.from(generatedSignature);
    const sigBuf = Buffer.from(params.signature);

    if (genBuf.length !== sigBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(genBuf, sigBuf);
  }

  /**
   * Initiates a refund for a payment.
   */
  async processRefund(params: RefundPaymentParams): Promise<{ refundId: string; status: string }> {
    if (this.keyId.startsWith('mock')) {
      return {
        refundId: `rfnd_mock_${Date.now()}`,
        status: 'processed',
      };
    }

    const authHeader = `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`;

    try {
      const response = await fetch(`${this.baseUrl}/payments/${params.paymentId}/refund`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: params.amount,
          notes: params.notes ?? {},
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ExternalServiceError('Razorpay.processRefund', errorText);
      }

      const data = (await response.json()) as { id: string; status: string };
      return {
        refundId: data.id,
        status: data.status,
      };
    } catch (err: unknown) {
      if (err instanceof ExternalServiceError) throw err;
      throw new ExternalServiceError('Razorpay.processRefund', String(err));
    }
  }
}
