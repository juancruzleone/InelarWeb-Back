import { db } from '../../db.js';

const handleWebhook = async (req, res) => {
    try {
        console.log('Webhook recibido:', req.body);

        // Extraer información del pago y verificar que esté "approved"
        const { action, data } = req.body;

        if (action === "payment" && data.status === "approved") {
            const orden = {
                userId: data.userId,
                items: data.items,
                total: data.items.reduce((acc, producto) => acc + producto.precio * producto.unidades, 0),
                estado: "approved",
                createdAt: new Date(),
            };

            console.log('Insertando orden aprobada en la base de datos:', orden);

            const ordersCollection = db.collection('ordenes');
            await ordersCollection.insertOne(orden);

            console.log('Orden insertada exitosamente en la base de datos.');
        } else {
            console.log(`El estado de pago recibido no es "approved": ${data.status}`);
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
