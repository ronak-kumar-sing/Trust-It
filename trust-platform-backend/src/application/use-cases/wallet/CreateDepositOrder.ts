import type { IPaymentGateway } from '../../interfaces/IPaymentGateway.js';
import type { IWalletRepository } from '../../interfaces/IWalletRepository.js';
import type { CreateDepositOrderDTO, DepositOrderResultDTO } from '../../dtos/wallet.dto.js';
import { NotFoundError, InvalidAmountError } from '../../../shared/errors/index.js';
import { nanoid } from 'nanoid';

/**
 * Use case: Create a payment deposit order with payment gateway.
 */
export class CreateDepositOrder {
  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly paymentGateway: IPaymentGateway,
  ) {}

  /**
   * Generates a payment order for client checkout.
   *
   * @param dto - Deposit request containing userId and amount in paise
   * @returns Order details from payment gateway
   * @throws {NotFoundError} When user wallet is not found
   * @throws {InvalidAmountError} When deposit amount is invalid
   */
  async execute(dto: CreateDepositOrderDTO): Promise<DepositOrderResultDTO> {
    if (!Number.isInteger(dto.amount) || dto.amount <= 0) {
      throw new InvalidAmountError(dto.amount);
    }

    const wallet = await this.walletRepository.findByUserId(dto.userId);
    if (!wallet) {
      throw new NotFoundError('Wallet for user', dto.userId);
    }

    const order = await this.paymentGateway.createOrder({
      amount: dto.amount,
      currency: 'INR',
      receipt: `rcpt_${nanoid(12)}`,
      notes: {
        userId: dto.userId,
        walletId: wallet.id,
      },
    });

    return {
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
    };
  }
}
