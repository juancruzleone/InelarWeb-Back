import axios from 'axios';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/forms', 'https://www.googleapis.com/auth/spreadsheets'];

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
const forms = google.forms({ version: 'v1', auth });
const sheets = google.sheets({ version: 'v4', auth });

async function createForm(category, deviceId, nombre, ubicacion, googleDriveFolderId) {
  try {
    const token = await auth.getAccessToken();
    const response = await axios.post(process.env.GOOGLE_SCRIPT_URL, {
      action: 'createForm',
      category,
      deviceId,
      nombre,
      ubicacion,
      googleDriveFolderId
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data && response.data.success) {
      return {
        success: true,
        url: response.data.url,
        id: response.data.id,
        sheetId: response.data.sheetId
      };
    } else {
      console.error('Respuesta inesperada del script de Google:', response.data);
      return {
        success: false,
        error: response.data.error || 'Respuesta inesperada del script de Google'
      };
    }
  } catch (error) {
    console.error('Error detallado al crear el formulario:', error.response ? error.response.data : error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function createFolder(installationId, folderName, deviceData = null) {
  try {
    const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
   
    let parentFolder;
   
    if (deviceData) {
      folderName = `${deviceData.nombre} - ${deviceData.ubicacion} - ${deviceData.categoria}`;
      parentFolder = installationId;
    } else {
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
        emailAddress: 'juancruzleone10@gmail.com',  
      },
      fileId: folder.data.id,
      fields: 'id',
    });

    console.log(`Permiso otorgado a juancruzleone10@gmail.com para la carpeta ${folder.data.name}`);
   
    return {
      success: true,
      folderId: folder.data.id,
      folderName: folder.data.name,
    };
  } catch (error) {
    console.error('Error al crear la carpeta en Google Drive o al  otorgar permisos:', error);
    return {
      success: false,
      error: 'Error al crear la carpeta en Google Drive: ' + error.message,
    };
  }
}

async function updateFolder(folderId, newName) {
  try {
    const response = await drive.files.update({
      fileId: folderId,
      resource: { name: newName },
    });

    console.log(`Carpeta actualizada: ${response.data.name} (${response.data.id})`);
    return {
      success: true,
      folderId: response.data.id,
      folderName: response.data.name,
    };
  } catch (error) {
    console.error('Error al actualizar la carpeta en Google Drive:', error);
    return {
      success: false,
      error: 'Error al actualizar la carpeta en Google Drive: ' + error.message,
    };
  }
}

async function deleteFolder(folderId) {
  try {
    await drive.files.delete({
      fileId: folderId,
    });

    console.log(`Carpeta eliminada: ${folderId}`);
    return {
      success: true,
      message: `Carpeta eliminada: ${folderId}`
    };
  } catch (error) {
    console.error('Error al eliminar la carpeta en Google Drive:', error);
    if (error.code === 404) {
      return {
        success: true,
        message: `La carpeta ${folderId} ya no existe en Google Drive.`
      };
    }
    return {
      success: false,
      error: 'Error al eliminar la carpeta en Google Drive: ' + error.message,
    };
  }
}

export { createForm, createFolder, updateFolder, deleteFolder };