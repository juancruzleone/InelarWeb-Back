import { db } from '../db.js';
import { ObjectId } from 'mongodb';
import { generatePDF } from './pdfGenerator.services.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const installationsCollection = db.collection('instalaciones');

async function getInstallations() {
  const installations = await installationsCollection.find().sort({ _id: -1 }).toArray();
  return installations;
}

async function createInstallation(installationData) {
  const { company, address, floorSector, postalCode, city, province, installationType } = installationData;

  const newInstallation = {
    company,
    address,
    floorSector,
    postalCode,
    city,
    province,
    installationType,
    devices: []
  };

  const result = await installationsCollection.insertOne(newInstallation);
  const insertedId = result.insertedId.toString();

  return { ...newInstallation, _id: insertedId };
}

async function updateInstallation(id, installationData) {
  if (!ObjectId.isValid(id)) {
    throw new Error('El ID de la instalación no es válido');
  }

  const objectId = new ObjectId(id);
 
  const result = await installationsCollection.findOneAndUpdate(
    { _id: objectId },
    { $set: installationData },
    { returnDocument: 'after' }
  );

  if (!result.value) {
    throw new Error('No se encontró la instalación para actualizar');
  }

  return result.value;
}

async function deleteInstallation(id) {
  if (!ObjectId.isValid(id)) {
    throw new Error('El ID de la instalación no es válido');
  }

  const objectId = new ObjectId(id);
  
  const result = await installationsCollection.deleteOne({ _id: objectId });

  if (result.deletedCount === 0) {
    throw new Error('No se pudo eliminar la instalación');
  }

  return { message: 'Instalación eliminada correctamente' };
}

async function addDeviceToInstallation(installationId, deviceData) {
  const { nombre, ubicacion, categoria } = deviceData;

  if (!ObjectId.isValid(installationId)) {
    throw new Error('El ID de la instalación no es válido');
  }

  const installationObjectId = new ObjectId(installationId);
  const installation = await installationsCollection.findOne({ _id: installationObjectId });
  if (!installation) {
    throw new Error('La instalación no existe');
  }

  const deviceId = new ObjectId();

  // Generar URL para el formulario, asegurándose de que no haya doble slash
  const formUrl = `${process.env.FRONTEND_URL.replace(/\/$/, '')}/formulario/${installationId}/${deviceId}`;

  const newDevice = {
    _id: deviceId,
    nombre,
    ubicacion,
    categoria,
    codigoQR: formUrl,
    maintenanceHistory: []
  };

  const result = await installationsCollection.updateOne(
    { _id: installationObjectId },
    { $push: { devices: newDevice } }
  );

  if (result.modifiedCount === 0) {
    throw new Error('No se pudo agregar el dispositivo a la instalación');
  }

  return {
    message: 'Dispositivo agregado correctamente',
    device: newDevice
  };
}

async function updateDeviceInInstallation(installationId, deviceId, updatedDeviceData) {
  if (!ObjectId.isValid(installationId) || !ObjectId.isValid(deviceId)) {
    throw new Error('El ID de la instalación o el dispositivo no es válido');
  }

  const installationObjectId = new ObjectId(installationId);
  const deviceObjectId = new ObjectId(deviceId);

  // Asegurarse de que codigoQR se mantenga
  const currentDevice = await installationsCollection.findOne(
    { _id: installationObjectId, "devices._id": deviceObjectId },
    { projection: { "devices.$": 1 } }
  );

  if (!currentDevice || !currentDevice.devices || currentDevice.devices.length === 0) {
    throw new Error('No se encontró el dispositivo');
  }

  const updatedDevice = {
    ...currentDevice.devices[0],
    ...updatedDeviceData,
    _id: deviceObjectId,
    codigoQR: currentDevice.devices[0].codigoQR
  };

  const result = await installationsCollection.updateOne(
    { _id: installationObjectId, "devices._id": deviceObjectId },
    { $set: { "devices.$": updatedDevice } }
  );

  if (result.matchedCount === 0) {
    throw new Error('No se encontró la instalación o el dispositivo');
  }

  if (result.modifiedCount === 0) {
    throw new Error('No se realizaron cambios en el dispositivo');
  }

  return { message: 'Dispositivo actualizado correctamente', device: updatedDevice };
}

async function deleteDeviceFromInstallation(installationId, deviceId) {
  if (!ObjectId.isValid(installationId) || !ObjectId.isValid(deviceId)) {
    throw new Error('El ID de la instalación o el dispositivo no es válido');
  }

  const installationObjectId = new ObjectId(installationId);
  const deviceObjectId = new ObjectId(deviceId);

  const result = await installationsCollection.updateOne(
    { _id: installationObjectId },
    { $pull: { devices: { _id: deviceObjectId } } }
  );

  if (result.matchedCount === 0) {
    throw new Error('No se encontró la instalación');
  }

  if (result.modifiedCount === 0) {
    throw new Error('No se encontró el dispositivo en la instalación');
  }

  return { message: 'Dispositivo eliminado correctamente' };
}

