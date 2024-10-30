import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '../../db.js';
import { ObjectId } from 'mongodb';

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
            auto_return: "approved",
            external_reference: userId // Agregamos el userId como referencia
        };

        const result = await preference.create({ body: preferenceBody });
        console.log('Preferencia creada:', result);

        const orden = {
            userId, 
            items: carrito,
            total: carrito.reduce((acc, producto) => acc + producto.precio * producto.unidades, 0),
            estado: 'pendiente',
            createdAt: new Date(),
            preferenceId: result.id,
            lastUpdated: new Date()
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

const handleSuccess = async (req, res) => {
    try {
        const { payment_id, preference_id } = req.query;
        console.log('Success handler - Query params:', req.query);

        const ordersCollection = db.collection('ordenes');
        
        const result = await ordersCollection.updateOne(
            { preferenceId: preference_id },
            {
                $set: {
                    estado: 'pago aprobado',
                    lastUpdated: new Date(),
                    paymentId: payment_id,
                    statusSource: 'success_redirect'
                }
            }
        );

        console.log('Orden actualizada en success handler:', result);
        res.redirect('https://inelar.vercel.app/carrito?status=success');
    } catch (error) {
        console.error('Error en success handler:', error);
        res.redirect('https://inelar.vercel.app/carrito?status=error');
    }
};

const handleFailure = async (req, res) => {
    try {
        const { payment_id, preference_id } = req.query;
        console.log('Failure handler - Query params:', req.query);

        const ordersCollection = db.collection('ordenes');
        
        const result = await ordersCollection.updateOne(
            { preferenceId: preference_id },
            {
                $set: {
                    estado: 'pago rechazado',
                    lastUpdated: new Date(),
                    paymentId: payment_id,
                    statusSource: 'failure_redirect'
                }
            }
        );

        console.log('Orden actualizada en failure handler:', result);
        res.redirect('https://inelar.vercel.app/carrito?status=failure');
    } catch (error) {
        console.error('Error en failure handler:', error);
        res.redirect('https://inelar.vercel.app/carrito?status=error');
    }
};

const handlePending = async (req, res) => {
    try {
        const { payment_id, preference_id } = req.query;
        console.log('Pending handler - Query params:', req.query);

        const ordersCollection = db.collection('ordenes');
        
        const result = await ordersCollection.updateOne(
            { preferenceId: preference_id },
            {
                $set: {
                    estado: 'pendiente',
                    lastUpdated: new Date(),
                    paymentId: payment_id,
                    statusSource: 'pending_redirect'
                }
            }
        );

        console.log('Orden actualizada en pending handler:', result);
        res.redirect('https://inelar.vercel.app/carrito?status=pending');
    } catch (error) {
        console.error('Error en pending handler:', error);
        res.redirect('https://inelar.vercel.app/carrito?status=error');
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        console.log('Webhook recibido - Body completo:', JSON.stringify(req.body, null, 2));
        
        const { action, data } = req.body;
        
        if (action === "payment.created" || action === "payment.updated") {
            const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
            
            const paymentId = data.id;
            console.log('Obteniendo detalles del pago:', paymentId);
            
            const payment = await mercadoPago.payment.get({ id: paymentId });
            console.log('Detalles del pago:', payment);
            
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
                    case 'in_process':
                    default:
                        newStatus = 'pendiente';
                        break;
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
    updateOrderStatus,
    handleSuccess,
    handleFailure,
    handlePending
};
