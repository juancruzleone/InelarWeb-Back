import { Router } from 'express';
import * as controllers from '../controllers/controller.api.clients.js';
import { validateClient, validateClientPatch } from '../../middleware/clients.validate.middleware.js';
import { isAdmin } from '../../middleware/auth.role.middleware.js'; 

const route = Router();

route.get('/clientes', controllers.getClients); 
route.get('/clientes/:id', controllers.getClientById);
route.post('/clientes', isAdmin ,[validateClient], controllers.addClient);
route.put('/clientes/:id', isAdmin , [validateClient], controllers.putClient);
route.patch('/clientes/:id', isAdmin , [validateClientPatch], controllers.patchClient);
route.delete('/clientes/:id', isAdmin ,controllers.deleteClient);

export default route;
