import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { db } from '../../db.js';

const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

const createOrder = async (req, res) => {
    try {
        const { carrito, userId } = req.body;

        console.log('Creando orden para el usuario:', userId);

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
                success: "https://inelarweb-back.onrender.com/api/checkout/success",
                failure: "https://inelarweb-back.onrender.com/api/checkout/failure",
                pending: "https://inelarweb-back.onrender.com/api/checkout/pending"
            },
            auto_return: "approved",
            notification_url: "https://inelarweb-back.onrender.com/api/checkout/webhook",
            external_reference: userId
        };

        const result = await preference.create({ body: preferenceBody });
        console.log('Preferencia creada:', JSON.stringify(result, null, 2));

        res.status(200).json(result);
    } catch (error) {
        console.error('Error al crear la preferencia:', error);
        res.status(500).json({ error: error.message });
    }
};

const handleSuccess = async (req, res) => {
    try {
        console.log('Pago exitoso:', req.query);
        const { payment_id, status, external_reference } = req.query;

        if (status === 'approved') {
            console.log('Pago aprobado, obteniendo detalles del pago');

            const payment = await new Payment(mercadoPago).get({ id: payment_id });
            console.log('Detalles del pago:', JSON.stringify(payment, null, 2));

            const orden = {
                userId: external_reference,
                items: payment.additional_info.items,
                total: payment.transaction_amount,
                estado: 'aprobado',
                createdAt: new Date(),
                paymentId: payment.id
            };

            const ordersCollection = db.collection('ordenes');
            const result = await ordersCollection.insertOne(orden);

            console.log('Orden insertada en MongoDB:', result.insertedId);
        }

        res.redirect('https://inelar.vercel.app/carrito?status=success');
    } catch (error) {
        console.error('Error al procesar el pago exitoso:', error);
        res.redirect('https://inelar.vercel.app/carrito?status=error');
    }
};

const handleWebhook = async (req, res) => {
    try {
        console.log('Webhook recibido:', JSON.stringify(req.body, null, 2));

        const { type, data } = req.body;

        if (type === 'payment') {
            const paymentId = data.id;
            console.log('ID de pago recibido en webhook:', paymentId);

            const payment = await new Payment(mercadoPago).get({ id: paymentId });
            console.log('Detalles del pago en webhook:', JSON.stringify(payment, null, 2));

            if (payment.status === 'approved') {
                console.log('Pago aprobado en webhook, verificando si la orden ya existe');

                const ordersCollection = db.collection('ordenes');
                const existingOrder = await ordersCollection.findOne({ paymentId: payment.id });

                if (!existingOrder) {
                    console.log('Orden no existe, insertando en MongoDB');

                    const orden = {
                        userId: payment.external_reference,
                        items: payment.additional_info.items,
                        total: payment.transaction_amount,
                        estado: 'aprobado',
                        createdAt: new Date(),
                        paymentId: payment.id
                    };

                    const result = await ordersCollection.insertOne(orden);
                    console.log('Orden insertada en MongoDB desde webhook:', result.insertedId);
                } else {
                    console.log('Orden ya existe en MongoDB, no se inserta nuevamente');
                }
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
    handleSuccess,
    handleWebhook
};