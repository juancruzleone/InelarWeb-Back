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
    devices: [],
  };

  const result = await installationsCollection.insertOne(newInstallation);
  const insertedId = result.insertedId.toString();

  try {
    const folderResult = await createFolder(insertedId);
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
  
  let codigoQR, formId, googleDriveFolderId;
  try {
    const folderResult = await createFolder(installationId, { nombre, ubicacion, categoria });
    if (folderResult.success) {
      googleDriveFolderId = folderResult.folderId;
    } else {
      console.error('No se pudo crear la carpeta del dispositivo:', folderResult.error);
    }
    
    const formResult = await createForm(categoria, deviceId.toString());
    if (formResult.success) {
      codigoQR = formResult.url;
      formId = formResult.id;
    } else {
      console.error('No se pudo crear el formulario:', formResult.error);
    }
  } catch (error) {
    console.error('Error al crear el formulario o la carpeta:', error);
  }

  const newDevice = {
    _id: deviceId,
    nombre,
    ubicacion,
    categoria,  
    codigoQR,
    formId,
    googleDriveFolderId,
  };

  await devicesCollection.insertOne(newDevice);

  await installationsCollection.findOneAndUpdate(
    { _id: installationObjectId },
    { $push: { devices: newDevice } },
    { returnDocument: 'after' }
  );

  return newDevice;
}

async function updateDeviceInInstallation(installationId, deviceId, deviceData) {
  const { nombre, ubicacion, categoria } = deviceData;

  if (!ObjectId.isValid(installationId) || !ObjectId.isValid(deviceId)) {
    throw new Error('El ID de la instalación o dispositivo no es válido');
  }

  const installationObjectId = new ObjectId(installationId);
  const deviceObjectId = new ObjectId(deviceId);

  const result = await installationsCollection.findOneAndUpdate(
    { _id: installationObjectId, 'devices._id': deviceObjectId },
    { 
      $set: { 
        'devices.$.nombre': nombre, 
        'devices.$.ubicacion': ubicacion, 
        'devices.$.categoria': categoria,
      } 
    },
    { returnDocument: 'after' }
  );

  if (!result.value) {
    throw new Error('No se encontró el dispositivo en la instalación');
  }
}

async function deleteDeviceFromInstallation(installationId, deviceId) {
  if (!ObjectId.isValid(installationId) || !ObjectId.isValid(deviceId)) {
    throw new Error('El ID de la instalación o dispositivo no es válido');
  }

  const installationObjectId = new ObjectId(installationId);
  const deviceObjectId = new ObjectId(deviceId);

  await installationsCollection.findOneAndUpdate(
    { _id: installationObjectId },
    { $pull: { devices: { _id: deviceObjectId } } }
  );

  await devicesCollection.deleteOne({ _id: deviceObjectId });
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

  return installation.devices || [];
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