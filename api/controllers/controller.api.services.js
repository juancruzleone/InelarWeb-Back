import { db } from "../../db.js";
import { maintenanceSchema, technicalServiceSchema, installationSchema, provisionsSchema } from "../../schemas/service.schema.js";

async function insertService(service) {
  try {
    let schema;

    switch (service.category) {
      case 'mantenimiento':
        schema = maintenanceSchema;
        break;
      case 'técnico':
        schema = technicalServiceSchema;
        break;
      case 'instalaciones':
        schema = installationSchema;
        break;
      case 'provisiones':
        schema = provisionsSchema;
        break;
      default:
        throw new Error("Categoría de servicio no válida");
    }

    await schema.validate(service);

    await db.collection("servicios").insertOne({ ...service, category: service.category });
    console.log("Servicio guardado en la base de datos");
  } catch (error) {
    console.error("Error al insertar el servicio en la base de datos:", error);
    throw error;
  }
}

async function getServices() {
  try {
    const servicios = await db.collection("servicios").find().toArray();
    return servicios;
  } catch (error) {
    console.error("Error al obtener la lista de servicios:", error);
    throw error;
  }
}

export { insertService, getServices };
