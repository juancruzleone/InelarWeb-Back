// schemas/installations.schema.js

import * as Yup from 'yup';

const installationSchema = Yup.object().shape({
  company: Yup.string()
    .required('La empresa es un campo requerido')
    .min(1, 'La empresa debe tener al menos 1 carácter')
    .max(255, 'La empresa no puede tener más de 255 caracteres'),
  address: Yup.string()
    .required('La dirección es un campo requerido')
    .min(1, 'La dirección debe tener al menos 1 carácter')
    .max(255, 'La dirección no puede tener más de 255 caracteres'),
  floorSector: Yup.string()
    .required('El piso/sector es un campo requerido')
    .min(1, 'El piso/sector debe tener al menos 1 carácter')
    .max(100, 'El piso/sector no puede tener más de 100 caracteres'),
  postalCode: Yup.string()
    .required('El código postal es un campo requerido')
    .matches(/^\d{4,6}$/, 'El código postal debe tener entre 4 y 6 dígitos'),
  city: Yup.string()
    .required('La ciudad es un campo requerido')
    .min(1, 'La ciudad debe tener al menos 1 carácter')
    .max(100, 'La ciudad no puede tener más de 100 caracteres'),
  province: Yup.string()
    .required('La provincia es un campo requerido')
    .min(1, 'La provincia debe tener al menos 1 carácter')
    .max(100, 'La provincia no puede tener más de 100 caracteres'),
  installationType: Yup.string()
    .required('El tipo de instalación es un campo requerido')
    .min(1, 'El tipo de instalación debe tener al menos 1 carácter')
    .max(100, 'El tipo de instalación no puede tener más de 100 caracteres')
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
  estado: Yup.string()
    .required('El estado del dispositivo es un campo requerido')
    .oneOf(['si', 'no'], 'El estado debe ser "si" o "no"')
});

export { installationSchema, deviceSchema };
