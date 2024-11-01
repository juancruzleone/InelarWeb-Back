import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { db } from '../../db.js';

const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

const createOrder = async (req, res) => {
    try {
        const { carrito, userId } = req.body;
        const preference = new Preference(mercadoPago);

        const items = carrito.map(producto => ({
            title: producto.nombre,
            unit_price: parseFloat(producto.precio),
            currency_id: "ARS",
            quantity: producto.unidades,
            id: userId // Añadimos el userId a cada ítem
        }));

        const preferenceBody = {
            items,
            back_urls: {
                success: "https://inelar.vercel.app/carrito?status=success",
                failure: "https://inelar.vercel.app/carrito?status=failure",
                pending: "https://inelar.vercel.app/carrito?status=pending"
            },
            auto_return: "approved",
            notification_url: "https://inelarweb-back.onrender.com/api/webhook"
        };

        const result = await preference.create({ body: preferenceBody });

        // Creamos la orden en la base de datos
        const orden = {
            userId,
            items: carrito,
            total: carrito.reduce((acc, producto) => acc + producto.precio * producto.unidades, 0),
            estado: 'pending',
            createdAt: new Date()
        };

        const ordersCollection = db.collection('ordenes');
        await ordersCollection.insertOne(orden);
       
        res.status(200).json(result);
    } catch (error) {
        console.error('Error creating preference:', error);
        res.status(500).json({ error: error.message });
    }
};

const handleWebhook = async (req, res) => {
    try {
        const { type, data } = req.body;

        if (type === 'payment') {
            const paymentApi = new Payment(mercadoPago);
            const paymentInfo = await paymentApi.get({ id: data.id });
           
            if (paymentInfo.status === 'approved') {
                const ordersCollection = db.collection('ordenes');
               
                const userId = paymentInfo.additional_info.items[0].id; // Obtenemos el userId del primer ítem

                // Actualizamos la orden existente
                await ordersCollection.updateOne(
                    { userId: userId, estado: 'pending' },
                    { 
                        $set: { 
                            estado: 'approved',
                            total: paymentInfo.transaction_amount,
                            updatedAt: new Date()
                        }
                    }
                );

                console.log('Orden actualizada con éxito para el usuario:', userId);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error in webhook handler:', error);
        res.sendStatus(500);
    }
};

export {
    createOrder,
    handleWebhook
};