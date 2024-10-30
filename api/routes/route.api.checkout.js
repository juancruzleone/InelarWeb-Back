import { Router } from 'express';
import { createOrder, handleWebhook } from '../controllers/controller.api.checkout.js';

const router = Router();

router.post('/create-order', createOrder);
router.get('/success', (req, res) => {
    const orderId = req.query.external_reference;
    updateOrderStatus(orderId, 'aprobado');
    res.redirect('/carrito?status=success');
});
router.get('/failure', (req, res) => {
    const orderId = req.query.external_reference;
    updateOrderStatus(orderId, 'rechazado');
    res.redirect('/carrito?status=failure');
});
router.get('/pending', (req, res) => {
    const orderId = req.query.external_reference;
    updateOrderStatus(orderId, 'pendiente');
    res.redirect('/carrito?status=pending');
});
router.post('/webhook', handleWebhook);

export default router;