import { db } from '../db.js';
import { ObjectId } from "mongodb";

const productsCollection = db.collection("productos");

async function getProducts(filter = {}) {
    const filterMongo = { eliminado: { $ne: true } };

    if (filter.min && filter.max) {
        filterMongo.price = { $gte: parseInt(filter.min), $lte: parseInt(filter.max) };
    } else {
        if (filter.min) {
            filterMongo.price = { $gte: parseInt(filter.min) };
        }

        if (filter.max) {
            filterMongo.price = { $lte: parseInt(filter.max) };
        }
    }

    if (filter.description) {
        filterMongo.$text = { $search: filter.description };
    }

    return productsCollection.find(filterMongo)
        .sort({ _id: -1 })  
        .toArray();
}

async function getProductbyId(id) {
    return productsCollection.findOne({ _id: new ObjectId(id) });
}

const addProduct = async (producto) => {
    const result = await productsCollection.insertOne(producto);
    producto._id = result.insertedId;
    return producto;
};

const putProduct = async (id, producto) => {
    const result = await productsCollection.replaceOne({ _id: new ObjectId(id) }, producto);
    return result;
};

const editProduct = async (id, producto) => {
    const result = await productsCollection.updateOne({ _id: new ObjectId(id) }, { $set: producto });
    return result;
};

const deleteProduct = async (id) => {
    const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
    return result;
};

export {
    getProducts,
    getProductbyId,
    addProduct,
    putProduct,
    deleteProduct,
    editProduct
};