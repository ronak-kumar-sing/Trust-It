import type { FastifyRequest, FastifyReply } from 'fastify';
import type { IStorageService } from '../../application/interfaces/IStorageService.js';
import { z } from 'zod';
import { UnauthorizedError } from '../../shared/errors/index.js';

const GetUploadTicketSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  purpose: z.enum(['KYC', 'DISPUTE_EVIDENCE', 'DELIVERY', 'PROFILE']),
  escrowId: z.string().optional(),
});

/**
 * Controller for managing secure file uploads and signed URLs via Firebase Storage.
 *
 * @param storageService - Cloud storage adapter instance
 */
export function createStorageController(storageService: IStorageService) {
  return {
    /**
     * POST /storage/upload-ticket
     * Generates a signed upload URL for mobile clients to upload KYC or dispute proof.
     */
    async getUploadTicket(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('User must be authenticated to obtain upload ticket');
      }

      const validated = GetUploadTicketSchema.parse(request.body);
      const timestamp = Date.now();
      const safeFilename = validated.filename.replace(/[^a-zA-Z0-9._-]/g, '_');

      let storagePath = `uploads/${request.user.id}/${timestamp}_${safeFilename}`;
      if (validated.purpose === 'KYC') {
        storagePath = `kyc/${request.user.id}/${timestamp}_${safeFilename}`;
      } else if (validated.purpose === 'DISPUTE_EVIDENCE') {
        storagePath = `disputes/${validated.escrowId ?? 'general'}/${request.user.id}_${timestamp}_${safeFilename}`;
      }

      const ticket = await storageService.getSignedUploadUrl(storagePath, validated.contentType);

      await reply.status(200).send({
        success: true,
        data: {
          ...ticket,
          storagePath,
          purpose: validated.purpose,
        },
      });
    },

    /**
     * GET /storage/download-link
     * Generates a secure, expiring signed download link for private documents.
     */
    async getDownloadLink(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('User must be authenticated to download secured documents');
      }

      const query = request.query as { filePath?: string };
      if (!query.filePath) {
        await reply.status(400).send({
          success: false,
          error: 'Query parameter filePath is required',
        });
        return;
      }

      const downloadUrl = await storageService.getSignedDownloadUrl(query.filePath);

      await reply.status(200).send({
        success: true,
        data: {
          downloadUrl,
          filePath: query.filePath,
        },
      });
    },
  };
}
