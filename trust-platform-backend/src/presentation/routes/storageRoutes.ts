import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { IStorageService } from '../../application/interfaces/IStorageService.js';
import { createStorageController } from '../controllers/storageController.js';

export interface StorageRoutesOptions {
  storageService: IStorageService;
  authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

/**
 * Fastify route plugin for secure Firebase Storage operations.
 * Mounts:
 * - POST /api/v1/storage/upload-ticket
 * - GET  /api/v1/storage/download-link
 */
export async function storageRoutes(
  fastify: FastifyInstance,
  options: StorageRoutesOptions,
): Promise<void> {
  const controller = createStorageController(options.storageService);

  fastify.post('/upload-ticket', {
    preHandler: [options.authenticate],
    handler: controller.getUploadTicket,
  });

  fastify.get('/download-link', {
    preHandler: [options.authenticate],
    handler: controller.getDownloadLink,
  });
}
