import type { IEscrowQueue } from '../../application/interfaces/IEscrowQueue.js';
import type { AutoReleaseJobData } from './jobTypes.js';

export type AutoReleaseHandler = (jobData: AutoReleaseJobData) => Promise<void>;

/**
 * EscrowQueueService.
 * Implements delayed job scheduling for inspection windows.
 * Employs in-memory timer map with deduplication, supporting high-throughput scheduling
 * and zero-dependency local development while adhering to BullMQ job contract.
 */
export class EscrowQueueService implements IEscrowQueue {
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private handler?: AutoReleaseHandler;

  constructor(handler?: AutoReleaseHandler) {
    this.handler = handler;
  }

  /**
   * Registers or updates the handler executed when an auto-release timer expires.
   */
  setHandler(handler: AutoReleaseHandler): void {
    this.handler = handler;
  }

  /**
   * Schedules a delayed auto-release job.
   * Cancels existing timer for this escrow ID if already scheduled.
   *
   * @param escrowTransactionId - Escrow transaction UUID
   * @param delayMs - Delay in milliseconds before firing
   */
  async scheduleAutoRelease(escrowTransactionId: string, delayMs: number): Promise<void> {
    // Clear any existing timer for this escrow
    this.clearTimer(escrowTransactionId);

    const scheduledAt = new Date().toISOString();

    const timer = setTimeout(async () => {
      this.timers.delete(escrowTransactionId);
      if (this.handler) {
        try {
          await this.handler({ escrowTransactionId, scheduledAt });
        } catch (err) {
          console.error(`Error processing auto-release for ${escrowTransactionId}:`, err);
        }
      }
    }, delayMs);

    // Unref timer so Node process doesn't hang in tests/shutdown
    if (typeof timer.unref === 'function') {
      timer.unref();
    }

    this.timers.set(escrowTransactionId, timer);
  }

  /**
   * Cancels a scheduled auto-release timer.
   *
   * @param escrowTransactionId - Escrow transaction UUID
   */
  async cancelAutoRelease(escrowTransactionId: string): Promise<void> {
    this.clearTimer(escrowTransactionId);
  }

  /**
   * Cleans up all pending timers on shutdown.
   */
  destroy(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  private clearTimer(id: string): void {
    const existing = this.timers.get(id);
    if (existing) {
      clearTimeout(existing);
      this.timers.delete(id);
    }
  }
}
