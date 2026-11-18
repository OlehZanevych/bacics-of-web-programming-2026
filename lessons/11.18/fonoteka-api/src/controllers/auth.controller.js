import * as authService from '../services/auth.service.js';

// Токен віддаємо і в тілі, і в заголовку Authorization — клієнт може взяти будь-який
function sendAuth(res, status, result) {
  res.set('Authorization', `Bearer ${result.token}`);
  res.status(status).json(result);
}

export async function signUp(req, res) {
  sendAuth(res, 201, await authService.signUp(req.validatedBody));
}

export async function signIn(req, res) {
  sendAuth(res, 200, await authService.signIn(req.validatedBody));
}

export async function refresh(req, res) {
  sendAuth(res, 200, await authService.refresh(req.user.id));
}

export async function me(req, res) {
  res.json(await authService.getProfile(req.user.id));
}
