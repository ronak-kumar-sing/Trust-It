import type { GamingChallenge } from '../../domain/entities/GamingChallenge.js';

export interface ChallengeFilter {
  limit?: number;
  offset?: number;
}

/**
 * Port interface for GamingChallenge persistence.
 */
export interface IGamingChallengeRepository {
  findById(id: string): Promise<GamingChallenge | null>;
  findOpenChallenges(filter?: ChallengeFilter): Promise<GamingChallenge[]>;
  findByUserId(userId: string): Promise<GamingChallenge[]>;
  create(challenge: GamingChallenge): Promise<void>;
  update(challenge: GamingChallenge): Promise<void>;
}
