import { db } from "../../db.js";
import { contactSchema } from "../../schemas/contact.schema.js";

async function insertContact(contact) {
  try {
    await contactSchema.validate(contact);

    await db.collection("contactos").insertOne(contact);
    console.log("Contacto guardado en la base de datos");
  } catch (error) {
    console.error("Error al insertar el contacto en la base de datos:", error);
    throw error; 
  }
}
async function getContacts() {
  try {
    const contactos = await db.collection("contactos").find().toArray();
    return contactos;
  } catch (error) {
    console.error("Error al obtener la lista de contactos:", error);
    throw error; 
  }
}

export { insertContact, getContacts };