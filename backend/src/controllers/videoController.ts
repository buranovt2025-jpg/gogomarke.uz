import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Video, User, Product, Comment } from '../models';
import uploadService from '../services/uploadService';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import { ContentType, ContentPurpose } from '../types';

// POST /api/videos - Create video
export const createVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: 'Video file is required' });
      return;
    }

    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Upload video
    const { url, key } = await uploadService.uploadVideo(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const { title, description, productId, categoryId } = req.body;

    const video = await Video.create({
      title,
      description,
      videoUrl: url,
      ownerId: user.id, // Using ownerId as per the existing model
      productId: productId || null,
      contentType: ContentType.VIDEO,
      contentPurpose: ContentPurpose.PRODUCT_REVIEW,
      duration: 0, // TODO: Extract from video metadata
      viewCount: 0,
      likeCount: 0,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: video,
    });
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ success: false, error: 'Failed to create video' });
  }
};

// GET /api/videos - List videos
export const getVideos = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const {
      page = 1,
      limit = 20,
      categoryId,
      sellerId,
      search,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const where: any = { isActive: true };

    // Note: Video model doesn't have categoryId field, but we keep the parameter for API compatibility
    // if (categoryId) where.categoryId = categoryId;
    if (sellerId) where.ownerId = sellerId; // Using ownerId as per the existing model
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    // Map sortBy field names to match the model
    let orderField = sortBy as string;
    if (sortBy === 'views') orderField = 'viewCount';
    if (sortBy === 'likes') orderField = 'likeCount';

    const { rows: videos, count: total } = await Video.findAndCountAll({
      where,
      include: [
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: Product, as: 'product', attributes: ['id', 'title', 'price'] },
      ],
      order: [[orderField, order as string]],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ success: false, error: 'Failed to get videos' });
  }
};

export const getVideoFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { isActive: true };

    let productWhere: Record<string, unknown> | undefined;
    if (category) {
      productWhere = { category, isActive: true };
    }

    const { count, rows: videos } = await Video.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'avatar'],
        },
        {
          model: Product,
          as: 'product',
          where: productWhere,
          required: !!category,
        },
      ],
      order: [
        ['isLive', 'DESC'],
        ['createdAt', 'DESC'],
      ],
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
    console.error('Get video feed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get video feed',
    });
  }
};

// GET /api/videos/:id - Get video by ID
export const getVideoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const video = await Video.findByPk(id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: Product, as: 'product' },
      ],
    });

    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    res.json({ success: true, data: video });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ success: false, error: 'Failed to get video' });
  }
};

// PUT /api/videos/:id - Update video
export const updateVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.currentUser;

    const video = await Video.findByPk(id);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    if (video.ownerId !== user?.id) {
      res.status(403).json({ success: false, error: 'Not authorized to update this video' });
      return;
    }

    const { title, description, isActive } = req.body;

    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    if (isActive !== undefined) video.isActive = isActive;

    await video.save();

    res.json({ success: true, data: video });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ success: false, error: 'Failed to update video' });
  }
};

// DELETE /api/videos/:id - Delete video
export const deleteVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.currentUser;

    const video = await Video.findByPk(id);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    if (video.ownerId !== user?.id) {
      res.status(403).json({ success: false, error: 'Not authorized to delete this video' });
      return;
    }

    // Delete from storage
    // Note: Video model doesn't have videoKey field, so we can't delete from storage
    // We'll just mark it as inactive for now
    video.isActive = false;
    await video.save();

    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete video' });
  }
};

// POST /api/videos/:id/view - Increment view
export const incrementView = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const video = await Video.findByPk(id);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    video.viewCount = (video.viewCount || 0) + 1;
    await video.save();

    res.json({ success: true, data: { views: video.viewCount } });
  } catch (error) {
    console.error('Increment view error:', error);
    res.status(500).json({ success: false, error: 'Failed to increment view' });
  }
};

// POST /api/videos/:id/like - Toggle like
export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.currentUser;

    const video = await Video.findByPk(id);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    // TODO: Implement proper like tracking with VideoLike model
    // For now, just increment
    video.likeCount = (video.likeCount || 0) + 1;
    await video.save();

    res.json({ success: true, data: { likes: video.likeCount, liked: true } });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle like' });
  }
};

// DELETE /api/videos/:id/like - Unlike video
export const unlikeVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const user = req.currentUser;

    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const video = await Video.findByPk(id);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    // Decrement like count (minimum 0)
    const currentLikes = (video as any).likeCount || (video as any).likes || 0;
    if (currentLikes > 0) {
      if ((video as any).likeCount !== undefined) {
        (video as any).likeCount = currentLikes - 1;
      } else {
        (video as any).likes = currentLikes - 1;
      }
      await video.save();
    }

    res.json({
      success: true,
      data: {
        likes: (video as any).likeCount || (video as any).likes || 0,
        liked: false
      }
    });
  } catch (error) {
    console.error('Unlike video error:', error);
    res.status(500).json({ success: false, error: 'Failed to unlike video' });
  }
};

export const getLiveVideos = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const videos = await Video.findAll({
      where: { isLive: true, isActive: true },
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
      order: [['viewCount', 'DESC']],
      limit: 20,
    });

    res.json({
      success: true,
      data: videos,
    });
  } catch (error) {
    console.error('Get live videos error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get live videos',
    });
  }
};

export const getSellerVideos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
      return;
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: videos } = await Video.findAndCountAll({
      where: { ownerId: user.id },
      include: [
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
    res.status(500).json({
      success: false,
      error: 'Failed to get seller videos',
    });
  }
};

// POST /api/videos/:id/comments - Add comment
export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { text, parentId } = req.body;
    const user = req.currentUser;

    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const video = await Video.findByPk(id);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    // If parentId provided, verify parent comment exists
    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (!parentComment) {
        res.status(404).json({ success: false, error: 'Parent comment not found' });
        return;
      }
    }

    const comment = await Comment.create({
      videoId: id,
      userId: user.id,
      text,
      parentId: parentId || null,
      isActive: true,
    });

    // Fetch with user data
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'avatar'] }
      ]
    });

    res.status(201).json({
      success: true,
      data: commentWithUser
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
};

// GET /api/videos/:id/comments - Get comments
export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const video = await Video.findByPk(id);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: comments, count: total } = await Comment.findAndCountAll({
      where: {
        videoId: id,
        isActive: true,
        parentId: null, // Only top-level comments
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
      ],
      order: [['createdAt', 'desc']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        }
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, error: 'Failed to get comments' });
  }
};

// DELETE /api/videos/:id/comments/:commentId - Delete comment
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { id, commentId } = req.params;
    const user = req.currentUser;

    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const comment = await Comment.findOne({
      where: {
        id: commentId,
        videoId: id,
      }
    });

    if (!comment) {
      res.status(404).json({ success: false, error: 'Comment not found' });
      return;
    }

    // Only comment owner can delete
    if (comment.userId !== user.id) {
      res.status(403).json({ success: false, error: 'Not authorized to delete this comment' });
      return;
    }

    // Soft delete
    comment.isActive = false;
    await comment.save();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete comment' });
  }
};
