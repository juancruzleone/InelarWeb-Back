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

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: { message: 'ID de instalación no válido' } });
    }

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
    const { deviceId } = req.body;

    if (!ObjectId.isValid(id) || !ObjectId.isValid(deviceId)) {
      return res.status(400).json({ error: { message: 'ID de instalación o dispositivo no válido' } });
    }

    const installation = await services.addDeviceToInstallation(id, deviceId);
    res.status(200).json({ message: 'Dispositivo agregado a la instalación', installation });
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
}

export { getInstallations, createInstallation, updateInstallation, deleteInstallation, addDeviceToInstallation };
