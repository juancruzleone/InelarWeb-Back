import { Router } from 'express';
import * as controllers from '../controllers/controller.api.installations.js';
import { validateToken } from '../../middleware/auth.validate.middleware.js';
import { validateBuilding } from '../../middleware/installations.validate.middleware.js';

const route = Router();

route.post('/instalaciones', validateToken, validateBuilding, controllers.createInstallation);
route.put('/instalaciones/:id', validateToken, validateBuilding, controllers.updateInstallation);
route.delete('/instalaciones/:id', validateToken, controllers.deleteInstallation);

export default route;
