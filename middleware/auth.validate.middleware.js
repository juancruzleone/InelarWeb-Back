import * as accountSchema from '../schemas/auth.schema.js';

async function validateAccount(req, res, next) {
    try {
        const cuenta = await accountSchema.cuenta.validate(req.body, { abortEarly: false, stripUnknown: true });
        req.body = cuenta;
        next();
    } catch (err) {
        const errorMessages = err.inner.map(e => e.message);
        res.status(400).json({ error: { message: 'Validation error', details: errorMessages } });
    }
}



export { validateAccount };