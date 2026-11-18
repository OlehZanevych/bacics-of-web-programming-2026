// Сервіс альбомів: бізнес-правила. НЕ знає про HTTP (жодних req, res, статусів).
import * as albumsRepository from '../repositories/albums.repository.js';
import * as artistsRepository from '../repositories/artists.repository.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors/index.js';
import { toAlbumResponse } from '../mappers/album.mapper.js';

export async function list(query) {
  const { sort, order, limit, offset, ...filters } = query;

  // Сторінка даних і загальна кількість — два незалежні запити, виконуємо паралельно
  const [rows, total] = await Promise.all([
    albumsRepository.findAll({ filters, sort, order, limit, offset }),
    albumsRepository.count(filters),
  ]);

  return { data: rows.map(toAlbumResponse), total, limit, offset };
}

export async function count(filters) {
  return albumsRepository.count(filters);
}

export async function getById(id) {
  const album = await albumsRepository.findById(id);
  if (!album) throw new NotFoundError('Альбом');
  return toAlbumResponse(album);
}

// Правило: назва альбому унікальна (без урахування регістру)
async function ensureTitleIsFree(title, exceptId = null) {
  const existing = await albumsRepository.findByTitle(title);
  if (existing && existing.id !== exceptId) {
    throw new ConflictError(`Альбом «${existing.title}» уже є у фонотеці`);
  }
}

// Правило: виконавець, на якого посилається альбом, має існувати
async function ensureArtistExists(artistId) {
  if (artistId !== undefined && !(await artistsRepository.findById(artistId))) {
    throw new ValidationError([
      { field: 'artistId', message: `Виконавця з id ${artistId} не існує` },
    ]);
  }
}

export async function create(data) {
  await ensureTitleIsFree(data.title);
  await ensureArtistExists(data.artistId);
  return toAlbumResponse(await albumsRepository.create(data));
}

/** І PUT (усі поля), і PATCH (лише передані) — різницю забезпечує схема валідації */
export async function update(id, data) {
  const existing = await albumsRepository.findById(id);
  if (!existing) throw new NotFoundError('Альбом');

  if (data.title !== undefined) await ensureTitleIsFree(data.title, id);
  await ensureArtistExists(data.artistId);

  await albumsRepository.update(id, data);
}

export async function remove(id) {
  const deleted = await albumsRepository.remove(id);
  if (!deleted) throw new NotFoundError('Альбом');
}
