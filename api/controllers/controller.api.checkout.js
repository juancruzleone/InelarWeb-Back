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
                success: "https://inelar.vercel.app/carrito?status=success",
                failure: "https://inelar.vercel.app/carrito?status=failure",
                pending: "https://inelar.vercel.app/carrito?status=pending"
            },
            auto_return: "approved"
        };

        const result = await preference.create({ body: preferenceBody });
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
            const paymentInfo = await mercadoPago.payment.findById(paymentId);

            if (paymentInfo.body.status === 'approved') {
                const orden = {
                    userId: paymentInfo.body.external_reference,
                    items: paymentInfo.body.additional_info.items,
                    total: paymentInfo.body.transaction_details.total_paid_amount,
                    estado: 'success',
                    createdAt: new Date()
                };

                const ordersCollection = db.collection('ordenes');
                await ordersCollection.insertOne(orden);
                console.log('Orden insertada con éxito');
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).json({ error: error.message });
    }
};

export {
    createOrder,
    handleWebhook
};
