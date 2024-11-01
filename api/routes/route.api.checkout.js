import { Router } from 'express';
import { createOrder, handleWebhook, updateOrderStatus } from '../controllers/controller.api.checkout.js';
import { isAdmin } from '../../middleware/auth.role.middleware.js';

const router = Router();

router.post('/create-order', createOrder);
router.get('/success', (req, res) => res.send('Success'));
router.get('/failure', (req, res) => res.send('Failure'));
router.get('/pending', (req, res) => res.send('Pending'));
router.post('/webhook', handleWebhook);
router.put('/order/:orderId/estado', [isAdmin], updateOrderStatus);

export default router;