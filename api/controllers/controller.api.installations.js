import * as services from '../../services/installations.services.js';

async function getInstallations(req, res) {
  try {
    const installations = await services.getInstallations();
    res.status(200).json(installations);
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

async function createInstallation(req, res) {
  try {
    const { company, address, floorSector, postalCode, city, province, installationType } = req.body;
    const newInstallation = await services.createInstallation({
      company,
      address,
      floorSector,
      postalCode,
      city,
      province,
      installationType,
    });
    
    if (newInstallation.googleDriveFolderId) {
      res.status(201).json({ 
        message: 'Instalación creada correctamente y carpeta de Google Drive creada', 
        installation: newInstallation,
      });
    } else {
      res.status(201).json({ 
        message: 'Instalación creada correctamente, pero no se pudo crear la carpeta de Google Drive', 
        installation: newInstallation,
      });
    }
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
      installationType,
    });
    res.status(200).json({ message: 'Instalación actualizada correctamente', installation: updatedInstallation });
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

async function deleteInstallation(req, res) {
  try {
    const { id } = req.params;
    const result = await services.deleteInstallation(id);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

async function addDeviceToInstallation(req, res) {
  try {
    const { id } = req.params;
    const { nombre, ubicacion, categoria } = req.body;
    const newDevice = await services.addDeviceToInstallation(id, { nombre, ubicacion, categoria });
    res.status(200).json({ 
      message: 'Dispositivo agregado a la instalación exitosamente',
      device: newDevice,
    });
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

async function updateDeviceInInstallation(req, res) {
  try {
    const { id, deviceId } = req.params;
    const { nombre, ubicacion, categoria } = req.body;
    const result = await services.updateDeviceInInstallation(id, deviceId, { nombre, ubicacion, categoria });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

async function deleteDeviceFromInstallation(req, res) {
  try {
    const { id, deviceId } = req.params;
    const result = await services.deleteDeviceFromInstallation(id, deviceId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

async function getDevicesFromInstallation(req, res) {
  try {
    const { id } = req.params;
    const devices = await services.getDevicesFromInstallation(id);
    res.status(200).json(devices);
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

export { 
  getInstallations, 
  createInstallation, 
  updateInstallation, 
  deleteInstallation, 
  addDeviceToInstallation, 
  updateDeviceInInstallation, 
  deleteDeviceFromInstallation,
  getDevicesFromInstallation,
};