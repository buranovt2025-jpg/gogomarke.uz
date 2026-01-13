import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import videoRoutes from './videoRoutes';
import orderRoutes from './orderRoutes';
import paymentRoutes from './paymentRoutes';
import chatRoutes from './chatRoutes';
import uploadRoutes from './uploadRoutes';
import adminRoutes from './adminRoutes';
import sellerRoutes from './sellerRoutes';
import withdrawalRoutes from './withdrawalRoutes';
import courierRoutes from './courierRoutes';
import favoriteRoutes from './favoriteRoutes';
import subscriptionRoutes from './subscriptionRoutes';
import disputeRoutes from './disputeRoutes';
import reviewRoutes from './reviewRoutes';
import couponRoutes from './couponRoutes';
import returnRoutes from './returnRoutes';
import ticketRoutes from './ticketRoutes';
import reportRoutes from './reportRoutes';
import storyRoutes from './storyRoutes';
import viewHistoryRoutes from './viewHistoryRoutes';
import addressRoutes from './addressRoutes';
import notificationRoutes from './notificationRoutes';
import cartRoutes from './cartRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/videos', videoRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/chats', chatRoutes);
router.use('/upload', uploadRoutes);
router.use('/admin', adminRoutes);
router.use('/seller', sellerRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/courier', courierRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/disputes', disputeRoutes);
router.use('/reviews', reviewRoutes);
router.use('/coupons', couponRoutes);
router.use('/returns', returnRoutes);
router.use('/tickets', ticketRoutes);
router.use('/reports', reportRoutes);
router.use('/stories', storyRoutes);
router.use('/history', viewHistoryRoutes);
router.use('/addresses', addressRoutes);
router.use('/notifications', notificationRoutes);
router.use('/cart', cartRoutes);

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'GoGoMarket API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
