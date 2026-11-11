export function toArtistResponse(row) {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    albumCount: row.album_count,
  };
}
