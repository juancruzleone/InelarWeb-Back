import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '../../db.js';

const createOrder = async (req, res) => {
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
            estado: 'pendiente',
            createdAt: new Date(),
            mercadoPagoId: result.id
        };

        const ordersCollection = db.collection('ordenes');
        await ordersCollection.insertOne(orden);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error creating preference:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { data } = req.body;
        
        if (data.type === 'payment') {
            const ordersCollection = db.collection('ordenes');
            const order = await ordersCollection.findOne({ mercadoPagoId: data.id });

            if (order) {
                let newStatus;
                switch (data.status) {
                    case 'approved':
                        newStatus = 'pago aprobado';
                        break;
                    case 'rejected':
                        newStatus = 'pago rechazado';
                        break;
                    default:
                        newStatus = 'pendiente';
                }

                await ordersCollection.updateOne(
                    { mercadoPagoId: data.id },
                    { $set: { estado: newStatus } }
                );
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: error.message });
    }
};

export {
    createOrder,
    updateOrderStatus
};