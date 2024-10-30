import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '../../db.js';

const createOrder = async (req, res) => {
    try {
        const { carrito, estado, userId } = req.body;

        if (estado === 'aprobado') {
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
            external_reference: userId, // Guardamos el userId como referencia
            notification_url: "https://inelarweb-back.onrender.com/api/webhook"
        };

        const result = await preference.create({ body: preferenceBody });
        res.status(200).json(result);
    } catch (error) {
        console.error('Error creating preference:', error);
        res.status(500).json({ error: error.message });
    }
};

const handlePaymentSuccess = async (req, res) => {
    try {
        const { payment_id, status, external_reference } = req.query;
        
        if (status === 'approved') {
            // Obtener información del pago desde MercadoPago
            const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
            const payment = await mercadoPago.payment.get(payment_id);
            
            // Crear la orden en MongoDB
            const orden = {
                userId: external_reference,
                payment_id,
                merchant_order_id: payment.merchant_order_id,
                items: payment.additional_info.items,
                total: payment.transaction_amount,
                estado: 'aprobado',
                createdAt: new Date()
            };

            const ordersCollection = db.collection('ordenes');
            await ordersCollection.insertOne(orden);
        }

        res.redirect('https://inelar.vercel.app/carrito?status=success');
    } catch (error) {
        console.error('Error handling payment success:', error);
        res.redirect('https://inelar.vercel.app/carrito?status=error');
    }
};

const handlePaymentFailure = async (req, res) => {
    res.redirect('https://inelar.vercel.app/carrito?status=failure');
};

const handlePaymentPending = async (req, res) => {
    res.redirect('https://inelar.vercel.app/carrito?status=pending');
};

export { createOrder, handlePaymentSuccess, handlePaymentFailure, handlePaymentPending };