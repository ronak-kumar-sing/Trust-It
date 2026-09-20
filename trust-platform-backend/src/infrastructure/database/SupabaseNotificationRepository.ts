import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  INotificationRepository,
  NotificationQueryOptions,
} from '../../application/interfaces/INotificationRepository.js';
import { Notification } from '../../domain/entities/Notification.js';
import { DatabaseError } from '../../shared/errors/index.js';

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

/**
 * Supabase implementation of INotificationRepository.
 */
export class SupabaseNotificationRepository implements INotificationRepository {
  constructor(private readonly client: SupabaseClient) {}

  /**
   * Saves a new notification record.
   */
  async create(notification: Notification): Promise<void> {
    const { error } = await this.client.from('notifications').insert({
      id: notification.id,
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      read_at: notification.readAt?.toISOString() ?? null,
      created_at: notification.createdAt.toISOString(),
    });

    if (error) {
      throw new DatabaseError('create notification', error.message);
    }
  }

  /**
   * Finds a notification by ID.
   */
  async findById(id: string): Promise<Notification | null> {
    const { data, error } = await this.client
      .from('notifications')
      .select('*')
      .eq('id', id)
      .maybeSingle<NotificationRow>();

    if (error) {
      throw new DatabaseError('findById notification', error.message);
    }

    if (!data) return null;
    return this.toDomain(data);
  }

  /**
   * Finds paginated notifications for a user, sorted descending by creation time.
   */
  async findByUserId(
    userId: string,
    options?: NotificationQueryOptions,
  ): Promise<Notification[]> {
    let query = this.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.unreadOnly) {
      query = query.is('read_at', null);
    }

    if (options?.limit) {
      const from = options.offset ?? 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;
    if (error) {
      throw new DatabaseError('findByUserId notifications', error.message);
    }

    return (data as NotificationRow[]).map((row) => this.toDomain(row));
  }

  /**
   * Marks a single notification as read.
   */
  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const now = new Date().toISOString();

    const { data, error } = await this.client
      .from('notifications')
      .update({ read_at: now })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .maybeSingle<NotificationRow>();

    if (error) {
      throw new DatabaseError('markAsRead notification', error.message);
    }

    if (!data) return null;
    return this.toDomain(data);
  }

  /**
   * Marks all unread notifications for a user as read.
   */
  async markAllAsRead(userId: string): Promise<number> {
    const now = new Date().toISOString();

    const { data, error } = await this.client
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', userId)
      .is('read_at', null)
      .select('id');

    if (error) {
      throw new DatabaseError('markAllAsRead notifications', error.message);
    }

    return data?.length ?? 0;
  }

  /**
   * Returns count of unread notifications for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      throw new DatabaseError('getUnreadCount notifications', error.message);
    }

    return count ?? 0;
  }

  private toDomain(row: NotificationRow): Notification {
    return Notification.fromPersistence(row);
  }
}
