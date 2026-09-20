import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  GetWalletBalance,
  CreateDepositOrder,
  VerifyAndCreditDeposit,
  WithdrawFunds,
  GetTransactionHistory,
} from '../../application/use-cases/wallet/index.js';
import {
  CreateDepositOrderSchema,
  VerifyDepositSchema,
  WithdrawFundsSchema,
  HistoryQuerySchema,
} from '../validators/walletValidators.js';
import { recordIdempotencyResponse } from '../middleware/idempotencyMiddleware.js';
import { UnauthorizedError } from '../../shared/errors/index.js';

/**
 * Controller handling user wallet operations: balances, deposits, withdrawals, and ledger history.
 */
export function createWalletController(
  getWalletBalance: GetWalletBalance,
  createDepositOrder: CreateDepositOrder,
  verifyAndCreditDeposit: VerifyAndCreditDeposit,
  withdrawFunds: WithdrawFunds,
  getTransactionHistory: GetTransactionHistory,
) {
  return {
    /**
     * GET /wallet/balance
     * Retrieves current user's available and frozen balances.
     */
    async getBalance(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const balance = await getWalletBalance.execute(request.user.id);

      await reply.status(200).send({
        success: true,
        data: balance,
      });
    },

    /**
     * POST /wallet/deposit/order
     * Generates a payment order with external gateway.
     */
    async createDepositOrder(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const body = CreateDepositOrderSchema.parse(request.body);
      const order = await createDepositOrder.execute({
        userId: request.user.id,
        amount: body.amount,
      });

      const responseBody = {
        success: true,
        data: order,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 201, responseBody);
      }

      await reply.status(201).send(responseBody);
    },

    /**
     * POST /wallet/deposit/verify
     * Verifies payment signature and credits funds to wallet.
     */
    async verifyDeposit(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const body = VerifyDepositSchema.parse(request.body);
      const balance = await verifyAndCreditDeposit.execute({
        userId: request.user.id,
        orderId: body.orderId,
        paymentId: body.paymentId,
        signature: body.signature,
        amount: body.amount,
      });

      const responseBody = {
        success: true,
        data: balance,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },

    /**
     * POST /wallet/withdraw
     * Debits available balance for withdrawal.
     */
    async withdraw(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const body = WithdrawFundsSchema.parse(request.body);
      const balance = await withdrawFunds.execute({
        userId: request.user.id,
        amount: body.amount,
        destinationAccount: body.destinationAccount,
      });

      const responseBody = {
        success: true,
        data: balance,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },

    /**
     * GET /wallet/transactions
     * Retrieves transaction ledger history.
     */
    async getHistory(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const query = HistoryQuerySchema.parse(request.query);
      const history = await getTransactionHistory.execute(
        request.user.id,
        query.limit,
        query.offset,
      );

      await reply.status(200).send({
        success: true,
        data: history,
        meta: {
          limit: query.limit,
          offset: query.offset,
        },
      });
    },
  };
}
