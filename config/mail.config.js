import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

async function sendVerificationEmail(to, token) {
  // Usamos la ruta del backend para la verificación
  const verificationLink = `${process.env.BACKEND_URL}/api/auth/verify/${token}`;
  
  let transporter = createTransporter();
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: "Verificación de cuenta",
      html: `
        <p>Haz clic en el siguiente enlace para verificar tu cuenta:</p>
        <a href="${verificationLink}">Verificar cuenta</a>
      `,
    });
    console.log("Correo de verificación enviado con éxito");
  } catch (error) {
    console.error("Error al enviar el correo de verificación:", error);
    throw new Error("No se pudo enviar el correo de verificación");
  }
}

export { sendVerificationEmail };