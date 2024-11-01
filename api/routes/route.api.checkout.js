import { Router } from 'express';
import { createOrder, handleOrderStatus } from '../controllers/controller.api.checkout.js';

const router = Router();

router.post('/create-order', createOrder);
router.get('/success', handleOrderStatus);
router.get('/failure', handleOrderStatus);
router.get('/pending', handleOrderStatus);
router.post('/webhook', (req, res) => {
    console.log('Webhook received:', req.body);
    res.sendStatus(200);
});

export default router;