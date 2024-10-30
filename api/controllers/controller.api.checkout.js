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
                success: "https://inelaver.vercel.app/carrito?status=success",
                failure: "https://inelaver.vercel.app/carrito?status=failure",
                pending: "https://inelaver.vercel.app/carrito?status=pending"
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

// Handler para el webhook de Mercado Pago
const handleWebhook = async (req, res) => {
    try {
        const paymentData = req.body;

        if (paymentData.type === 'payment' && paymentData.data && paymentData.data.id) {
            const paymentId = paymentData.data.id;

            const paymentInfo = await mercadoPago.payment.findById(paymentId);

            if (paymentInfo && paymentInfo.status === 'approved') {
                // Crear y guardar la orden solo si el pago es aprobado
                const { carrito, userId } = paymentInfo.metadata;
                
                const orden = {
                    userId,
                    items: carrito,
                    total: carrito.reduce((acc, producto) => acc + producto.precio * producto.unidades, 0),
                    estado: paymentInfo.status,
                    createdAt: new Date()
                };

                const ordersCollection = db.collection('ordenes');
                await ordersCollection.insertOne(orden);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.sendStatus(500);
    }
};

export {
    createOrder,
    handleWebhook
};
