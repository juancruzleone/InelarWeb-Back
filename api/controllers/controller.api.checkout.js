import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { db } from '../../db.js';

const mercadoPago = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN 
});

const createOrder = async (req, res) => {
    try {
        const { carrito, userId } = req.body;

        console.log('Creando orden para usuario:', userId);
        console.log('Carrito:', JSON.stringify(carrito));

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
                success: `https://inelarweb-back.onrender.com/api/checkout/success?userId=${userId}&items=${encodeURIComponent(JSON.stringify(carrito))}`,
                failure: "https://inelar.vercel.app/carrito?status=failure",
                pending: "https://inelar.vercel.app/carrito?status=pending"
            },
            notification_url: "https://inelarweb-back.onrender.com/api/checkout/webhook",
            auto_return: "approved",
            external_reference: userId,
        };

        const result = await preference.create({ body: preferenceBody });
        console.log('Preferencia creada:', JSON.stringify(result));
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al crear preferencia:', error);
        res.status(500).json({ error: error.message });
    }
};

const successCallback = async (req, res) => {
    try {
        const { payment_id, status, userId, items } = req.query;
        
        console.log('Success callback recibido:', JSON.stringify(req.query));

        if (status === 'approved' && payment_id && userId && items) {
            const decodedItems = JSON.parse(decodeURIComponent(items));
            
            const orden = {
                userId,
                items: decodedItems,
                total: decodedItems.reduce((acc, producto) => 
                    acc + producto.precio * producto.unidades, 0),
                estado: 'approved',
                paymentId: payment_id,
                createdAt: new Date(),
                lastUpdated: new Date()
            };

            const ordersCollection = db.collection('ordenes');
            const result = await ordersCollection.insertOne(orden);
            
            console.log('Orden creada exitosamente:', JSON.stringify(result));
            console.log('Detalles de la orden:', JSON.stringify(orden));

            return res.redirect('https://inelar.vercel.app/carrito?status=success');
        } else {
            console.log('Datos incompletos en success callback');
            return res.redirect('https://inelar.vercel.app/carrito?status=incomplete');
        }
    } catch (error) {
        console.error('Error en success callback:', error);
        res.redirect('https://inelar.vercel.app/carrito?status=error');
    }
};

const handleWebhook = async (req, res) => {
    try {
        console.log('Webhook recibido:', JSON.stringify(req.body));
        
        const { type, data } = req.body;
        
        if (type === 'payment' && data.id) {
            const payment = new Payment(mercadoPago);
            const paymentInfo = await payment.get({ id: data.id });

            console.log('Información de pago:', JSON.stringify(paymentInfo));

            if (paymentInfo.status === 'approved') {
                const ordersCollection = db.collection('ordenes');
                const existingOrder = await ordersCollection.findOne({ paymentId: data.id });
                
                if (!existingOrder) {
                    // Intenta obtener los datos del pago
                    const userId = paymentInfo.external_reference;
                    const items = paymentInfo.additional_info ? JSON.parse(paymentInfo.additional_info.items) : [];

                    const orden = {
                        userId,
                        items,
                        total: items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0),
                        estado: 'approved',
                        paymentId: data.id,
                        createdAt: new Date(),
                        lastUpdated: new Date()
                    };

                    await ordersCollection.insertOne(orden);
                    console.log('Orden creada por webhook:', JSON.stringify(orden));
                } else {
                    console.log('Orden ya existente, no se crea duplicado');
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