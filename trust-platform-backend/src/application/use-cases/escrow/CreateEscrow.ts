import { EscrowTransaction } from '../../../domain/entities/EscrowTransaction.js';
import type { IEscrowRepository } from '../../interfaces/IEscrowRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { CreateEscrowDTO, EscrowDetailsDTO } from '../../dtos/escrow.dto.js';
import type { IUserRepository } from '../../interfaces/IUserRepository.js';
import { TrustScoreCalculator } from '../../../domain/services/TrustScoreCalculator.js';
import { ValidationError, InvalidAmountError } from '../../../shared/errors/index.js';
import { PLATFORM_FEES } from '../../../shared/constants/index.js';
import { nanoid } from 'nanoid';

/**
 * Use case: Create a new escrow transaction in INITIATED state.
 * Enforces Trust Tier maximum single-transaction limit.
 */
export class CreateEscrow {
  constructor(
    private readonly escrowRepository: IEscrowRepository,
    private readonly auditLogger: IAuditLogger,
    private readonly userRepository?: IUserRepository,
  ) {}

  /**
   * Initiates a new escrow contract between buyer and seller.
   *
   * @param dto - Escrow creation payload
   * @returns Detailed escrow representation
   * @throws {ValidationError} When buyer and seller are identical or tier limit exceeded
   * @throws {InvalidAmountError} When amount is not positive integer
   */
  async execute(dto: CreateEscrowDTO): Promise<EscrowDetailsDTO> {
    if (dto.buyerId === dto.sellerId) {
      throw new ValidationError('Buyer and seller must be different parties');
    }
    if (!Number.isInteger(dto.amount) || dto.amount <= 0) {
      throw new InvalidAmountError(dto.amount);
    }

    // Enforce Trust Tier limit if userRepository is provided
    if (this.userRepository) {
      const buyer = await this.userRepository.findById(dto.buyerId);
      if (buyer) {
        if (!TrustScoreCalculator.isEscrowPermitted(buyer.trustScore, dto.amount)) {
          const tierDetails = TrustScoreCalculator.getDetails(buyer.trustScore);
          throw new ValidationError(
            `Transaction amount of ₹${dto.amount / 100} exceeds your Trust Tier (${tierDetails.tier}) limit of ₹${tierDetails.maxEscrowAmount / 100}. Complete more transactions or verify KYC to increase your tier.`,
          );
        }
      }
    }

    // Calculate platform fee in basis points (500 bps = 5%)
    const platformFee = Math.round((dto.amount * PLATFORM_FEES.STANDARD) / 10000);

    const escrow = EscrowTransaction.create({
      id: nanoid(),
      type: dto.type,
      buyerId: dto.buyerId,
      sellerId: dto.sellerId,
      amount: dto.amount,
      platformFee,
      metadata: dto.metadata,
    });

    await this.escrowRepository.create(escrow);

    await this.auditLogger.log({
      entity: 'escrow_transaction',
      entityId: escrow.id,
      action: 'ESCROW_CREATED',
      actorId: dto.buyerId,
      metadata: {
        type: dto.type,
        buyerId: dto.buyerId,
        sellerId: dto.sellerId,
        amount: dto.amount,
        platformFee,
      },
    });

    return {
      id: escrow.id,
      type: escrow.type,
      buyerId: escrow.buyerId,
      sellerId: escrow.sellerId,
      amount: escrow.amount,
      platformFee: escrow.platformFee,
      status: escrow.status,
      inspectionDeadline: escrow.inspectionDeadline?.toISOString() ?? null,
      version: escrow.version,
      metadata: escrow.metadata,
      createdAt: escrow.createdAt.toISOString(),
      updatedAt: escrow.updatedAt.toISOString(),
    };
  }
}
