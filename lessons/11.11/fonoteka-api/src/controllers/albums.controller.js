// Контролер — тонкий шар: читає req, викликає сервіс, формує res. Жодної бізнес-логіки й SQL.
import * as albumsService from '../services/albums.service.js';

export async function list(req, res) {
  const { data, total } = await albumsService.list(req.validatedQuery);
  res.set('X-Total-Count', String(total));
  res.json(data); // Завдання №4: список — масив, кількість — у заголовку й на /count
}

export async function count(req, res) {
  res.json({ total: await albumsService.count(req.validatedQuery) });
}

export async function getById(req, res) {
  res.json(await albumsService.getById(req.validatedParams.id));
}

export async function create(req, res) {
  const album = await albumsService.create(req.validatedBody);
  res.status(201).location(`${req.baseUrl}/${album.id}`).json(album);
}

// PUT і PATCH: 204 No Content — тіло не потрібне
export async function update(req, res) {
  await albumsService.update(req.validatedParams.id, req.validatedBody);
  res.status(204).end();
}

export async function remove(req, res) {
  await albumsService.remove(req.validatedParams.id);
  res.status(204).end();
}
