import { describe, it, expect } from 'vitest';
import { Money } from '../../../src/domain/value-objects/Money.js';

describe('Money', () => {
  describe('creation', () => {
    it('should create from paise', () => {
      const money = Money.fromPaise(10050);
      expect(money.amountInPaise).toBe(10050);
    });

    it('should create from rupees', () => {
      const money = Money.fromRupees(100.50);
      expect(money.amountInPaise).toBe(10050);
    });

    it('should create zero', () => {
      const money = Money.zero();
      expect(money.amountInPaise).toBe(0);
      expect(money.isZero).toBe(true);
    });

    it('should reject negative paise', () => {
      expect(() => Money.fromPaise(-100)).toThrow();
    });

    it('should reject non-integer paise', () => {
      expect(() => Money.fromPaise(100.5)).toThrow();
    });
  });

  describe('arithmetic', () => {
    it('should add two Money values', () => {
      const a = Money.fromPaise(5000);
      const b = Money.fromPaise(3000);
      const result = a.add(b);
      expect(result.amountInPaise).toBe(8000);
    });

    it('should subtract two Money values', () => {
      const a = Money.fromPaise(5000);
      const b = Money.fromPaise(3000);
      const result = a.subtract(b);
      expect(result.amountInPaise).toBe(2000);
    });

    it('should reject subtraction resulting in negative', () => {
      const a = Money.fromPaise(3000);
      const b = Money.fromPaise(5000);
      expect(() => a.subtract(b)).toThrow();
    });

    it('should calculate percentage in basis points', () => {
      const amount = Money.fromPaise(100000); // ₹1,000
      const fee = amount.percentage(500); // 5%
      expect(fee.amountInPaise).toBe(5000); // ₹50
    });
  });

  describe('comparison', () => {
    it('should check equality', () => {
      const a = Money.fromPaise(5000);
      const b = Money.fromPaise(5000);
      expect(a.equals(b)).toBe(true);
    });

    it('should check inequality', () => {
      const a = Money.fromPaise(5000);
      const b = Money.fromPaise(3000);
      expect(a.equals(b)).toBe(false);
    });

    it('should check greater than or equal', () => {
      const a = Money.fromPaise(5000);
      const b = Money.fromPaise(3000);
      expect(a.isGreaterThanOrEqual(b)).toBe(true);
      expect(b.isGreaterThanOrEqual(a)).toBe(false);
    });
  });

  describe('display', () => {
    it('should format money for display', () => {
      const money = Money.fromPaise(123456);
      const display = money.toDisplay();
      expect(display).toContain('1,234.56');
    });
  });

  describe('immutability', () => {
    it('should not mutate original on add', () => {
      const original = Money.fromPaise(5000);
      original.add(Money.fromPaise(3000));
      expect(original.amountInPaise).toBe(5000);
    });

    it('should not mutate original on subtract', () => {
      const original = Money.fromPaise(5000);
      original.subtract(Money.fromPaise(3000));
      expect(original.amountInPaise).toBe(5000);
    });
  });
});
