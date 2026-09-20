import { describe, it, expect } from 'vitest';
import { Notification } from '../../../src/domain/entities/Notification.js';
import { NotificationType } from '../../../src/domain/enums/NotificationType.js';
import { ValidationError } from '../../../src/shared/errors/index.js';

describe('Notification Domain Entity', () => {
  it('creates an unread notification with defaults', () => {
    const notification = Notification.create({
      userId: 'usr_test_1',
      type: NotificationType.ESCROW_FUNDED,
      title: 'Escrow Funded',
      body: 'Your buyer has deposited funds into escrow.',
      data: { escrowId: 'escrow_123', amount: 5000 },
    });

    expect(notification.id).toBeDefined();
    expect(notification.userId).toBe('usr_test_1');
    expect(notification.type).toBe('ESCROW_FUNDED');
    expect(notification.title).toBe('Escrow Funded');
    expect(notification.body).toBe('Your buyer has deposited funds into escrow.');
    expect(notification.data).toEqual({ escrowId: 'escrow_123', amount: 5000 });
    expect(notification.isRead).toBe(false);
    expect(notification.readAt).toBeNull();
    expect(notification.createdAt).toBeInstanceOf(Date);
  });

  it('throws ValidationError when userId is empty', () => {
    expect(() =>
      Notification.create({
        userId: '',
        type: NotificationType.ESCROW_FUNDED,
        title: 'Title',
        body: 'Body',
      }),
    ).toThrow(ValidationError);
  });

  it('throws ValidationError when title is empty', () => {
    expect(() =>
      Notification.create({
        userId: 'usr_test_1',
        type: NotificationType.ESCROW_FUNDED,
        title: '   ',
        body: 'Body',
      }),
    ).toThrow(ValidationError);
  });

  it('marks notification as read', () => {
    const notification = Notification.create({
      userId: 'usr_test_1',
      type: NotificationType.DELIVERY_SUBMITTED,
      title: 'Deliverable Ready',
      body: 'Review your order credentials.',
    });

    expect(notification.isRead).toBe(false);
    notification.markAsRead();
    expect(notification.isRead).toBe(true);
    expect(notification.readAt).toBeInstanceOf(Date);

    // Calling again does not change readAt
    const firstRead = notification.readAt;
    notification.markAsRead();
    expect(notification.readAt).toBe(firstRead);
  });

  it('reconstitutes from persistence row correctly', () => {
    const readDate = new Date('2026-03-01T12:00:00.000Z');
    const createDate = new Date('2026-03-01T11:00:00.000Z');

    const notification = Notification.fromPersistence({
      id: 'notif_100',
      user_id: 'usr_test_2',
      type: 'DISPUTE_FILED',
      title: 'Dispute Alert',
      body: 'A dispute has been initiated.',
      data: { disputeId: 'disp_1' },
      read_at: readDate.toISOString(),
      created_at: createDate.toISOString(),
    });

    expect(notification.id).toBe('notif_100');
    expect(notification.userId).toBe('usr_test_2');
    expect(notification.type).toBe('DISPUTE_FILED');
    expect(notification.isRead).toBe(true);
    expect(notification.readAt?.toISOString()).toBe(readDate.toISOString());
    expect(notification.createdAt.toISOString()).toBe(createDate.toISOString());
  });
});
