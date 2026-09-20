import type { EscrowStatusType, EscrowTypeValue } from '../../domain/enums/index.js';

/**
 * Input DTO for creating an escrow transaction.
 */
export interface CreateEscrowDTO {
  buyerId: string;
  sellerId: string;
  type: EscrowTypeValue;
  amount: number;
  metadata?: Record<string, unknown>;
}

/**
 * Input DTO for locking funds in escrow.
 */
export interface FundEscrowDTO {
  escrowTransactionId: string;
  buyerId: string;
}

/**
 * Input DTO for transitioning escrow status.
 */
export interface TransitionEscrowDTO {
  escrowTransactionId: string;
  targetState: EscrowStatusType;
  actorId: string;
}

/**
 * Input DTO for raising an escrow dispute.
 */
export interface DisputeEscrowDTO {
  escrowTransactionId: string;
  buyerId: string;
  reason: string;
  evidenceUrls?: string[];
}

/**
 * Output DTO for escrow transaction representation.
 */
export interface EscrowDetailsDTO {
  id: string;
  type: EscrowTypeValue;
  buyerId: string;
  sellerId: string;
  amount: number;
  platformFee: number;
  status: EscrowStatusType;
  inspectionDeadline: string | null;
  version: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
