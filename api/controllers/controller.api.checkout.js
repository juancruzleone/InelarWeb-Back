import { MercadoPagoConfig, Preference } from 'mercadopago';
import { ObjectId } from 'mongodb';
import { db } from '../../db.js';

const createOrder = async (req, res) => {
    try {
        const { carrito, userId } = req.body;

        const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const preference = new Preference(mercadoPago);

        const orden = {
            userId, 
            items: carrito,
            total: carrito.reduce((acc, producto) => acc + producto.precio * producto.unidades, 0),
            estado: 'pendiente',
            createdAt: new Date()
        };

        const ordersCollection = db.collection('ordenes');
        const result = await ordersCollection.insertOne(orden);
        const orderId = result.insertedId.toString();

        const items = carrito.map(producto => ({
            title: producto.nombre,
            unit_price: parseFloat(producto.precio),
            currency_id: "ARS",
            quantity: producto.unidades
        }));

        const preferenceBody = {
            items,
            external_reference: orderId,
            back_urls: {
                success: `${process.env.FRONTEND_URL}/carrito?status=success&external_reference=${orderId}`,
                failure: `${process.env.FRONTEND_URL}/carrito?status=failure&external_reference=${orderId}`,
                pending: `${process.env.FRONTEND_URL}/carrito?status=pending&external_reference=${orderId}`
            },
            notification_url: `${process.env.BACKEND_URL}/api/checkout/webhook`,
            auto_return: "approved"
        };

        const preferenceResult = await preference.create({ body: preferenceBody });
        res.status(200).json(preferenceResult);
    } catch (error) {
        console.error('Error creating preference:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateOrderStatus = async (orderId, status) => {
    try {
        const ordersCollection = db.collection('ordenes');
        await ordersCollection.updateOne(
            { _id: new ObjectId(orderId) },
            { $set: { estado: status } }
        );
    } catch (error) {
        console.error('Error updating order status:', error);
    }
};

const handleWebhook = async (req, res) => {
    try {
        const { type, data } = req.body;
        
        if (type === 'payment') {
            const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
            const payment = await mercadoPago.payment.findById(data.id);
            
            const orderId = payment.external_reference;
            let status;
            
            switch (payment.status) {
                case 'approved':
                    status = 'aprobado';
                    break;
                case 'rejected':
                    status = 'rechazado';
                    break;
                case 'pending':
                    status = 'pendiente';
                    break;
                default:
                    status = 'pendiente';
            }
            
            await updateOrderStatus(orderId, status);
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error('Error in webhook:', error);
        res.sendStatus(500);
    }
};

export {
    createOrder,
    handleWebhook,
    updateOrderStatus
};