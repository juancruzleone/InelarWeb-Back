import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '../../db.js';

const createOrder = async (req, res) => {
    try {
        const { carrito, estado, userId } = req.body;

        console.log('Creando orden para el usuario:', userId);

        if (estado === 'aprobado') {
            console.log('Intento de crear orden ya aprobada');
            return res.status(400).json({ error: 'Ya se ha aprobado una orden.' });
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
                success: "https://inelar.vercel.app/carrito?status=success",
                failure: "https://inelar.vercel.app/carrito?status=failure",
                pending: "https://inelar.vercel.app/carrito?status=pending"
            },
            auto_return: "approved",
            notification_url: "https://inelarweb-back.onrender.com/api/checkout/webhook"
        };

        const result = await preference.create({ body: preferenceBody });
        console.log('Preferencia creada:', result);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error al crear la preferencia:', error);
        res.status(500).json({ error: error.message });
    }
};

const handleWebhook = async (req, res) => {
    try {
        console.log('Webhook recibido:', req.body);

        const { type, data } = req.body;

        if (type === 'payment') {
            const paymentId = data.id;
            console.log('ID de pago recibido:', paymentId);

            // Aquí deberías usar el SDK de MercadoPago para obtener los detalles del pago
            const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
            const payment = await mercadoPago.payment.findById(paymentId);

            console.log('Detalles del pago:', payment);

            if (payment.status === 'approved') {
                console.log('Pago aprobado, insertando orden en MongoDB');

                const orden = {
                    userId: payment.additional_info.items[0].id, // Asumiendo que guardas el userId en additional_info
                    items: payment.additional_info.items,
                    total: payment.transaction_amount,
                    estado: 'aprobado',
                    createdAt: new Date()
                };

                const ordersCollection = db.collection('ordenes');
                await ordersCollection.insertOne(orden);

                console.log('Orden insertada en MongoDB:', orden);
            }
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