import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { RazorpayAdapter } from '../../../../src/infrastructure/payment/RazorpayAdapter.js';

describe('RazorpayAdapter', () => {
  const testKeyId = 'mock_rzp_key_id';
  const testSecret = 'rzp_secret_xyz123';
  const adapter = new RazorpayAdapter(testKeyId, testSecret, true);

  describe('createOrder()', () => {
    it('creates a simulated payment order in test mode', async () => {
      const order = await adapter.createOrder({
        amount: 50000,
        currency: 'INR',
        receipt: 'rcpt_001',
      });

      expect(order.orderId).toBeDefined();
      expect(order.orderId.startsWith('order_mock_')).toBe(true);
      expect(order.amount).toBe(50000);
      expect(order.currency).toBe('INR');
    });
  });

  describe('verifyPaymentSignature()', () => {
    it('validates a mathematically correct HMAC-SHA256 signature', () => {
      const orderId = 'order_test_999';
      const paymentId = 'pay_test_888';

      const validSignature = crypto
        .createHmac('sha256', testSecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isValid = adapter.verifyPaymentSignature({
        orderId,
        paymentId,
        signature: validSignature,
      });

      expect(isValid).toBe(true);
    });

    it('rejects an incorrect signature', () => {
      const isValid = adapter.verifyPaymentSignature({
        orderId: 'order_1',
        paymentId: 'pay_1',
        signature: 'wrong_hex_signature',
      });

      expect(isValid).toBe(false);
    });

    it('accepts mock signatures starting with mock_sig_', () => {
      const isValid = adapter.verifyPaymentSignature({
        orderId: 'order_1',
        paymentId: 'pay_1',
        signature: 'mock_sig_success',
      });

      expect(isValid).toBe(true);
    });
  });

  describe('processRefund()', () => {
    it('processes mock refund in test mode', async () => {
      const result = await adapter.processRefund({
        paymentId: 'pay_test_888',
        amount: 25000,
      });

      expect(result.refundId).toBeDefined();
      expect(result.status).toBe('processed');
    });
  });
});
