// Інтеграційні тести API: справжній Express-застосунок + справжня тестова база.
// Запуск: npm test (потрібні запущений Docker і база fonoteka_test).
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { closePool } from '../src/db/pool.js';
import { ADMIN, ALBUM_ID, ARTIST_ID, USER, migrate, resetData } from './helpers.js';

const api = '/api/v1';
const newAlbum = {
  title: 'Модель',
  artistId: ARTIST_ID.okean,
  releaseDate: '2001-01-01',
  trackCount: 11,
  format: 'cd',
};

async function tokenFor(credentials) {
  const response = await request(app).post(`${api}/auth/sign-in`).send(credentials).expect(200);
  return response.body.token;
}

before(migrate);
beforeEach(resetData);
after(closePool);

describe('GET /albums', () => {
  test('повертає масив і загальну кількість у X-Total-Count', async () => {
    const response = await request(app).get(`${api}/albums`).expect(200);
    assert.equal(response.body.length, 3);
    assert.equal(response.headers['x-total-count'], '3');
    assert.equal(response.body[0].artist.name, 'Океан Ельзи'); // разом із виконавцем
  });

  test('пошук без урахування регістру + фільтр + сортування', async () => {
    const response = await request(app)
      .get(`${api}/albums?search=з&inCollection=true&sort=title&order=desc`)
      .expect(200);
    assert.deepEqual(
      response.body.map((album) => album.title),
      ['Земля'], // «Без меж» не в колекції, у «Шляху» немає «з»
    );
  });

  test('пагінація: limit і offset', async () => {
    const response = await request(app)
      .get(`${api}/albums?sort=releaseDate&limit=1&offset=1`)
      .expect(200);
    assert.equal(response.body.length, 1);
    assert.equal(response.body[0].title, 'Без меж');
    assert.equal(response.headers['x-total-count'], '3');
  });

  test('некоректні query-параметри → 400 з переліком полів', async () => {
    const response = await request(app)
      .get(`${api}/albums?limit=1000&sort=password_hash`)
      .expect(400);
    const fields = response.body.errors.map((error) => error.field).sort();
    assert.deepEqual(fields, ['limit', 'sort']);
  });

  test('/albums/count враховує фільтри', async () => {
    const response = await request(app).get(`${api}/albums/count?format=vinyl`).expect(200);
    assert.deepEqual(response.body, { total: 1 });
  });
});

describe('GET /albums/:id', () => {
  test('існуючий → 200, неіснуючий → 404, не UUID → 400', async () => {
    await request(app).get(`${api}/albums/${ALBUM_ID.first}`).expect(200);
    await request(app).get(`${api}/albums/00000000-0000-4000-8000-000000000099`).expect(404);
    await request(app).get(`${api}/albums/abc`).expect(400);
  });
});

describe('POST /albums', () => {
  test('без токена → 401', async () => {
    await request(app).post(`${api}/albums`).send(newAlbum).expect(401);
  });

  test('USER створює → 201 + Location', async () => {
    const token = await tokenFor(USER);
    const response = await request(app)
      .post(`${api}/albums`)
      .set('Authorization', `Bearer ${token}`)
      .send(newAlbum)
      .expect(201);
    assert.equal(response.headers.location, `${api}/albums/${response.body.id}`);
    assert.equal(response.body.inCollection, false); // значення за замовчуванням
  });

  test('дублікат назви (без урахування регістру) → 409', async () => {
    const token = await tokenFor(USER);
    await request(app)
      .post(`${api}/albums`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newAlbum, title: 'ЗЕМЛЯ' })
      .expect(409);
  });

  test('невідоме поле й неіснуючий виконавець → 400', async () => {
    const token = await tokenFor(USER);
    const unknown = await request(app)
      .post(`${api}/albums`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newAlbum, id: 'hack' })
      .expect(400);
    assert.equal(unknown.body.errors[0].field, 'id');

    const noArtist = await request(app)
      .post(`${api}/albums`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newAlbum, artistId: 999 })
      .expect(400);
    assert.equal(noArtist.body.errors[0].field, 'artistId');
  });

  test('битий JSON → 400 у загальному форматі, без стеку', async () => {
    const response = await request(app)
      .post(`${api}/albums`)
      .set('Content-Type', 'application/json')
      .send('{ "title": ')
      .expect(400);
    assert.equal(response.body.message, 'Некоректний JSON у тілі запиту');
    assert.equal(response.body.stack, undefined);
  });
});

