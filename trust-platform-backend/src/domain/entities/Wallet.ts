import {
  InsufficientFundsError,
  InvalidAmountError,
} from '../../shared/errors/index.js';

/**
 * Wallet domain entity.
 * Manages user balances with separate available and frozen pools.
 * All amounts are in paise (integers). Uses optimistic locking via version.
 *
 * Invariants:
 * - available_balance >= 0 (always)
 * - frozen_balance >= 0 (always)
 * - freeze amount <= available_balance
 * - release/refund amount <= frozen_balance
 */
export class Wallet {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    private _availableBalance: number,
    private _frozenBalance: number,
    private _totalEarned: number,
    private _totalSpent: number,
    private _version: number,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  // ── Getters ──────────────────────────────────────────────────

  /** Current available (unfrozen) balance in paise */
  get availableBalance(): number {
    return this._availableBalance;
  }

  /** Current frozen balance (locked in escrow) in paise */
  get frozenBalance(): number {
    return this._frozenBalance;
  }

  /** Total amount earned (lifetime) in paise */
  get totalEarned(): number {
    return this._totalEarned;
  }

  /** Total amount spent (lifetime) in paise */
  get totalSpent(): number {
    return this._totalSpent;
  }

  /** Optimistic locking version number */
  get version(): number {
    return this._version;
  }

  /** Total balance (available + frozen) */
  get totalBalance(): number {
    return this._availableBalance + this._frozenBalance;
  }

  /** Last update timestamp */
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ── Factory Methods ──────────────────────────────────────────

  /**
   * Creates a new wallet for a user.
   *
   * @param id - Wallet UUID
   * @param userId - Owning user's UUID
   * @returns New wallet with zero balances
   */
  static create(id: string, userId: string): Wallet {
    return new Wallet(id, userId, 0, 0, 0, 0, 1, new Date(), new Date());
  }

  /**
   * Reconstitutes a Wallet from persistence data.
   *
   * @param props - Wallet properties from database
   * @returns Reconstituted Wallet instance
   */
  static fromPersistence(props: {
    id: string;
    user_id: string;
    available_balance: number;
    frozen_balance: number;
    total_earned: number;
    total_spent: number;
    version: number;
    created_at: string;
    updated_at: string;
  }): Wallet {
    return new Wallet(
      props.id,
      props.user_id,
      props.available_balance,
      props.frozen_balance,
      props.total_earned,
      props.total_spent,
      props.version,
      new Date(props.created_at),
      new Date(props.updated_at),
    );
  }

  // ── Mutation Methods ─────────────────────────────────────────

  /**
   * Credits funds to available balance (e.g., deposit, escrow release).
   *
   * @param amount - Amount in paise to credit
   * @throws {InvalidAmountError} if amount is not a positive integer
   */
  credit(amount: number): void {
    this.assertPositiveAmount(amount);
    this._availableBalance += amount;
    this._totalEarned += amount;
    this.touch();
  }

  /**
   * Debits funds from available balance (e.g., withdrawal).
   *
   * @param amount - Amount in paise to debit
   * @throws {InvalidAmountError} if amount is not a positive integer
   * @throws {InsufficientFundsError} if available balance is insufficient
   */
  debit(amount: number): void {
    this.assertPositiveAmount(amount);
    if (amount > this._availableBalance) {
      throw new InsufficientFundsError(this._availableBalance, amount);
    }
    this._availableBalance -= amount;
    this._totalSpent += amount;
    this.touch();
  }

  /**
   * Freezes funds from available balance (moves to frozen pool for escrow).
   *
   * @param amount - Amount in paise to freeze
   * @throws {InvalidAmountError} if amount is not a positive integer
   * @throws {InsufficientFundsError} if available balance is insufficient
   */
  freeze(amount: number): void {
    this.assertPositiveAmount(amount);
    if (amount > this._availableBalance) {
      throw new InsufficientFundsError(this._availableBalance, amount);
    }
    this._availableBalance -= amount;
    this._frozenBalance += amount;
    this.touch();
  }

  /**
   * Releases frozen funds to available balance (escrow completion for seller).
   *
   * @param amount - Amount in paise to release
   * @throws {InvalidAmountError} if amount is not a positive integer
   * @throws {InsufficientFundsError} if frozen balance is insufficient
   */
  release(amount: number): void {
    this.assertPositiveAmount(amount);
    if (amount > this._frozenBalance) {
      throw new InsufficientFundsError(this._frozenBalance, amount);
    }
    this._frozenBalance -= amount;
    this._availableBalance += amount;
    this._totalEarned += amount;
    this.touch();
  }

  /**
   * Deducts funds from frozen balance upon escrow release to another party.
   *
   * @param amount - Amount in paise to deduct from frozen balance
   */
  debitFrozen(amount: number): void {
    this.assertPositiveAmount(amount);
    if (amount > this._frozenBalance) {
      throw new InsufficientFundsError(this._frozenBalance, amount);
    }
    this._frozenBalance -= amount;
    this._totalSpent += amount;
    this.touch();
  }

  /**
   * Refunds frozen funds back to available balance (escrow cancellation/refund).
   *
   * @param amount - Amount in paise to refund
   * @throws {InvalidAmountError} if amount is not a positive integer
   * @throws {InsufficientFundsError} if frozen balance is insufficient
   */
  refund(amount: number): void {
    this.assertPositiveAmount(amount);
    if (amount > this._frozenBalance) {
      throw new InsufficientFundsError(this._frozenBalance, amount);
    }
    this._frozenBalance -= amount;
    this._availableBalance += amount;
    this.touch();
  }

  // ── Private Helpers ──────────────────────────────────────────

  /**
   * Validates that an amount is a positive integer.
   * @throws {InvalidAmountError} if validation fails
   */
  private assertPositiveAmount(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new InvalidAmountError(amount);
    }
  }

  /** Increments version and updates timestamp */
  private touch(): void {
    this._version += 1;
    this._updatedAt = new Date();
  }

  /**
   * Serializes the wallet for database persistence.
   *
   * @returns Plain object for database writes
   */
  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      user_id: this.userId,
      available_balance: this._availableBalance,
      frozen_balance: this._frozenBalance,
      total_earned: this._totalEarned,
      total_spent: this._totalSpent,
      version: this._version,
      updated_at: this._updatedAt.toISOString(),
    };
  }
}
