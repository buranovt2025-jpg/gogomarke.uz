import { Response } from 'express';
import { User, Product, Video, Review, Subscription } from '../models';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../types';

export const getSellerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sellerId } = req.params;

    const seller = await User.findByPk(sellerId, {
      attributes: ['id', 'firstName', 'lastName', 'avatar', 'createdAt'],
    });

    if (!seller) {
      res.status(404).json({ success: false, error: 'Seller not found.' });
      return;
    }

    // Check if user is actually a seller
    const sellerData = await User.findByPk(sellerId);
    if (sellerData?.role !== UserRole.SELLER && sellerData?.role !== UserRole.ADMIN) {
      res.status(404).json({ success: false, error: 'Seller not found.' });
      return;
    }

    // Get seller stats
    const totalProducts = await Product.count({ where: { sellerId, isActive: true } });
    const totalVideos = await Video.count({ where: { ownerId: sellerId, isActive: true } });
    const followersCount = await Subscription.count({ where: { sellerId } });

    // Get average rating from reviews
    const reviews = await Review.findAll({
      include: [{
        model: Product,
        as: 'product',
        where: { sellerId },
        attributes: [],
      }],
      attributes: ['rating'],
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    res.json({
      success: true,
      data: {
        id: seller.id,
        firstName: seller.firstName,
        lastName: seller.lastName,
        avatar: seller.avatar,
        createdAt: seller.createdAt,
        stats: {
          totalProducts,
          totalVideos,
          followersCount,
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
        },
      },
    });
  } catch (error) {
    console.error('Get seller profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get seller profile' });
  }
};

export const getSellerProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: products } = await Product.findAndCountAll({
      where: { sellerId, isActive: true },
      include: [{
        model: User,
        as: 'seller',
        attributes: ['id', 'firstName', 'lastName', 'avatar'],
      }],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({ success: false, error: 'Failed to get seller products' });
  }
};

export const getSellerVideos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: videos } = await Video.findAndCountAll({
      where: { ownerId: sellerId, isActive: true },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'avatar'],
        },
        {
          model: Product,
          as: 'product',
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: videos,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get seller videos error:', error);
    res.status(500).json({ success: false, error: 'Failed to get seller videos' });
  }
};
