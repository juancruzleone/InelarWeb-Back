import { Router } from 'express';
import { createOrder } from '../controllers/controller.api.checkout.js';
import { handleWebhook } from '../controllers/controller.api.webhook.js';

const router = Router();

router.post('/create-order', createOrder);
router.get('/success', (req, res) => {
    console.log('Redireccionado a success');
    res.send('Success');
});
router.get('/failure', (req, res) => {
    console.log('Redireccionado a failure');
    res.send('Failure');
});
router.get('/pending', (req, res) => {
    console.log('Redireccionado a pending');
    res.send('Pending');
});
router.post('/webhook', handleWebhook);

export default router;