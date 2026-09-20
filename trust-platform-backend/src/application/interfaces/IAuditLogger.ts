/**
 * Represents an immutable audit log event.
 * Used to track every financial state change, verification transition,
 * and balance adjustment in the system.
 */
export interface AuditEvent {
  /** Entity type (e.g., 'escrow_transaction', 'wallet', 'trust_score') */
  entity: string;
  /** Entity UUID */
  entityId: string;
  /** Action performed (e.g., 'STATE_CHANGE:INITIATED→FUNDED_IN_ESCROW') */
  action: string;
  /** Who performed the action (userId or 'SYSTEM_TIMER') */
  actorId: string;
  /** Additional context data */
  metadata?: Record<string, unknown>;
  /** ISO timestamp (defaults to now) */
  timestamp?: string;
}

/**
 * Port interface for audit logging.
 * All financial state changes MUST be logged via this interface.
 */
export interface IAuditLogger {
  /**
   * Logs an immutable audit event.
   * Events are INSERT-only — never updated or deleted.
   *
   * @param event - The audit event to persist
   */
  log(event: AuditEvent): Promise<void>;
}
