import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getCategories,
  getSellerProducts,
} from '../controllers/productController';
import {
  getProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
} from '../controllers/productVariantController';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { validateProduct } from '../middleware/validation';
import { UserRole } from '../types';

const router = Router();

// GET /api/products - List products with filters
router.get('/',
  optionalAuth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('categoryId').optional().isString(),
    query('sellerId').optional().isUUID(),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('search').optional().trim(),
    query('sortBy').optional().isIn(['createdAt', 'price', 'rating', 'salesCount']),
    query('order').optional().isIn(['asc', 'desc']),
    query('inStock').optional().isBoolean(),
  ],
  getProducts
);

router.get('/categories', getCategories);
router.get('/seller', authenticate, authorize(UserRole.SELLER), getSellerProducts);

// GET /api/products/:id - Get product details
router.get('/:id',
  optionalAuth,
  [param('id').isUUID()],
  getProductById
);

// POST /api/products - Create product (seller only)
router.post('/',
  authenticate,
  authorize(UserRole.SELLER),
  validateProduct,
  createProduct
);

// PUT /api/products/:id - Update product
router.put('/:id',
  authenticate,
  authorize(UserRole.SELLER, UserRole.ADMIN),
  [
    param('id').isUUID(),
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('price').optional().isFloat({ min: 0 }),
    body('stock').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
  ],
  updateProduct
);

// DELETE /api/products/:id - Delete product
router.delete('/:id',
  authenticate,
  authorize(UserRole.SELLER, UserRole.ADMIN),
  [param('id').isUUID()],
  deleteProduct
);

// GET /api/products/:id/variants - Get product variants
router.get('/:id/variants',
  [param('id').isUUID()],
  getProductVariants
);

// POST /api/products/:id/variants - Add variant
router.post('/:id/variants',
  authenticate,
  authorize(UserRole.SELLER, UserRole.ADMIN),
  [
    param('id').isUUID(),
    body('color').optional().trim(),
    body('colorHex').optional().trim(),
    body('size').optional().trim(),
    body('priceModifier').optional().isFloat(),
    body('stock').optional().isInt({ min: 0 }),
    body('sku').optional().trim(),
  ],
  createProductVariant
);

// PUT /api/products/:id/variants/:variantId - Update variant
router.put('/:id/variants/:variantId',
  authenticate,
  authorize(UserRole.SELLER, UserRole.ADMIN),
  [
    param('id').isUUID(),
    param('variantId').isUUID(),
    body('color').optional().trim(),
    body('colorHex').optional().trim(),
    body('size').optional().trim(),
    body('priceModifier').optional().isFloat(),
    body('stock').optional().isInt({ min: 0 }),
    body('sku').optional().trim(),
    body('isActive').optional().isBoolean(),
  ],
  updateProductVariant
);

// DELETE /api/products/:id/variants/:variantId - Delete variant
router.delete('/:id/variants/:variantId',
  authenticate,
  authorize(UserRole.SELLER, UserRole.ADMIN),
  [
    param('id').isUUID(),
    param('variantId').isUUID(),
  ],
  deleteProductVariant
);

export default router;
