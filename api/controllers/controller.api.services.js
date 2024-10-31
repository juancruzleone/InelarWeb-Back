import { db } from "../../db.js";
import { ObjectId } from "mongodb";
import { maintenanceSchema, technicalServiceSchema, installationSchema, provisionsSchema } from "../../schemas/service.schema.js";

async function insertService(service) {
  try {
    let schema;

    switch (service.category) {
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
        throw new Error("Categoría de servicio no válida");
    }

    await schema.validate(service);

    await db.collection("servicios").insertOne({ 
      ...service, 
      category: service.category, 
      estado: "no realizado",
      createdAt: new Date() // Add creation date
    });
    console.log("Servicio guardado en la base de datos");
  } catch (error) {
    console.error("Error al insertar el servicio en la base de datos:", error);
    throw error;
  }
}

async function getServices() {
  try {
    const servicios = await db.collection("servicios")
      .find()
      .sort({ _id: -1 }) // Sort by _id in descending order
      .toArray();
    return servicios;
  } catch (error) {
    console.error("Error al obtener la lista de servicios:", error);
    throw error;
  }
}

async function updateServiceStatus(id, estado) {
  try {
    if (!['realizado', 'no realizado'].includes(estado)) {
      throw new Error("Estado no válido");
    }

    await db.collection("servicios").updateOne(
      { _id: new ObjectId(id) },
      { $set: { estado } }
    );
    console.log("Estado del servicio actualizado en la base de datos");
  } catch (error) {
    console.error("Error al actualizar el estado del servicio:", error);
    throw error;
  }
}

export { insertService, getServices, updateServiceStatus };