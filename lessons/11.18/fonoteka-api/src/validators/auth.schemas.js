import { z } from 'zod';

const email = z
  .email({ error: 'Некоректна адреса електронної пошти' })
  .max(255)
  .transform((value) => value.toLowerCase());

export const signUpSchema = z
  .object({
    email,
    password: z
      .string({ error: "Пароль обов'язковий" })
      .min(8, { error: 'Мінімум 8 символів' })
      // bcrypt мовчки обрізає все, що довше за 72 байти (кирилична літера — 2 байти)
      .refine((value) => Buffer.byteLength(value) <= 72, { error: 'Максимум 72 байти' }),
  })
  .strict();

export const signInSchema = z
  .object({
    email,
    password: z.string({ error: "Пароль обов'язковий" }).min(1, { error: "Пароль обов'язковий" }),
  })
  .strict();
