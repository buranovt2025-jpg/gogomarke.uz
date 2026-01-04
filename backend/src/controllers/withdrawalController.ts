import { Response } from 'express';
import { User, Transaction } from '../models';
import { AuthRequest } from '../middleware/auth';
import { PaymentStatus, TransactionType, UserRole } from '../types';

export const getWithdrawals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || (user.role !== UserRole.SELLER && user.role !== UserRole.COURIER)) {
      res.status(403).json({ success: false, error: 'Seller or courier access required.' });
      return;
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: withdrawals } = await Transaction.findAndCountAll({
      where: {
        userId: user.id,
        type: TransactionType.SELLER_PAYOUT,
      },
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: withdrawals,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ success: false, error: 'Failed to get withdrawals' });
  }
};

export const requestWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || (user.role !== UserRole.SELLER && user.role !== UserRole.COURIER)) {
      res.status(403).json({ success: false, error: 'Seller or courier access required.' });
      return;
    }

    const { amount, method, accountDetails } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: 'Invalid withdrawal amount.' });
      return;
    }

    const minWithdrawal = 50000;
    if (amount < minWithdrawal) {
      res.status(400).json({ 
        success: false, 
        error: `Minimum withdrawal amount is ${minWithdrawal} UZS.` 
      });
      return;
    }

    const userData = await User.findByPk(user.id);
    if (!userData) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const availableBalance = Number(userData.availableBalance) || 0;
    if (amount > availableBalance) {
      res.status(400).json({ 
        success: false, 
        error: `Insufficient balance. Available: ${availableBalance} UZS.` 
      });
      return;
    }

    const withdrawal = await Transaction.create({
      orderId: '00000000-0000-0000-0000-000000000000',
      userId: user.id,
      type: TransactionType.SELLER_PAYOUT,
      amount: amount,
      currency: 'UZS',
      status: PaymentStatus.PENDING,
      description: `Withdrawal request via ${method || 'card'}`,
      metadata: {
        method: method || 'card',
        accountDetails: accountDetails || {},
        requestedAt: new Date().toISOString(),
        isWithdrawal: true,
      },
    });

    userData.availableBalance = availableBalance - amount;
    userData.pendingBalance = Number(userData.pendingBalance || 0) + amount;
    await userData.save();

    res.status(201).json({
      success: true,
      data: withdrawal,
      message: 'Withdrawal request submitted successfully.',
    });
  } catch (error) {
    console.error('Request withdrawal error:', error);
    res.status(500).json({ success: false, error: 'Failed to request withdrawal' });
  }
};

export const getWithdrawalById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;

    const withdrawal = await Transaction.findByPk(id);
    if (!withdrawal) {
      res.status(404).json({ success: false, error: 'Withdrawal not found.' });
      return;
    }

    if (withdrawal.userId !== user?.id && user?.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    res.json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    console.error('Get withdrawal error:', error);
    res.status(500).json({ success: false, error: 'Failed to get withdrawal' });
  }
};
