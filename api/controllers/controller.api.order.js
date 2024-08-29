import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb+srv://juan:juan123@proyectoinelar.2eadspu.mongodb.net/');
await client.connect();
const db = client.db("inelar");

const getAllOrders = async (req, res) => {
    try {
        const ordersCollection = db.collection('ordenes');
        const orders = await ordersCollection.find().toArray();
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: error.message });
    }
};

export {
    getAllOrders
};
