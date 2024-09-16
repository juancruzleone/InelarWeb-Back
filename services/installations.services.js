import { db } from '../db.js';
import { ObjectId } from 'mongodb';

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
    devices: [] // Inicialmente, sin dispositivos
  };

  const result = await installationsCollection.insertOne(newInstallation);
  return { ...newInstallation, _id: result.insertedId };
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

  if (!result) {
    throw new Error('La instalación no existe');
  }
  return result;
}

async function deleteInstallation(id) {
  if (!ObjectId.isValid(id)) {
    throw new Error('El ID de la instalación no es válido');
  }

  const objectId = new ObjectId(id);
  const result = await installationsCollection.deleteOne({ _id: objectId });

  if (result.deletedCount === 0) throw new Error('La instalación no existe');
}

async function addDeviceToInstallation(installationId, deviceId) {
  if (!ObjectId.isValid(installationId) || !ObjectId.isValid(deviceId)) {
    throw new Error('El ID de la instalación o del dispositivo no es válido');
  }

  const installationObjectId = new ObjectId(installationId);
  const deviceObjectId = new ObjectId(deviceId);

  const device = await devicesCollection.findOne({ _id: deviceObjectId });
  if (!device) throw new Error('El dispositivo no existe');

  const result = await installationsCollection.findOneAndUpdate(
    { _id: installationObjectId },
    { $push: { devices: deviceObjectId } },
    { returnDocument: 'after' }
  );

  if (!result) throw new Error('La instalación no existe');
  return result;
}

export { getInstallations, createInstallation, updateInstallation, deleteInstallation, addDeviceToInstallation };