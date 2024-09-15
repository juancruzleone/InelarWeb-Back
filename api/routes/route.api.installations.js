import { Router } from 'express';
import * as controllers from '../controllers/controller.api.installations.js';
import { validateToken } from '../../middleware/auth.validate.middleware.js';
import { validateInstallations } from '../../middleware/installations.validate.middleware.js';

const route = Router();

route.get('/instalaciones', validateToken, controllers.getInstallations); 
route.post('/instalaciones', validateToken, validateInstallations, controllers.createInstallation);
route.put('/instalaciones/:id', validateToken, validateInstallations, controllers.updateInstallation);
route.delete('/instalaciones/:id', validateToken, controllers.deleteInstallation);
route.post('/instalaciones/:id/dispositivos', validateToken, controllers.addDeviceToInstallation);

export default route;
