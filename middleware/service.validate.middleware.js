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

    next();
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export { validateService };
