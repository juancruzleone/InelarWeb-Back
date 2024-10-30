import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '../../db.js';

// Crear orden y preferencia de pago
export const createOrder = async (req, res) => {
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
                success: "https://inelar.vercel.app/api/checkout/success",
                failure: "https://inelar.vercel.app/api/checkout/failure",
                pending: "https://inelar.vercel.app/api/checkout/pending"
            },
            notification_url: "https://inelarweb-back.onrender.com/api/checkout/webhook",
            auto_return: "approved",
            external_reference: userId
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

// Actualizar estado de la orden según el webhook de MercadoPago
export const updateOrderStatus = async (req, res) => {
    try {
        console.log('Webhook recibido:', req.body);
        
        const { action, data } = req.body;
        
        if (action === "payment.created" || action === "payment.updated") {
            const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
            const paymentId = data.id;
            
            // Obtener detalles del pago
            const payment = await mercadoPago.payment.findById({ id: paymentId });
            console.log('Detalles del pago:', payment);
            
            const ordersCollection = db.collection('ordenes');
            
            // Determinar el nuevo estado según el status del pago
            let newStatus;
            switch (payment.status) {
                case 'approved':
                    newStatus = 'pago aprobado';
                    break;
                case 'rejected':
                    newStatus = 'pago rechazado';
                    break;
                default:
                    newStatus = 'pendiente';
            }

            // Actualizar la orden en MongoDB
            const updateResult = await ordersCollection.updateOne(
                { preferenceId: payment.preference_id },
                { 
                    $set: { 
                        estado: newStatus,
                        lastUpdated: new Date(),
                        paymentId: paymentId,
                        paymentStatus: payment.status
                    } 
                }
            );

            console.log(`Orden actualizada - Estado: ${newStatus}`, updateResult);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error en webhook:', error);
        res.status(500).json({ error: error.message });
    }
};

// Manejador de redirección para pago exitoso
export const handleSuccess = async (req, res) => {
    try {
        console.log('Pago exitoso:', req.query);
        const { payment_id, status, external_reference } = req.query;

        if (payment_id && status === 'approved') {
            const ordersCollection = db.collection('ordenes');
            const updateResult = await ordersCollection.updateOne(
                { userId: external_reference, estado: 'pendiente' },
                { 
                    $set: { 
                        estado: 'pago aprobado',
                        paymentId: payment_id,
                        lastUpdated: new Date()
                    } 
                }
            );
            console.log('Orden actualizada en handleSuccess:', updateResult);
        }

        res.redirect('https://inelar.vercel.app/carrito?status=success&modal=exito');
    } catch (error) {
        console.error('Error en handleSuccess:', error);
        res.redirect('https://inelar.vercel.app/carrito?status=error');
    }
};

// Manejador de redirección para pago fallido
export const handleFailure = async (req, res) => {
    try {
        console.log('Pago fallido:', req.query);
        const { payment_id, status, external_reference } = req.query;

        if (payment_id) {
            const ordersCollection = db.collection('ordenes');
            const updateResult = await ordersCollection.updateOne(
                { userId: external_reference, estado: 'pendiente' },
                { 
                    $set: { 
                        estado: 'pago rechazado',
                        paymentId: payment_id,
                        lastUpdated: new Date()
                    } 
                }
            );
            console.log('Orden actualizada en handleFailure:', updateResult);
        }

        res.redirect('https://inelar.vercel.app/carrito?status=failure');
    } catch (error) {
        console.error('Error en handleFailure:', error);
        res.redirect('https://inelar.vercel.app/carrito?status=error');
    }
};

// Manejador de redirección para pago pendiente
export const handlePending = async (req, res) => {
    try {
        console.log('Pago pendiente:', req.query);
        const { payment_id, external_reference } = req.query;

        if (payment_id) {
            const ordersCollection = db.collection('ordenes');
            const updateResult = await ordersCollection.updateOne(
                { userId: external_reference, estado: 'pendiente' },
                { 
                    $set: { 
                        paymentId: payment_id,
                        lastUpdated: new Date()
                    } 
                }
            );
            console.log('Orden actualizada en handlePending:', updateResult);
        }

        res.redirect('https://inelar.vercel.app/carrito?status=pending');
    } catch (error) {
        console.error('Error en handlePending:', error);
        res.redirect('https://inelar.vercel.app/carrito?status=error');
    }
};