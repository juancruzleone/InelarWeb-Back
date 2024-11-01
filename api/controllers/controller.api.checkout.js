import { MercadoPagoConfig, Preference } from 'mercadopago';

const createOrder = async (req, res) => {
    try {
        const { carrito } = req.body;

        console.log('Creando preferencia de pago para el carrito:', carrito);

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
                success: "https://inelar.vercel.app/api/checkout/success",
                failure: "https://inelar.vercel.app/api/checkout/failure",
                pending: "https://inelar.vercel.app/api/checkout/pending"
            },
            auto_return: "approved",
            notification_url: "https://inelar.vercel.app/api/checkout/webhook"
        };

        const result = await preference.create({ body: preferenceBody });

        console.log('Preferencia creada exitosamente:', result);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error al crear la preferencia:', error);
        res.status(500).json({ error: error.message });
    }
};

export {
    createOrder
};