import { describe, it, expect } from 'vitest';
import { GamingChallenge } from '../../../src/domain/entities/GamingChallenge.js';
import {
  ValidationError,
  InvalidAmountError,
  IllegalStateTransitionError,
} from '../../../src/shared/errors/index.js';

describe('GamingChallenge Entity', () => {
  const challengerId = '11111111-1111-4111-8111-111111111111';
  const opponentId = '22222222-2222-4222-8222-222222222222';

  it('creates an open challenge with valid inputs', () => {
    const challenge = GamingChallenge.create({
      challengerId,
      gameTitle: 'Valorant 1v1 Ascent',
      stakeAmount: 50000,
      rules: { rounds: 13, server: 'Mumbai' },
    });

    expect(challenge.id).toBeDefined();
    expect(challenge.challengerId).toBe(challengerId);
    expect(challenge.opponentId).toBeNull();
    expect(challenge.gameTitle).toBe('Valorant 1v1 Ascent');
    expect(challenge.stakeAmount).toBe(50000);
    expect(challenge.totalPot).toBe(100000);
    expect(challenge.status).toBe('OPEN');
    expect(challenge.rules).toEqual({ rounds: 13, server: 'Mumbai' });
  });

  it('throws ValidationError if challenger targets themselves', () => {
    expect(() =>
      GamingChallenge.create({
        challengerId,
        opponentId: challengerId,
        gameTitle: 'FIFA 24',
        stakeAmount: 10000,
      }),
    ).toThrow(ValidationError);
  });

  it('throws InvalidAmountError on negative or non-integer stake', () => {
    expect(() =>
      GamingChallenge.create({
        challengerId,
        gameTitle: 'Chess',
        stakeAmount: -500,
      }),
    ).toThrow(InvalidAmountError);
  });

  it('transitions through accept, startMatch, reportFirstResult, and complete', () => {
    const challenge = GamingChallenge.create({
      challengerId,
      gameTitle: 'Tekken 8',
      stakeAmount: 25000,
    });

    challenge.accept(opponentId, 'escrow-game-1');
    expect(challenge.status).toBe('ACCEPTED');
    expect(challenge.opponentId).toBe(opponentId);
    expect(challenge.escrowTransactionId).toBe('escrow-game-1');

    challenge.startMatch();
    expect(challenge.status).toBe('IN_PROGRESS');

    const deadline = new Date(Date.now() + 30 * 60 * 1000);
    challenge.reportFirstResult(deadline);
    expect(challenge.status).toBe('RESULTS_REPORTED');
    expect(challenge.responseDeadline).toEqual(deadline);

    challenge.reachConsensus();
    expect(challenge.status).toBe('CONSENSUS_REACHED');

    challenge.complete();
    expect(challenge.status).toBe('COMPLETED');
  });

  it('detects 30-minute timeout correctly', () => {
    const challenge = GamingChallenge.create({
      challengerId,
      gameTitle: 'Street Fighter 6',
      stakeAmount: 30000,
    });

    challenge.accept(opponentId, 'escrow-game-2');

    // Past deadline
    const expiredDeadline = new Date(Date.now() - 1000);
    challenge.reportFirstResult(expiredDeadline);
    expect(challenge.isResponseExpired()).toBe(true);

    // Future deadline
    const futureDeadline = new Date(Date.now() + 60000);
    challenge.reportFirstResult(futureDeadline);
    expect(challenge.isResponseExpired()).toBe(false);
  });

  it('throws IllegalStateTransitionError on out-of-order transitions', () => {
    const challenge = GamingChallenge.create({
      challengerId,
      gameTitle: 'BGMI',
      stakeAmount: 20000,
    });

    expect(() => challenge.startMatch()).toThrow(IllegalStateTransitionError);
    expect(() => challenge.complete()).toThrow(IllegalStateTransitionError);
  });
});
