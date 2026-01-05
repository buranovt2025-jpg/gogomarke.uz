import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ViewHistory, { ViewType } from '../models/ViewHistory';
import Product from '../models/Product';
import Video from '../models/Video';
import { Op } from 'sequelize';

export const addToHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { targetType, targetId } = req.body;

    if (!targetType || !targetId) {
      res.status(400).json({ success: false, message: 'Target type and ID are required' });
      return;
    }

    if (!Object.values(ViewType).includes(targetType)) {
      res.status(400).json({ success: false, message: 'Invalid target type' });
      return;
    }

    const [viewHistory, created] = await ViewHistory.findOrCreate({
      where: {
        userId: user.id,
        targetType,
        targetId,
      },
      defaults: {
        userId: user.id,
        targetType,
        targetId,
        viewedAt: new Date(),
      },
    });

    if (!created) {
      await viewHistory.update({ viewedAt: new Date() });
    }

    res.status(200).json({
      success: true,
      message: 'Added to history',
      data: viewHistory,
    });
  } catch (error) {
    console.error('Add to history error:', error);
    res.status(500).json({ success: false, message: 'Failed to add to history' });
  }
};

export const getHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { type, limit = 50, offset = 0 } = req.query;

    const where: { userId: string; targetType?: ViewType } = { userId: user.id };
    if (type && Object.values(ViewType).includes(type as ViewType)) {
      where.targetType = type as ViewType;
    }

    const history = await ViewHistory.findAndCountAll({
      where,
      order: [['viewedAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset),
    });

    const productIds = history.rows
      .filter((h) => h.targetType === ViewType.PRODUCT)
      .map((h) => h.targetId);
    const videoIds = history.rows
      .filter((h) => h.targetType === ViewType.VIDEO)
      .map((h) => h.targetId);

    const [products, videos] = await Promise.all([
      productIds.length > 0
        ? Product.findAll({ where: { id: { [Op.in]: productIds } } })
        : [],
      videoIds.length > 0
        ? Video.findAll({ where: { id: { [Op.in]: videoIds } } })
        : [],
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const videoMap = new Map(videos.map((v) => [v.id, v]));

    const enrichedHistory = history.rows.map((h) => ({
      ...h.toJSON(),
      target:
        h.targetType === ViewType.PRODUCT
          ? productMap.get(h.targetId)
          : videoMap.get(h.targetId),
    }));

    res.status(200).json({
      success: true,
      data: enrichedHistory,
      total: history.count,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get history' });
  }
};

export const clearHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { type } = req.query;

    const where: { userId: string; targetType?: ViewType } = { userId: user.id };
    if (type && Object.values(ViewType).includes(type as ViewType)) {
      where.targetType = type as ViewType;
    }

    const deleted = await ViewHistory.destroy({ where });

    res.status(200).json({
      success: true,
      message: `Cleared ${deleted} items from history`,
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ success: false, message: 'Failed to clear history' });
  }
};

export const removeFromHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const deleted = await ViewHistory.destroy({
      where: {
        id,
        userId: user.id,
      },
    });

    if (deleted === 0) {
      res.status(404).json({ success: false, message: 'History item not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Removed from history',
    });
  } catch (error) {
    console.error('Remove from history error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove from history' });
  }
};
