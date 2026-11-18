import bcrypt from 'bcrypt';
import * as usersRepository from '../repositories/users.repository.js';
import { generateToken } from './token.service.js';
import { ConflictError, UnauthorizedError } from '../errors/index.js';
import { toUserResponse } from '../mappers/user.mapper.js';

// 2^12 ітерацій ≈ 200–300 мс на хеш: швидко для людини, дорого для перебору
const SALT_ROUNDS = 12;

export async function signUp({ email, password }) {
  if (await usersRepository.findByEmail(email)) {
    throw new ConflictError('Користувач із такою поштою вже існує');
  }

  // Сіль генерується автоматично й зберігається всередині хеша
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // ⚠️ Роль НІКОЛИ не береться з запиту — інакше кожен зареєструється як ADMIN
  const user = await usersRepository.create({ email, passwordHash, role: 'USER' });
  return { user: toUserResponse(user), token: generateToken(user) };
}

export async function signIn({ email, password }) {
  const user = await usersRepository.findByEmail(email);

  // Однакове повідомлення для «немає пошти» й «неправильний пароль» — не підказуємо зловмиснику
  if (!user) {
    await bcrypt.hash(password, SALT_ROUNDS); // вирівнюємо час відповіді (timing attack)
    throw new UnauthorizedError('Неправильна пошта або пароль');
  }
  if (!(await bcrypt.compare(password, user.password_hash))) {
    throw new UnauthorizedError('Неправильна пошта або пароль');
  }

  return { user: toUserResponse(user), token: generateToken(user) };
}

// Обмін ще дійсного токена на новий (спрощена схема без окремого refresh-токена).
// Роль беремо з бази, а не зі старого токена: якщо адміністратор змінив роль,
// новий токен уже міститиме актуальну
export async function refresh(userId) {
  const user = await usersRepository.findById(userId);
  if (!user) throw new UnauthorizedError('Користувача не знайдено');
  return { user: toUserResponse(user), token: generateToken(user) };
}

export async function getProfile(userId) {
  const user = await usersRepository.findById(userId);
  if (!user) throw new UnauthorizedError('Користувача не знайдено');
  return toUserResponse(user);
}
