import type { User } from '../../domain/entities/User.js';

/**
 * Port interface for User persistence operations.
 * Implemented by infrastructure layer (SupabaseUserRepository).
 */
export interface IUserRepository {
  /**
   * Finds a user by their UUID.
   *
   * @param id - User UUID
   * @returns The user entity, or null if not found
   */
  findById(id: string): Promise<User | null>;

  /**
   * Finds a user by their email address.
   *
   * @param email - User email
   * @returns The user entity, or null if not found
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Finds a user by their phone number.
   *
   * @param phone - User phone number
   * @returns The user entity, or null if not found
   */
  findByPhone(phone: string): Promise<User | null>;

  /**
   * Creates a new user in the database.
   *
   * @param user - User entity to persist
   */
  create(user: User): Promise<void>;

  /**
   * Updates an existing user in the database.
   *
   * @param user - User entity with updated fields
   */
  update(user: User): Promise<void>;
}
