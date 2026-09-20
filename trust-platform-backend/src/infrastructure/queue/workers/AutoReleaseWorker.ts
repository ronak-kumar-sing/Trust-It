import type { IEscrowRepository } from '../../../application/interfaces/IEscrowRepository.js';
import type { TransitionEscrowState } from '../../../application/use-cases/escrow/TransitionEscrowState.js';
import type { AutoReleaseJobData } from '../jobTypes.js';

/**
 * Worker handler that processes delayed auto-release inspection window expiry jobs.
 * Enforces defensive checks before executing auto-release.
 */
export function createAutoReleaseWorker(
  escrowRepository: IEscrowRepository,
  transitionEscrowState: TransitionEscrowState,
) {
  return async function handleAutoRelease(jobData: AutoReleaseJobData): Promise<void> {
    const escrow = await escrowRepository.findById(jobData.escrowTransactionId);

    // Guard: Only release if escrow exists and is still in INSPECTION_PERIOD
    if (!escrow || escrow.status !== 'INSPECTION_PERIOD') {
      return;
    }

    // Guard: Defensive check that inspection deadline has actually elapsed
    if (!escrow.isInspectionExpired()) {
      return;
    }

    // Trigger deterministic release
    await transitionEscrowState.execute({
      escrowTransactionId: escrow.id,
      targetState: 'RELEASED',
      actorId: 'SYSTEM_TIMER',
    });
  };
}
