import { Router } from 'express';
import * as controllers from '../controllers/controller.api.installations.js';
import { validateToken } from '../../middleware/auth.validate.middleware.js';
import { validateInstallations, validateDevice } from '../../middleware/installations.validate.middleware.js';
import { isAdmin } from '../../middleware/auth.role.middleware.js'; 

const route = Router();

route.get('/instalaciones', [validateToken, isAdmin], controllers.getInstallations); 
route.post('/instalaciones', [validateToken, isAdmin, validateInstallations], controllers.createInstallation);
route.put('/instalaciones/:id', [validateToken, isAdmin, validateInstallations], controllers.updateInstallation);
route.delete('/instalaciones/:id', [validateToken, isAdmin], controllers.deleteInstallation);

route.get('/instalaciones/:id/dispositivos', [validateToken, isAdmin], controllers.getDevicesFromInstallation); 
route.post('/instalaciones/:id/dispositivos', [validateToken, isAdmin, validateDevice], controllers.addDeviceToInstallation);
route.put('/instalaciones/:id/dispositivos/:deviceId', [validateToken, isAdmin, validateDevice], controllers.updateDeviceInInstallation);
route.delete('/instalaciones/:id/dispositivos/:deviceId', [validateToken, isAdmin], controllers.deleteDeviceFromInstallation);

export default route;