import yup from 'yup';

const productSchemaCreate = yup.object({
  name: yup.string().required(),
  description: yup.string().required(),
  price: yup.number().required(),
  categoria: yup.string().required(),
});

const productSchemaPatch = yup.object({
  name: yup.string(),
  description: yup.string(),
  price: yup.number(),
  categoria: yup.string(),
});

export {
  productSchemaCreate,
  productSchemaPatch
};
