import { db } from '../db.js';
import { ObjectId } from 'mongodb';
import { createForm, createFolder } from './googleAppsScript.service.js';

const installationsCollection = db.collection('instalaciones');

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
    throw new Error('La instalación no existe');
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
 
  let deviceFolderId;
  try {
    const folderResult = await createFolder(installation.googleDriveFolderId, null, { nombre, ubicacion, categoria });
    if (folderResult.success) {
      deviceFolderId = folderResult.folderId;
    } else {
      console.error('No se pudo crear la carpeta del dispositivo en Google Drive:', folderResult.error);
    }
  } catch (error) {
    console.error('Error al crear la carpeta del dispositivo en Google Drive:', error);
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

  const result = await installationsCollection.updateOne(
    { _id: installationObjectId, "devices._id": deviceObjectId },
    { $set: { "devices.$": { ...updatedDeviceData, _id: deviceObjectId } } }
  );

  if (result.matchedCount === 0) {
    throw new Error('No se encontró la instalación o el dispositivo');
  }

  if (result.modifiedCount === 0) {
    throw new Error('No se realizaron cambios en el dispositivo');
  }

  return { message: 'Dispositivo actualizado correctamente' };
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
  getDevicesFromInstallation 
};