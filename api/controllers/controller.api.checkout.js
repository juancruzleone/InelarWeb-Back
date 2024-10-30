import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '../../db.js';

const createPreference = async (req, res) => {
    try {
        const { carrito, userId } = req.body;

        const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
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
                success: `http://localhost:3000/api/checkout/success?userId=${userId}`,
                failure: "http://localhost:3000/api/checkout/failure",
                pending: "http://localhost:3000/api/checkout/pending"
            },
            auto_return: "approved",
            external_reference: userId
        };

        const result = await preference.create({ body: preferenceBody });

        const tempOrdersCollection = db.collection('tempOrders');
        await tempOrdersCollection.insertOne({
            userId,
            carrito,
            preferenceId: result.id,
            createdAt: new Date()
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error creating preference:', error);
        res.status(500).json({ error: error.message });
    }
};

const createOrder = async (req, res) => {
    try {
        const { payment_id, status, external_reference } = req.query;
        const userId = external_reference;

        if (status !== 'approved') {
            return res.redirect('http://localhost:3000/carrito?status=failure');
        }

        const tempOrdersCollection = db.collection('tempOrders');
        const tempOrder = await tempOrdersCollection.findOne({ userId });

        if (!tempOrder) {
            return res.redirect('http://localhost:3000/carrito?status=error');
        }

        const { carrito } = tempOrder;

        const orden = {
            userId, 
            items: carrito,
            total: carrito.reduce((acc, producto) => acc + producto.precio * producto.unidades, 0),
            estado: 'aprobado',
            paymentId: payment_id,
            createdAt: new Date()
        };

        const ordersCollection = db.collection('ordenes');
        await ordersCollection.insertOne(orden);

        await tempOrdersCollection.deleteOne({ userId });

        res.redirect('http://localhost:3000/carrito?status=success');
    } catch (error) {
        console.error('Error creating order:', error);
        res.redirect('http://localhost:3000/carrito?status=error');
    }
};

export {
    createPreference,
    createOrder
};