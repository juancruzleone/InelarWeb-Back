import express from "express";
import session from 'express-session';
import ApiProductsRoutes from '../api/routes/route.api.products.js';
import ApiClientsRoutes from '../api/routes/route.api.clients.js';
import ApiContactRoutes from '../api/routes/route.api.contacts.js';
import ApiServicesRoutes from '../api/routes/route.api.services.js';
import ApiCheckoutRoutes from '../api/routes/route.api.checkout.js';
import ApiOrdersRoutes from '../api/routes/route.api.order.js';
import ApiProfileRoutes from '../api/routes/route.api.profile.js';
import ApiInstallationsRoutes from '../api/routes/route.api.installations.js'
import ApiAuthRoutes from '../api/routes/route.api.auth.js';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuración de sesión
app.use(session({
  secret: process.env.JWT_SECRET || 'ClaveSecreta',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

app.use(express.urlencoded({ extended: true }));
app.use("/", express.static("public"));
app.use(express.json());
app.use(cors({
  origin: 'https://inelaver.vercel.app',
  credentials: true
}));

app.use('/api', ApiProductsRoutes);
app.use('/api', ApiClientsRoutes);
app.use("/api", ApiContactRoutes);
app.use("/api", ApiServicesRoutes);
app.use("/api", ApiCheckoutRoutes);
app.use('/api', ApiOrdersRoutes);
app.use('/api', ApiProfileRoutes);
app.use('/api', ApiInstallationsRoutes);
app.use('/api', ApiAuthRoutes);

app.listen(2023, () => {
  console.log("Servidor escuchando en el puerto 2023");
});