import * as services from "../../services/auth.services.js";
import * as tokenService from "../../services/token.service.js";

async function createAccount(req, res) {
  return services
    .createAccount(req.body)
    .then(() =>
      res.status(201).json({ message: "Cuenta creada correctamente" })
    )
    .catch((err) => res.status(400).json({ error: { message: err.message } }));
}

async function login(req, res) {
  return services
    .login(req.body)
    .then(async (cuenta) => {
      const token = await tokenService.createToken(cuenta);
      return { token, cuenta };
    })
    .then((auth) => res.status(200).json(auth))
    .catch((err) => res.status(400).json({ error: { message: err.message } }));
}

async function logout(req, res) {
  const token = req.headers["auth-token"];
  return tokenService
    .removeToken(token)
    .then(() => {
      res.status(200).json({ message: "Sesión cerrada correctamente." });
    })
    .catch((err) => {
      res.status(400).json({ error: { message: err.message } });
    });
}

async function getAllAccounts(req, res) {
  return services
    .getAllAccounts()
    .then((cuentas) => res.status(200).json(cuentas))
    .catch((err) => res.status(400).json({ error: { message: err.message } }));
}

async function getAccountById(req, res) {
  const { id } = req.params;
  return services
    .getAccountById(id)
    .then((cuenta) => {
      if (!cuenta) {
        return res.status(404).json({ error: { message: "Usuario no encontrado" } });
      }
      res.status(200).json(cuenta);
    })
    .catch((err) => res.status(400).json({ error: { message: err.message } }));
}

export { createAccount, login, logout, getAllAccounts, getAccountById };