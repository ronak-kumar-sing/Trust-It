import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUser } from '../../../../src/application/use-cases/auth/RegisterUser.js';
import type { IUserRepository } from '../../../../src/application/interfaces/IUserRepository.js';
import type { IWalletRepository } from '../../../../src/application/interfaces/IWalletRepository.js';
import type { IAuditLogger } from '../../../../src/application/interfaces/IAuditLogger.js';
import { ConflictError, ValidationError } from '../../../../src/shared/errors/index.js';
import { User } from '../../../../src/domain/entities/User.js';

describe('RegisterUser Use Case', () => {
  let userRepo: IUserRepository;
  let walletRepo: IWalletRepository;
  let auditLogger: IAuditLogger;
  let useCase: RegisterUser;

  const validUserId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    userRepo = {
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn().mockResolvedValue(null),
      findByPhone: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
    };

    walletRepo = {
      findById: vi.fn().mockResolvedValue(null),
      findByUserId: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    };

    auditLogger = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new RegisterUser(userRepo, walletRepo, auditLogger);
  });

  it('registers a new user successfully with email and wallet initialization', async () => {
    const result = await useCase.execute({
      id: validUserId,
      email: 'alex@example.com',
      displayName: 'Alex Rivers',
      authProvider: 'email',
    });

    expect(result.id).toBe(validUserId);
    expect(result.email).toBe('alex@example.com');
    expect(result.phone).toBeNull();
    expect(result.displayName).toBe('Alex Rivers');
    expect(result.kycStatus).toBe('UNVERIFIED');
    expect(result.trustScore).toBe(50);
    expect(result.availableBalance).toBe(0);
    expect(result.frozenBalance).toBe(0);

    expect(userRepo.create).toHaveBeenCalledTimes(1);
    expect(walletRepo.create).toHaveBeenCalledTimes(1);
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'user',
        entityId: validUserId,
        action: 'USER_REGISTERED',
      }),
    );
  });

  it('registers a user with phone number successfully', async () => {
    const result = await useCase.execute({
      id: validUserId,
      phone: '+919876543210',
      authProvider: 'phone',
    });

    expect(result.phone).toBe('+919876543210');
    expect(result.email).toBeNull();
    expect(userRepo.create).toHaveBeenCalledTimes(1);
  });

  it('throws ValidationError if neither email nor phone is provided', async () => {
    await expect(
      useCase.execute({
        id: validUserId,
        authProvider: 'phone',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('throws ConflictError if user ID already exists', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(
      User.create(validUserId, 'existing@example.com', null, 'email'),
    );

    await expect(
      useCase.execute({
        id: validUserId,
        email: 'alex@example.com',
        authProvider: 'email',
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('throws ConflictError if email is already taken', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(
      User.create('other-id', 'alex@example.com', null, 'email'),
    );

    await expect(
      useCase.execute({
        id: validUserId,
        email: 'alex@example.com',
        authProvider: 'email',
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('throws ConflictError if phone is already taken', async () => {
    vi.mocked(userRepo.findByPhone).mockResolvedValue(
      User.create('other-id', null, '+919876543210', 'phone'),
    );

    await expect(
      useCase.execute({
        id: validUserId,
        phone: '+919876543210',
        authProvider: 'phone',
      }),
    ).rejects.toThrow(ConflictError);
  });
});
