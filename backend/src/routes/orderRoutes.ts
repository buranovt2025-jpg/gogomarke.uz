import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  confirmOrder,
  handoverToCourier,
  assignCourier,
  scanPickupQr,
  confirmDelivery,
  cancelOrder,
  getAvailableOrdersForCourier,
  acceptOrderAsCourier,
  updateOrderStatus,
  getOrderQr,
  verifyOrderQr,
  getSellerOrders,
} from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';
import { validateOrder } from '../middleware/validation';
import { UserRole } from '../types';

const router = Router();

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get user orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 */
router.get('/', authenticate, getOrders);

router.get('/available', authenticate, authorize(UserRole.COURIER), getAvailableOrdersForCourier);
router.get('/seller/list', authenticate, authorize(UserRole.SELLER, UserRole.ADMIN), getSellerOrders);
router.post('/verify-qr', authenticate, verifyOrderQr);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 */
router.get('/:id', authenticate, getOrderById);

router.get('/:id/qr', authenticate, getOrderQr);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sellerId
 *               - items
 *               - deliveryAddress
 *             properties:
 *               sellerId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               deliveryAddress:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - buyer role required
 */
router.post('/', authenticate, authorize(UserRole.BUYER), validateOrder, createOrder);

/**
 * @swagger
 * /orders/{id}/confirm:
 *   post:
 *     summary: Confirm order (seller action)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order confirmed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - seller role required
 */
router.post('/:id/confirm', authenticate, authorize(UserRole.SELLER, UserRole.ADMIN), confirmOrder);

router.post('/:id/handover', authenticate, authorize(UserRole.SELLER, UserRole.ADMIN), handoverToCourier);
router.post('/:id/assign-courier', authenticate, authorize(UserRole.SELLER, UserRole.ADMIN), assignCourier);
router.post('/:id/accept', authenticate, authorize(UserRole.COURIER), acceptOrderAsCourier);
router.post('/:id/pickup', authenticate, authorize(UserRole.COURIER), scanPickupQr);
router.post('/:id/deliver', authenticate, authorize(UserRole.COURIER), confirmDelivery);
router.put('/:id/status', authenticate, updateOrderStatus);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   post:
 *     summary: Cancel order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post('/:id/cancel', authenticate, cancelOrder);

export default router;
