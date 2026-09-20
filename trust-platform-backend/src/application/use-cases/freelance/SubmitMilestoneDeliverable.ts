import type { IProjectRepository } from '../../interfaces/IProjectRepository.js';
import type { IMilestoneRepository } from '../../interfaces/IMilestoneRepository.js';
import type { IEscrowRepository } from '../../interfaces/IEscrowRepository.js';
import type { ICodeQualityGate } from '../../interfaces/ICodeQualityGate.js';
import type { TransitionEscrowState } from '../escrow/TransitionEscrowState.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type {
  SubmitMilestoneDTO,
  MilestoneDTO,
} from '../../dtos/freelance.dto.js';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../../shared/errors/index.js';
import { INSPECTION_WINDOWS } from '../../../shared/constants/index.js';
import { hoursToMs } from '../../../shared/utils/index.js';

/**
 * Use case: Freelancer submits milestone deliverable URL.
 * Automatically runs AI quality gate check, opens 14-day client review window,
 * and advances escrow into INSPECTION_PERIOD with auto-release timer.
 */
export class SubmitMilestoneDeliverable {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly milestoneRepository: IMilestoneRepository,
    private readonly escrowRepository: IEscrowRepository,
    private readonly codeQualityGate: ICodeQualityGate,
    private readonly transitionEscrowState: TransitionEscrowState,
    private readonly auditLogger: IAuditLogger,
  ) {}

  async execute(dto: SubmitMilestoneDTO): Promise<MilestoneDTO> {
    const milestone = await this.milestoneRepository.findById(dto.milestoneId);
    if (!milestone) {
      throw new NotFoundError('Milestone', dto.milestoneId);
    }

    const project = await this.projectRepository.findById(milestone.projectId);
    if (!project) {
      throw new NotFoundError('Project', milestone.projectId);
    }

    if (project.freelancerId !== dto.freelancerId) {
      throw new ForbiddenError('Only the assigned freelancer can submit deliverables');
    }

    if (!milestone.escrowTransactionId) {
      throw new ValidationError(
        'Milestone must be funded before deliverables can be submitted',
      );
    }

    // Move to IN_PROGRESS if currently FUNDED
    if (milestone.status === 'FUNDED') {
      milestone.startWork();
    }

    // Submit deliverable URL
    milestone.submitDeliverable(dto.submissionUrl);

    // AI Quality Gate verification
    const qualityResult = await this.codeQualityGate.check(dto.submissionUrl);

    // 14-day client review deadline
    const reviewDeadline = new Date(
      Date.now() + hoursToMs(INSPECTION_WINDOWS.FREELANCE_MILESTONE),
    );

    // Transition milestone to UNDER_REVIEW
    milestone.triggerQualityGate(
      qualityResult as unknown as Record<string, unknown>,
      reviewDeadline,
    );

    // Advance Escrow if in FUNDED_IN_ESCROW
    const escrow = await this.escrowRepository.findById(
      milestone.escrowTransactionId,
    );
    if (escrow && escrow.status === 'FUNDED_IN_ESCROW') {
      await this.transitionEscrowState.execute({
        escrowTransactionId: milestone.escrowTransactionId,
        targetState: 'DELIVERED',
        actorId: dto.freelancerId,
      });

      await this.transitionEscrowState.execute({
        escrowTransactionId: milestone.escrowTransactionId,
        targetState: 'INSPECTION_PERIOD',
        actorId: dto.freelancerId,
      });
    }

    await this.milestoneRepository.update(milestone);

    await this.auditLogger.log({
      entity: 'milestone',
      entityId: milestone.id,
      action: 'DELIVERABLE_SUBMITTED',
      actorId: dto.freelancerId,
      metadata: {
        submissionUrl: dto.submissionUrl,
        qualityGateScore: qualityResult.score,
        reviewDeadline: reviewDeadline.toISOString(),
      },
    });

    return {
      id: milestone.id,
      projectId: milestone.projectId,
      title: milestone.title,
      description: milestone.description,
      amount: milestone.amount,
      sowText: milestone.sowText,
      status: milestone.status,
      qualityGateResult: milestone.qualityGateResult,
      submissionUrl: milestone.submissionUrl,
      revisionCount: milestone.revisionCount,
      escrowTransactionId: milestone.escrowTransactionId,
      reviewDeadline: milestone.reviewDeadline?.toISOString() ?? null,
      createdAt: milestone.createdAt.toISOString(),
      updatedAt: milestone.updatedAt.toISOString(),
    };
  }
}
