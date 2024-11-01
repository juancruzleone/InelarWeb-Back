import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '../../db.js';

const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

const createOrder = async (req, res) => {
    try {
        const { carrito, userId } = req.body;

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
                success: "https://inelar.vercel.app/carrito?status=success",
                failure: "https://inelar.vercel.app/carrito?status=failure",
                pending: "https://inelar.vercel.app/carrito?status=pending"
            },
            notification_url: "https://inelarweb-back.onrender.com/api/checkout/webhook",
            external_reference: userId,
            auto_return: "approved"
        };

        const result = await preference.create({ body: preferenceBody });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: error.message });
    }
};

const handlePaymentNotification = async (req, res) => {
    try {
        const { data } = req.body;
        
        if (data.type === "payment") {
            const paymentId = data.id;
            const payment = await mercadoPago.payment.findById(paymentId);

            if (payment.status === 'approved') {
                const orden = {
                    userId: payment.external_reference,
                    items: payment.additional_info.items,
                    total: payment.transaction_amount,
                    estado: 'aprobado',
                    createdAt: new Date()
                };

                const ordersCollection = db.collection('ordenes');
                await ordersCollection.insertOne(orden);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error handling payment notification:', error);
        res.status(500).json({ error: error.message });
    }
};

export {
    createOrder,
    handlePaymentNotification
};