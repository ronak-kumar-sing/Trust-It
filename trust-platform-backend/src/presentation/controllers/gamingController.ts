import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateChallenge,
  AcceptChallenge,
  GetChallengeById,
  GetOpenChallenges,
  ReportMatchResult,
  ClaimTimeoutWin,
  ResolveGamingDispute,
  CancelChallenge,
} from '../../application/use-cases/gaming/index.js';
import {
  CreateChallengeSchema,
  ReportMatchResultSchema,
  ResolveGamingDisputeSchema,
  ChallengeFilterQuerySchema,
  ChallengeIdParamSchema,
} from '../validators/gamingValidators.js';
import { recordIdempotencyResponse } from '../middleware/idempotencyMiddleware.js';
import { UnauthorizedError } from '../../shared/errors/index.js';

/**
 * Controller handling competitive 1v1 gaming wager challenges and match settlement.
 */
export function createGamingController(
  createChallenge: CreateChallenge,
  acceptChallenge: AcceptChallenge,
  getChallengeById: GetChallengeById,
  getOpenChallenges: GetOpenChallenges,
  reportMatchResult: ReportMatchResult,
  claimTimeoutWin: ClaimTimeoutWin,
  resolveGamingDispute: ResolveGamingDispute,
  cancelChallenge: CancelChallenge,
) {
  return {
    /**
     * POST /gaming/challenges
     * Creates a new wager challenge.
     */
    async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const body = CreateChallengeSchema.parse(request.body);
      const challenge = await createChallenge.execute({
        challengerId: request.user.id,
        opponentId: body.opponentId,
        gameTitle: body.gameTitle,
        stakeAmount: body.stakeAmount,
        rules: body.rules,
      });

      const responseBody = {
        success: true,
        data: challenge,
      };

      const idempotencyKey = request.headers['idempotency-key'] as
        | string
        | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 201, responseBody);
      }

      await reply.status(201).send(responseBody);
    },

    /**
     * GET /gaming/challenges
     * Lists open challenges in the lobby.
     */
    async listOpen(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const query = ChallengeFilterQuerySchema.parse(request.query);
      const challenges = await getOpenChallenges.execute(query);

      await reply.status(200).send({
        success: true,
        data: challenges,
        meta: {
          limit: query.limit,
          offset: query.offset,
        },
      });
    },

    /**
     * GET /gaming/challenges/:id
     * Retrieves challenge details with all submitted match reports.
     */
    async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const params = ChallengeIdParamSchema.parse(request.params);
      const challenge = await getChallengeById.execute(params.id);

      await reply.status(200).send({
        success: true,
        data: challenge,
      });
    },

    /**
     * POST /gaming/challenges/:id/accept
     * Opponent accepts challenge and locks matching stake.
     */
    async accept(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const params = ChallengeIdParamSchema.parse(request.params);
      const result = await acceptChallenge.execute({
        challengeId: params.id,
        opponentId: request.user.id,
      });

      const responseBody = {
        success: true,
        data: result,
      };

      const idempotencyKey = request.headers['idempotency-key'] as
        | string
        | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },

    /**
     * POST /gaming/challenges/:id/report
     * Participant reports match outcome and submits proof.
     */
    async reportResult(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const params = ChallengeIdParamSchema.parse(request.params);
      const body = ReportMatchResultSchema.parse(request.body);

      const result = await reportMatchResult.execute({
        challengeId: params.id,
        reporterId: request.user.id,
        claimedWinnerId: body.claimedWinnerId,
        evidenceUrl: body.evidenceUrl,
      });

      const responseBody = {
        success: true,
        data: result,
      };

      const idempotencyKey = request.headers['idempotency-key'] as
        | string
        | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },

    /**
     * POST /gaming/challenges/:id/claim-timeout
     * Reporter claims win after 30-minute opponent silence.
     */
    async claimTimeout(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const params = ChallengeIdParamSchema.parse(request.params);
      const result = await claimTimeoutWin.execute({
        challengeId: params.id,
        reporterId: request.user.id,
      });

      const responseBody = {
        success: true,
        data: result,
      };

      const idempotencyKey = request.headers['idempotency-key'] as
        | string
        | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },

    /**
     * POST /gaming/challenges/:id/resolve
     * Resolves dispute and slashes fraudulent party stake if evidence was falsified.
     */
    async resolveDispute(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const params = ChallengeIdParamSchema.parse(request.params);
      const body = ResolveGamingDisputeSchema.parse(request.body);

      const result = await resolveGamingDispute.execute({
        challengeId: params.id,
        adminId: request.user.id,
        resolvedWinnerId: body.resolvedWinnerId,
        slashFraudulentStake: body.slashFraudulentStake,
        fraudulentPartyId: body.fraudulentPartyId,
        reason: body.reason,
      });

      const responseBody = {
        success: true,
        data: result,
      };

      const idempotencyKey = request.headers['idempotency-key'] as
        | string
        | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },

    /**
     * POST /gaming/challenges/:id/cancel
     * Cancels challenge and fully refunds stakes to participants.
     */
    async cancel(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const params = ChallengeIdParamSchema.parse(request.params);
      const result = await cancelChallenge.execute({
        challengeId: params.id,
        userId: request.user.id,
      });

      const responseBody = {
        success: true,
        data: result,
      };

      const idempotencyKey = request.headers['idempotency-key'] as
        | string
        | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },
  };
}
