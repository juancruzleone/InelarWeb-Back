import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '../../db.js';

const createOrder = async (req, res) => {
    try {
        const { carrito, userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'UserId es requerido.' });
        }

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
            auto_return: "approved",
            metadata: {
                userId: userId
            }
        };

        const result = await preference.create({ body: preferenceBody });

        const orden = {
            userId, 
            items: carrito,
            total: carrito.reduce((acc, producto) => acc + parseFloat(producto.precio) * producto.unidades, 0),
            estado: null,
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

const handleWebhook = async (req, res) => {
    try {
        const { type, data } = req.body;

        if (type === 'payment') {
            const paymentId = data.id;
            const payment = await mercadoPago.payment.findById(paymentId);

            if (payment.status === 'approved') {
                const ordersCollection = db.collection('ordenes');
                const userId = payment.metadata.userId;

                await ordersCollection.updateOne(
                    { userId: userId, estado: null },
                    { 
                        $set: { 
                            estado: 'approved',
                            updatedAt: new Date()
                        }
                    }
                );

                console.log('Orden actualizada con éxito');
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error in webhook handler:', error);
        res.sendStatus(500);
    }
};

export {
    createOrder,
    handleWebhook
};