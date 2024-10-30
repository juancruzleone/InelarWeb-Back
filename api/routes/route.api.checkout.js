import { Router } from 'express';
import { createOrder, updateOrderStatus, handleSuccess, handleFailure, handlePending } from '../controllers/controller.api.checkout.js';

const router = Router();

// Rutas para el proceso de checkout
router.post('/create-order', createOrder);
router.post('/webhook', updateOrderStatus);
router.get('/success', handleSuccess);
router.get('/failure', handleFailure);
router.get('/pending', handlePending);

export default router;