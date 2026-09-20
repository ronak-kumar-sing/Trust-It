import type { FastifyInstance } from 'fastify';
import type {
  CreateProject,
  GetProjectById,
  CreateMilestone,
  FundMilestone,
  SubmitMilestoneDeliverable,
  RequestMilestoneChanges,
  ApproveMilestone,
} from '../../application/use-cases/freelance/index.js';
import { createFreelanceController } from '../controllers/freelanceController.js';
import { requireIdempotencyKey } from '../middleware/idempotencyMiddleware.js';

export interface FreelanceRoutesOptions {
  createProject: CreateProject;
  getProjectById: GetProjectById;
  createMilestone: CreateMilestone;
  fundMilestone: FundMilestone;
  submitMilestoneDeliverable: SubmitMilestoneDeliverable;
  requestMilestoneChanges: RequestMilestoneChanges;
  approveMilestone: ApproveMilestone;
  authenticate: (request: any, reply: any) => Promise<void>;
}

/**
 * Fastify route plugin for freelance contracts and milestones.
 * Mounts:
 * - POST /api/v1/freelance/projects
 * - GET  /api/v1/freelance/projects/:id
 * - POST /api/v1/freelance/projects/:id/milestones
 * - POST /api/v1/freelance/milestones/:id/fund
 * - POST /api/v1/freelance/milestones/:id/submit
 * - POST /api/v1/freelance/milestones/:id/request-changes
 * - POST /api/v1/freelance/milestones/:id/approve
 */
export async function freelanceRoutes(
  fastify: FastifyInstance,
  options: FreelanceRoutesOptions,
): Promise<void> {
  const controller = createFreelanceController(
    options.createProject,
    options.getProjectById,
    options.createMilestone,
    options.fundMilestone,
    options.submitMilestoneDeliverable,
    options.requestMilestoneChanges,
    options.approveMilestone,
  );

  fastify.post('/projects', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.createProject,
  });

  fastify.get('/projects/:id', {
    handler: controller.getProject,
  });

  fastify.post('/projects/:id/milestones', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.createMilestone,
  });

  fastify.post('/milestones/:id/fund', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.fundMilestone,
  });

  fastify.post('/milestones/:id/submit', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.submitMilestone,
  });

  fastify.post('/milestones/:id/request-changes', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.requestChanges,
  });

  fastify.post('/milestones/:id/approve', {
    preHandler: [
      options.authenticate,
      async (request, reply) => {
        if (request.headers['idempotency-key']) {
          await requireIdempotencyKey(request, reply);
        }
      },
    ],
    handler: controller.approveMilestone,
  });
}
