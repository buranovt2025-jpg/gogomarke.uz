import crypto from 'crypto';
import { config } from '../config';
import { Order, Transaction } from '../models';
import { PaymentStatus, TransactionType } from '../types';

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  error?: string;
}

interface PaymeTransaction {
  id: string;
  time: number;
  amount: number;
  account: {
    order_id: string;
  };
  create_time: number;
  perform_time: number;
  cancel_time: number;
  state: number;
  reason?: number;
}

interface ClickTransaction {
  click_trans_id: number;
  service_id: number;
  merchant_trans_id: string;
  amount: number;
  action: number;
  error: number;
  error_note: string;
  sign_time: string;
  sign_string: string;
}

class PaymentService {
  // Payme states
  private readonly PAYME_STATE = {
    CREATED: 1,
    COMPLETED: 2,
    CANCELLED: -1,
    CANCELLED_AFTER_COMPLETE: -2,
  };

  // Click actions
  private readonly CLICK_ACTION = {
    PREPARE: 0,
    COMPLETE: 1,
  };

  // Generate Payme checkout URL
  generatePaymeUrl(orderId: string, amount: number): string {
    if (!config.payment.paymeId) {
      console.log('[Payment] Payme not configured');
      return '';
    }

    const amountInTiyin = amount * 100;
    const params = Buffer.from(
      `m=${config.payment.paymeId};ac.order_id=${orderId};a=${amountInTiyin}`
    ).toString('base64');

    return `https://checkout.paycom.uz/${params}`;
  }

  // Generate Click checkout URL
  generateClickUrl(orderId: string, amount: number): string {
    if (!config.payment.clickServiceId || !config.payment.clickMerchantId) {
      console.log('[Payment] Click not configured');
      return '';
    }

    const params = new URLSearchParams({
      service_id: config.payment.clickServiceId,
      merchant_id: config.payment.clickMerchantId,
      amount: amount.toString(),
      transaction_param: orderId,
      return_url: `https://gogomarket.uz/orders/${orderId}`,
    });

    return `https://my.click.uz/services/pay?${params.toString()}`;
  }

  // Verify Payme signature
  verifyPaymeAuth(authHeader: string): boolean {
    if (!config.payment.paymeKey) return false;

    const encoded = authHeader.replace('Basic ', '');
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const [login, password] = decoded.split(':');

    return login === 'Paycom' && password === config.payment.paymeKey;
  }

  // Handle Payme JSON-RPC request
  async handlePaymeRequest(method: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
    switch (method) {
      case 'CheckPerformTransaction':
        return this.paymeCheckPerformTransaction(params);
      case 'CreateTransaction':
        return this.paymeCreateTransaction(params);
      case 'PerformTransaction':
        return this.paymePerformTransaction(params);
      case 'CancelTransaction':
        return this.paymeCancelTransaction(params);
      case 'CheckTransaction':
        return this.paymeCheckTransaction(params);
      case 'GetStatement':
        return this.paymeGetStatement(params);
      default:
        return { error: { code: -32601, message: 'Method not found' } };
    }
  }

  private async paymeCheckPerformTransaction(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const account = params.account as { order_id: string };
    const amount = params.amount as number;

    const order = await Order.findByPk(account.order_id);
    if (!order) {
      return { error: { code: -31050, message: 'Order not found' } };
    }

    const orderAmountInTiyin = order.totalAmount * 100;
    if (orderAmountInTiyin !== amount) {
      return { error: { code: -31001, message: 'Invalid amount' } };
    }

    if (order.paymentStatus !== PaymentStatus.PENDING) {
      return { error: { code: -31008, message: 'Order already paid' } };
    }

    return { result: { allow: true } };
  }

  private async paymeCreateTransaction(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const id = params.id as string;
    const account = params.account as { order_id: string };
    const amount = params.amount as number;
    const time = params.time as number;

    const order = await Order.findByPk(account.order_id);
    if (!order) {
      return { error: { code: -31050, message: 'Order not found' } };
    }

    // Check if transaction already exists
    const existingTx = await Transaction.findOne({
      where: { externalId: id, type: TransactionType.PAYMENT },
    });

    if (existingTx) {
      return {
        result: {
          create_time: existingTx.createdAt.getTime(),
          transaction: existingTx.id,
          state: this.PAYME_STATE.CREATED,
        },
      };
    }

    // Create new transaction
    const transaction = await Transaction.create({
      orderId: order.id,
      userId: order.buyerId,
      type: TransactionType.PAYMENT,
      amount: amount / 100,
      status: PaymentStatus.PENDING,
      externalId: id,
      provider: 'payme',
      metadata: { payme_time: time },
    });

    return {
      result: {
        create_time: transaction.createdAt.getTime(),
        transaction: transaction.id,
        state: this.PAYME_STATE.CREATED,
      },
    };
  }

