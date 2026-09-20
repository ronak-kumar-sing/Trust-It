/**
 * Port interface for scheduling delayed escrow operations (such as auto-release after inspection window).
 */
export interface IEscrowQueue {
  /**
   * Schedules a delayed auto-release job for an escrow transaction.
   *
   * @param escrowTransactionId - Escrow transaction UUID
   * @param delayMs - Delay in milliseconds before job executes
   */
  scheduleAutoRelease(escrowTransactionId: string, delayMs: number): Promise<void>;

  /**
   * Cancels a previously scheduled auto-release job (e.g., if buyer approves early or files dispute).
   *
   * @param escrowTransactionId - Escrow transaction UUID
   */
  cancelAutoRelease(escrowTransactionId: string): Promise<void>;
}
