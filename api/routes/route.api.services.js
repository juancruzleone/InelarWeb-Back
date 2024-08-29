import { Router } from 'express';
import * as controllers from '../controllers/controller.api.services.js';
import { validateService } from '../../middleware/service.validate.middleware.js';

const route = Router();

route.post('/servicios', async (req, res) => {
  try {
    await validateService(req, res, async () => {
      await controllers.insertService(req.body);
      res.status(201).json({ message: "Servicio agregado correctamente" });
    });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


route.get('/servicios', async (req, res) => {
  try {
    const servicios = await controllers.getServices();
    res.status(200).json(servicios);
  } catch (error) {
    console.error("Error al obtener la lista de servicios:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default route;
