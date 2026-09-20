import type { SupabaseClient } from '@supabase/supabase-js';
import type { IAuditLogger, AuditEvent } from '../../application/interfaces/IAuditLogger.js';
import { DatabaseError } from '../../shared/errors/index.js';

/**
 * Supabase implementation of IAuditLogger.
 * Writes append-only immutable audit events to the audit_logs table.
 */
export class SupabaseAuditLogger implements IAuditLogger {
  constructor(private readonly client: SupabaseClient) {}

  /**
   * Records an immutable audit log entry.
   *
   * @param event - Audit event details
   */
  async log(event: AuditEvent): Promise<void> {
    const { error } = await this.client.from('audit_logs').insert({
      entity: event.entity,
      entity_id: event.entityId,
      action: event.action,
      actor_id: event.actorId,
      metadata: event.metadata ?? {},
      created_at: event.timestamp ?? new Date().toISOString(),
    });

    if (error) {
      throw new DatabaseError('log audit event', error.message);
    }
  }
}
