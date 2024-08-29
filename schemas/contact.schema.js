import * as yup from "yup";

const contactSchema = yup.object().shape({
  name: yup.string().required("El nombre es obligatorio"),
  email: yup.string().email("El correo electrónico debe ser válido").required("El correo electrónico es obligatorio"),
  message: yup.string().required("El mensaje es obligatorio"),
});

export { contactSchema };
