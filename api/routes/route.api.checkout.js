import { Router } from 'express';
import { createOrder, handlePaymentSuccess } from '../controllers/controller.api.checkout.js';

const router = Router();

router.post('/create-order', createOrder);
router.get('/success', handlePaymentSuccess);
router.get('/failure', (req, res) => res.redirect('/carrito?status=failure'));
router.get('/pending', (req, res) => res.redirect('/carrito?status=pending'));
router.post('/webhook', (req, res) => {
    console.log('Webhook received:', req.body);
    res.sendStatus(200);
});

export default router;