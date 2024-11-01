import { db } from '../../db.js';

const handleWebhook = async (req, res) => {
    try {
        console.log('Webhook recibido:', req.body);

        const paymentStatus = req.body.data?.status;
        const userId = req.body.data?.userId;
        const carrito = req.body.data?.items;

        console.log(`Estado del pago recibido: ${paymentStatus}`);

        if (paymentStatus === 'approved') {
            const orden = {
                userId,
                items: carrito,
                total: carrito.reduce((acc, producto) => acc + producto.precio * producto.unidades, 0),
                estado: 'approved',
                createdAt: new Date(),
            };

            console.log('Insertando orden en la base de datos:', orden);

            const ordersCollection = db.collection('ordenes');
            await ordersCollection.insertOne(orden);

            console.log('Orden insertada exitosamente en la base de datos.');
        } else {
            console.log(`El pago no fue aprobado. Estado actual: ${paymentStatus}`);
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
