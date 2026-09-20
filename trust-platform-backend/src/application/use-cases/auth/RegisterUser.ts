import { User } from '../../../domain/entities/User.js';
import { Wallet } from '../../../domain/entities/Wallet.js';
import type { IUserRepository } from '../../interfaces/IUserRepository.js';
import type { IWalletRepository } from '../../interfaces/IWalletRepository.js';
import type { IAuditLogger } from '../../interfaces/IAuditLogger.js';
import type { RegisterUserDTO, RegisterUserResultDTO } from '../../dtos/auth.dto.js';
import { ConflictError, ValidationError } from '../../../shared/errors/index.js';
import { nanoid } from 'nanoid';

/**
 * Use case: Register a new user in the platform.
 * Creates the user record, initializes their wallet with zero balance,
 * and emits an immutable audit event.
 */
export class RegisterUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly walletRepository: IWalletRepository,
    private readonly auditLogger: IAuditLogger,
  ) {}

  /**
   * Executes the user registration flow.
   *
   * @param dto - User registration input data
   * @returns Registered user profile and wallet details
   * @throws {ValidationError} When neither email nor phone is provided
   * @throws {ConflictError} When user, email, or phone is already registered
   */
  async execute(dto: RegisterUserDTO): Promise<RegisterUserResultDTO> {
    const email = dto.email?.trim().toLowerCase() || null;
    const phone = dto.phone?.trim() || null;

    if (!email && !phone) {
      throw new ValidationError('At least one of email or phone must be provided');
    }

    // Check if user ID already exists
    const existingById = await this.userRepository.findById(dto.id);
    if (existingById) {
      throw new ConflictError(`User with ID '${dto.id}' already exists`);
    }

    // Check unique email
    if (email) {
      const existingByEmail = await this.userRepository.findByEmail(email);
      if (existingByEmail) {
        throw new ConflictError(`Email '${email}' is already registered`);
      }
    }

    // Check unique phone
    if (phone) {
      const existingByPhone = await this.userRepository.findByPhone(phone);
      if (existingByPhone) {
        throw new ConflictError(`Phone '${phone}' is already registered`);
      }
    }

    // Create user entity
    const user = User.create(dto.id, email, phone, dto.authProvider);
    if (dto.displayName?.trim()) {
      user.updateDisplayName(dto.displayName.trim());
    }

    await this.userRepository.create(user);

    // Initialize wallet
    const walletId = nanoid();
    const wallet = Wallet.create(walletId, user.id);
    await this.walletRepository.create(wallet);

    // Emit audit log
    await this.auditLogger.log({
      entity: 'user',
      entityId: user.id,
      action: 'USER_REGISTERED',
      actorId: user.id,
      metadata: {
        authProvider: dto.authProvider,
        walletId,
        hasEmail: Boolean(email),
        hasPhone: Boolean(phone),
      },
    });

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      kycStatus: user.kycStatus,
      isKycVerified: user.isKycVerified,
      trustScore: user.trustScore,
      authProvider: user.authProvider,
      walletId: wallet.id,
      availableBalance: wallet.availableBalance,
      frozenBalance: wallet.frozenBalance,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
