import * as yup from 'yup';

const cuenta = yup.object({
    userName: yup.string()
        .trim()
        .required('El nombre de usuario es obligatorio')
        .min(6, 'El nombre de usuario debe tener al menos 6 caracteres'),
    password: yup.string()
        .required('La contraseña es obligatoria')
        .min(6, 'La contraseña debe tener al menos 6 caracteres')
});

export { cuenta };
