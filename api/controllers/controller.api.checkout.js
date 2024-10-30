import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { db } from '../../db.js';

const mercadoPago = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN 
});

const createOrder = async (req, res) => {
    try {
        const { carrito, userId } = req.body;

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
            external_reference: userId,
            metadata: {
                userId,
                items: JSON.stringify(carrito)
            }
        };

        const result = await preference.create({ body: preferenceBody });
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al crear preferencia:', error);
        res.status(500).json({ error: error.message });
    }
};

const successCallback = async (req, res) => {
    try {
        const { payment_id, status, external_reference } = req.query;
        
        if (status === 'approved' && payment_id) {
            const payment = new Payment(mercadoPago);
            const paymentInfo = await payment.get({ id: payment_id });
            
            if (paymentInfo.status === 'approved') {
                const metadata = paymentInfo.metadata;
                const items = JSON.parse(metadata.items);
                
                const orden = {
                    userId: external_reference,
                    items,
                    total: items.reduce((acc, producto) => 
                        acc + producto.precio * producto.unidades, 0),
                    estado: 'approved',
                    paymentId: payment_id,
                    createdAt: new Date(),
                    lastUpdated: new Date()
                };

                const ordersCollection = db.collection('ordenes');
                await ordersCollection.insertOne(orden);
                
                console.log('Orden creada exitosamente:', orden);
            }
        }
        
        res.redirect('https://inelar.vercel.app/carrito?status=success');
    } catch (error) {
        console.error('Error en callback de éxito:', error);
        res.redirect('https://inelar.vercel.app/carrito?status=failure');
    }
};

const handleWebhook = async (req, res) => {
    try {
        const { type, data } = req.body;
        
        if (type === 'payment' && data.id) {
            const payment = new Payment(mercadoPago);
            const paymentInfo = await payment.get({ id: data.id });

            if (paymentInfo.status === 'approved') {
                const metadata = paymentInfo.metadata;
                const items = JSON.parse(metadata.items);
                
                const orden = {
                    userId: paymentInfo.external_reference,
                    items,
                    total: items.reduce((acc, producto) => 
                        acc + producto.precio * producto.unidades, 0),
                    estado: 'approved',
                    paymentId: data.id,
                    createdAt: new Date(),
                    lastUpdated: new Date()
                };

                const ordersCollection = db.collection('ordenes');
                const existingOrder = await ordersCollection.findOne({ paymentId: data.id });
                
                if (!existingOrder) {
                    await ordersCollection.insertOne(orden);
                    console.log('Orden creada por webhook:', orden);
                }
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error procesando webhook:', error);
        res.sendStatus(500);
    }
};

export {
    createOrder,
    successCallback,
    handleWebhook
};