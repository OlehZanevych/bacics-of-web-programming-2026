import { z } from 'zod';

// Повідомлення за замовчуванням — українською (для перевірок без власного тексту)
z.config(z.locales.uk());

/** Параметр шляху :id для альбомів (UUID) */
export const uuidParamSchema = z.object({
  // PostgreSQL повертає UUID малими літерами; приводимо й параметр, щоб порівняння id збігалися
  id: z.uuid({ error: 'Некоректний ідентифікатор' }).transform((value) => value.toLowerCase()),
});

/** Параметр шляху :id для довідників (ціле число > 0) */
export const intIdParamSchema = z.object({
  id: z.coerce
    .number({ error: 'Некоректний ідентифікатор' })
    .int({ error: 'Некоректний ідентифікатор' })
    .positive({ error: 'Некоректний ідентифікатор' })
    .max(2_147_483_647, { error: 'Некоректний ідентифікатор' }),
});

/**
 * Query-параметр → ціле число в межах [min, max]. У query усе — рядки (або масив, якщо
 * параметр повторено), тому перетворюємо самі: порожній рядок = «фільтр не задано».
 */
export function queryInt(min, max, message, defaultValue) {
  const number = z
    .number({ error: message })
    .int({ error: message })
    .min(min, { error: message })
    .max(max, { error: message });

  return z.preprocess(
    (value) => (value === undefined || String(value).trim() === '' ? undefined : Number(value)),
    defaultValue === undefined ? number.optional() : number.default(defaultValue),
  );
}
