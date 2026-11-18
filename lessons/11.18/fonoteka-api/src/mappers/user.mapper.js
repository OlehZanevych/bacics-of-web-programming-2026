// password_hash НЕ потрапляє назовні НІКОЛИ
export function toUserResponse(row) {
  return { id: row.id, email: row.email, role: row.role, createdAt: row.created_at };
}
