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

        // Guardamos temporalmente los datos del carrito en la sesión
        req.session.orderData = {
            userId,
            items: carrito,
            total: carrito.reduce((acc, producto) => acc + producto.precio * producto.unidades, 0),
            createdAt: new Date()
        };

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

const handlePaymentSuccess = async (req, res) => {
    try {
        // Verificamos que tengamos los datos de la orden en la sesión
        if (!req.session.orderData) {
            return res.redirect('https://inelar.vercel.app/carrito?status=error');
        }

        // Creamos la orden en MongoDB solo cuando el pago es exitoso
        const orden = {
            ...req.session.orderData,
            estado: 'aprobado',
            payment_id: req.query.payment_id,
            merchant_order_id: req.query.merchant_order_id
        };

        const ordersCollection = db.collection('ordenes');
        await ordersCollection.insertOne(orden);

        // Limpiamos los datos de la sesión
        delete req.session.orderData;

        // Redirigimos al usuario a la página de éxito
        res.redirect('https://inelar.vercel.app/carrito?status=success');
    } catch (error) {
        console.error('Error handling payment success:', error);
        res.redirect('https://inelar.vercel.app/carrito?status=error');
    }
};

export { createOrder, handlePaymentSuccess };