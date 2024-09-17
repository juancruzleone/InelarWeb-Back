import { db } from '../db.js';
import bcrypt from 'bcrypt';

const cuentaCollection = db.collection("cuentas");

async function createAccount(cuenta) {
    const existe = await cuentaCollection.findOne({ userName: cuenta.userName });
    if (existe) throw new Error("cuenta ya existe");

    const existeEmail = await cuentaCollection.findOne({ email: cuenta.email });
    if (existeEmail) throw new Error("El correo ya está registrado");

    const nuevaCuenta = { ...cuenta };
    nuevaCuenta.password = await bcrypt.hash(cuenta.password, 10);

    await cuentaCollection.insertOne(nuevaCuenta);
}

async function login(cuenta) {
    const existe = await cuentaCollection.findOne({ userName: cuenta.userName });
    if (!existe) throw new Error("No me pude logear");

    const esValido = await bcrypt.compare(cuenta.password, existe.password);
    if (!esValido) throw new Error("No me pude logear");

    return { ...existe, password: undefined };
}

// Nueva función para obtener todas las cuentas
async function getAllAccounts() {
    return cuentaCollection.find({}).toArray(); // Retorna todas las cuentas
}

export {
    createAccount,
    login,
    getAllAccounts // Exportar nueva función
};
