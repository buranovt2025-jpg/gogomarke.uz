import { Response } from 'express';
import Report, { ReportStatus, ReportReason, ReportType } from '../models/Report';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../types';

export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
      res.status(400).json({ 
        success: false, 
        message: 'Target type, target ID, and reason are required' 
      });
      return;
    }

    if (!Object.values(ReportType).includes(targetType)) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid target type' 
      });
      return;
    }

    if (!Object.values(ReportReason).includes(reason)) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid reason' 
      });
      return;
    }

    const existingReport = await Report.findOne({
      where: {
        reporterId: user.id,
        targetType,
        targetId,
      },
    });

    if (existingReport) {
      res.status(400).json({ 
        success: false, 
        message: 'You have already reported this content' 
      });
      return;
    }

    const report = await Report.create({
      reporterId: user.id,
      targetType,
      targetId,
      reason,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: report,
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ success: false, message: 'Failed to create report' });
  }
};

export const getReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: reports } = await Report.findAndCountAll({
      where: { reporterId: user.id },
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'phone'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to get reports' });
  }
};

export const getAdminReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { page = 1, limit = 20, status, targetType, reason } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: Record<string, string> = {};
    if (status) where.status = status as string;
    if (targetType) where.targetType = targetType as string;
    if (reason) where.reason = reason as string;

    const { count, rows: reports } = await Report.findAndCountAll({
      where,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'phone'] },
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'phone'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get admin reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to get reports' });
  }
};

export const updateReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const report = await Report.findByPk(id);
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    if (status && Object.values(ReportStatus).includes(status)) {
      report.status = status;
      report.reviewedBy = user.id;
      report.reviewedAt = new Date();
    }

    if (adminNotes !== undefined) {
      report.adminNotes = adminNotes;
    }

    await report.save();

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: report,
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ success: false, message: 'Failed to update report' });
  }
};

export const getReportStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user || user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const pendingCount = await Report.count({ where: { status: ReportStatus.PENDING } });
    const reviewedCount = await Report.count({ where: { status: ReportStatus.REVIEWED } });
    const resolvedCount = await Report.count({ where: { status: ReportStatus.RESOLVED } });
    const dismissedCount = await Report.count({ where: { status: ReportStatus.DISMISSED } });

    res.json({
      success: true,
      data: {
        pending: pendingCount,
        reviewed: reviewedCount,
        resolved: resolvedCount,
        dismissed: dismissedCount,
        total: pendingCount + reviewedCount + resolvedCount + dismissedCount,
      },
    });
  } catch (error) {
    console.error('Get report stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get report stats' });
  }
};
