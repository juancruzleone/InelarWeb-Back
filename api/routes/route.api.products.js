import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import * as controllers from '../controllers/controller.api.products.js';
import { validateProduct, validateProductPatch } from '../../middleware/product.validate.middleware.js';
import { isAdmin } from '../../middleware/auth.role.middleware.js';

const route = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'productos', resource_type: 'image' },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

route.get('/productos', controllers.getProducts);
route.get('/productos/:id', controllers.getProductById);

route.post('/productos', [upload.single('imagen'), validateProduct, isAdmin], async (req, res, next) => {
  try {
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      req.body.imagen = result.secure_url; 
    }
    next();
  } catch (error) {
    console.error('Error al subir imagen a Cloudinary:', error);
    return res.status(500).json({ error: 'Error al subir imagen' });
  }
}, controllers.addProduct);

route.put('/productos/:id', [upload.single('imagen'), validateProduct, isAdmin], async (req, res, next) => {
  try {
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      req.body.imagen = result.secure_url; 
    }
    next();
  } catch (error) {
    console.error('Error al subir imagen a Cloudinary:', error);
    return res.status(500).json({ error: 'Error al subir imagen' });
  }
}, controllers.putProduct);

route.patch('/productos/:id', [upload.single('imagen'), validateProductPatch, isAdmin], async (req, res, next) => {
  try {
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      req.body.imagen = result.secure_url; 
    }
    next();
  } catch (error) {
    console.error('Error al subir imagen a Cloudinary:', error);
    return res.status(500).json({ error: 'Error al subir imagen' });
  }
}, controllers.patchProduct);

route.delete('/productos/:id', isAdmin, controllers.deleteProduct);

export default route;