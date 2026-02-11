import { Request, Response } from 'express';
import { Category } from '../models';
import { Op } from 'sequelize';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { parentId, active, search, limit = 50, offset = 0 } = req.query;
    
    const where: any = {};
    
    if (parentId !== undefined) {
      where.parentId = parentId === 'null' ? null : parentId;
    }
    
    if (active !== undefined) {
      where.isActive = active === 'true';
    }
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { nameRu: { [Op.iLike]: `%${search}%` } },
        { nameUz: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const categories = await Category.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      include: [
        {
          model: Category,
          as: 'children',
          where: { isActive: true },
          required: false,
          order: [['sortOrder', 'ASC']],
        },
      ],
    });

    const total = await Category.count({ where });

    res.json({
      success: true,
      data: {
        categories,
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to get categories' });
  }
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'children',
          where: { isActive: true },
          required: false,
          order: [['sortOrder', 'ASC']],
        },
        {
          model: Category,
          as: 'parent',
          required: false,
        },
      ],
    });

    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Get category by id error:', error);
    res.status(500).json({ success: false, error: 'Failed to get category' });
  }
};

export const getCategoryBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({
      where: { slug },
      include: [
        {
          model: Category,
          as: 'children',
          where: { isActive: true },
          required: false,
          order: [['sortOrder', 'ASC']],
        },
        {
          model: Category,
          as: 'parent',
          required: false,
        },
      ],
    });

    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Get category by slug error:', error);
    res.status(500).json({ success: false, error: 'Failed to get category' });
  }
};