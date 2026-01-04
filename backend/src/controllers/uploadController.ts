import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import uploadService from '../services/uploadService';

// Upload video
export const uploadVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded.' });
      return;
    }

    const { url, key } = await uploadService.uploadVideo(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({
      success: true,
      data: { url, key },
    });
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload video' });
  }
};

// Upload image
export const uploadImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded.' });
      return;
    }

    const { url, key } = await uploadService.uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({
      success: true,
      data: { url, key },
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
};

// Upload product image
export const uploadProductImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded.' });
      return;
    }

    const { url, key } = await uploadService.uploadProductImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({
      success: true,
      data: { url, key },
    });
  } catch (error) {
    console.error('Upload product image error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload product image' });
  }
};
