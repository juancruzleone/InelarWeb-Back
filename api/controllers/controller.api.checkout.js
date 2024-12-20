import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { db } from '../../db.js';
import { ObjectId } from 'mongodb';

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
            id: userId // Añadimos el userId como id del primer ítem
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
       
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al crear la preferencia:', error);
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
                const usersCollection = db.collection('cuentas');
               
                const userId = paymentInfo.additional_info.items[0].id;
                
                // Obtener el email y userName del usuario
                const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
                const userEmail = user ? user.email : 'Email no disponible';
                const userName = user ? user.userName : 'Usuario no disponible';

                const orden = {
                    userId: userId,
                    email: userEmail,
                    userName: userName, // Añadimos el userName del usuario a la orden
                    items: paymentInfo.additional_info.items.map(item => ({
                        nombre: item.title,
                        precio: item.unit_price,
                        unidades: item.quantity
                    })),
                    total: paymentInfo.transaction_amount,
                    estado: 'no enviado',
                    createdAt: new Date()
                };

                await ordersCollection.insertOne(orden);
                console.log('Orden insertada con éxito:', orden);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error en el manejador del webhook:', error);
        res.sendStatus(500);
    }
};

const changeOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { estado } = req.body;

        if (!['no enviado', 'enviado'].includes(estado)) {
            return res.status(400).json({ error: 'Estado no válido' });
        }

        const ordersCollection = db.collection('ordenes');
        const result = await ordersCollection.updateOne(
            { _id: new ObjectId(orderId) },
            { $set: { estado: estado } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        res.status(200).json({ message: 'Estado de la orden actualizado con éxito' });
    } catch (error) {
        console.error('Error al cambiar el estado de la orden:', error);
        res.status(500).json({ error: error.message });
    }
};

export {
    createOrder,
    handleWebhook,
    changeOrderStatus
};