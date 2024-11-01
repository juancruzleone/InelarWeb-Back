import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
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
            auto_return: "approved",
            external_reference: userId,
            notification_url: "https://inelarweb-back.onrender.com/api/checkout/webhook"
        };

        const result = await preference.create({ body: preferenceBody });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error creating preference:', error);
        res.status(500).json({ error: error.message });
    }
};

const handleWebhook = async (req, res) => {
    console.log('Webhook received:', req.body);
    try {
        const { type, data } = req.body;
        
        if (type === "payment") {
            const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
            const paymentClient = new Payment(mercadoPago);
            const payment = await paymentClient.get({ id: data.id });
            
            console.log('Payment data:', payment);

            if (payment.status === 'approved') {
                const userId = payment.external_reference;
                const ordersCollection = db.collection('ordenes');
                
                const orden = {
                    userId, 
                    items: payment.additional_info.items,
                    total: payment.transaction_amount,
                    estado: 'aprobado',
                    createdAt: new Date(),
                    paymentId: payment.id
                };

                const result = await ordersCollection.insertOne(orden);
                console.log('Orden insertada con éxito:', result);
            } else {
                console.log('Pago no aprobado. Estado:', payment.status);
            }
        } else {
            console.log('Evento no relevante:', type);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error en el webhook:', error);
        res.sendStatus(500);
    }
};

export {
    createOrder,
    handleWebhook
};