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
            quantity: producto.unidades
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
               
                const orden = {
                    userId: paymentInfo.additional_info.items[0].id, // Asumiendo que el userId está en el primer ítem
                    items: paymentInfo.additional_info.items.map(item => ({
                        nombre: item.title,
                        precio: item.unit_price,
                        unidades: item.quantity
                    })),
                    total: paymentInfo.transaction_amount,
                    estado: 'approved',
                    createdAt: new Date()
                };


                await ordersCollection.insertOne(orden);
                console.log('Orden insertada con éxito:', orden);
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