describe('PUT, PATCH, DELETE /albums/:id', () => {
  test('PATCH змінює лише передані поля → 204', async () => {
    const token = await tokenFor(USER);
    await request(app)
      .patch(`${api}/albums/${ALBUM_ID.second}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 2 })
      .expect(204);
    const { body } = await request(app).get(`${api}/albums/${ALBUM_ID.second}`);
    assert.equal(body.rating, 2);
    assert.equal(body.title, 'Без меж');
  });

  test('PUT замінює ресурс повністю: не передані поля стають null', async () => {
    const token = await tokenFor(USER);
    await request(app)
      .put(`${api}/albums/${ALBUM_ID.first}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newAlbum, title: 'Земля (перевидання)' })
      .expect(204);
    const { body } = await request(app).get(`${api}/albums/${ALBUM_ID.first}`);
    assert.equal(body.rating, null);
    assert.equal(body.inCollection, false);
  });

  test('id великими літерами — той самий альбом, без хибного 409', async () => {
    const token = await tokenFor(USER);
    await request(app)
      .patch(`${api}/albums/${ALBUM_ID.second.toUpperCase()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Без меж' }) // назва не змінилася — конфлікту з самим собою немає
      .expect(204);
  });

  test('DELETE: USER → 403, ADMIN → 204, повторно → 404', async () => {
    const userToken = await tokenFor(USER);
    const adminToken = await tokenFor(ADMIN);
    const url = `${api}/albums/${ALBUM_ID.third}`;
    await request(app).delete(url).set('Authorization', `Bearer ${userToken}`).expect(403);
    await request(app).delete(url).set('Authorization', `Bearer ${adminToken}`).expect(204);
    await request(app).delete(url).set('Authorization', `Bearer ${adminToken}`).expect(404);
  });
});

describe('Автентифікація', () => {
  test('реєстрація: роль завжди USER, пароль не повертається', async () => {
    const response = await request(app)
      .post(`${api}/auth/sign-up`)
      .send({ email: 'New@Test.ua', password: 'NewPass123' })
      .expect(201);
    assert.equal(response.body.user.role, 'USER');
    assert.equal(response.body.user.email, 'new@test.ua'); // пошта нормалізується
    assert.equal(response.body.user.passwordHash, undefined);
    assert.equal(response.headers.authorization, `Bearer ${response.body.token}`);
  });

  test('спроба передати role → 400; повторна пошта → 409', async () => {
    await request(app)
      .post(`${api}/auth/sign-up`)
      .send({ email: 'x@test.ua', password: 'Password1', role: 'ADMIN' })
      .expect(400);
    await request(app).post(`${api}/auth/sign-up`).send(USER).expect(409);
  });

  test('неправильний пароль і неіснуюча пошта → однакова відповідь 401', async () => {
    const wrongPassword = await request(app)
      .post(`${api}/auth/sign-in`)
      .send({ ...USER, password: 'wrong-password' })
      .expect(401);
    const noUser = await request(app)
      .post(`${api}/auth/sign-in`)
      .send({ email: 'nobody@test.ua', password: 'whatever1' })
      .expect(401);
    assert.equal(wrongPassword.body.message, noUser.body.message);
  });

  test('me і refresh-token працюють з токеном; підроблений токен → 401', async () => {
    const token = await tokenFor(ADMIN);
    const me = await request(app)
      .get(`${api}/auth/me`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    assert.equal(me.body.role, 'ADMIN');

    const refreshed = await request(app)
      .post(`${api}/auth/refresh-token`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    assert.ok(refreshed.body.token);

    await request(app)
      .get(`${api}/auth/me`)
      .set('Authorization', `Bearer ${token.slice(0, -2)}xx`)
      .expect(401);
  });
});

describe('Службові маршрути', () => {
  test('/health → 200, невідомий маршрут → 404 JSON', async () => {
    const health = await request(app).get('/health').expect(200);
    assert.equal(health.body.database, 'up');
    const missing = await request(app).get(`${api}/nope`).expect(404);
    assert.equal(missing.body.path, `${api}/nope`);
  });
});
