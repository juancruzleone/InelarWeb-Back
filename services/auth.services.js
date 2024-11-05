import { db } from '../db.js';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import { sendVerificationEmail } from '../config/mail.config.js';

const cuentaCollection = db.collection("cuentas");
const verificationTokensCollection = db.collection("verificationTokens");

async function createAccount(cuenta) {
  const existe = await cuentaCollection.findOne({ userName: cuenta.userName });
  if (existe) throw new Error("La cuenta ya existe");

  const existeEmail = await cuentaCollection.findOne({ email: cuenta.email });
  if (existeEmail) throw new Error("El correo ya está registrado");

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedPassword = await bcrypt.hash(cuenta.password, 10);

  await verificationTokensCollection.insertOne({
    email: cuenta.email,
    token: verificationToken,
    userName: cuenta.userName,
    password: cuenta.password, // Guardamos la contraseña sin hash para el inicio de sesión automático
    hashedPassword, // Guardamos también la contraseña hasheada
    createdAt: new Date()
  });

  try {
    await sendVerificationEmail(cuenta.email, verificationToken);
    return { message: "Se ha enviado un correo de verificación. Por favor, verifica tu cuenta para activarla." };
  } catch (error) {
    await verificationTokensCollection.deleteOne({ email: cuenta.email });
    throw new Error("No se pudo enviar el correo de verificación. Por favor, intenta registrarte de nuevo.");
  }
}

async function verifyAccount(token) {
  const verificationData = await verificationTokensCollection.findOne({ token });
  if (!verificationData) throw new Error("Token de verificación inválido o expirado");

  const nuevaCuenta = {
    userName: verificationData.userName,
    email: verificationData.email,
    password: verificationData.hashedPassword,
    isVerified: true,
    status: 'active',
    createdAt: new Date()
  };

  await cuentaCollection.insertOne(nuevaCuenta);
  await verificationTokensCollection.deleteOne({ _id: verificationData._id });

  return { 
    verified: true, 
    userName: verificationData.userName, 
    password: verificationData.password // Devolvemos la contraseña sin hash para el inicio de sesión automático
  };
}

async function login(cuenta) {
  const existe = await cuentaCollection.findOne({ userName: cuenta.userName });
  if (!existe) throw new Error("No se pudo iniciar sesión");

  if (!existe.isVerified || existe.status !== 'active') {
    throw new Error("La cuenta no está verificada o activa. Revisa tu correo.");
  }

  const esValido = await bcrypt.compare(cuenta.password, existe.password);
  if (!esValido) throw new Error("No se pudo iniciar sesión");

  return { ...existe, password: undefined };
}

async function getAllAccounts() {
  return cuentaCollection.find({}).sort({ _id: -1 }).toArray();
}

async function getAccountById(id) {
  const cuenta = await cuentaCollection.findOne({ _id: new ObjectId(id) });
  return cuenta ? { ...cuenta, password: undefined } : null;
}

export {
  createAccount,
  verifyAccount,
  login,
  getAllAccounts,
  getAccountById
};