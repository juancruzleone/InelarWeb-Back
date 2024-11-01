import { Router } from 'express';
import { createOrder, handleWebhook, handleSuccess } from '../controllers/controller.api.checkout.js';

const router = Router();

router.post('/create-order', createOrder);
router.get('/success', handleSuccess);
router.get('/failure', (req, res) => {
    console.log('Pago fallido:', req.query);
    res.redirect('https://inelar.vercel.app/carrito?status=failure');
});
router.get('/pending', (req, res) => {
    console.log('Pago pendiente:', req.query);
    res.redirect('https://inelar.vercel.app/carrito?status=pending');
});
router.post('/webhook', handleWebhook);

export default router;