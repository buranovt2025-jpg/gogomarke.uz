import { Response } from 'express';
import { Op } from 'sequelize';
import Story from '../models/Story';
import User from '../models/User';
import Product from '../models/Product';
import Subscription from '../models/Subscription';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../types';

export const createStory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || (user.role !== UserRole.SELLER && user.role !== UserRole.ADMIN)) {
      res.status(403).json({ success: false, message: 'Only sellers and admins can create stories' });
      return;
    }

    const { mediaUrl, mediaType, thumbnailUrl, caption, productId } = req.body;

    if (!mediaUrl) {
      res.status(400).json({ success: false, message: 'Media URL is required' });
      return;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await Story.create({
      sellerId: user.id,
      mediaUrl,
      mediaType: mediaType || 'image',
      thumbnailUrl,
      caption,
      productId,
      expiresAt,
    });

    res.status(201).json({
      success: true,
      message: 'Story created successfully',
      data: story,
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ success: false, message: 'Failed to create story' });
  }
};

export const getStories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sellerId } = req.query;

    const where: Record<string, unknown> = {
      isActive: true,
      expiresAt: { [Op.gt]: new Date() },
    };

    if (sellerId) {
      where.sellerId = sellerId;
    }

    const stories = await Story.findAll({
      where,
      include: [
        { model: User, as: 'seller', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: Product, as: 'product', attributes: ['id', 'title', 'price', 'images'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const groupedStories = stories.reduce((acc: Record<string, unknown[]>, story) => {
      const sellerIdKey = story.sellerId;
      if (!acc[sellerIdKey]) {
        acc[sellerIdKey] = [];
      }
      acc[sellerIdKey].push(story);
      return acc;
    }, {});

    const storyGroups = Object.entries(groupedStories).map(([sellerIdKey, sellerStories]) => {
      const firstStory = sellerStories[0] as Story & { seller?: User };
      return {
        sellerId: sellerIdKey,
        seller: firstStory.seller,
        stories: sellerStories,
        hasUnviewed: true,
      };
    });

    res.json({
      success: true,
      data: storyGroups,
    });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ success: false, message: 'Failed to get stories' });
  }
};

export const getFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Get list of sellers the user is subscribed to
    const subscriptions = await Subscription.findAll({
      where: { followerId: user.id },
      attributes: ['sellerId'],
    });

    const sellerIds = subscriptions.map((s) => s.sellerId);

    if (sellerIds.length === 0) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    // Get active stories from subscribed sellers
    const stories = await Story.findAll({
      where: {
        sellerId: { [Op.in]: sellerIds },
        isActive: true,
        expiresAt: { [Op.gt]: new Date() },
      },
      include: [
        { model: User, as: 'seller', attributes: ['id', 'firstName', 'lastName', 'phone', 'avatar'] },
        { model: Product, as: 'product', attributes: ['id', 'title', 'price', 'images'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Group stories by seller
    const groupedStories = stories.reduce((acc: Record<string, unknown[]>, story) => {
      const sellerIdKey = story.sellerId;
      if (!acc[sellerIdKey]) {
        acc[sellerIdKey] = [];
      }
      acc[sellerIdKey].push(story);
      return acc;
    }, {});

    const storyGroups = Object.entries(groupedStories).map(([sellerIdKey, sellerStories]) => {
      const firstStory = sellerStories[0] as Story & { seller?: User };
      return {
        sellerId: sellerIdKey,
        seller: firstStory.seller,
        stories: sellerStories,
        hasUnviewed: true,
      };
    });

    res.json({
      success: true,
      data: storyGroups,
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ success: false, message: 'Failed to get feed' });
  }
};

export const getMyStories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || (user.role !== UserRole.SELLER && user.role !== UserRole.ADMIN)) {
      res.status(403).json({ success: false, message: 'Only sellers and admins can view stories' });
      return;
    }

    // Admin can see all stories, seller only sees their own
    const where = user.role === UserRole.ADMIN ? {} : { sellerId: user.id };

    const stories = await Story.findAll({
      where,
      include: [
        { model: User, as: 'seller', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: Product, as: 'product', attributes: ['id', 'title', 'price', 'images'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: stories,
    });
  } catch (error) {
    console.error('Get my stories error:', error);
    res.status(500).json({ success: false, message: 'Failed to get stories' });
  }
};

export const viewStory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const story = await Story.findByPk(id);
    if (!story) {
      res.status(404).json({ success: false, message: 'Story not found' });
      return;
    }

    story.viewCount += 1;
    await story.save();

    res.json({
      success: true,
      data: story,
    });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ success: false, message: 'Failed to view story' });
  }
};

export const deleteStory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const story = await Story.findByPk(id);
    if (!story) {
      res.status(404).json({ success: false, message: 'Story not found' });
      return;
    }

    if (story.sellerId !== user.id && user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this story' });
      return;
    }

    await story.destroy();

    res.json({
      success: true,
      message: 'Story deleted successfully',
    });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete story' });
  }
};
