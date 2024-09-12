import * as yup from 'yup';

const commonFields = {
  nombre: yup.string().required("El nombre es obligatorio"),
  email: yup.string().email("Introduce un email válido").required("El email es obligatorio"),
  telefono: yup.string().required("El teléfono es obligatorio"),
  direccion: yup.string().required("La dirección es obligatoria"),
  fecha: yup.date().required("La fecha es obligatoria").test('is-future-date', 'La fecha debe ser posterior a la fecha actual', function(value) {
    const today = new Date();
    return value > today;
  }),
};

const maintenanceSchema = yup.object().shape({
  ...commonFields,
  dispositivo: yup.string().required("Selecciona un dispositivo"),
  cantidad: yup.number().positive("La cantidad debe ser mayor que cero").required("La cantidad es obligatoria"),
});

const technicalServiceSchema = yup.object().shape({
  ...commonFields,
  dispositivo: yup.string().required("Selecciona un dispositivo"),
  problema: yup.string().required("Describe el problema"),
});

const installationSchema = yup.object().shape({
  ...commonFields,
  dispositivo: yup.string().required("Selecciona un dispositivo"),
});

const provisionsSchema = yup.object().shape({
  ...commonFields,
  dispositivo: yup.string().required("Selecciona un dispositivo"),
  cantidad: yup.number().positive("La cantidad debe ser mayor que cero").required("La cantidad es obligatoria"),
});

export { maintenanceSchema, technicalServiceSchema, installationSchema, provisionsSchema };
