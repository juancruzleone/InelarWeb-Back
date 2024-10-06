// googleAppsScript.service.js
import axios from 'axios';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'];

function getPrivateKey() {
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('No se pudo obtener la clave privada de Google');
  }
  return privateKey.replace(/\\n/g, '\n');
}

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: getPrivateKey(),
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

async function createForm(category, deviceId) {
  try {
    const token = await auth.getAccessToken();
    const response = await axios.post(process.env.GOOGLE_SCRIPT_URL, {
      action: 'createForm',
      category,
      deviceId
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data && response.data.success && response.data.url) {
      return {
        success: true,
        url: response.data.url
      };
    } else {
      console.error('No se pudo obtener la URL del formulario:', response.data);
      return {
        success: false,
        error: 'No se pudo obtener la URL del formulario'
      };
    }
  } catch (error) {
    console.error('Error al crear el formulario:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function createFolder(installationId, deviceData = null) {
  try {
    const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
    
    let folderName;
    let parentFolder;
    
    if (deviceData) {
      folderName = `${deviceData.nombre} - ${deviceData.ubicacion} - ${deviceData.categoria}`;
      parentFolder = installationId;
    } else {
      folderName = `Instalación ${installationId}`;
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
      error: 'Error al crear la carpeta en Google Drive: ' + error.message,
    };
  }
}

export { createForm, createFolder };