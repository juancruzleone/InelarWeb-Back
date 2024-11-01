import { Router } from 'express';
import { createOrder, handleWebhook, handleSuccess } from '../controllers/controller.api.checkout.js';

const router = Router();

router.post('/create-order', createOrder);
router.get('/success', handleSuccess);
router.get('/failure', (req, res) => res.send('Failure'));
router.get('/pending', (req, res) => res.send('Pending'));
router.post('/webhook', handleWebhook);

export default router;