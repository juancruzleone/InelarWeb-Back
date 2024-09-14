import * as services from '../../services/installations.services.js';

async function createInstallation(req, res) {
  try {
    const { company, address, floorSector, postalCode, city, province, installationType } = req.body;
    const installation = await services.createInstallation({
      company,
      address,
      floorSector,
      postalCode,
      city,
      province,
      installationType
    });
    res.status(201).json({ message: 'Instalación creada correctamente', installation });
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

async function updateInstallation(req, res) {
  try {
    const { id } = req.params;
    const { company, address, floorSector, postalCode, city, province, installationType } = req.body;
    const updatedInstallation = await services.updateInstallation(id, {
      company,
      address,
      floorSector,
      postalCode,
      city,
      province,
      installationType
    });
    res.status(200).json({ message: 'Instalación actualizada correctamente', updatedInstallation });
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

async function deleteInstallation(req, res) {
  try {
    const { id } = req.params;
    await services.deleteInstallation(id);
    res.status(200).json({ message: 'Instalación eliminada correctamente' });
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

export { createInstallation, updateInstallation, deleteInstallation };
