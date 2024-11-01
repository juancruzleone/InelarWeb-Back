import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '../../db.js';

const createOrder = async (req, res) => {
    try {
        const { carrito, estado, userId } = req.body;

        // Verificar si la orden ya fue aprobada
        if (estado === 'aprobado') {
            return res.status(400).json({ error: 'Ya se ha aprobado una orden.' });
        }

        // Configuración de MercadoPago
        const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const preference = new Preference(mercadoPago);

        // Crear items para la preferencia
        const items = carrito.map(producto => ({
            title: producto.nombre,
            unit_price: parseFloat(producto.precio),
            currency_id: "ARS",
            quantity: producto.unidades
        }));

        // Configuración del cuerpo de la preferencia
        const preferenceBody = {
            items,
            back_urls: {
                success: "https://inelar.vercel.app/carrito?status=success",
                failure: "https://inelar.vercel.app/carrito?status=failure",
                pending: "https://inelar.vercel.app/carrito?status=pending"
            },
            auto_return: "approved"
        };

        // Crear la preferencia en MercadoPago
        const result = await preference.create({ body: preferenceBody });
        console.log('Resultado de MercadoPago:', result);

        // Verificar si el pago fue exitoso
        if (result.status === 'approved' || result.status === 'success') {
            const orden = {
                userId,
                items: carrito,
                total: carrito.reduce((acc, producto) => acc + producto.precio * producto.unidades, 0),
                estado: result.status,
                createdAt: new Date()
            };

            // Intentar insertar la orden en MongoDB
            try {
                const ordersCollection = db.collection('ordenes');
                await ordersCollection.insertOne(orden);
                console.log('Orden insertada:', orden);
            } catch (insertError) {
                console.error('Error al insertar la orden:', insertError);
                return res.status(500).json({ error: 'Error al insertar la orden en la base de datos.' });
            }
        } else {
            console.log('El pago no fue exitoso, estado recibido:', result.status);
            return res.status(400).json({ error: 'El pago no fue exitoso.' });
        }

        // Responder con el resultado de la preferencia
        res.status(200).json(result);
    } catch (error) {
        console.error('Error creando preferencia:', error);
        res.status(500).json({ error: error.message });
    }
};

export {
    createOrder
};