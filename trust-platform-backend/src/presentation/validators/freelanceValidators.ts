import { z } from 'zod';

export const CreateProjectSchema = z.object({
  freelancerId: z.string().uuid({ message: 'Freelancer ID must be a valid UUID' }),
  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters' })
    .max(200, { message: 'Title cannot exceed 200 characters' }),
  description: z.string().max(2000).optional(),
  totalBudget: z
    .number()
    .int({ message: 'Total budget must be an integer in paise' })
    .positive({ message: 'Total budget must be positive' }),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const CreateMilestoneSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters' })
    .max(200, { message: 'Title cannot exceed 200 characters' }),
  description: z.string().max(2000).optional(),
  amount: z
    .number()
    .int({ message: 'Amount must be an integer in paise' })
    .positive({ message: 'Amount must be positive' }),
  sowText: z.string().max(5000).optional(),
});

export type CreateMilestoneInput = z.infer<typeof CreateMilestoneSchema>;

export const SubmitMilestoneSchema = z.object({
  submissionUrl: z
    .string()
    .url({ message: 'Submission URL must be a valid URL' }),
});

export type SubmitMilestoneInput = z.infer<typeof SubmitMilestoneSchema>;

export const RequestChangesSchema = z.object({
  feedback: z
    .string()
    .min(5, { message: 'Feedback must be at least 5 characters' })
    .max(2000, { message: 'Feedback cannot exceed 2000 characters' }),
});

export type RequestChangesInput = z.infer<typeof RequestChangesSchema>;

export const ProjectIdParamSchema = z.object({
  id: z.string().min(1, { message: 'Project ID is required' }),
});

export type ProjectIdParam = z.infer<typeof ProjectIdParamSchema>;

export const MilestoneIdParamSchema = z.object({
  id: z.string().min(1, { message: 'Milestone ID is required' }),
});

export type MilestoneIdParam = z.infer<typeof MilestoneIdParamSchema>;
