import { InvalidAmountError } from '../../shared/errors/index.js';

/**
 * Money value object — represents a monetary amount in paise (₹1 = 100 paise).
 * All monetary operations use integer arithmetic to prevent floating-point errors.
 * This is an immutable value object — all operations return new instances.
 */
export class Money {
  /**
   * @param amountInPaise - Amount in paise (must be a non-negative integer)
   * @throws {InvalidAmountError} if amount is negative or not an integer
   */
  private constructor(public readonly amountInPaise: number) {
    if (!Number.isInteger(amountInPaise) || amountInPaise < 0) {
      throw new InvalidAmountError(amountInPaise);
    }
  }

  /**
   * Creates a Money instance from paise.
   *
   * @param paise - Amount in paise
   * @returns New Money instance
   * @throws {InvalidAmountError} if paise is negative or not an integer
   */
  static fromPaise(paise: number): Money {
    return new Money(paise);
  }

  /**
   * Creates a Money instance from rupees.
   * Converts to paise internally (multiplies by 100).
   *
   * @param rupees - Amount in rupees
   * @returns New Money instance
   * @throws {InvalidAmountError} if the resulting paise is not valid
   */
  static fromRupees(rupees: number): Money {
    return new Money(Math.round(rupees * 100));
  }

  /** Creates a zero-value Money instance */
  static zero(): Money {
    return new Money(0);
  }

  /**
   * Adds two Money instances.
   *
   * @param other - Money to add
   * @returns New Money instance with the sum
   */
  add(other: Money): Money {
    return new Money(this.amountInPaise + other.amountInPaise);
  }

  /**
   * Subtracts another Money instance.
   *
   * @param other - Money to subtract
   * @returns New Money instance with the difference
   * @throws {InvalidAmountError} if result would be negative
   */
  subtract(other: Money): Money {
    return new Money(this.amountInPaise - other.amountInPaise);
  }

  /**
   * Calculates a percentage of this Money value.
   * Result is rounded to the nearest paise.
   *
   * @param basisPoints - Percentage in basis points (100 = 1%)
   * @returns New Money instance with the percentage amount
   */
  percentage(basisPoints: number): Money {
    return new Money(Math.round((this.amountInPaise * basisPoints) / 10000));
  }

  /** Whether this amount is zero */
  get isZero(): boolean {
    return this.amountInPaise === 0;
  }

  /** Whether this amount is greater than zero */
  get isPositive(): boolean {
    return this.amountInPaise > 0;
  }

  /**
   * Checks if this Money is greater than or equal to another.
   *
   * @param other - Money to compare against
   * @returns True if this >= other
   */
  isGreaterThanOrEqual(other: Money): boolean {
    return this.amountInPaise >= other.amountInPaise;
  }

  /**
   * Checks equality with another Money value.
   *
   * @param other - Money to compare
   * @returns True if amounts are equal
   */
  equals(other: Money): boolean {
    return this.amountInPaise === other.amountInPaise;
  }

  /**
   * Formats the amount for display.
   *
   * @param currency - Currency symbol (default: ₹)
   * @returns Formatted string like "₹1,234.56"
   */
  toDisplay(currency: string = '₹'): string {
    const rupees = this.amountInPaise / 100;
    return `${currency}${rupees.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /** Returns the paise value as a number (for serialization) */
  toNumber(): number {
    return this.amountInPaise;
  }

  toString(): string {
    return this.toDisplay();
  }
}
