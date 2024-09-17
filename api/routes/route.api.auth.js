import { Router } from "express";
import * as controllers from '../controllers/controller.api.auth.js';
import { validateAccountRegistro, validateAccountLogin } from '../../middleware/auth.validate.middleware.js';
const route = Router();

route.post('/cuenta', [validateAccountRegistro], controllers.createAccount);
route.post('/cuenta/login', [validateAccountLogin], controllers.login);
route.delete('/cuenta', controllers.logout);
route.get('/cuentas', controllers.getAllAccounts);  

export default route;
