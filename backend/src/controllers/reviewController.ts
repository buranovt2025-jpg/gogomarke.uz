import { Response } from 'express';
import Review from '../models/Review';
import Product from '../models/Product';
import Order from '../models/Order';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { OrderStatus } from '../types';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Support both formats: from /products/:id/reviews and from /reviews
    const productId = req.params.id || req.body.productId;
    const { orderId, rating, comment, images } = req.body;

    if (!productId || !rating) {
      res.status(400).json({ success: false, error: 'Product ID and rating are required' });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
      return;
    }

    // Check if orderId is provided and valid
    if (orderId) {
      const order = await Order.findByPk(orderId);
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }

      if (order.buyerId !== user.id) {
        res.status(403).json({ success: false, error: 'You can only review your own orders' });
        return;
      }

      if (order.status !== OrderStatus.DELIVERED) {
        res.status(400).json({ success: false, error: 'You can only review delivered orders' });
        return;
      }

      const existingReview = await Review.findOne({
        where: { orderId, productId, buyerId: user.id },
      });

      if (existingReview) {
        res.status(400).json({ success: false, error: 'You have already reviewed this product for this order' });
        return;
      }
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    const review = await Review.create({
      orderId: orderId || null,
      productId,
      buyerId: user.id,
      sellerId: product.sellerId,
      rating,
      comment,
      images: images || [],
      isVerifiedPurchase: !!orderId,
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, error: 'Failed to create review' });
  }
};

export const getProductReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Support both formats: from /products/:id/reviews and from /reviews/product/:productId
    const productId = req.params.id || req.params.productId;
    const { page = 1, limit = 10 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { productId },
      include: [
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({ success: false, error: 'Failed to get reviews' });
  }
};

export const getSellerReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { sellerId },
      include: [
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'images'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get seller reviews error:', error);
    res.status(500).json({ success: false, error: 'Failed to get reviews' });
  }
};

export const getMyReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { buyerId: user.id },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'images'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ success: false, error: 'Failed to get reviews' });
  }
};

export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const review = await Review.findByPk(id);
    if (!review) {
      res.status(404).json({ success: false, error: 'Review not found' });
      return;
    }

    if (review.buyerId !== user.id) {
      res.status(403).json({ success: false, error: 'You can only delete your own reviews' });
      return;
    }

    await review.destroy();

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete review' });
  }
};

export const updateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { rating, comment, images } = req.body;

    const review = await Review.findByPk(id);
    if (!review) {
      res.status(404).json({ success: false, error: 'Review not found' });
      return;
    }

    if (review.buyerId !== user.id) {
      res.status(403).json({ success: false, error: 'You can only update your own reviews' });
      return;
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
        return;
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    if (images !== undefined) {
      review.images = images;
    }

    await review.save();

    res.json({ success: true, data: review });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ success: false, error: 'Failed to update review' });
  }
};
