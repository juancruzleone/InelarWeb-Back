import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '../../db.js';

const createOrder = async (req, res) => {
    try {
        console.log('Iniciando creación de preferencia de pago...');
        const { carrito, userId } = req.body;

        const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const preference = new Payment(mercadoPago);

        const items = carrito.map(producto => ({
            title: producto.nombre,
            unit_price: parseFloat(producto.precio),
            currency_id: "ARS",
            quantity: producto.unidades
        }));

        console.log('Items de la preferencia:', items);

        const preferenceBody = {
            items,
            back_urls: {
                success: "https://inelar.vercel.app/carrito?status=success",
                failure: "https://inelar.vercel.app/carrito?status=failure",
                pending: "https://inelar.vercel.app/carrito?status=pending"
            },
            auto_return: "approved",
            external_reference: userId
        };

        const result = await preference.create({ body: preferenceBody });
        console.log('Preferencia creada con éxito:', result);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error al crear la preferencia de pago:', error);
        res.status(500).json({ error: error.message });
    }
};

const handleOrderStatus = async (req, res) => {
    const { status, payment_id, external_reference } = req.query;

    console.log(`Redirección a success con status: ${status}, payment_id: ${payment_id}, external_reference: ${external_reference}`);

    if (status === 'success' && payment_id) {
        try {
            console.log('Verificando estado del pago en MercadoPago...');
            const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
            const payment = await mercadoPago.payment.get({ id: payment_id });

            if (payment.body.status === 'approved') {
                console.log('Pago aprobado. Insertando orden en la base de datos...');
                const ordersCollection = db.collection('ordenes');

                const existingOrder = await ordersCollection.findOne({ paymentId: payment_id });
                if (!existingOrder) {
                    const orden = {
                        userId: external_reference,
                        items: payment.body.additional_info.items,
                        total: payment.body.transaction_amount,
                        estado: 'aprobado',
                        createdAt: new Date(),
                        paymentId: payment_id
                    };

                    try {
                        await ordersCollection.insertOne(orden);
                        console.log('Orden insertada con éxito:', orden);
                    } catch (dbError) {
                        console.error('Error al insertar la orden en la base de datos:', dbError);
                    }
                } else {
                    console.log('La orden ya existe en la base de datos. No se insertará duplicado.');
                }
            } else {
                console.log('El estado del pago no es aprobado. No se insertará la orden.');
            }
        } catch (paymentError) {
            console.error('Error al verificar el pago en MercadoPago:', paymentError);
        }
    } else {
        console.log('El status no es "success" o falta el payment_id. No se procesará la orden.');
    }

    res.redirect(`https://inelar.vercel.app/carrito?status=${status}`);
};

const webhookListener = async (req, res) => {
    try {
        console.log('Webhook recibido:', req.body);
        const { type, data } = req.body;

        if (type === 'payment') {
            console.log('Tipo de evento de webhook: pago');
            const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
            const payment = await mercadoPago.payment.get({ id: data.id });

            if (payment.body.status === 'approved') {
                console.log('Pago aprobado en webhook. Insertando orden en la base de datos...');
                const ordersCollection = db.collection('ordenes');

                const orden = {
                    userId: payment.body.external_reference,
                    items: payment.body.additional_info.items,
                    total: payment.body.transaction_amount,
                    estado: 'aprobado',
                    createdAt: new Date(),
                    paymentId: payment.body.id
                };

                try {
                    await ordersCollection.insertOne(orden);
                    console.log('Orden insertada con éxito desde el webhook:', orden);
                } catch (dbError) {
                    console.error('Error al insertar la orden desde el webhook en la base de datos:', dbError);
                }
            } else {
                console.log('El estado del pago en webhook no es aprobado. No se insertará la orden.');
            }
        } else {
            console.log('El evento del webhook no es de tipo "payment".');
        }

        res.sendStatus(200);
    } catch (webhookError) {
        console.error('Error en el webhook:', webhookError);
        res.sendStatus(500);
    }
};

export {
    createOrder,
    handleOrderStatus,
    webhookListener
};
