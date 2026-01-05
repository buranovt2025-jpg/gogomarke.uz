import { Response } from 'express';
import { Comment, Video, User } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getVideoComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const video = await Video.findByPk(videoId);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found.' });
      return;
    }

    const { count, rows: comments } = await Comment.findAndCountAll({
      where: { videoId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'avatar'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: comments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get video comments error:', error);
    res.status(500).json({ success: false, error: 'Failed to get comments' });
  }
};

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { videoId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Comment text is required.' });
      return;
    }

    const video = await Video.findByPk(videoId);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found.' });
      return;
    }

    const comment = await Comment.create({
      videoId,
      userId: user.id,
      text: text.trim(),
    });

    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'avatar'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: commentWithUser,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { commentId } = req.params;

    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      res.status(404).json({ success: false, error: 'Comment not found.' });
      return;
    }

    if (comment.userId !== user.id) {
      res.status(403).json({ success: false, error: 'You can only delete your own comments.' });
      return;
    }

    await comment.destroy();

    res.json({
      success: true,
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete comment' });
  }
};
