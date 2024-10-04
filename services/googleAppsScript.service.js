import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function createForm(category, deviceId) {
  try {
    const response = await axios.post(process.env.GOOGLE_SCRIPT_URL, {
      category,
      deviceId
    });

    if (response.data && response.data.url) {
      return response.data.url;
    } else {
      throw new Error('No se pudo obtener la URL del formulario');
    }
  } catch (error) {
    console.error('Error al crear el formulario:', error);
    throw error;
  }
}

export { createForm };