async function getDevicesFromInstallation(installationId) {
  if (!ObjectId.isValid(installationId)) {
    throw new Error('El ID de la instalación no es válido');
  }

  const installationObjectId = new ObjectId(installationId);
  
  const installation = await installationsCollection.findOne({ _id: installationObjectId });
  
  if (!installation) {
    throw new Error('La instalación no existe');
  }

  return installation.devices ? installation.devices.sort((a, b) => b._id.getTimestamp() - a._id.getTimestamp()) : [];
}

async function handleMaintenanceSubmission(installationId, deviceId, formResponses) {
  if (!ObjectId.isValid(installationId) || !ObjectId.isValid(deviceId)) {
    throw new Error('El ID de la instalación o el dispositivo no es válido');
  }

  const installationObjectId = new ObjectId(installationId);
  const deviceObjectId = new ObjectId(deviceId);

  const installation = await installationsCollection.findOne(
    { _id: installationObjectId, "devices._id": deviceObjectId },
    { projection: { "devices.$": 1 } }
  );

  if (!installation || !installation.devices || installation.devices.length === 0) {
    throw new Error('No se encontró la instalación o el dispositivo');
  }

  const device = installation.devices[0];

  const pdfBuffer = await generatePDF(formResponses, device);
  const pdfFileName = `maintenance_${deviceId}_${Date.now()}.pdf`;
  
  // Usar el directorio temporal del sistema para almacenar los PDFs
  const pdfPath = path.join(os.tmpdir(), pdfFileName);
  
  await fs.writeFile(pdfPath, pdfBuffer);

  const maintenanceRecord = {
    date: new Date(),
    responses: formResponses,
    pdfUrl: `${process.env.BACKEND_URL.replace(/\/$/, '')}/temp/${pdfFileName}`
  };

  const result = await installationsCollection.updateOne(
    { _id: installationObjectId, "devices._id": deviceObjectId },
    { 
      $push: { "devices.$.maintenanceHistory": maintenanceRecord }
    }
  );

  if (result.modifiedCount === 0) {
    throw new Error('No se pudo registrar el mantenimiento');
  }

  return { message: 'Mantenimiento registrado correctamente', maintenanceRecord };
}

async function getLastMaintenanceForDevice(installationId, deviceId) {
  if (!ObjectId.isValid(installationId) || !ObjectId.isValid(deviceId)) {
    throw new Error('El ID de la instalación o el dispositivo no es válido');
  }

  const installationObjectId = new ObjectId(installationId);
  const deviceObjectId = new ObjectId(deviceId);

  const result = await installationsCollection.findOne(
    { _id: installationObjectId, "devices._id": deviceObjectId },
    { projection: { "devices.$": 1 } }
  );

  if (!result || !result.devices || result.devices.length === 0) {
    throw new Error('No se encontró la instalación o el dispositivo');
  }

  const device = result.devices[0];
  const maintenanceHistory = device.maintenanceHistory || [];
  return maintenanceHistory.length > 0 ? maintenanceHistory[maintenanceHistory.length - 1] : null;
}

async function getDeviceForm(installationId, deviceId) {
  if (!ObjectId.isValid(installationId) || !ObjectId.isValid(deviceId)) {
    throw new Error('El ID de la instalación o el dispositivo no es válido');
  }

  const installationObjectId = new ObjectId(installationId);
  const deviceObjectId = new ObjectId(deviceId);

  const result = await installationsCollection.findOne(
    { _id: installationObjectId, "devices._id": deviceObjectId },
    { projection: { "devices.$": 1 } }
  );

  if (!result || !result.devices || result.devices.length === 0) {
    throw new Error('No se encontró la instalación o el dispositivo');
  }

  const device = result.devices[0];
  
  // Aquí definimos el formulario basado en la categoría del dispositivo
  let formFields;
  switch (device.categoria) {
    case 'detector':
      formFields = [
        { name: 'estado', type: 'select', options: ['Operativo', 'No operativo'], label: 'Estado' },
        { name: 'limpieza', type: 'select', options: ['Cumple', 'No cumple', 'No aplica'], label: 'Limpieza' },
        { name: 'prueba', type: 'select', options: ['Responde', 'No responde'], label: 'Prueba' },
        { name: 'observaciones', type: 'textarea', label: 'Observaciones' }
      ];
      break;
    case 'extintor':
      formFields = [
        { name: 'presion', type: 'select', options: ['Cumple', 'No cumple', 'No aplica'], label: 'Presión' },
        { name: 'manguera', type: 'select', options: ['Cumple', 'No cumple', 'No aplica'], label: 'Estado de manguera' },
        { name: 'precinto', type: 'select', options: ['Cumple', 'No cumple', 'No aplica'], label: 'Precinto de seguridad' },
        { name: 'observaciones', type: 'textarea', label: 'Observaciones' }
      ];
      break;
    // Añadir más casos para otras categorías
    default:
      formFields = [
        { name: 'estado', type: 'select', options: ['Operativo', 'No operativo'], label: 'Estado' },
        { name: 'observaciones', type: 'textarea', label: 'Observaciones' }
      ];
  }

  return {
    deviceInfo: {
      nombre: device.nombre,
      ubicacion: device.ubicacion,
      categoria: device.categoria
    },
    formFields
  };
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