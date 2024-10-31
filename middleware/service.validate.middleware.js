import { maintenanceSchema, technicalServiceSchema, installationSchema, provisionsSchema } from "../schemas/service.schema.js";

const validateService = async (req, res, next) => {
  try {
    let schema;

    switch (req.body.category) {
      case 'mantenimiento':
        schema = maintenanceSchema;
        break;
      case 'servicio técnico':
        schema = technicalServiceSchema;
        break;
      case 'instalaciones':
        schema = installationSchema;
        break;
      case 'provisiones':
        schema = provisionsSchema;
        break;
      default:
        return res.status(400).json({ error: "Categoría de servicio no válida" });
    }

    await schema.validate(req.body, { abortEarly: false });

    const currentDate = new Date();
    const selectedDate = new Date(req.body.fecha);

    if (selectedDate <= currentDate) {
      return res.status(400).json({ error: "La fecha debe ser posterior a la fecha actual" });
    }

    next();
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export { validateService };
