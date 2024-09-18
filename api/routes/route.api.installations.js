import { Router } from 'express';
import * as controllers from '../controllers/controller.api.installations.js';
import { validateToken } from '../../middleware/auth.validate.middleware.js';
import { validateInstallations, validateDevice } from '../../middleware/installations.validate.middleware.js';

const route = Router();

route.get('/instalaciones', validateToken, controllers.getInstallations); 
route.post('/instalaciones', validateToken, validateInstallations, controllers.createInstallation);
route.put('/instalaciones/:id', validateToken, validateInstallations, controllers.updateInstallation);
route.delete('/instalaciones/:id', validateToken, controllers.deleteInstallation);

route.get('/instalaciones/:id/dispositivos', validateToken, controllers.getDevicesFromInstallation); 
route.post('/instalaciones/:id/dispositivos', validateToken, validateDevice, controllers.addDeviceToInstallation);
route.put('/instalaciones/:id/dispositivos/:deviceId', validateToken, validateDevice, controllers.updateDeviceInInstallation);
route.delete('/instalaciones/:id/dispositivos/:deviceId', validateToken, controllers.deleteDeviceFromInstallation);


export default route;
