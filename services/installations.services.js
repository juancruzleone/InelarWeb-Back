import { db } from '../db.js';
import { ObjectId } from 'mongodb';
import { createForm, createFolder, updateFolder, deleteFolder } from './googleAppsScript.service.js';

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
  
  const installation = await installationsCollection.findOne({ _id: objectId });
  
  if (!installation) {
    throw new Error('La instalación no existe');
  }

  if (installation.googleDriveFolderId) {
    try {
      const folderDeleteResult = await deleteFolder(installation.googleDriveFolderId);
      if (!folderDeleteResult.success) {
        console.error('Error al eliminar la carpeta en Google Drive:', folderDeleteResult.error);
        throw new Error('No se pudo eliminar la carpeta de la instalación en Google Drive');
      }
    } catch (error) {
      console.error('Error al intentar eliminar la carpeta en Google Drive:', error);
      throw new Error('Error al eliminar la carpeta de la instalación en Google Drive');
    }
  }

  const result = await installationsCollection.deleteOne({ _id: objectId });

  if (result.deletedCount === 0) {
    throw new Error('No se pudo eliminar la instalación');
  }

  return { message: 'Instalación y su carpeta asociada eliminadas correctamente' };
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

  const installation = await installationsCollection.findOne(
    { _id: installationObjectId, "devices._id": deviceObjectId },
    { projection: { "devices.$": 1 } }
  );

  if (!installation || !installation.devices || installation.devices.length === 0) {
    throw new Error('No se encontró la instalación o el dispositivo');
  }

  const currentDevice = installation.devices[0];

  if (currentDevice.googleDriveFolderId) {
    const newFolderName = `${updatedDeviceData.nombre} - ${updatedDeviceData.ubicacion} - ${updatedDeviceData.categoria}`;
    const folderUpdateResult = await updateFolder(currentDevice.googleDriveFolderId, newFolderName);
    if (!folderUpdateResult.success) {
      console.error('Error al actualizar la carpeta en Google Drive:', folderUpdateResult.error);
    }
  }

  const result = await installationsCollection.updateOne(
    { _id: installationObjectId, "devices._id": deviceObjectId },
    { $set: { "devices.$": { ...currentDevice, ...updatedDeviceData, _id: deviceObjectId } } }
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

  const installation = await installationsCollection.findOne(
    { _id: installationObjectId, "devices._id": deviceObjectId },
    { projection: { "devices.$": 1 } }
  );

  if (!installation || !installation.devices || installation.devices.length === 0) {
    throw new Error('No se encontró la instalación o el dispositivo');
  }

  const deviceToDelete = installation.devices[0];

  let folderDeleteResult = { success: true, message: 'No se encontró carpeta de Google Drive para eliminar' };
  if (deviceToDelete.googleDriveFolderId) {
    try {
      folderDeleteResult = await deleteFolder(deviceToDelete.googleDriveFolderId);
      console.log('Resultado de la eliminación de la carpeta:', folderDeleteResult);
      if (!folderDeleteResult.success) {
        console.error('Error al eliminar la carpeta en Google Drive:', folderDeleteResult.error);
      } else {
        console.log(`Carpeta de Google Drive eliminada: ${deviceToDelete.googleDriveFolderId}`);
      }
    } catch (error) {
      console.error('Error al intentar eliminar la carpeta en Google Drive:', error);
      folderDeleteResult = { success: false, error: error.message };
    }
  } else {
    console.log('El dispositivo no tiene una carpeta de Google Drive asociada');
  }

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

  return { 
    message: folderDeleteResult.success 
      ? `Dispositivo eliminado correctamente. ${folderDeleteResult.message}`
      : `Dispositivo eliminado correctamente, pero hubo un problema con la carpeta de Google Drive: ${folderDeleteResult.error}`,
    device: deviceToDelete
  };
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