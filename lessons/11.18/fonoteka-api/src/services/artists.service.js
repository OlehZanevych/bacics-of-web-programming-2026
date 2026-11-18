import * as artistsRepository from '../repositories/artists.repository.js';
import { toArtistResponse } from '../mappers/artist.mapper.js';

export async function list() {
  const rows = await artistsRepository.findAll();
  return rows.map(toArtistResponse);
}
