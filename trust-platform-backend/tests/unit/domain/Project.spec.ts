import { describe, it, expect } from 'vitest';
import { Project } from '../../../src/domain/entities/Project.js';
import {
  ValidationError,
  InvalidAmountError,
  IllegalStateTransitionError,
} from '../../../src/shared/errors/index.js';

describe('Project Entity', () => {
  const validClientId = '11111111-1111-4111-8111-111111111111';
  const validFreelancerId = '22222222-2222-4222-8222-222222222222';

  it('creates a project with valid inputs', () => {
    const project = Project.create({
      clientId: validClientId,
      freelancerId: validFreelancerId,
      title: 'Full Stack App Development',
      description: 'Build backend and frontend',
      totalBudget: 1500000,
    });

    expect(project.id).toBeDefined();
    expect(project.clientId).toBe(validClientId);
    expect(project.freelancerId).toBe(validFreelancerId);
    expect(project.title).toBe('Full Stack App Development');
    expect(project.totalBudget).toBe(1500000);
    expect(project.status).toBe('ACTIVE');
  });

  it('throws ValidationError if client and freelancer are the same user', () => {
    expect(() =>
      Project.create({
        clientId: validClientId,
        freelancerId: validClientId,
        title: 'Valid Project Title',
        totalBudget: 100000,
      }),
    ).toThrow(ValidationError);
  });

  it('throws ValidationError if title is too short or too long', () => {
    expect(() =>
      Project.create({
        clientId: validClientId,
        freelancerId: validFreelancerId,
        title: 'ab',
        totalBudget: 100000,
      }),
    ).toThrow(ValidationError);

    expect(() =>
      Project.create({
        clientId: validClientId,
        freelancerId: validFreelancerId,
        title: 'a'.repeat(201),
        totalBudget: 100000,
      }),
    ).toThrow(ValidationError);
  });

  it('throws InvalidAmountError if totalBudget is not a positive integer', () => {
    expect(() =>
      Project.create({
        clientId: validClientId,
        freelancerId: validFreelancerId,
        title: 'Valid Title',
        totalBudget: -500,
      }),
    ).toThrow(InvalidAmountError);

    expect(() =>
      Project.create({
        clientId: validClientId,
        freelancerId: validFreelancerId,
        title: 'Valid Title',
        totalBudget: 100.5,
      }),
    ).toThrow(InvalidAmountError);
  });

  it('transitions through status lifecycle: ACTIVE -> COMPLETED', () => {
    const project = Project.create({
      clientId: validClientId,
      freelancerId: validFreelancerId,
      title: 'Mobile App Project',
      totalBudget: 500000,
    });

    project.complete();
    expect(project.status).toBe('COMPLETED');

    expect(() => project.cancel()).toThrow(IllegalStateTransitionError);
  });

  it('cancels an active project', () => {
    const project = Project.create({
      clientId: validClientId,
      freelancerId: validFreelancerId,
      title: 'Cancelled Project',
      totalBudget: 500000,
    });

    project.cancel();
    expect(project.status).toBe('CANCELLED');
  });
});
