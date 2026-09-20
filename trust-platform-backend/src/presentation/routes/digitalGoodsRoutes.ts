import type { FastifyInstance } from 'fastify';
import type {
  CreateListing,
  GetListings,
  GetListingById,
  BuyListing,
  SubmitDelivery,
  ApproveDelivery,
} from '../../application/use-cases/digital-goods/index.js';
import { createDigitalGoodsController } from '../controllers/digitalGoodsController.js';
import { requireIdempotencyKey } from '../middleware/idempotencyMiddleware.js';

export interface DigitalGoodsRoutesOptions {
  createListing: CreateListing;
  getListings: GetListings;
  getListingById: GetListingById;
  buyListing: BuyListing;
  submitDelivery: SubmitDelivery;
  approveDelivery: ApproveDelivery;
  authenticate: (request: any, reply: any) => Promise<void>;
}

/**
 * Fastify route plugin for digital goods marketplace.
 * Mounts:
 * - POST /api/v1/digital-goods/listings
 * - GET  /api/v1/digital-goods/listings
 * - GET  /api/v1/digital-goods/listings/:id
 * - POST /api/v1/digital-goods/listings/:id/buy
 * - POST /api/v1/digital-goods/listings/:id/deliver
 * - POST /api/v1/digital-goods/listings/:id/approve
 */
export async function digitalGoodsRoutes(
  fastify: FastifyInstance,
  options: DigitalGoodsRoutesOptions,
): Promise<void> {
  const controller = createDigitalGoodsController(
    options.createListing,
    options.getListings,
    options.getListingById,
    options.buyListing,
    options.submitDelivery,
    options.approveDelivery,
  );

  fastify.post('/listings', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.create,
  });

  fastify.get('/listings', {
    handler: controller.list,
  });

  fastify.get('/listings/:id', {
    handler: controller.getById,
  });

  fastify.post('/listings/:id/buy', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.buy,
  });

  fastify.post('/listings/:id/deliver', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.deliver,
  });

  fastify.post('/listings/:id/approve', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.approve,
  });
}
