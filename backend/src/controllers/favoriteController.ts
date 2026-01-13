import { Response } from 'express';
import { validationResult } from 'express-validator';
import { Favorite, Product, User } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: favorites } = await Favorite.findAndCountAll({
      where: { userId: user.id },
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'firstName', 'lastName', 'avatar'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        favorites: favorites.map((f) => (f as unknown as { product: unknown }).product),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ success: false, error: 'Failed to get favorites' });
  }
};

export const addToFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { productId } = req.params;

    const product = await Product.findByPk(productId);
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found.' });
      return;
    }

    const existingFavorite = await Favorite.findOne({
      where: { userId: user.id, productId },
    });

    if (existingFavorite) {
      res.status(400).json({ success: false, error: 'Product already in favorites.' });
      return;
    }

    await Favorite.create({
      userId: user.id,
      productId,
    });

    res.status(201).json({
      success: true,
      message: 'Added to favorites',
      data: { isFavorite: true },
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ success: false, error: 'Failed to add to favorites' });
  }
};

export const removeFromFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { productId } = req.params;

    const favorite = await Favorite.findOne({
      where: { userId: user.id, productId },
    });

    if (!favorite) {
      res.status(404).json({ success: false, error: 'Not in favorites' });
      return;
    }

    await favorite.destroy();

    res.json({
      success: true,
      message: 'Removed from favorites',
      data: { isFavorite: false },
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove from favorites' });
  }
};

export const checkFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { productId } = req.params;

    const favorite = await Favorite.findOne({
      where: { userId: user.id, productId },
    });

    res.json({
      success: true,
      data: { isFavorite: !!favorite },
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ success: false, error: 'Failed to check favorite' });
  }
};
