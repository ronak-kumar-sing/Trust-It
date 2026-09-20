import { describe, it, expect, beforeEach } from 'vitest';
import { useWalletStore } from '../src/store/walletStore';
import { walletService } from '../src/services/walletService';

describe('Part 3.7 — Wallet Store & Financial Ledger', () => {
  beforeEach(() => {
    useWalletStore.setState({
      balances: {
        available: 50000,
        frozen: 10000,
        total: 60000,
        currency: 'INR',
      },
      ledger: [],
      isLoading: false,
    });
  });

  it('should initialize with correct balance allocations', () => {
    const { balances } = useWalletStore.getState();
    expect(balances.available).toBe(50000);
    expect(balances.frozen).toBe(10000);
    expect(balances.total).toBe(60000);
  });

  it('should credit funds and append settled deposit entry', () => {
    useWalletStore.getState().creditFunds(5000, 'rzp_test_1');
    const { balances, ledger } = useWalletStore.getState();

    expect(balances.available).toBe(55000);
    expect(balances.total).toBe(65000);
    expect(ledger).toHaveLength(1);
    expect(ledger[0].type).toBe('DEPOSIT');
    expect(ledger[0].amount).toBe(5000);
  });

  it('should debit funds and append settled withdrawal entry', () => {
    useWalletStore.getState().debitFunds(10000, 'wth_test_1');
    const { balances, ledger } = useWalletStore.getState();

    expect(balances.available).toBe(40000);
    expect(balances.total).toBe(50000);
    expect(ledger).toHaveLength(1);
    expect(ledger[0].type).toBe('WITHDRAWAL');
    expect(ledger[0].amount).toBe(-10000);
  });

  it('should filter transaction ledger by type', async () => {
    const allLedger = await walletService.getLedger();
    expect(allLedger.length).toBeGreaterThan(0);

    const depositsOnly = await walletService.getLedger('DEPOSIT');
    expect(depositsOnly.every((d) => d.type === 'DEPOSIT')).toBe(true);

    const releasesOnly = await walletService.getLedger('ESCROW_RELEASE');
    expect(releasesOnly.every((r) => r.type === 'ESCROW_RELEASE')).toBe(true);
  });
});
