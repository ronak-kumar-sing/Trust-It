import { describe, it, expect } from 'vitest';
import { Wallet } from '../../../src/domain/entities/Wallet.js';

describe('Wallet', () => {
  describe('creation', () => {
    it('should create a wallet with zero balances', () => {
      const wallet = Wallet.create('w1', 'u1');
      expect(wallet.availableBalance).toBe(0);
      expect(wallet.frozenBalance).toBe(0);
      expect(wallet.totalEarned).toBe(0);
      expect(wallet.totalSpent).toBe(0);
      expect(wallet.version).toBe(1);
    });
  });

  describe('credit', () => {
    it('should credit funds to available balance', () => {
      const wallet = Wallet.create('w1', 'u1');
      wallet.credit(10000);
      expect(wallet.availableBalance).toBe(10000);
      expect(wallet.totalEarned).toBe(10000);
    });

    it('should increment version on credit', () => {
      const wallet = Wallet.create('w1', 'u1');
      wallet.credit(10000);
      expect(wallet.version).toBe(2);
    });

    it('should reject zero credit', () => {
      const wallet = Wallet.create('w1', 'u1');
      expect(() => wallet.credit(0)).toThrow();
    });

    it('should reject negative credit', () => {
      const wallet = Wallet.create('w1', 'u1');
      expect(() => wallet.credit(-100)).toThrow();
    });
  });

  describe('debit', () => {
    it('should debit funds from available balance', () => {
      const wallet = Wallet.create('w1', 'u1');
      wallet.credit(10000);
      wallet.debit(3000);
      expect(wallet.availableBalance).toBe(7000);
      expect(wallet.totalSpent).toBe(3000);
    });

    it('should reject debit exceeding available balance', () => {
      const wallet = Wallet.create('w1', 'u1');
      wallet.credit(5000);
      expect(() => wallet.debit(6000)).toThrow('Insufficient funds');
    });
  });

  describe('freeze', () => {
    it('should move funds from available to frozen', () => {
      const wallet = Wallet.create('w1', 'u1');
      wallet.credit(10000);
      wallet.freeze(5000);
      expect(wallet.availableBalance).toBe(5000);
      expect(wallet.frozenBalance).toBe(5000);
    });

    it('should reject freeze exceeding available balance', () => {
      const wallet = Wallet.create('w1', 'u1');
      wallet.credit(3000);
      expect(() => wallet.freeze(5000)).toThrow('Insufficient funds');
    });

    it('should reject zero freeze amount', () => {
      const wallet = Wallet.create('w1', 'u1');
      wallet.credit(10000);
      expect(() => wallet.freeze(0)).toThrow();
    });
  });

  describe('release', () => {
    it('should move funds from frozen to available', () => {
      const wallet = Wallet.create('w1', 'u1');
      wallet.credit(10000);
      wallet.freeze(5000);
      wallet.release(5000);
      expect(wallet.availableBalance).toBe(10000);
      expect(wallet.frozenBalance).toBe(0);
    });

    it('should reject release exceeding frozen balance', () => {
      const wallet = Wallet.create('w1', 'u1');
      wallet.credit(10000);
      wallet.freeze(3000);
      expect(() => wallet.release(5000)).toThrow('Insufficient funds');
    });
  });

  describe('refund', () => {
    it('should move frozen funds back to available', () => {
      const wallet = Wallet.create('w1', 'u1');
      wallet.credit(10000);
      wallet.freeze(5000);
      wallet.refund(5000);
      expect(wallet.availableBalance).toBe(10000);
      expect(wallet.frozenBalance).toBe(0);
    });

    it('should reject refund exceeding frozen balance', () => {
      const wallet = Wallet.create('w1', 'u1');
      wallet.credit(10000);
      wallet.freeze(3000);
      expect(() => wallet.refund(5000)).toThrow('Insufficient funds');
    });
  });

  describe('total balance', () => {
    it('should report total as available + frozen', () => {
      const wallet = Wallet.create('w1', 'u1');
      wallet.credit(10000);
      wallet.freeze(3000);
      expect(wallet.totalBalance).toBe(10000);
    });
  });

  describe('version tracking', () => {
    it('should increment version on every mutation', () => {
      const wallet = Wallet.create('w1', 'u1');
      expect(wallet.version).toBe(1);
      wallet.credit(10000);
      expect(wallet.version).toBe(2);
      wallet.freeze(5000);
      expect(wallet.version).toBe(3);
      wallet.release(5000);
      expect(wallet.version).toBe(4);
    });
  });

  describe('persistence', () => {
    it('should serialize to persistence format', () => {
      const wallet = Wallet.create('w1', 'u1');
      wallet.credit(10000);
      const data = wallet.toPersistence();
      expect(data.id).toBe('w1');
      expect(data.user_id).toBe('u1');
      expect(data.available_balance).toBe(10000);
      expect(data.version).toBe(2);
    });

    it('should reconstitute from persistence', () => {
      const wallet = Wallet.fromPersistence({
        id: 'w1',
        user_id: 'u1',
        available_balance: 5000,
        frozen_balance: 3000,
        total_earned: 8000,
        total_spent: 0,
        version: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      });
      expect(wallet.availableBalance).toBe(5000);
      expect(wallet.frozenBalance).toBe(3000);
      expect(wallet.version).toBe(5);
    });
  });
});
