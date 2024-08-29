import * as yup from 'yup';

const validateService = async (req, res, next) => {
  try {
    const commonSchema = yup.object().shape({
      nombre: yup.string().required('El nombre es obligatorio'),
      email: yup.string().email('Introduce un email válido').required('El email es obligatorio'),
      telefono: yup.string().required('El teléfono es obligatorio'),
      direccion: yup.string().required('La dirección es obligatoria'),
      fecha: yup.date().required('La fecha es obligatoria'),
      category: yup.string().required('La categoría es obligatoria'),
    });

    await commonSchema.validate(req.body, { abortEarly: false });

    const categorySchema = yup.string().oneOf(['mantenimiento', 'tecnico', 'instalaciones', 'provisiones']).required();
    await categorySchema.validate(req.body.category);

    if (req.body.category === 'provisiones') {
      const provisionSchema = yup.object().shape({
        dispositivo: yup.string().required("Selecciona un dispositivo"),
        cantidad: yup.number().positive("La cantidad debe ser mayor que cero y es obligatoria").required("La cantidad es obligatoria"),
      });

      await provisionSchema.validate(req.body, { abortEarly: false });
    }

    next();
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export { validateService };
