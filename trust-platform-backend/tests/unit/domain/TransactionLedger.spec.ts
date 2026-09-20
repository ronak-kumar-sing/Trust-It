import { describe, it, expect } from 'vitest';
import { TransactionLedger } from '../../../src/domain/entities/TransactionLedger.js';
import { InvalidAmountError } from '../../../src/shared/errors/index.js';

describe('TransactionLedger Domain Entity', () => {
  const walletId = 'wallet-111';

  it('creates a valid ledger entry', () => {
    const entry = TransactionLedger.create({
      walletId,
      type: 'DEPOSIT',
      amount: 50000,
      balanceAfter: 50000,
      referenceId: 'pay_123',
      description: 'Initial deposit',
    });

    expect(entry.id).toBeDefined();
    expect(entry.walletId).toBe(walletId);
    expect(entry.type).toBe('DEPOSIT');
    expect(entry.amount).toBe(50000);
    expect(entry.balanceAfter).toBe(50000);
    expect(entry.referenceId).toBe('pay_123');
    expect(entry.description).toBe('Initial deposit');
    expect(entry.createdAt).toBeInstanceOf(Date);
  });

  it('throws InvalidAmountError when amount is zero or negative', () => {
    expect(() =>
      TransactionLedger.create({
        walletId,
        type: 'DEPOSIT',
        amount: 0,
        balanceAfter: 0,
      }),
    ).toThrow(InvalidAmountError);

    expect(() =>
      TransactionLedger.create({
        walletId,
        type: 'WITHDRAWAL',
        amount: -100,
        balanceAfter: 0,
      }),
    ).toThrow(InvalidAmountError);
  });

  it('reconstitutes and serializes to persistence correctly', () => {
    const pastDate = new Date('2026-03-01T12:00:00.000Z');
    const entry = TransactionLedger.fromPersistence({
      id: 'tx-ledger-1',
      wallet_id: walletId,
      type: 'ESCROW_FREEZE',
      amount: 15000,
      balance_after: 35000,
      reference_id: 'escrow-999',
      description: 'Escrow lock',
      created_at: pastDate.toISOString(),
    });

    expect(entry.id).toBe('tx-ledger-1');
    expect(entry.type).toBe('ESCROW_FREEZE');
    expect(entry.amount).toBe(15000);
    expect(entry.balanceAfter).toBe(35000);

    const persisted = entry.toPersistence();
    expect(persisted).toEqual({
      id: 'tx-ledger-1',
      wallet_id: walletId,
      type: 'ESCROW_FREEZE',
      amount: 15000,
      balance_after: 35000,
      reference_id: 'escrow-999',
      description: 'Escrow lock',
      created_at: pastDate.toISOString(),
    });
  });
});
