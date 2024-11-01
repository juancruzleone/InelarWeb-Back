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
                success: "https://inelar.vercel.app/carrito?status=success",
                failure: "https://inelar.vercel.app/carrito?status=failure",
                pending: "https://inelar.vercel.app/carrito?status=pending"
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

const handleWebhook = async (req, res) => {
    try {
        console.log('Webhook recibido:', JSON.stringify(req.body, null, 2));

        const { type, data } = req.body;

        if (type === 'payment') {
            const paymentId = data.id;
            console.log('ID de pago recibido:', paymentId);

            const payment = new Payment(mercadoPago);
            const paymentData = await payment.get({ id: paymentId });
            console.log('Detalles del pago:', JSON.stringify(paymentData, null, 2));

            if (paymentData.status === 'approved') {
                console.log('Pago aprobado, verificando si la orden ya existe');

                const ordersCollection = db.collection('ordenes');
                const existingOrder = await ordersCollection.findOne({ paymentId: paymentData.id });

                if (!existingOrder) {
                    console.log('Orden no existe, insertando en MongoDB');

                    const orden = {
                        userId: paymentData.external_reference,
                        items: paymentData.additional_info.items,
                        total: paymentData.transaction_amount,
                        estado: 'aprobado',
                        createdAt: new Date(),
                        paymentId: paymentData.id,
                        paymentDetails: {
                            status: paymentData.status,
                            status_detail: paymentData.status_detail,
                            payment_method: paymentData.payment_method_id,
                            payment_type: paymentData.payment_type_id,
                            merchant_order_id: paymentData.merchant_order_id
                        },
                        webhookReceived: true
                    };

                    const result = await ordersCollection.insertOne(orden);
                    console.log('Orden insertada en MongoDB:', result.insertedId);
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
    handleWebhook
};