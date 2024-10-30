import { Router } from 'express';
import { createOrder, handlePaymentSuccess, handlePaymentFailure, handlePaymentPending } from '../controllers/controller.api.checkout.js';

const router = Router();

router.post('/create-order', createOrder);
router.get('/success', handlePaymentSuccess);
router.get('/failure', handlePaymentFailure);
router.get('/pending', handlePaymentPending);
router.post('/webhook', (req, res) => {
    console.log('Webhook received:', req.body);
    res.sendStatus(200);
});

export default router;