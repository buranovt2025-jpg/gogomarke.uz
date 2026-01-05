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

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/videos', videoRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/chat', chatRoutes);
router.use('/upload', uploadRoutes);
router.use('/admin', adminRoutes);
router.use('/seller', sellerRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/courier', courierRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/disputes', disputeRoutes);
router.use('/reviews', reviewRoutes);

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'GoGoMarket API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
