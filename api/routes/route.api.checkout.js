import { Router } from 'express';
import { createOrder, handleOrderStatus, webhookListener } from '../controllers/controller.api.checkout.js';

const router = Router();

router.post('/create-order', createOrder);
router.get('/success', handleOrderStatus);
router.get('/failure', handleOrderStatus);
router.get('/pending', handleOrderStatus);
router.post('/webhook', webhookListener);

export default router;
