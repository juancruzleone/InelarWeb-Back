import { db } from '../db.js';
import { ObjectId } from 'mongodb';
import { createForm, createFolder } from './googleAppsScript.service.js';

const installationsCollection = db.collection('instalaciones');
const devicesCollection = db.collection('dispositivos');

async function getInstallations() {
  const installations = await installationsCollection.find().toArray();
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

  const folderName = `${company} - ${address} - ${installationType}`;

  try {
    const folderResult = await createFolder(insertedId, folderName);
    if (folderResult.success) {
      newInstallation.googleDriveFolderId = folderResult.folderId;
      await installationsCollection.updateOne(
        { _id: result.insertedId },
        { $set: { googleDriveFolderId: folderResult.folderId } }
      );
    } else {
      console.error('No se pudo crear la carpeta en Google Drive:', folderResult.error);
    }
  } catch (error) {
    console.error('Error al crear la carpeta en Google Drive:', error);
  }

  return { ...newInstallation, _id: insertedId };
}

async function updateInstallation(id, installationData) {
  if (!ObjectId.isValid(id)) {
    throw new Error('El ID de la instalación no es válido');
  }

  const objectId = new ObjectId(id);
 
  await installationsCollection.findOneAndUpdate(
    { _id: objectId },
    { $set: installationData },
    { returnDocument: 'after' }
  );
}

async function deleteInstallation(id) {
  if (!ObjectId.isValid(id)) {
    throw new Error('El ID de la instalación no es válido');
  }

  const objectId = new ObjectId(id);
  const result = await installationsCollection.deleteOne({ _id: objectId });

  if (result.deletedCount === 0) throw new Error('La instalación no existe');
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
 
  let deviceFolderId;
  try {
    const folderResult = await createFolder(installation.googleDriveFolderId, null, { nombre, ubicacion, categoria });
    if (folderResult.success) {
      deviceFolderId = folderResult.folderId;
    } else {
      throw new Error('No se pudo crear la carpeta del dispositivo en Google Drive: ' + folderResult.error);
    }
  } catch (error) {
    throw new Error('Error al crear la carpeta del dispositivo en Google Drive: ' + error.message);
  }

  let codigoQR, formId;
  try {
    const formResult = await createForm(categoria, deviceId.toString(), nombre, ubicacion, deviceFolderId);
    if (formResult.success) {
      codigoQR = formResult.url;
      formId = formResult.id;
    } else {
      console.error('No se pudo crear el formulario de Google:', formResult.error);
    }
  } catch (error) {
    console.error('Error al crear el formulario de Google:', error);
  }

  const newDevice = {
    _id: deviceId,
    nombre,
    ubicacion,
    categoria,
    googleDriveFolderId: deviceFolderId || null,
    codigoQR: codigoQR || null,
    formId: formId || null,
  };

  await installationsCollection.findOneAndUpdate(
    { _id: installationObjectId },
    { $push: { devices: newDevice } }
  );
  return newDevice;
}

async function updateDeviceInInstallation(installationId, deviceId, updatedDeviceData) {
  if (!ObjectId.isValid(installationId) || !ObjectId.isValid(deviceId)) {
    throw new Error('El ID de la instalación o el dispositivo no es válido');
  }

  const installationObjectId = new ObjectId(installationId);
  const deviceObjectId = new ObjectId(deviceId);

  await devicesCollection.updateOne(
    { _id: deviceObjectId },
    { $set: updatedDeviceData }
  );
}

async function deleteDeviceFromInstallation(installationId, deviceId) {
  if (!ObjectId.isValid(installationId) || !ObjectId.isValid(deviceId)) {
    throw new Error('El ID de la instalación o el dispositivo no es válido');
  }

  const installationObjectId = new ObjectId(installationId);
  const deviceObjectId = new ObjectId(deviceId);

  await devicesCollection.deleteOne({ _id: deviceObjectId });
}

async function getDevicesFromInstallation(installationId) {
  if (!ObjectId.isValid(installationId)) {
    throw new Error('El ID de la instalación no es válido');
  }

  const installationObjectId = new ObjectId(installationId);
  
  // Buscar la instalación primero
  const installation = await installationsCollection.findOne({ _id: installationObjectId });
  
  if (!installation) {
    throw new Error('La instalación no existe');
  }

  // Si los dispositivos están anidados en la instalación
  if (installation.devices && Array.isArray(installation.devices)) {
    return installation.devices.map(device => ({
      _id: device._id,
      nombre: device.nombre,
      ubicacion: device.ubicacion,
      categoria: device.categoria || 'No especificada',
      googleDriveFolderId: device.googleDriveFolderId,
      codigoQR: device.codigoQR,
      formId: device.formId,
      installationId: installationId
    }));
  } else {
    // Si los dispositivos están en una colección separada
    const devices = await devicesCollection.find({ installationId: installationObjectId }).toArray();
    return devices.map(device => ({
      _id: device._id,
      nombre: device.nombre,
      ubicacion: device.ubicacion,
      categoria: device.categoria || 'No especificada',
      googleDriveFolderId: device.googleDriveFolderId,
      codigoQR: device.codigoQR,
      formId: device.formId,
      installationId: installationId
    }));
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