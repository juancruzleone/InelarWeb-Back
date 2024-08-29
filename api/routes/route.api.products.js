import { Router } from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import * as controllers from '../controllers/controller.api.products.js';
import { validateProduct, validateProductPatch } from '../../middleware/product.validate.middleware.js';
import { isAdmin } from '../../middleware/auth.role.middleware.js';
import { v2 as cloudinary } from 'cloudinary';

const route = Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'productos', // Nombre de la carpeta en Cloudinary
    allowedFormats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

const upload = multer({ storage: storage });

route.get('/productos', controllers.getProducts);
route.get('/productos/:id', controllers.getProductById);

route.all('/productos/:id', function todos(req, res, next) {
  console.log("Tengo un rol válido");
  next();
});

route.post('/productos', [upload.single('imagen'), validateProduct, isAdmin], controllers.addProduct);
route.put('/productos/:id', [upload.single('imagen'), validateProduct, isAdmin], controllers.putProduct);
route.patch('/productos/:id', [upload.single('imagen'), validateProductPatch, isAdmin], controllers.patchProduct);
route.delete('/productos/:id', isAdmin, controllers.deleteProduct);

export default route;
