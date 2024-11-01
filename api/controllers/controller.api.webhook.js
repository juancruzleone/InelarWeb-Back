import { db } from '../../db.js';
import axios from 'axios';

const handleWebhook = async (req, res) => {
    try {
        console.log('Webhook recibido:', req.body);

        const { action, data } = req.body;

        if (action === "payment") {
            const paymentId = data.id;

            // Consultamos la API de Mercado Pago para obtener el estado y los detalles del pago
            const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
                }
            });

            const paymentData = response.data;

            // Verificamos si el estado del pago es "approved"
            if (paymentData.status === "approved") {
                const orden = {
                    userId: paymentData.payer.id || null,
                    items: paymentData.additional_info.items.map(item => ({
                        nombre: item.title,
                        precio: item.unit_price,
                        unidades: item.quantity
                    })),
                    total: paymentData.transaction_amount,
                    estado: "approved",
                    createdAt: new Date(),
                };

                console.log('Insertando orden aprobada en la base de datos:', orden);

                const ordersCollection = db.collection('ordenes');
                await ordersCollection.insertOne(orden);

                console.log('Orden insertada exitosamente en la base de datos.');
            } else {
                console.log(`El estado de pago recibido no es "approved": ${paymentData.status}`);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error al procesar el webhook:', error);
        res.status(500).send('Error procesando el webhook');
    }
};

export {
    handleWebhook
};
