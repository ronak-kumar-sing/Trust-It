import type { SupabaseClient } from '@supabase/supabase-js';
import type { IUserRepository } from '../../application/interfaces/IUserRepository.js';
import { User } from '../../domain/entities/User.js';
import { DatabaseError } from '../../shared/errors/index.js';

interface UserRow {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string;
  avatar_url: string | null;
  kyc_status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  trust_score: number;
  auth_provider: string;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase implementation of IUserRepository.
 * Uses supabaseAdmin client (bypasses RLS for trusted server operations).
 */
export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly client: SupabaseClient) {}

  /**
   * Finds a user by their UUID.
   *
   * @param id - User UUID
   * @returns User entity or null if not found
   */
  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle<UserRow>();

    if (error) {
      throw new DatabaseError('findById', error.message);
    }

    if (!data) return null;
    return User.fromPersistence(data);
  }

  /**
   * Finds a user by their email address.
   *
   * @param email - User email
   * @returns User entity or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle<UserRow>();

    if (error) {
      throw new DatabaseError('findByEmail', error.message);
    }

    if (!data) return null;
    return User.fromPersistence(data);
  }

  /**
   * Finds a user by their phone number.
   *
   * @param phone - User phone number
   * @returns User entity or null if not found
   */
  async findByPhone(phone: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('phone', phone)
      .maybeSingle<UserRow>();

    if (error) {
      throw new DatabaseError('findByPhone', error.message);
    }

    if (!data) return null;
    return User.fromPersistence(data);
  }

  /**
   * Creates a new user record in Supabase.
   *
   * @param user - User domain entity to insert
   */
  async create(user: User): Promise<void> {
    const payload = user.toPersistence();
    const { error } = await this.client.from('users').insert(payload);

    if (error) {
      throw new DatabaseError('create user', error.message);
    }
  }

  /**
   * Updates an existing user record in Supabase.
   *
   * @param user - User domain entity with updated values
   */
  async update(user: User): Promise<void> {
    const payload = user.toPersistence();
    const { error } = await this.client
      .from('users')
      .update(payload)
      .eq('id', user.id);

    if (error) {
      throw new DatabaseError('update user', error.message);
    }
  }
}
