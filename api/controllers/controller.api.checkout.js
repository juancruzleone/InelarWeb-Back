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

        // Guardamos los datos del carrito en la sesión
        req.session.orderData = {
            userId,
            items: carrito,
            total: carrito.reduce((acc, producto) => acc + producto.precio * producto.unidades, 0),
            createdAt: new Date()
        };

        const preferenceBody = {
            items,
            back_urls: {
                success: "https://inelaver.vercel.app/api/checkout/success",
                failure: "https://inelaver.vercel.app/api/checkout/failure",
                pending: "https://inelaver.vercel.app/api/checkout/pending"
            },
            auto_return: "approved",
            notification_url: "https://inelaver.vercel.app/api/checkout/webhook",
            external_reference: userId.toString()
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
        if (!req.session.orderData) {
            return res.redirect('https://inelaver.vercel.app/carrito?status=error');
        }

        const orden = {
            ...req.session.orderData,
            estado: 'aprobado',
            paymentId: req.query.payment_id,
            merchantOrderId: req.query.merchant_order_id
        };

        const ordersCollection = db.collection('ordenes');
        await ordersCollection.insertOne(orden);

        // Limpiamos los datos de la sesión
        delete req.session.orderData;

        res.redirect('https://inelaver.vercel.app/carrito?status=success');
    } catch (error) {
        console.error('Error handling payment success:', error);
        res.redirect('https://inelaver.vercel.app/carrito?status=error');
    }
};

const handlePaymentFailure = (req, res) => {
    delete req.session.orderData;
    res.redirect('https://inelaver.vercel.app/carrito?status=failure');
};

const handlePaymentPending = (req, res) => {
    delete req.session.orderData;
    res.redirect('https://inelaver.vercel.app/carrito?status=pending');
};

const handleWebhook = async (req, res) => {
    try {
        const { type, data } = req.body;
        
        if (type === 'payment') {
            const { id } = data;
            console.log('Payment received:', id);
            // Aquí puedes agregar lógica adicional para verificar el pago
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(500);
    }
};

export {
    createOrder,
    handlePaymentSuccess,
    handlePaymentFailure,
    handlePaymentPending,
    handleWebhook
};