import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '../../db.js';

const createOrder = async (req, res) => {
    try {
        console.log('Iniciando createOrder con body:', req.body);
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
            notification_url: "https://inelarweb-back.onrender.com/api/checkout/webhook",
            auto_return: "approved"
        };

        const result = await preference.create({ body: preferenceBody });
        console.log('Preferencia creada:', result);

        const orden = {
            userId, 
            items: carrito,
            total: carrito.reduce((acc, producto) => acc + producto.precio * producto.unidades, 0),
            estado: 'pendiente',
            createdAt: new Date(),
            preferenceId: result.id
        };

        const ordersCollection = db.collection('ordenes');
        await ordersCollection.insertOne(orden);
        console.log('Orden creada con estado pendiente');

        res.status(200).json(result);
    } catch (error) {
        console.error('Error en createOrder:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        console.log('Webhook recibido - Body:', JSON.stringify(req.body, null, 2));
        
 
        const { status } = req.query;
        if (status) {
            console.log('Actualizando estado por back_url:', status);
            const ordersCollection = db.collection('ordenes');
            
            let newStatus;
            switch (status) {
                case 'success':
                    newStatus = 'pago aceptado';
                    break;
                case 'failure':
                    newStatus = 'pago rechazado';
                    break;
                case 'pending':
                    newStatus = 'pendiente';
                    break;
                default:
                    newStatus = 'pendiente';
            }

      
            const order = await ordersCollection.findOne(
                { estado: 'pendiente' },
                { sort: { createdAt: -1 } }
            );

            if (order) {
                await ordersCollection.updateOne(
                    { _id: order._id },
                    { 
                        $set: { 
                            estado: newStatus,
                            lastUpdated: new Date(),
                            statusSource: 'back_url'
                        } 
                    }
                );
                console.log(`Orden actualizada a ${newStatus} por back_url`);
            }
        }
        

        const { action, data } = req.body;
        if (action === "payment.created" || action === "payment.updated") {
            console.log('Procesando notificación de pago');
            const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
            
            const paymentId = data.id;
            const payment = await mercadoPago.payment.get({ id: paymentId });
            console.log('Detalles del pago:', payment);
            
            const preferenceId = payment.preference_id;
            const ordersCollection = db.collection('ordenes');
            const order = await ordersCollection.findOne({ preferenceId: preferenceId });

            if (order) {
                let newStatus;
                switch (payment.status) {
                    case 'approved':
                        newStatus = 'pago aceptado';
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
                            paymentStatus: payment.status,
                            paymentDetails: payment,
                            statusSource: 'webhook'
                        } 
                    }
                );

                console.log(`Orden ${preferenceId} actualizada a estado: ${newStatus}`);
            } else {
                console.log(`No se encontró la orden para el preferenceId: ${preferenceId}`);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error en webhook:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: error.message });
    }
};

export {
    createOrder,
    updateOrderStatus
};