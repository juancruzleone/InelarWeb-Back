import * as services from '../../services/installations.services.js';
import { ObjectId } from 'mongodb';

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
      installationType
    });
    res.status(201).json({ message: 'Instalación creada correctamente', installation: newInstallation });
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

async function updateInstallation(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: { message: 'ID de instalación no válido' } });
    }

    const { company, address, floorSector, postalCode, city, province, installationType } = req.body;
    await services.updateInstallation(id, {
      company,
      address,
      floorSector,
      postalCode,
      city,
      province,
      installationType
    });
    res.status(200).json({ message: 'Instalación actualizada correctamente' });
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

async function deleteInstallation(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: { message: 'ID de instalación no válido' } });
    }

    await services.deleteInstallation(id);
    res.status(200).json({ message: 'Instalación eliminada correctamente' });
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

async function addDeviceToInstallation(req, res) {
  try {
    const { id } = req.params;
    const { nombre, ubicacion, categoria } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: { message: 'ID de instalación no válido' } });
    }

    const newDevice = await services.addDeviceToInstallation(id, { nombre, ubicacion, categoria });
    res.status(200).json({ 
      message: 'Dispositivo agregado a la instalación exitosamente',
      device: newDevice
    });
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

async function updateDeviceInInstallation(req, res) {
  try {
    const { id, deviceId } = req.params;
    const { nombre, ubicacion, categoria } = req.body;

    if (!ObjectId.isValid(id) || !ObjectId.isValid(deviceId)) {
      return res.status(400).json({ error: { message: 'ID de instalación o dispositivo no válido' } });
    }

    await services.updateDeviceInInstallation(id, deviceId, { nombre, ubicacion, categoria });
    res.status(200).json({ message: 'Dispositivo actualizado correctamente' });
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

async function deleteDeviceFromInstallation(req, res) {
  try {
    const { id, deviceId } = req.params;

    if (!ObjectId.isValid(id) || !ObjectId.isValid(deviceId)) {
      return res.status(400).json({ error: { message: 'ID de instalación o dispositivo no válido' } });
    }

    await services.deleteDeviceFromInstallation(id, deviceId);
    res.status(200).json({ message: 'Dispositivo eliminado correctamente' });
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

async function getDevicesFromInstallation(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: { message: 'ID de instalación no válido' } });
    }

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
  getDevicesFromInstallation 
};