  private async paymePerformTransaction(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const id = params.id as string;

    const transaction = await Transaction.findOne({
      where: { externalId: id, type: TransactionType.PAYMENT },
    });

    if (!transaction) {
      return { error: { code: -31003, message: 'Transaction not found' } };
    }

    if (transaction.status === PaymentStatus.COMPLETED) {
      return {
        result: {
          transaction: transaction.id,
          perform_time: transaction.updatedAt.getTime(),
          state: this.PAYME_STATE.COMPLETED,
        },
      };
    }

    if (transaction.status === PaymentStatus.CANCELLED) {
      return { error: { code: -31008, message: 'Transaction cancelled' } };
    }

    // Complete the transaction
    transaction.status = PaymentStatus.HELD;
    await transaction.save();

    // Update order payment status
    const order = await Order.findByPk(transaction.orderId);
    if (order) {
      order.paymentStatus = PaymentStatus.HELD;
      await order.save();
    }

    return {
      result: {
        transaction: transaction.id,
        perform_time: Date.now(),
        state: this.PAYME_STATE.COMPLETED,
      },
    };
  }

  private async paymeCancelTransaction(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const id = params.id as string;
    const reason = params.reason as number;

    const transaction = await Transaction.findOne({
      where: { externalId: id, type: TransactionType.PAYMENT },
    });

    if (!transaction) {
      return { error: { code: -31003, message: 'Transaction not found' } };
    }

    if (transaction.status === PaymentStatus.CANCELLED) {
      return {
        result: {
          transaction: transaction.id,
          cancel_time: transaction.updatedAt.getTime(),
          state: this.PAYME_STATE.CANCELLED,
        },
      };
    }

    const wasCompleted = transaction.status === PaymentStatus.COMPLETED || transaction.status === PaymentStatus.HELD;

    transaction.status = PaymentStatus.CANCELLED;
    transaction.metadata = { ...transaction.metadata, cancel_reason: reason };
    await transaction.save();

    // Update order
    const order = await Order.findByPk(transaction.orderId);
    if (order) {
      order.paymentStatus = PaymentStatus.REFUNDED;
      await order.save();
    }

    return {
      result: {
        transaction: transaction.id,
        cancel_time: Date.now(),
        state: wasCompleted ? this.PAYME_STATE.CANCELLED_AFTER_COMPLETE : this.PAYME_STATE.CANCELLED,
      },
    };
  }

  private async paymeCheckTransaction(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const id = params.id as string;

    const transaction = await Transaction.findOne({
      where: { externalId: id, type: TransactionType.PAYMENT },
    });

    if (!transaction) {
      return { error: { code: -31003, message: 'Transaction not found' } };
    }

    let state = this.PAYME_STATE.CREATED;
    if (transaction.status === PaymentStatus.COMPLETED || transaction.status === PaymentStatus.HELD) {
      state = this.PAYME_STATE.COMPLETED;
    } else if (transaction.status === PaymentStatus.CANCELLED) {
      state = this.PAYME_STATE.CANCELLED;
    }

    return {
      result: {
        create_time: transaction.createdAt.getTime(),
        perform_time: transaction.status === PaymentStatus.COMPLETED ? transaction.updatedAt.getTime() : 0,
        cancel_time: transaction.status === PaymentStatus.CANCELLED ? transaction.updatedAt.getTime() : 0,
        transaction: transaction.id,
        state,
        reason: transaction.metadata?.cancel_reason || null,
      },
    };
  }

