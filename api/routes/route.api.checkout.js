import { Router } from 'express';
import { createOrder, handleWebhook } from '../controllers/controller.api.checkout.js';

const router = Router();

router.post('/create-order', createOrder);
router.get('/success', (req, res) => {
    console.log('Pago exitoso:', req.query);
    res.send('Success');
});
router.get('/failure', (req, res) => {
    console.log('Pago fallido:', req.query);
    res.send('Failure');
});
router.get('/pending', (req, res) => {
    console.log('Pago pendiente:', req.query);
    res.send('Pending');
});
router.post('/webhook', handleWebhook);

export default router;