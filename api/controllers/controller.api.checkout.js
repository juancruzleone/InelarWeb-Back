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
            notification_url: "https://tu-backend-url/api/checkout/webhook",
            auto_return: "approved"
        };

        const result = await preference.create({ body: preferenceBody });

        const orden = {
            userId, 
            items: carrito,
            total: carrito.reduce((acc, producto) => acc + producto.precio * producto.unidades, 0),
            estado: 'pendiente',
            createdAt: new Date(),
            preferenceId: result.id // Cambiado de mercadoPagoId a preferenceId
        };

        const ordersCollection = db.collection('ordenes');
        await ordersCollection.insertOne(orden);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error creating preference:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        console.log('Webhook received:', req.body);
        
        const { action, data } = req.body;
        
        // Solo procesamos notificaciones de pagos
        if (action === "payment.created" || action === "payment.updated") {
            const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
            
            // Obtener los detalles del pago
            const paymentId = data.id;
            const payment = await mercadoPago.payment.get({ id: paymentId });
            
            // Obtener el preferenceId del pago
            const preferenceId = payment.preference_id;
            
            const ordersCollection = db.collection('ordenes');
            const order = await ordersCollection.findOne({ preferenceId: preferenceId });

            if (order) {
                let newStatus;
                switch (payment.status) {
                    case 'approved':
                        newStatus = 'pago aprobado';
                        break;
                    case 'rejected':
                        newStatus = 'pago rechazado';
                        break;
                    case 'pending':
                        newStatus = 'pendiente';
                        break;
                    case 'in_process':
                        newStatus = 'pendiente';
                        break;
                    default:
                        newStatus = 'pendiente';
                }

                await ordersCollection.updateOne(
                    { preferenceId: preferenceId },
                    { 
                        $set: { 
                            estado: newStatus,
                            lastUpdated: new Date(),
                            paymentId: paymentId,
                            paymentStatus: payment.status
                        } 
                    }
                );

                console.log(`Order ${preferenceId} updated to status: ${newStatus}`);
            } else {
                console.log(`Order not found for preferenceId: ${preferenceId}`);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: error.message });
    }
};

export {
    createOrder,
    updateOrderStatus
};