  private async paymeGetStatement(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const from = params.from as number;
    const to = params.to as number;

    const transactions = await Transaction.findAll({
      where: {
        provider: 'payme',
        type: TransactionType.PAYMENT,
      },
    });

    const filteredTx = transactions.filter((tx) => {
      const txTime = tx.createdAt.getTime();
      return txTime >= from && txTime <= to;
    });

    return {
      result: {
        transactions: filteredTx.map((tx) => ({
          id: tx.externalId,
          time: tx.createdAt.getTime(),
          amount: tx.amount * 100,
          account: { order_id: tx.orderId },
          create_time: tx.createdAt.getTime(),
          perform_time: tx.status === PaymentStatus.COMPLETED ? tx.updatedAt.getTime() : 0,
          cancel_time: tx.status === PaymentStatus.CANCELLED ? tx.updatedAt.getTime() : 0,
          transaction: tx.id,
          state: tx.status === PaymentStatus.COMPLETED ? this.PAYME_STATE.COMPLETED : this.PAYME_STATE.CREATED,
        })),
      },
    };
  }

  // Click signature verification
  verifyClickSign(params: ClickTransaction, secretKey: string): boolean {
    const signString = `${params.click_trans_id}${params.service_id}${secretKey}${params.merchant_trans_id}${params.amount}${params.action}${params.sign_time}`;
    const expectedSign = crypto.createHash('md5').update(signString).digest('hex');
    return expectedSign === params.sign_string;
  }

  // Handle Click prepare request
  async handleClickPrepare(params: ClickTransaction): Promise<Record<string, unknown>> {
    const order = await Order.findByPk(params.merchant_trans_id);
    
    if (!order) {
      return {
        error: -5,
        error_note: 'Order not found',
        click_trans_id: params.click_trans_id,
        merchant_trans_id: params.merchant_trans_id,
      };
    }

    if (order.paymentStatus !== PaymentStatus.PENDING) {
      return {
        error: -4,
        error_note: 'Already paid',
        click_trans_id: params.click_trans_id,
        merchant_trans_id: params.merchant_trans_id,
      };
    }

    if (order.totalAmount !== params.amount) {
      return {
        error: -2,
        error_note: 'Invalid amount',
        click_trans_id: params.click_trans_id,
        merchant_trans_id: params.merchant_trans_id,
      };
    }

    // Create pending transaction
    await Transaction.create({
      orderId: order.id,
      userId: order.buyerId,
      type: TransactionType.PAYMENT,
      amount: params.amount,
      status: PaymentStatus.PENDING,
      externalId: params.click_trans_id.toString(),
      provider: 'click',
    });

    return {
      error: 0,
      error_note: 'Success',
      click_trans_id: params.click_trans_id,
      merchant_trans_id: params.merchant_trans_id,
      merchant_prepare_id: order.id,
    };
  }

  // Handle Click complete request
  async handleClickComplete(params: ClickTransaction): Promise<Record<string, unknown>> {
    const transaction = await Transaction.findOne({
      where: { externalId: params.click_trans_id.toString(), provider: 'click' },
    });

    if (!transaction) {
      return {
        error: -6,
        error_note: 'Transaction not found',
        click_trans_id: params.click_trans_id,
        merchant_trans_id: params.merchant_trans_id,
      };
    }

    if (params.error < 0) {
      transaction.status = PaymentStatus.CANCELLED;
      await transaction.save();

      return {
        error: -9,
        error_note: 'Transaction cancelled',
        click_trans_id: params.click_trans_id,
        merchant_trans_id: params.merchant_trans_id,
      };
    }

    // Complete transaction
    transaction.status = PaymentStatus.HELD;
    await transaction.save();

    // Update order
    const order = await Order.findByPk(transaction.orderId);
    if (order) {
      order.paymentStatus = PaymentStatus.HELD;
      await order.save();
    }

    return {
      error: 0,
      error_note: 'Success',
      click_trans_id: params.click_trans_id,
      merchant_trans_id: params.merchant_trans_id,
      merchant_confirm_id: transaction.id,
    };
  }

  // Initialize payment for order
  async initializePayment(orderId: string, provider: 'payme' | 'click'): Promise<PaymentResult> {
    const order = await Order.findByPk(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.paymentStatus !== PaymentStatus.PENDING) {
      return { success: false, error: 'Order already paid or processed' };
    }

    let paymentUrl = '';
    if (provider === 'payme') {
      paymentUrl = this.generatePaymeUrl(orderId, order.totalAmount);
    } else {
      paymentUrl = this.generateClickUrl(orderId, order.totalAmount);
    }

    if (!paymentUrl) {
      return { success: false, error: `${provider} not configured` };
    }

    return { success: true, paymentUrl };
  }
}

export const paymentService = new PaymentService();
export default paymentService;
