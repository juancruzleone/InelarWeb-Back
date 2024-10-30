import { Router } from 'express';
import { createOrder, successCallback, handleWebhook } from '../controllers/controller.api.checkout.js';

const router = Router();

router.post('/create-order', createOrder);
router.get('/success', successCallback);
router.get('/failure', (req, res) => res.redirect('https://inelar.vercel.app/carrito?status=failure'));
router.get('/pending', (req, res) => res.redirect('https://inelar.vercel.app/carrito?status=pending'));
router.post('/webhook', handleWebhook);

export default router;