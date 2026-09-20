import type { FastifyInstance } from 'fastify';
import type {
  GetWalletBalance,
  CreateDepositOrder,
  VerifyAndCreditDeposit,
  WithdrawFunds,
  GetTransactionHistory,
} from '../../application/use-cases/wallet/index.js';
import { createWalletController } from '../controllers/walletController.js';
import { requireIdempotencyKey } from '../middleware/idempotencyMiddleware.js';

export interface WalletRoutesOptions {
  getWalletBalance: GetWalletBalance;
  createDepositOrder: CreateDepositOrder;
  verifyAndCreditDeposit: VerifyAndCreditDeposit;
  withdrawFunds: WithdrawFunds;
  getTransactionHistory: GetTransactionHistory;
  authenticate: (request: any, reply: any) => Promise<void>;
}

/**
 * Fastify route plugin for wallet and balance operations.
 * Mounts:
 * - GET  /api/v1/wallet/balance
 * - POST /api/v1/wallet/deposit/order
 * - POST /api/v1/wallet/deposit/verify
 * - POST /api/v1/wallet/withdraw
 * - GET  /api/v1/wallet/transactions
 */
export async function walletRoutes(
  fastify: FastifyInstance,
  options: WalletRoutesOptions,
): Promise<void> {
  const controller = createWalletController(
    options.getWalletBalance,
    options.createDepositOrder,
    options.verifyAndCreditDeposit,
    options.withdrawFunds,
    options.getTransactionHistory,
  );

  fastify.get('/balance', {
    preHandler: [options.authenticate],
    handler: controller.getBalance,
  });

  fastify.post('/deposit/order', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.createDepositOrder,
  });

  fastify.post('/deposit/verify', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.verifyDeposit,
  });

  fastify.post('/withdraw', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.withdraw,
  });

  fastify.get('/transactions', {
    preHandler: [options.authenticate],
    handler: controller.getHistory,
  });
}
