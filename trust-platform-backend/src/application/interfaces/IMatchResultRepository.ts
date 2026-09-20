import type { MatchResult } from '../../domain/entities/MatchResult.js';

/**
 * Port interface for MatchResult persistence.
 */
export interface IMatchResultRepository {
  findById(id: string): Promise<MatchResult | null>;
  findByChallengeId(challengeId: string): Promise<MatchResult[]>;
  create(matchResult: MatchResult): Promise<void>;
  update(matchResult: MatchResult): Promise<void>;
}
