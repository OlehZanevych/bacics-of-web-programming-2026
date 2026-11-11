import { z } from 'zod';
import { queryInt } from './common.js';

export const FORMATS = ['vinyl', 'cd', 'cassette', 'digital'];
export const SORT_FIELDS = ['title', 'releaseDate', 'rating', 'trackCount', 'createdAt'];

const required = (message) => ({
  error: (issue) => (issue.input === undefined ? "Обов'язкове поле" : message),
});

// Тіло альбому для POST і PUT (повний ресурс).
// .strict() — невідомі поля відхиляються: захист від mass assignment.
export const albumCreateSchema = z
  .object({
    title: z
      .string(required('Назва має бути рядком'))
      .trim()
      .min(1, { error: "Назва обов'язкова" })
      .max(200, { error: 'Максимум 200 символів' }),
    description: z
      .string({ error: 'Опис має бути рядком' })
      .trim()
      .max(2000, { error: 'Максимум 2000 символів' })
      .nullable()
      .default(null)
      .transform((value) => value || null), // порожній рядок → null
    artistId: z
      .number(required('Потрібен id виконавця'))
      .int({ error: 'Потрібен id виконавця' })
      .positive({ error: 'Потрібен id виконавця' }),
    releaseDate: z.iso
      .date(required('Дата у форматі РРРР-ММ-ДД'))
      .refine((value) => value >= '1900-01-01', { error: 'Не раніше 1900 року' }),
    trackCount: z
      .number(required('Кількість треків — ціле число'))
      .int({ error: 'Кількість треків — ціле число' })
      .min(1, { error: 'Від 1 до 999 треків' })
      .max(999, { error: 'Від 1 до 999 треків' }),
    durationMinutes: z
      .number({ error: 'Тривалість — ціле число хвилин' })
      .int({ error: 'Тривалість — ціле число хвилин' })
      .min(1, { error: 'Від 1 до 600 хвилин' })
      .max(600, { error: 'Від 1 до 600 хвилин' })
      .nullable()
      .default(null),
    rating: z
      .number({ error: 'Оцінка — ціле число від 1 до 5' })
      .int({ error: 'Оцінка — ціле число від 1 до 5' })
      .min(1, { error: 'Оцінка — ціле число від 1 до 5' })
      .max(5, { error: 'Оцінка — ціле число від 1 до 5' })
      .nullable()
      .default(null),
    format: z.enum(FORMATS, required(`Формат: ${FORMATS.join(', ')}`)),
    inCollection: z.boolean({ error: 'Очікується true або false' }).default(false),
    coverUrl: z
      .url({ protocol: /^https?$/, error: 'Посилання має починатися з http:// або https://' })
      .max(500, { error: 'Максимум 500 символів' })
      .nullable()
      .default(null),
  })
  .strict();

// PATCH: усі поля необов'язкові, але хоча б одне має бути.
// Значення за замовчуванням прибираємо, інакше PATCH { rating: 5 } скинув би решту полів.
export const albumPatchSchema = z
  .object({
    title: albumCreateSchema.shape.title,
    description: z
      .string({ error: 'Опис має бути рядком' })
      .trim()
      .max(2000)
      .nullable()
      .transform((value) => value || null),
    artistId: albumCreateSchema.shape.artistId,
    releaseDate: albumCreateSchema.shape.releaseDate,
    trackCount: albumCreateSchema.shape.trackCount,
    durationMinutes: albumCreateSchema.shape.durationMinutes.unwrap(),
    rating: albumCreateSchema.shape.rating.unwrap(),
    format: albumCreateSchema.shape.format,
    inCollection: z.boolean({ error: 'Очікується true або false' }),
    coverUrl: albumCreateSchema.shape.coverUrl.unwrap(),
  })
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    error: 'Потрібно передати хоча б одне поле для оновлення',
    path: ['body'],
  });

// Query-параметри списку й /count: рядки → числа й булеві, межі, значення за замовчуванням
const filtersShape = {
  search: z.string().trim().max(100, { error: 'Максимум 100 символів' }).optional(),
  artistId: queryInt(1, 2_147_483_647, 'Ціле число > 0'),
  format: z.enum(FORMATS, { error: `Формат: ${FORMATS.join(', ')}` }).optional(),
  inCollection: z
    .enum(['true', 'false'], { error: 'Очікується true або false' })
    .transform((value) => value === 'true')
    .optional(),
  yearFrom: queryInt(1900, 2100, 'Рік від 1900 до 2100'),
  yearTo: queryInt(1900, 2100, 'Рік від 1900 до 2100'),
  ratingMin: queryInt(1, 5, 'Оцінка від 1 до 5'),
};

const yearRange = (data) => !data.yearFrom || !data.yearTo || data.yearFrom <= data.yearTo;
const yearRangeError = { error: 'yearFrom не може бути більшим за yearTo', path: ['yearFrom'] };

export const albumFiltersSchema = z.object(filtersShape).refine(yearRange, yearRangeError);

export const albumListQuerySchema = z
  .object({
    ...filtersShape,
    sort: z.enum(SORT_FIELDS, { error: `Сортування: ${SORT_FIELDS.join(', ')}` }).default('title'),
    order: z.enum(['asc', 'desc'], { error: 'Напрямок: asc або desc' }).default('asc'),
    limit: queryInt(1, 100, 'Ціле число від 1 до 100', 20),
    offset: queryInt(0, 1_000_000, 'Ціле число ≥ 0', 0),
  })
  .refine(yearRange, yearRangeError);
