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
      company, address, floorSector, postalCode, city, province, installationType,
    });
    res.status(201).json({ message: 'Instalación creada correctamente', installation: newInstallation });
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

async function updateInstallation(req, res) {
  try {
    const { id } = req.params;
    const { company, address, floorSector, postalCode, city, province, installationType } = req.body;
    const updatedInstallation = await services.updateInstallation(id, {
      company, address, floorSector, postalCode, city, province, installationType,
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
    const result = await services.addDeviceToInstallation(id, { nombre, ubicacion, categoria });
    res.status(201).json(result);
  } catch (err) {
    console.error('Error al agregar dispositivo:', err);
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

async function handleMaintenanceSubmission(req, res) {
  try {
    const { installationId, deviceId } = req.params;
    const formResponses = req.body;
    const result = await services.handleMaintenanceSubmission(installationId, deviceId, formResponses);
    res.status(200).json(result);
  } catch (err) {
    console.error('Error al procesar la respuesta del formulario:', err);
    res.status(400).json({ error: { message: err.message } });
  }
}

async function getLastMaintenanceForDevice(req, res) {
  try {
    const { installationId, deviceId } = req.params;
    const lastMaintenance = await services.getLastMaintenanceForDevice(installationId, deviceId);
    res.status(200).json(lastMaintenance);
  } catch (err) {
    console.error('Error al obtener el último mantenimiento:', err);
    res.status(400).json({ error: { message: err.message } });
  }
}

async function getDeviceForm(req, res) {
  try {
    const { installationId, deviceId } = req.params;
    const formData = await services.getDeviceForm(installationId, deviceId);
    res.status(200).json(formData);
  } catch (err) {
    console.error('Error al obtener el formulario del dispositivo:', err);
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
  handleMaintenanceSubmission,
  getLastMaintenanceForDevice,
  getDeviceForm
};