import { Router } from 'express';
import multer from 'multer';
import * as controllers from '../controllers/controller.api.products.js';
import { validateProduct, validateProductPatch } from '../../middleware/product.validate.middleware.js';
import { isAdmin } from '../../middleware/auth.role.middleware.js'; 
import fs from 'fs';

const route = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const directory = '../front/public'; 
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    cb(null, directory);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

route.get('/productos', controllers.getProducts);
route.get('/productos/:id', controllers.getProductById);

route.all('/productos/:id', function todos(req, res, next) {
  console.log("tengo un rol valido");
  next();
});

route.post('/productos', [upload.single('imagen'), validateProduct, isAdmin], controllers.addProduct);
route.put('/productos/:id', [upload.single('imagen'), validateProduct, isAdmin], controllers.putProduct);
route.patch('/productos/:id', [upload.single('imagen'), validateProductPatch, isAdmin], controllers.patchProduct);
route.delete('/productos/:id', isAdmin, controllers.deleteProduct);

export default route;
