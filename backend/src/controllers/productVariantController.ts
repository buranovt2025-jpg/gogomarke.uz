import { Response } from 'express';
import { Product, ProductVariant } from '../models';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Get all variants for a product
export const getProductVariants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found.',
      });
      return;
    }

    const variants = await ProductVariant.findAll({
      where: { productId: id, isActive: true },
      order: [['createdAt', 'ASC']],
    });

    res.json({
      success: true,
      data: variants,
    });
  } catch (error) {
    console.error('Get product variants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product variants',
    });
  }
};

// Create a new variant for a product
export const createProductVariant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;

    if (!user || (user.role !== UserRole.SELLER && user.role !== UserRole.ADMIN)) {
      res.status(403).json({
        success: false,
        error: 'Only sellers can create product variants.',
      });
      return;
    }

    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found.',
      });
      return;
    }

    // Check if user owns the product (unless admin)
    if (user.role !== UserRole.ADMIN && product.sellerId !== user.id) {
      res.status(403).json({
        success: false,
        error: 'You can only add variants to your own products.',
      });
      return;
    }

    const { color, colorHex, size, priceModifier, stock, images } = req.body;

    // Generate SKU if not provided
    const sku = req.body.sku || `${product.id.substring(0, 8)}-${color || 'DEF'}-${size || 'STD'}-${uuidv4().substring(0, 4)}`.toUpperCase();

    // Check for duplicate variant
    const existingVariant = await ProductVariant.findOne({
      where: { productId: id, color: color || null, size: size || null },
    });

    if (existingVariant) {
      res.status(400).json({
        success: false,
        error: 'A variant with this color and size combination already exists.',
      });
      return;
    }

    const variant = await ProductVariant.create({
      productId: id,
      sku,
      color,
      colorHex,
      size,
      priceModifier: priceModifier || 0,
      stock: stock || 0,
      images: images || [],
    });

    res.status(201).json({
      success: true,
      data: variant,
    });
  } catch (error) {
    console.error('Create product variant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product variant',
    });
  }
};

// Update a variant
export const updateProductVariant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id, variantId } = req.params;

    if (!user || (user.role !== UserRole.SELLER && user.role !== UserRole.ADMIN)) {
      res.status(403).json({
        success: false,
        error: 'Only sellers can update product variants.',
      });
      return;
    }

    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found.',
      });
      return;
    }

    // Check if user owns the product (unless admin)
    if (user.role !== UserRole.ADMIN && product.sellerId !== user.id) {
      res.status(403).json({
        success: false,
        error: 'You can only update variants of your own products.',
      });
      return;
    }

    const variant = await ProductVariant.findOne({
      where: { id: variantId, productId: id },
    });

    if (!variant) {
      res.status(404).json({
        success: false,
        error: 'Variant not found.',
      });
      return;
    }

    const { color, colorHex, size, priceModifier, stock, images, isActive, sku } = req.body;

    if (color !== undefined) variant.color = color;
    if (colorHex !== undefined) variant.colorHex = colorHex;
    if (size !== undefined) variant.size = size;
    if (priceModifier !== undefined) variant.priceModifier = priceModifier;
    if (stock !== undefined) variant.stock = stock;
    if (images !== undefined) variant.images = images;
    if (isActive !== undefined) variant.isActive = isActive;
    if (sku !== undefined) variant.sku = sku;

    await variant.save();

    res.json({
      success: true,
      data: variant,
    });
  } catch (error) {
    console.error('Update product variant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product variant',
    });
  }
};

// Delete a variant (soft delete)
export const deleteProductVariant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id, variantId } = req.params;

    if (!user || (user.role !== UserRole.SELLER && user.role !== UserRole.ADMIN)) {
      res.status(403).json({
        success: false,
        error: 'Only sellers can delete product variants.',
      });
      return;
    }

    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found.',
      });
      return;
    }

    // Check if user owns the product (unless admin)
    if (user.role !== UserRole.ADMIN && product.sellerId !== user.id) {
      res.status(403).json({
        success: false,
        error: 'You can only delete variants of your own products.',
      });
      return;
    }

    const variant = await ProductVariant.findOne({
      where: { id: variantId, productId: id },
    });

    if (!variant) {
      res.status(404).json({
        success: false,
        error: 'Variant not found.',
      });
      return;
    }

    // Soft delete
    variant.isActive = false;
    await variant.save();

    res.json({
      success: true,
      message: 'Variant deleted successfully.',
    });
  } catch (error) {
    console.error('Delete product variant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product variant',
    });
  }
};

// Bulk create variants for a product
export const bulkCreateVariants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id } = req.params;

    if (!user || (user.role !== UserRole.SELLER && user.role !== UserRole.ADMIN)) {
      res.status(403).json({
        success: false,
        error: 'Only sellers can create product variants.',
      });
      return;
    }

    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found.',
      });
      return;
    }

    // Check if user owns the product (unless admin)
    if (user.role !== UserRole.ADMIN && product.sellerId !== user.id) {
      res.status(403).json({
        success: false,
        error: 'You can only add variants to your own products.',
      });
      return;
    }

    const { variants } = req.body;

    if (!Array.isArray(variants) || variants.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Variants array is required.',
      });
      return;
    }

    const createdVariants = [];

    for (const variantData of variants) {
      const { color, colorHex, size, priceModifier, stock, images } = variantData;
      
      // Generate SKU
      const sku = variantData.sku || `${product.id.substring(0, 8)}-${color || 'DEF'}-${size || 'STD'}-${uuidv4().substring(0, 4)}`.toUpperCase();

      // Check for duplicate
      const existingVariant = await ProductVariant.findOne({
        where: { productId: id, color: color || null, size: size || null },
      });

      if (!existingVariant) {
        const variant = await ProductVariant.create({
          productId: id,
          sku,
          color,
          colorHex,
          size,
          priceModifier: priceModifier || 0,
          stock: stock || 0,
          images: images || [],
        });
        createdVariants.push(variant);
      }
    }

    res.status(201).json({
      success: true,
      data: createdVariants,
      message: `Created ${createdVariants.length} variants.`,
    });
  } catch (error) {
    console.error('Bulk create variants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create variants',
    });
  }
};

// Update variant stock
export const updateVariantStock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    const { id, variantId } = req.params;
    const { stock } = req.body;

    if (!user || (user.role !== UserRole.SELLER && user.role !== UserRole.ADMIN)) {
      res.status(403).json({
        success: false,
        error: 'Only sellers can update stock.',
      });
      return;
    }

    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found.',
      });
      return;
    }

    if (user.role !== UserRole.ADMIN && product.sellerId !== user.id) {
      res.status(403).json({
        success: false,
        error: 'You can only update stock of your own products.',
      });
      return;
    }

    const variant = await ProductVariant.findOne({
      where: { id: variantId, productId: id },
    });

    if (!variant) {
      res.status(404).json({
        success: false,
        error: 'Variant not found.',
      });
      return;
    }

    variant.stock = stock;
    await variant.save();

    res.json({
      success: true,
      data: variant,
    });
  } catch (error) {
    console.error('Update variant stock error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stock',
    });
  }
};
