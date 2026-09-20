import type { TransactionTypeValue } from '../enums/TransactionType.js';
import { InvalidAmountError } from '../../shared/errors/index.js';
import { nanoid } from 'nanoid';

/**
 * TransactionLedger domain entity.
 * Represents an immutable double-entry ledger record for auditing all wallet balance changes.
 */
export class TransactionLedger {
  private constructor(
    public readonly id: string,
    public readonly walletId: string,
    public readonly type: TransactionTypeValue,
    public readonly amount: number,
    public readonly balanceAfter: number,
    public readonly referenceId: string | null,
    public readonly description: string,
    public readonly createdAt: Date,
  ) {}

  /**
   * Factory method to create a new ledger entry.
   *
   * @param walletId - Owning wallet UUID
   * @param type - Type of transaction
   * @param amount - Transaction amount in paise (must be positive)
   * @param balanceAfter - Wallet total/available balance after operation
   * @param referenceId - External payment ID or escrow ID
   * @param description - Human-readable note
   * @returns New TransactionLedger instance
   * @throws {InvalidAmountError} If amount is not positive integer
   */
  static create(params: {
    walletId: string;
    type: TransactionTypeValue;
    amount: number;
    balanceAfter: number;
    referenceId?: string | null;
    description?: string;
    id?: string;
  }): TransactionLedger {
    if (!Number.isInteger(params.amount) || params.amount <= 0) {
      throw new InvalidAmountError(params.amount);
    }

    return new TransactionLedger(
      params.id ?? nanoid(),
      params.walletId,
      params.type,
      params.amount,
      params.balanceAfter,
      params.referenceId ?? null,
      params.description ?? '',
      new Date(),
    );
  }

  /**
   * Reconstitutes ledger entity from persistence data.
   */
  static fromPersistence(props: {
    id: string;
    wallet_id: string;
    type: TransactionTypeValue;
    amount: number | string;
    balance_after: number | string;
    reference_id: string | null;
    description: string;
    created_at: string;
  }): TransactionLedger {
    return new TransactionLedger(
      props.id,
      props.wallet_id,
      props.type,
      Number(props.amount),
      Number(props.balance_after),
      props.reference_id,
      props.description,
      new Date(props.created_at),
    );
  }

  /**
   * Serializes entity to database row structure.
   */
  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      wallet_id: this.walletId,
      type: this.type,
      amount: this.amount,
      balance_after: this.balanceAfter,
      reference_id: this.referenceId,
      description: this.description,
      created_at: this.createdAt.toISOString(),
    };
  }
}
