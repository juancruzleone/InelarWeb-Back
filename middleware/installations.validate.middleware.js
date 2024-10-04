import { installationSchema, deviceSchema } from '../schemas/installations.schema.js';

async function validateInstallations(req, res, next) {
  try {
    await installationSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    next();
  } catch (err) {
    const errorMessages = err.inner.map(e => e.message);
    res.status(400).json({ error: { message: 'Validation error', details: errorMessages } });
  }
}

async function validateDevice(req, res, next) {
  try {
    await deviceSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    next();
  } catch (err) {
    const errorMessages = err.inner.map(e => e.message);
    res.status(400).json({ error: { message: 'Validation error', details: errorMessages } });
  }
}

export { validateInstallations, validateDevice };
