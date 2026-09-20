import { describe, it, expect } from 'vitest';
import { escrowService } from '../src/services/escrowService';
import { generateIdempotencyKey } from '../src/api/client';
import { formatINR, formatDuration, truncateHash } from '../src/utils/formatters';

describe('Part 3.4 — Escrow State Machine & Integrity', () => {
  it('should generate unique idempotency keys with custom prefixes', () => {
    const key1 = generateIdempotencyKey('fund');
    const key2 = generateIdempotencyKey('fund');
    expect(key1).toMatch(/^fund_/);
    expect(key2).toMatch(/^fund_/);
    expect(key1).not.toBe(key2);
  });

  it('should format INR currency properly with commas', () => {
    expect(formatINR(12500)).toBe('₹12,500');
    expect(formatINR(500)).toBe('₹500');
    expect(formatINR(1000000)).toBe('₹10,00,000');
  });

  it('should format durations into tabular figures', () => {
    expect(formatDuration(3665)).toBe('01:01:05');
    expect(formatDuration(90)).toBe('01:30');
    expect(formatDuration(0)).toBe('00:00:00');
  });

  it('should truncate hashes safely', () => {
    expect(truncateHash('0x1234567890abcdef', 4, 4)).toBe('0x12...cdef');
    expect(truncateHash('short')).toBe('short');
  });

  it('should create and fund escrow with 1% platform fee calculations', async () => {
    const amount = 10000;
    const escrow = await escrowService.fundEscrow('list_test_99', amount);
    expect(escrow.amount).toBe(amount);
    expect(escrow.fee).toBe(100); // 1% of 10,000
    expect(escrow.status).toBe('FUNDED_IN_ESCROW');
  });

  it('should transition to RELEASED upon buyer inspection approval', async () => {
    const escrow = await escrowService.fundEscrow('list_test_100', 5000);
    await escrowService.approveRelease(escrow.id);
    const updated = await escrowService.getEscrowById(escrow.id);
    expect(updated.status).toBe('RELEASED');
  });

  it('should transition to DISPUTED upon buyer complaint filing', async () => {
    const escrow = await escrowService.fundEscrow('list_test_101', 8000);
    const dispute = await escrowService.fileDispute(
      escrow.id,
      'Invalid credentials',
      'The password did not match the account handle'
    );
    expect(dispute.escrowId).toBe(escrow.id);
    const updated = await escrowService.getEscrowById(escrow.id);
    expect(updated.status).toBe('DISPUTED');
  });
});
