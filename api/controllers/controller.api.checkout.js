import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { db } from '../../db.js';

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
                success: "https://inelar.vercel.app/carrito?status=success",
                failure: "https://inelar.vercel.app/carrito?status=failure",
                pending: "https://inelar.vercel.app/carrito?status=pending"
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
        const insertResult = await ordersCollection.insertOne(orden);
        console.log('Orden creada con estado pendiente. Resultado de la inserción:', insertResult);
        console.log('Orden completa:', orden);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error en createOrder:', error);
        res.status(500).json({ error: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        console.log('Webhook recibido:', req.body);
        
        const { action, data } = req.body;
        
        if (action === "payment.created" || action === "payment.updated") {
            const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
            const payment = new Payment(mercadoPago);
            const paymentId = data.id;
            
            try {
                // Obtener detalles del pago
                const paymentInfo = await payment.get({ id: paymentId });
                console.log('Detalles del pago:', paymentInfo);
                
                const ordersCollection = db.collection('ordenes');
                
                // Determinar el nuevo estado según el status del pago
                let newStatus;
                switch (paymentInfo.status) {
                    case 'approved':
                        newStatus = 'pago aprobado';
                        break;
                    case 'rejected':
                        newStatus = 'pago rechazado';
                        break;
                    default:
                        newStatus = 'pendiente';
                }

                // Actualizar la orden en MongoDB usando preferenceId
                const updateResult = await ordersCollection.updateOne(
                    { 
                        $or: [
                            { preferenceId: paymentInfo.preference_id },
                            { "userId": paymentInfo.external_reference }
                        ]
                    },
                    { 
                        $set: { 
                            estado: newStatus,
                            lastUpdated: new Date(),
                            paymentId: paymentId,
                            paymentStatus: paymentInfo.status,
                            paymentDetails: {
                                status: paymentInfo.status,
                                status_detail: paymentInfo.status_detail,
                                payment_method: paymentInfo.payment_method_id,
                                payment_type: paymentInfo.payment_type_id,
                                external_reference: paymentInfo.external_reference
                            }
                        } 
                    }
                );

                console.log(`Orden actualizada por webhook - Estado: ${newStatus}`, updateResult);
                
                // Obtener la orden actualizada
                const updatedOrder = await ordersCollection.findOne({ 
                    $or: [
                        { preferenceId: paymentInfo.preference_id },
                        { "userId": paymentInfo.external_reference }
                    ]
                });
                console.log('Orden actualizada completa:', updatedOrder);
            } catch (paymentError) {
                console.error('Error al obtener detalles del pago:', paymentError);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error en webhook:', error);
        res.status(200).send('OK'); // Siempre devolver 200 al webhook
    }
};

export const handleSuccess = async (req, res) => {
    try {
        console.log('Pago exitoso:', req.query);
        const { payment_id, status, external_reference, preference_id } = req.query;

        if (payment_id) {
            const ordersCollection = db.collection('ordenes');
            
            // Intentar actualizar por preferenceId y userId
            const updateResult = await ordersCollection.updateOne(
                { 
                    $or: [
                        { preferenceId: preference_id },
                        { userId: external_reference }
                    ]
                },
                { 
                    $set: { 
                        estado: 'pago aprobado',
                        paymentId: payment_id,
                        lastUpdated: new Date(),
                        successRedirectProcessed: true
                    } 
                }
            );
            
            console.log('Orden actualizada en handleSuccess:', updateResult);

            // Obtener la orden actualizada
            const updatedOrder = await ordersCollection.findOne({ 
                $or: [
                    { preferenceId: preference_id },
                    { userId: external_reference }
                ]
            });
            console.log('Estado actual de la orden:', updatedOrder.estado);
            console.log('Orden completa:', updatedOrder);

            // Obtener información completa del pago de MercadoPago
            const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
            const payment = new Payment(mercadoPago);
            const paymentInfo = await payment.get({ id: payment_id });
            console.log('Información completa del pago de MercadoPago:', paymentInfo);
        }

        res.redirect('https://inelar.vercel.app/carrito?status=success');
    } catch (error) {
        console.error('Error en handleSuccess:', error);
        res.redirect('https://inelar.vercel.app/carrito?status=error');
    }
};

export const handleFailure = async (req, res) => {
    try {
        console.log('Pago fallido:', req.query);
        const { payment_id, external_reference, preference_id } = req.query;

        if (payment_id) {
            const ordersCollection = db.collection('ordenes');
            const updateResult = await ordersCollection.updateOne(
                { 
                    $or: [
                        { preferenceId: preference_id },
                        { userId: external_reference }
                    ]
                },
                { 
                    $set: { 
                        estado: 'pago rechazado',
                        paymentId: payment_id,
                        lastUpdated: new Date()
                    } 
                }
            );
            console.log('Orden actualizada en handleFailure:', updateResult);

            // Obtener la orden actualizada
            const updatedOrder = await ordersCollection.findOne({ 
                $or: [
                    { preferenceId: preference_id },
                    { userId: external_reference }
                ]
            });
            console.log('Estado actual de la orden:', updatedOrder.estado);
            console.log('Orden completa:', updatedOrder);
        }

        res.redirect('https://inelar.vercel.app/carrito?status=failure');
    } catch (error) {
        console.error('Error en handleFailure:', error);
        res.redirect('https://inelar.vercel.app/carrito?status=error');
    }
};

export const handlePending = async (req, res) => {
    try {
        console.log('Pago pendiente:', req.query);
        const { payment_id, external_reference, preference_id } = req.query;

        if (payment_id) {
            const ordersCollection = db.collection('ordenes');
            const updateResult = await ordersCollection.updateOne(
                { 
                    $or: [
                        { preferenceId: preference_id },
                        { userId: external_reference }
                    ]
                },
                { 
                    $set: { 
                        estado: 'pendiente',
                        paymentId: payment_id,
                        lastUpdated: new Date()
                    } 
                }
            );
            console.log('Orden actualizada en handlePending:', updateResult);

            // Obtener la orden actualizada
            const updatedOrder = await ordersCollection.findOne({ 
                $or: [
                    { preferenceId: preference_id },
                    { userId: external_reference }
                ]
            });
            console.log('Estado actual de la orden:', updatedOrder.estado);
            console.log('Orden completa:', updatedOrder);
        }

        res.redirect('https://inelar.vercel.app/carrito?status=pending');
    } catch (error) {
        console.error('Error en handlePending:', error);
        res.redirect('https://inelar.vercel.app/carrito?status=error');
    }
};