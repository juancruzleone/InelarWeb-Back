import * as service from "../../services/products.services.js";

const getProducts = (req, res) => {
  const filter = req.query;

  service.getProducts(filter).then((productos) => {
    res.status(200).json(productos);
  });
};

const getProductById = (req, res) => {
  const id = req.params.id;
  service.getProductbyId(id).then((producto) => {
    if (producto) {
      res.status(200).json(producto);
    } else {
      res.status(404).json();
    }
  });
};

const addProduct = async (req, res) => {
  try {
    const producto = { ...req.body, imagen: req.body.imagen };
    const newProduct = await service.addProduct(producto);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error al agregar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const putProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const existingProduct = await service.getProductbyId(id);
    if (!existingProduct) {
      return res.status(404).json();
    }

    const producto = { ...req.body, imagen: req.body.imagen || existingProduct.imagen };
    const editedProduct = await service.putProduct(id, producto);
    if (editedProduct.modifiedCount > 0) {
      res.status(200).json(producto);
    } else {
      res.status(404).json();
    }
  } catch (error) {
    console.error('Error al reemplazar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const patchProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const existingProduct = await service.getProductbyId(id);
    if (!existingProduct) {
      return res.status(404).json();
    }

    const producto = { ...req.body, imagen: req.body.imagen || existingProduct.imagen };
    const editedProduct = await service.editProduct(id, producto);
    if (editedProduct.modifiedCount > 0) {
      res.status(200).json(producto);
    } else {
      res.status(404).json();
    }
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const deleteProduct = (req, res) => {
  const id = req.params.id;
  service.deleteProduct(id)
    .then(() => {
      res.status(204).json();
    })
    .catch((error) => {
      console.error('Error al eliminar producto:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    });
};

export {
  getProducts,
  getProductById,
  addProduct,
  putProduct,
  patchProduct,
  deleteProduct,
};
