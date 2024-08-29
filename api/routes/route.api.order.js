import { Router } from 'express';
import { getAllOrders } from '../controllers/controller.api.order.js';

const router = Router();

router.get('/orders', getAllOrders); 

export default router;
