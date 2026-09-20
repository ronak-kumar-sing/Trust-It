import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateListing,
  GetListings,
  GetListingById,
  BuyListing,
  SubmitDelivery,
  ApproveDelivery,
} from '../../application/use-cases/digital-goods/index.js';
import {
  CreateListingSchema,
  SubmitDeliverySchema,
  ListingFilterQuerySchema,
  ListingIdParamSchema,
} from '../validators/digitalGoodsValidators.js';
import { recordIdempotencyResponse } from '../middleware/idempotencyMiddleware.js';
import { UnauthorizedError } from '../../shared/errors/index.js';

/**
 * Controller handling digital goods marketplace listings and trading lifecycle.
 */
export function createDigitalGoodsController(
  createListing: CreateListing,
  getListings: GetListings,
  getListingById: GetListingById,
  buyListing: BuyListing,
  submitDelivery: SubmitDelivery,
  approveDelivery: ApproveDelivery,
) {
  return {
    /**
     * POST /digital-goods/listings
     * Creates a new marketplace listing.
     */
    async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const body = CreateListingSchema.parse(request.body);
      const listing = await createListing.execute({
        sellerId: request.user.id,
        title: body.title,
        description: body.description,
        price: body.price,
        category: body.category,
        insuranceOpted: body.insuranceOpted,
      });

      const responseBody = {
        success: true,
        data: listing,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 201, responseBody);
      }

      await reply.status(201).send(responseBody);
    },

    /**
     * GET /digital-goods/listings
     * Queries active marketplace listings with filters & pagination.
     */
    async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const query = ListingFilterQuerySchema.parse(request.query);
      const listings = await getListings.execute({
        category: query.category,
        status: query.status ?? 'ACTIVE',
        sellerId: query.sellerId,
        limit: query.limit,
        offset: query.offset,
      });

      await reply.status(200).send({
        success: true,
        data: listings,
        meta: {
          limit: query.limit,
          offset: query.offset,
        },
      });
    },

    /**
     * GET /digital-goods/listings/:id
     * Retrieves a single listing by ID.
     */
    async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const params = ListingIdParamSchema.parse(request.params);
      const listing = await getListingById.execute(params.id);

      await reply.status(200).send({
        success: true,
        data: listing,
      });
    },

    /**
     * POST /digital-goods/listings/:id/buy
     * Buyer purchases listing — creates escrow and locks funds.
     */
    async buy(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const params = ListingIdParamSchema.parse(request.params);
      const result = await buyListing.execute({
        listingId: params.id,
        buyerId: request.user.id,
      });

      const responseBody = {
        success: true,
        data: result,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },

    /**
     * POST /digital-goods/listings/:id/deliver
     * Seller submits credentials/payload, advancing escrow to INSPECTION_PERIOD.
     */
    async deliver(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const params = ListingIdParamSchema.parse(request.params);
      const body = SubmitDeliverySchema.parse(request.body);

      const escrow = await submitDelivery.execute({
        listingId: params.id,
        sellerId: request.user.id,
        credentialsOrPayload: body.credentialsOrPayload,
        instructions: body.instructions,
      });

      const responseBody = {
        success: true,
        data: escrow,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },

    /**
     * POST /digital-goods/listings/:id/approve
     * Buyer approves delivery, releasing escrow funds to seller.
     */
    async approve(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const params = ListingIdParamSchema.parse(request.params);
      const escrow = await approveDelivery.execute(params.id, request.user.id);

      const responseBody = {
        success: true,
        data: escrow,
      };

      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      if (idempotencyKey) {
        recordIdempotencyResponse(idempotencyKey, 200, responseBody);
      }

      await reply.status(200).send(responseBody);
    },
  };
}
