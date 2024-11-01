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
            auto_return: "approved",
            external_reference: userId // Usamos esto para identificar al usuario
        };

        const result = await preference.create({ body: preferenceBody });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error creating preference:', error);
        res.status(500).json({ error: error.message });
    }
};

const handleOrderStatus = async (req, res) => {
    const { status, payment_id, external_reference } = req.query;

    if (status === 'success' && payment_id) {
        try {
            const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
            const payment = await mercadoPago.payment.get({ id: payment_id });

            if (payment.status === 'approved') {
                const ordersCollection = db.collection('ordenes');
                
                const orden = {
                    userId: external_reference,
                    items: payment.additional_info.items,
                    total: payment.transaction_amount,
                    estado: 'aprobado',
                    createdAt: new Date(),
                    paymentId: payment_id
                };

                await ordersCollection.insertOne(orden);
                console.log('Orden insertada con éxito:', orden);
            }
        } catch (error) {
            console.error('Error al procesar el pago exitoso:', error);
        }
    }

    // Redirigir al usuario de vuelta a la página del carrito
    res.redirect(`https://inelar.vercel.app/carrito?status=${status}`);
};

export {
    createOrder,
    handleOrderStatus
};