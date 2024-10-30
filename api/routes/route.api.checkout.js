import { Router } from 'express';
import { createPreference, createOrder } from '../controllers/controller.api.checkout.js';

const router = Router();

router.post('/create-preference', createPreference);
router.get('/success', createOrder);
router.get('/failure', (req, res) => res.redirect('http://localhost:3000/carrito?status=failure'));
router.get('/pending', (req, res) => res.redirect('http://localhost:3000/carrito?status=pending'));
router.post('/webhook', (req, res) => {
    console.log('Webhook received:', req.body);
    res.sendStatus(200);
});

export default router;