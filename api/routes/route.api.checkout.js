import { Router } from 'express';
import { createOrder, handlePaymentNotification } from '../controllers/controller.api.checkout.js';

const router = Router();

router.post('/create-order', createOrder);
router.get('/success', (req, res) => res.redirect('https://inelar.vercel.app/carrito?status=success'));
router.get('/failure', (req, res) => res.redirect('https://inelar.vercel.app/carrito?status=failure'));
router.get('/pending', (req, res) => res.redirect('https://inelar.vercel.app/carrito?status=pending'));
router.post('/webhook', handlePaymentNotification);

export default router;