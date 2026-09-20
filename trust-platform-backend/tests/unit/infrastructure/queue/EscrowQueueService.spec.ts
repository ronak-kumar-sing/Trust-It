import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EscrowQueueService } from '../../../../src/infrastructure/queue/EscrowQueueService.js';

describe('EscrowQueueService', () => {
  let queue: EscrowQueueService;

  beforeEach(() => {
    vi.useFakeTimers();
    queue = new EscrowQueueService();
  });

  afterEach(() => {
    queue.destroy();
    vi.useRealTimers();
  });

  it('triggers auto-release callback after specified delay', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    queue.setHandler(handler);

    await queue.scheduleAutoRelease('escrow-timer-1', 1000);

    expect(handler).not.toHaveBeenCalled();

    // Fast-forward 1000ms
    vi.advanceTimersByTime(1000);

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        escrowTransactionId: 'escrow-timer-1',
      }),
    );
  });

  it('cancels scheduled timer so handler is never executed', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    queue.setHandler(handler);

    await queue.scheduleAutoRelease('escrow-timer-2', 5000);
    await queue.cancelAutoRelease('escrow-timer-2');

    vi.advanceTimersByTime(6000);

    expect(handler).not.toHaveBeenCalled();
  });
});
