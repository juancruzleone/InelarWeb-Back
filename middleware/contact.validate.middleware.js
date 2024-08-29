import { contactSchema } from '../schemas/contact.schema.js'; 

const validateContact = async (req, res, next) => {
  const { body } = req;

  try {
    await contactSchema.validate(body, { abortEarly: false });
    next();
  } catch (error) {
    res.status(400).json({ errors: error.errors });
  }
};

export { validateContact };
