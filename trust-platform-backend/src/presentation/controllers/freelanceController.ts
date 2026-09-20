import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateProject,
  GetProjectById,
  CreateMilestone,
  FundMilestone,
  SubmitMilestoneDeliverable,
  RequestMilestoneChanges,
  ApproveMilestone,
} from '../../application/use-cases/freelance/index.js';
import {
  CreateProjectSchema,
  CreateMilestoneSchema,
  SubmitMilestoneSchema,
  RequestChangesSchema,
  ProjectIdParamSchema,
  MilestoneIdParamSchema,
} from '../validators/freelanceValidators.js';
import { recordIdempotencyResponse } from '../middleware/idempotencyMiddleware.js';
import { UnauthorizedError } from '../../shared/errors/index.js';

/**
 * Controller handling freelance projects and milestone-based escrow lifecycle.
 */
export function createFreelanceController(
  createProject: CreateProject,
  getProjectById: GetProjectById,
  createMilestone: CreateMilestone,
  fundMilestone: FundMilestone,
  submitMilestoneDeliverable: SubmitMilestoneDeliverable,
  requestMilestoneChanges: RequestMilestoneChanges,
  approveMilestone: ApproveMilestone,
) {
  return {
    /**
     * POST /freelance/projects
     * Creates a new freelance project contract.
     */
    async createProject(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const body = CreateProjectSchema.parse(request.body);
      const project = await createProject.execute({
        clientId: request.user.id,
        freelancerId: body.freelancerId,
        title: body.title,
        description: body.description,
        totalBudget: body.totalBudget,
      });

      const responseBody = {
        success: true,
        data: project,
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
     * GET /freelance/projects/:id
     * Retrieves a project with all of its milestones.
     */
    async getProject(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void> {
      const params = ProjectIdParamSchema.parse(request.params);
      const project = await getProjectById.execute(params.id);

      await reply.status(200).send({
        success: true,
        data: project,
      });
    },

    /**
     * POST /freelance/projects/:id/milestones
     * Adds a new milestone to a project.
     */
    async createMilestone(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const params = ProjectIdParamSchema.parse(request.params);
      const body = CreateMilestoneSchema.parse(request.body);

      const milestone = await createMilestone.execute({
        projectId: params.id,
        clientId: request.user.id,
        title: body.title,
        description: body.description,
        amount: body.amount,
        sowText: body.sowText,
      });

      const responseBody = {
        success: true,
        data: milestone,
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
     * POST /freelance/milestones/:id/fund
     * Client funds the milestone into escrow.
     */
    async fundMilestone(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const params = MilestoneIdParamSchema.parse(request.params);
      const result = await fundMilestone.execute({
        milestoneId: params.id,
        clientId: request.user.id,
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
     * POST /freelance/milestones/:id/submit
     * Freelancer submits deliverable URL, triggering AI quality gate and 14-day review.
     */
    async submitMilestone(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const params = MilestoneIdParamSchema.parse(request.params);
      const body = SubmitMilestoneSchema.parse(request.body);

      const milestone = await submitMilestoneDeliverable.execute({
        milestoneId: params.id,
        freelancerId: request.user.id,
        submissionUrl: body.submissionUrl,
      });

      const responseBody = {
        success: true,
        data: milestone,
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
     * POST /freelance/milestones/:id/request-changes
     * Client requests revisions on milestone deliverable (max 3 rounds).
     */
    async requestChanges(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const params = MilestoneIdParamSchema.parse(request.params);
      const body = RequestChangesSchema.parse(request.body);

      const milestone = await requestMilestoneChanges.execute({
        milestoneId: params.id,
        clientId: request.user.id,
        feedback: body.feedback,
      });

      const responseBody = {
        success: true,
        data: milestone,
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
     * POST /freelance/milestones/:id/approve
     * Client approves deliverable; releases escrow funds to freelancer.
     */
    async approveMilestone(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void> {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const params = MilestoneIdParamSchema.parse(request.params);
      const milestone = await approveMilestone.execute(
        params.id,
        request.user.id,
      );

      const responseBody = {
        success: true,
        data: milestone,
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
