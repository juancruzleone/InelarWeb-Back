import * as Yup from 'yup';

const installationSchema = Yup.object().shape({
  company: Yup.string()
    .required('La compañía es un campo requerido')
    .max(100, 'El nombre de la compañía no puede tener más de 100 caracteres'),
  address: Yup.string()
    .required('La dirección es un campo requerido')
    .max(255, 'La dirección no puede tener más de 255 caracteres'),
  floorSector: Yup.string()
    .max(100, 'El sector o piso no puede tener más de 100 caracteres'),
  postalCode: Yup.string()
    .max(10, 'El código postal no puede tener más de 10 caracteres'),
  city: Yup.string()
    .required('La ciudad es un campo requerido')
    .max(100, 'La ciudad no puede tener más de 100 caracteres'),
  province: Yup.string()
    .required('La provincia es un campo requerido')
    .max(100, 'La provincia no puede tener más de 100 caracteres'),
  installationType: Yup.string()
    .required('El tipo de instalación es un campo requerido')
    .oneOf(['residencial', 'comercial', 'industrial'], 'El tipo de instalación debe ser "residencial", "comercial" o "industrial"')
});

const deviceSchema = Yup.object().shape({
  nombre: Yup.string()
    .required('El nombre del dispositivo es un campo requerido')
    .min(1, 'El nombre debe tener al menos 1 carácter')
    .max(100, 'El nombre no puede tener más de 100 caracteres'),
  ubicacion: Yup.string()
    .required('La ubicación del dispositivo es un campo requerido')
    .min(1, 'La ubicación debe tener al menos 1 carácter')
    .max(255, 'La ubicación no puede tener más de 255 caracteres'),
  categoria: Yup.string()
    .required('La categoría del dispositivo es un campo requerido')
    .oneOf(['sensor', 'actuador', 'controlador'], 'La categoría debe ser "sensor", "actuador" o "controlador"')
});

export { installationSchema, deviceSchema };
