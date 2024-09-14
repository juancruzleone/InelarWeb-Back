import { db } from '../db.js';
import { ObjectId } from 'mongodb';

const installationsCollection = db.collection('instalaciones');

async function createInstallation(installationData) {
  const { company, address, floorSector, postalCode, city, province, installationType } = installationData;

  const newInstallation = {
    company,
    address,
    floorSector,
    postalCode,
    city,
    province,
    installationType
  };

  const result = await installationsCollection.insertOne(newInstallation);
  return { ...newInstallation, _id: result.insertedId };
}

async function updateInstallation(id, installationData) {
  const result = await installationsCollection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: installationData },
    { returnDocument: 'after' }
  );

  if (!result.value) throw new Error('La instalación no existe');
  return result.value;
}

async function deleteInstallation(id) {
  const result = await installationsCollection.deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) throw new Error('La instalación no existe');
}

export { createInstallation, updateInstallation, deleteInstallation };
