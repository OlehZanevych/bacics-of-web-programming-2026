import * as artistsService from '../services/artists.service.js';

export async function list(req, res) {
  res.json(await artistsService.list());
}
