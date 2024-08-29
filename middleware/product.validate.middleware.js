import { productSchemaCreate, productSchemaPatch } from '../schemas/product.schema.js';
import * as service from '../services/products.services.js';

async function validateProduct(req, res, next) {
  try {
    // Verificar si se está editando un producto existente
    if (req.method === 'PUT') {
      const existingProduct = await service.getProductbyId(req.params.id);
      if (!existingProduct) {
        return res.status(404).json({ error: "Producto no encontrado." });
      }
      // Si no se proporciona una nueva imagen, mantener la existente
      if (!req.file) {
        req.body.imagen = existingProduct.imagen;
      } else {
        req.body.imagen = `/${req.file.filename}`;
      }
    } else {
      // En caso de que sea un nuevo producto, la imagen es obligatoria
      if (!req.file) {
        return res.status(400).json({ error: "La imagen es obligatoria." });
      }
      req.body.imagen = `/${req.file.filename}`;
    }

    const producto = await productSchemaCreate.validate(req.body, { abortEarly: false });
    req.body = producto;
    next();
  } catch (error) {
    res.status(400).json({ error: error.errors });
  }
}

function validateProductPatch(req, res, next) {
  if (req.file) {
    req.body.imagen = `/${req.file.filename}`;
  }

  productSchemaPatch.validate(req.body, { abortEarly: false, stripUnknown: true })
    .then((producto) => {
      req.body = producto;
      next();
    })
    .catch((error) => res.status(400).json({ error: error.errors }));
}

export {
  validateProduct,
  validateProductPatch
};
