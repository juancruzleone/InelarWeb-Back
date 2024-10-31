import { Router } from 'express';
import * as controllers from '../controllers/controller.api.contact.js';
import { validateContact } from '../../middleware/contact.validate.middleware.js';
import { isAdmin } from '../../middleware/auth.role.middleware.js';  

const route = Router();

route.post('/contactos', async (req, res) => {
  try {
    await validateContact(req, res, async () => {
      await controllers.insertContact(req.body);
      res.status(201).json({ message: "Contacto agregado correctamente" });
    });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

route.get('/contactos', [isAdmin], async (req, res) => {
  try {
    const contactos = await controllers.getContacts();
    res.status(200).json(contactos);
  } catch (error) {
    console.error("Error al obtener la lista de contactos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default route;