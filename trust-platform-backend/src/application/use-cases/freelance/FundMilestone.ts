import type { IProjectRepository } from '../../interfaces/IProjectRepository.js';
import type { IMilestoneRepository } from '../../interfaces/IMilestoneRepository.js';
import type { CreateEscrow } from '../escrow/CreateEscrow.js';
import type { FundEscrow } from '../escrow/FundEscrow.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type {
  FundMilestoneDTO,
  FundMilestoneResultDTO,
} from '../../dtos/freelance.dto.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../../shared/errors/index.js';

/**
 * Use case: Fund a freelance milestone.
 * Creates an escrow transaction and locks client funds in wallet escrow balance.
 */
export class FundMilestone {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly milestoneRepository: IMilestoneRepository,
    private readonly createEscrow: CreateEscrow,
    private readonly fundEscrow: FundEscrow,
    private readonly auditLogger: IAuditLogger,
  ) {}

  async execute(dto: FundMilestoneDTO): Promise<FundMilestoneResultDTO> {
    const milestone = await this.milestoneRepository.findById(dto.milestoneId);
    if (!milestone) {
      throw new NotFoundError('Milestone', dto.milestoneId);
    }

    const project = await this.projectRepository.findById(milestone.projectId);
    if (!project) {
      throw new NotFoundError('Project', milestone.projectId);
    }

    if (project.clientId !== dto.clientId) {
      throw new ForbiddenError('Only the project client can fund this milestone');
    }

    if (milestone.status !== 'PENDING') {
      throw new ConflictError(
        `Milestone cannot be funded from current status: ${milestone.status}`,
      );
    }

    // 1. Create Escrow contract
    const escrow = await this.createEscrow.execute({
      buyerId: dto.clientId,
      sellerId: project.freelancerId,
      type: 'FREELANCE_MILESTONE',
      amount: milestone.amount,
      metadata: {
        projectId: project.id,
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
      },
    });

    // 2. Fund Escrow (freezes buyer funds in wallet)
    const fundedEscrow = await this.fundEscrow.execute({
      escrowTransactionId: escrow.id,
      buyerId: dto.clientId,
    });

    // 3. Mark milestone as FUNDED
    milestone.fund(fundedEscrow.id);
    await this.milestoneRepository.update(milestone);

    // 4. Log audit event
    await this.auditLogger.log({
      entity: 'milestone',
      entityId: milestone.id,
      action: 'MILESTONE_FUNDED',
      actorId: dto.clientId,
      metadata: {
        escrowTransactionId: fundedEscrow.id,
        amount: milestone.amount,
        freelancerId: project.freelancerId,
      },
    });

    return {
      milestone: {
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
      },
      escrow: fundedEscrow,
    };
  }
}
