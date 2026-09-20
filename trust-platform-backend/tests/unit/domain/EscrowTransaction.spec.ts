import { describe, it, expect } from 'vitest';
import { EscrowTransaction } from '../../../src/domain/entities/EscrowTransaction.js';

describe('EscrowTransaction', () => {
  function createTestEscrow(overrides?: { status?: string }): EscrowTransaction {
    const escrow = EscrowTransaction.create({
      id: 'e1',
      type: 'DIGITAL_GOODS',
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      amount: 100000,
      platformFee: 5000,
    });

    // If we need a specific starting state, chain transitions
    if (overrides?.status) {
      const transitions: Record<string, string[]> = {
        FUNDED_IN_ESCROW: ['FUNDED_IN_ESCROW'],
        DELIVERED: ['FUNDED_IN_ESCROW', 'DELIVERED'],
        INSPECTION_PERIOD: ['FUNDED_IN_ESCROW', 'DELIVERED', 'INSPECTION_PERIOD'],
        DISPUTED: ['FUNDED_IN_ESCROW', 'DELIVERED', 'INSPECTION_PERIOD', 'DISPUTED'],
        RELEASED: ['FUNDED_IN_ESCROW', 'DELIVERED', 'INSPECTION_PERIOD', 'RELEASED'],
        REFUNDED: ['FUNDED_IN_ESCROW', 'DELIVERED', 'INSPECTION_PERIOD', 'DISPUTED', 'REFUNDED'],
        CANCELLED: ['CANCELLED'],
      };
      const path = transitions[overrides.status];
      if (path) {
        for (const state of path) {
          escrow.transition(state as Parameters<typeof escrow.transition>[0], 'test');
        }
      }
    }

    return escrow;
  }

  describe('creation', () => {
    it('should create in INITIATED state', () => {
      const escrow = createTestEscrow();
      expect(escrow.status).toBe('INITIATED');
      expect(escrow.version).toBe(1);
      expect(escrow.isTerminal).toBe(false);
    });
  });

  describe('valid transitions', () => {
    const VALID_TRANSITIONS: [string, string][] = [
      ['INITIATED', 'FUNDED_IN_ESCROW'],
      ['INITIATED', 'CANCELLED'],
      ['FUNDED_IN_ESCROW', 'DELIVERED'],
      ['FUNDED_IN_ESCROW', 'CANCELLED'],
      ['FUNDED_IN_ESCROW', 'REFUNDED'],
      ['DELIVERED', 'INSPECTION_PERIOD'],
      ['INSPECTION_PERIOD', 'RELEASED'],
      ['INSPECTION_PERIOD', 'DISPUTED'],
      ['INSPECTION_PERIOD', 'REFUNDED'],
      ['DISPUTED', 'RELEASED'],
      ['DISPUTED', 'REFUNDED'],
    ];

    it.each(VALID_TRANSITIONS)(
      'should allow transition from %s to %s',
      (from, to) => {
        const escrow = createTestEscrow({ status: from });
        const event = escrow.transition(
          to as Parameters<typeof escrow.transition>[0],
          'test-user',
        );
        expect(escrow.status).toBe(to);
        expect(event.fromState).toBe(from);
        expect(event.toState).toBe(to);
        expect(event.actorId).toBe('test-user');
      },
    );
  });

  describe('invalid transitions', () => {
    const INVALID_TRANSITIONS: [string, string][] = [
      ['INITIATED', 'RELEASED'],
      ['INITIATED', 'DISPUTED'],
      ['INITIATED', 'DELIVERED'],
      ['INITIATED', 'INSPECTION_PERIOD'],
      ['FUNDED_IN_ESCROW', 'RELEASED'],
      ['FUNDED_IN_ESCROW', 'DISPUTED'],
      ['DELIVERED', 'RELEASED'],
      ['DELIVERED', 'DISPUTED'],
      ['RELEASED', 'FUNDED_IN_ESCROW'],
      ['RELEASED', 'REFUNDED'],
      ['REFUNDED', 'RELEASED'],
      ['CANCELLED', 'INITIATED'],
      ['CANCELLED', 'FUNDED_IN_ESCROW'],
    ];

    it.each(INVALID_TRANSITIONS)(
      'should reject transition from %s to %s',
      (from, to) => {
        const escrow = createTestEscrow({ status: from });
        expect(() =>
          escrow.transition(
            to as Parameters<typeof escrow.transition>[0],
            'test-user',
          ),
        ).toThrow('Cannot transition');
      },
    );
  });

  describe('terminal states', () => {
    it('should be terminal when RELEASED', () => {
      const escrow = createTestEscrow({ status: 'RELEASED' });
      expect(escrow.isTerminal).toBe(true);
    });

    it('should be terminal when REFUNDED', () => {
      const escrow = createTestEscrow({ status: 'REFUNDED' });
      expect(escrow.isTerminal).toBe(true);
    });

    it('should be terminal when CANCELLED', () => {
      const escrow = createTestEscrow({ status: 'CANCELLED' });
      expect(escrow.isTerminal).toBe(true);
    });

    it('should not be terminal when INSPECTION_PERIOD', () => {
      const escrow = createTestEscrow({ status: 'INSPECTION_PERIOD' });
      expect(escrow.isTerminal).toBe(false);
    });
  });

  describe('version tracking', () => {
    it('should increment version on each transition', () => {
      const escrow = createTestEscrow();
      expect(escrow.version).toBe(1);
      escrow.transition('FUNDED_IN_ESCROW', 'user');
      expect(escrow.version).toBe(2);
      escrow.transition('DELIVERED', 'user');
      expect(escrow.version).toBe(3);
    });
  });

  describe('inspection', () => {
    it('should be disputable during INSPECTION_PERIOD', () => {
      const escrow = createTestEscrow({ status: 'INSPECTION_PERIOD' });
      expect(escrow.isDisputable).toBe(true);
    });

    it('should not be disputable during DELIVERED', () => {
      const escrow = createTestEscrow({ status: 'DELIVERED' });
      expect(escrow.isDisputable).toBe(false);
    });

    it('should detect expired inspection window', () => {
      const escrow = createTestEscrow({ status: 'INSPECTION_PERIOD' });
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);
      escrow.setInspectionDeadline(pastDate);
      expect(escrow.isInspectionExpired()).toBe(true);
    });

    it('should detect active inspection window', () => {
      const escrow = createTestEscrow({ status: 'INSPECTION_PERIOD' });
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 48);
      escrow.setInspectionDeadline(futureDate);
      expect(escrow.isInspectionExpired()).toBe(false);
    });
  });

  describe('state change events', () => {
    it('should emit event with correct from/to states', () => {
      const escrow = createTestEscrow();
      const event = escrow.transition('FUNDED_IN_ESCROW', 'buyer-1');
      expect(event.fromState).toBe('INITIATED');
      expect(event.toState).toBe('FUNDED_IN_ESCROW');
      expect(event.actorId).toBe('buyer-1');
      expect(event.entityId).toBe('e1');
      expect(event.timestamp).toBeDefined();
    });
  });

  describe('persistence', () => {
    it('should serialize to persistence format', () => {
      const escrow = createTestEscrow();
      escrow.transition('FUNDED_IN_ESCROW', 'buyer-1');
      const data = escrow.toPersistence();
      expect(data.id).toBe('e1');
      expect(data.status).toBe('FUNDED_IN_ESCROW');
      expect(data.buyer_id).toBe('buyer-1');
      expect(data.version).toBe(2);
    });
  });
});
