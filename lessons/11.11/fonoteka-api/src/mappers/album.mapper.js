// Мапер: рядок таблиці (snake_case) → те, що бачить клієнт (camelCase).
// Контракт API не залежить від назв стовпців у базі.
export function toAlbumResponse(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    artist: { id: row.artist_id, name: row.artist_name, country: row.artist_country },
    releaseDate: row.release_date,
    trackCount: row.track_count,
    durationMinutes: row.duration_minutes,
    rating: row.rating,
    format: row.format,
    inCollection: row.in_collection,
    coverUrl: row.cover_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
