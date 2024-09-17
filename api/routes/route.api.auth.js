import { Router } from "express";
import * as controllers from '../controllers/controller.api.auth.js';
import { validateAccount } from '../../middleware/auth.validate.middleware.js';
const route = Router();

route.post('/cuenta', [validateAccount], controllers.createAccount);
route.post('/cuenta/login', [validateAccount], controllers.login);
route.delete('/cuenta', controllers.logout);
route.get('/cuentas', controllers.getAllAccounts);

export default route;
