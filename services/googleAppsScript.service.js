import axios from 'axios';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import { db } from '../db.js';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'];
const installationsCollection = db.collection('instalaciones');

function getPrivateKey() {
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!privateKey) {
    try {
      const keyPath = path.join(process.cwd(), 'google-private-key.pem');
      privateKey = fs.readFileSync(keyPath, 'utf8');
    } catch (error) {
      console.error('Error al leer el archivo de clave privada:', error);
      throw new Error('No se pudo obtener la clave privada de Google');
    }
  }
  return privateKey.replace(/\\n/g, '\n');
}

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: getPrivateKey(),
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

async function verifyParentFolder() {
  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
  try {
    const folder = await drive.files.get({
      fileId: parentFolderId,
      fields: 'id,name,permissions'
    });
    
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const hasAccess = folder.data.permissions.some(permission => 
      permission.emailAddress === serviceAccountEmail && 
      (permission.role === 'writer' || permission.role === 'owner')
    );

    if (!hasAccess) {
      console.log('La cuenta de servicio no tiene permisos suficientes en la carpeta padre. Creando una nueva...');
      return await createParentFolder();
    }

    console.log(`Carpeta padre verificada: ${folder.data.name} (${folder.data.id})`);
    return parentFolderId;
  } catch (error) {
    if (error.code === 404) {
      console.log('Carpeta padre no encontrada. Creando una nueva...');
      return await createParentFolder();
    } else {
      console.error('Error al verificar la carpeta padre:', error);
      throw error;
    }
  }
}

async function createParentFolder() {
  try {
    const folderMetadata = {
      name: 'Instalaciones INELAR',
      mimeType: 'application/vnd.google-apps.folder',
    };
    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id,name',
    });
    console.log(`Nueva carpeta padre creada: ${folder.data.name} (${folder.data.id})`);
    return folder.data.id;
  } catch (error) {
    console.error('Error al crear la carpeta padre:', error);
    throw new Error('No se pudo crear la carpeta padre en Google Drive');
  }
}

async function createFolder(installationId, deviceData = null) {
  try {
    const parentFolderId = '1n2wOXdPxYsk5p5z3j_uDfoJBNGHlbFbu';
    
    let folderName;
    let parentFolder;
    
    const installation = await installationsCollection.findOne({ _id: new ObjectId(installationId) });
    
    if (!installation) {
      throw new Error('Instalación no encontrada');
    }

    if (deviceData) {
      folderName = `${deviceData.nombre} - ${deviceData.ubicacion} - ${deviceData.categoria}`;

      const installationFolderName = `${installation.company} - ${installation.address} - ${installation.installationType}`;
      const installationFolders = await drive.files.list({
        q: `name='${installationFolderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents`,
        fields: 'files(id, name)',
        spaces: 'drive'
      });
      
      if (installationFolders.data.files.length > 0) {
        parentFolder = installationFolders.data.files[0].id;
      } else {
        throw new Error('Carpeta de instalación no encontrada');
      }
    } else {
      folderName = `${installation.company} - ${installation.address} - ${installation.installationType}`;
      parentFolder = parentFolderId;
    }

    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolder],
    };

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id,name',
    });

    console.log(`Carpeta creada: ${folder.data.name} (${folder.data.id})`);

    await drive.permissions.create({
      resource: {
        role: 'writer', 
        type: 'user',
        emailAddress: 'mantenimientoinelarsrl@gmail.com',  
      },
      fileId: folder.data.id,
      fields: 'id',
    });

    console.log(`Permiso otorgado a mantenimientoinelarsrl@gmail.com para la carpeta ${folder.data.name}`);
    
    return {
      success: true,
      folderId: folder.data.id,
      folderName: folder.data.name,
    };
  } catch (error) {
    console.error('Error al crear la carpeta en Google Drive o al otorgar permisos:', error);
    return {
      success: false,
      error: 'Error al crear la carpeta en Google Drive',
    };
  }
}

async function createForm(category, deviceId) {
  try {
    const response = await axios.post(process.env.GOOGLE_SCRIPT_URL, {
      action: 'createForm',
      category,
      deviceId,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.url && response.data.id) {
      return {
        success: true,
        url: response.data.url,
        id: response.data.id,
      };
    } else {
      console.error('Respuesta inesperada del Google Apps Script:', response.data);
      return {
        success: false,
        error: 'No se pudo obtener la información del formulario',
        details: response.data
      };
    }
  } catch (error) {
    console.error('Error al crear el formulario:', error.response ? error.response.data : error.message);
    return {
      success: false,
      error: 'Error al crear el formulario',
      details: error.response ? error.response.data : error.message
    };
  }
}

export { createForm, createFolder };