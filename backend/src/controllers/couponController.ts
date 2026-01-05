import { Response } from 'express';
import Coupon from '../models/Coupon';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../types';
import { Op } from 'sequelize';

export const createCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (user.role !== UserRole.SELLER && user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, error: 'Only sellers and admins can create coupons' });
      return;
    }

    const { code, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, expiresAt } = req.body;

    if (!code || !discountType || !discountValue) {
      res.status(400).json({ success: false, error: 'Code, discount type, and discount value are required' });
      return;
    }

    const existingCoupon = await Coupon.findOne({ where: { code: code.toUpperCase() } });
    if (existingCoupon) {
      res.status(400).json({ success: false, error: 'Coupon code already exists' });
      return;
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      sellerId: user.role === UserRole.SELLER ? user.id : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ success: false, error: 'Failed to create coupon' });
  }
};

export const getCoupons = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: Record<string, unknown> = {};
    
    if (user.role === UserRole.SELLER) {
      whereClause.sellerId = user.id;
    }

    const { count, rows: coupons } = await Coupon.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: coupons,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ success: false, error: 'Failed to get coupons' });
  }
};

export const validateCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      res.status(400).json({ success: false, error: 'Coupon code is required' });
      return;
    }

    const coupon = await Coupon.findOne({ 
      where: { 
        code: code.toUpperCase(),
        isActive: true,
      } 
    });

    if (!coupon) {
      res.status(404).json({ success: false, error: 'Coupon not found or inactive' });
      return;
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      res.status(400).json({ success: false, error: 'Coupon has expired' });
      return;
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      res.status(400).json({ success: false, error: 'Coupon usage limit reached' });
      return;
    }

    if (coupon.minOrderAmount && orderAmount && orderAmount < Number(coupon.minOrderAmount)) {
      res.status(400).json({ 
        success: false, 
        error: `Minimum order amount is ${coupon.minOrderAmount} UZS` 
      });
      return;
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderAmount || 0) * (Number(coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
        discount = Number(coupon.maxDiscount);
      }
    } else {
      discount = Number(coupon.discountValue);
    }

    res.json({
      success: true,
      data: {
        coupon,
        discount,
        finalAmount: Math.max(0, (orderAmount || 0) - discount),
      },
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ success: false, error: 'Failed to validate coupon' });
  }
};

export const applyCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ success: false, error: 'Coupon code is required' });
      return;
    }

    const coupon = await Coupon.findOne({ 
      where: { 
        code: code.toUpperCase(),
        isActive: true,
      } 
    });

    if (!coupon) {
      res.status(404).json({ success: false, error: 'Coupon not found' });
      return;
    }

    await coupon.update({ usedCount: coupon.usedCount + 1 });

    res.json({ success: true, message: 'Coupon applied successfully' });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ success: false, error: 'Failed to apply coupon' });
  }
};

export const updateCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { isActive, usageLimit, expiresAt } = req.body;

    const coupon = await Coupon.findByPk(id);
    if (!coupon) {
      res.status(404).json({ success: false, error: 'Coupon not found' });
      return;
    }

    if (user.role === UserRole.SELLER && coupon.sellerId !== user.id) {
      res.status(403).json({ success: false, error: 'You can only update your own coupons' });
      return;
    }

    await coupon.update({
      isActive: isActive !== undefined ? isActive : coupon.isActive,
      usageLimit: usageLimit !== undefined ? usageLimit : coupon.usageLimit,
      expiresAt: expiresAt ? new Date(expiresAt) : coupon.expiresAt,
    });

    res.json({ success: true, data: coupon });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ success: false, error: 'Failed to update coupon' });
  }
};

export const deleteCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const coupon = await Coupon.findByPk(id);
    if (!coupon) {
      res.status(404).json({ success: false, error: 'Coupon not found' });
      return;
    }

    if (user.role === UserRole.SELLER && coupon.sellerId !== user.id) {
      res.status(403).json({ success: false, error: 'You can only delete your own coupons' });
      return;
    }

    await coupon.destroy();

    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete coupon' });
  }
};
