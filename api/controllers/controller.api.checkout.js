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
            auto_return: "approved"
        };

        const result = await preference.create({ body: preferenceBody });
        res.status(200).json(result);
    } catch (error) {
        console.error('Error creating preference:', error);
        res.status(500).json({ error: error.message });
    }
};

const handleSuccess = async (req, res) => {
    try {
        // Aquí se debe obtener la información de la transacción con el ID que MercadoPago devuelve
        const { payment_id, external_reference } = req.query;

        const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const paymentInfo = await mercadoPago.payment.findById(payment_id);

        if (paymentInfo.body.status === 'approved') {
            // Insertar la orden solo si el estado es 'approved'
            const orden = {
                userId: external_reference,
                items: paymentInfo.body.additional_info.items,
                total: paymentInfo.body.transaction_details.total_paid_amount,
                estado: 'success',
                createdAt: new Date()
            };

            const ordersCollection = db.collection('ordenes');
            await ordersCollection.insertOne(orden);
            console.log('Orden insertada con éxito');
        }

        res.redirect('/carrito?status=success');
    } catch (error) {
        console.error('Error handling success:', error);
        res.status(500).json({ error: error.message });
    }
};

export {
    createOrder,
    handleSuccess
};
