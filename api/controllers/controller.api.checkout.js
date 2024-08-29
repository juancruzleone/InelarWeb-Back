import { MercadoPagoConfig, Preference } from 'mercadopago';
import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb+srv://juan:juan123@proyectoinelar.2eadspu.mongodb.net/');
await client.connect();  
const db = client.db("inelar");

const createOrder = async (req, res) => {
    try {
        const { carrito, estado, userId } = req.body;

        if (estado === 'aprobado') {
            return res.status(400).json({ error: 'Ya se ha aprobado una orden.' });
        }

        const mercadoPago = new MercadoPagoConfig({ accessToken: "APP_USR-4052031476279541-061615-b619da07aaa484257152a2fe9b485ce3-1861901310" });
        const preference = new Preference(mercadoPago);

        const items = carrito.map(producto => ({
            title: producto.nombre,
            unit_price: parseFloat(producto.precio),
            currency_id: "ARS",
            quantity: producto.unidades
        }));

        const preferenceBody = {
            items,
            back_urls: {
                success: "http://localhost:3000/carrito?status=success",
                failure: "http://localhost:3000/carrito?status=failure",
                pending: "http://localhost:3000/carrito?status=pending"
            },
            auto_return: "approved"
        };

        const result = await preference.create({ body: preferenceBody });

        const orden = {
            userId, 
            items: carrito,
            total: carrito.reduce((acc, producto) => acc + producto.precio * producto.unidades, 0),
            estado: result.status,
            createdAt: new Date()
        };

        const ordersCollection = db.collection('ordenes');
        await ordersCollection.insertOne(orden);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error creating preference:', error);
        res.status(500).json({ error: error.message });
    }
};

export {
    createOrder
};