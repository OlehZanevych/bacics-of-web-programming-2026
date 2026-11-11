// REST-сервер БЕЗ фреймворку — лише вбудований модуль node:http.
// Не для продакшену: щоб побачити, що саме Express зробить за нас.
// Запуск: npm run demo:http   (порт 3001, щоб не заважати основному серверу)

import http from 'node:http';

const PORT = 3001;

// «Сховище» в пам'яті: зникає після перезапуску
const albums = [
    { id: '1', title: 'Гірська весна', year: 2014 },
    { id: '2', title: 'Остання зупинка', year: 2012 },
    { id: '3', title: 'Тиша між нотами', year: 2010 },
];

// Відповідь JSON: статус, заголовки, тіло — усе вручну
function sendJson(res, status, data) {
    const body = JSON.stringify(data);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
}

// Тіло запиту приходить ПОТОКОМ шматків (chunks) — збираємо й розбираємо самі
function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;

        req.on('data', (chunk) => {
            size += chunk.length;
            // захист від величезного тіла: зайве не зберігаємо в пам'яті
            if (size <= 100_000) chunks.push(chunk);
        });

        req.on('end', () => {
            if (size > 100_000) {
                reject(Object.assign(new Error('Завелике тіло запиту'), { status: 413 }));
                return;
            }
            const raw = Buffer.concat(chunks).toString('utf8');
            try {
                resolve(raw ? JSON.parse(raw) : null);
            } catch {
                reject(Object.assign(new Error('Некоректний JSON'), { status: 400 }));
            }
        });

        req.on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const { pathname } = url;
    console.log(req.method, url.pathname + url.search);

    try {
        // GET /api/albums?search=…
        if (req.method === 'GET' && pathname === '/api/albums') {
            const search = url.searchParams.get('search')?.toLowerCase() ?? '';
            const data = albums.filter((album) => album.title.toLowerCase().includes(search));
            return sendJson(res, 200, { data, total: data.length });
        }

        // GET /api/albums/:id — параметр шляху витягуємо регулярним виразом
        const match = pathname.match(/^\/api\/albums\/([\w-]+)$/);
        if (req.method === 'GET' && match) {
            const album = albums.find((item) => item.id === match[1]);
            if (!album) return sendJson(res, 404, { message: 'Альбом не знайдено' });
            return sendJson(res, 200, album);
        }

        // POST /api/albums
        if (req.method === 'POST' && pathname === '/api/albums') {
            const body = await readJsonBody(req);

            if (typeof body?.title !== 'string' || body.title.trim() === '') {
                return sendJson(res, 400, { message: "Поле title обов'язкове" });
            }
            const title = body.title.trim();
            if (albums.some((album) => album.title.toLowerCase() === title.toLowerCase())) {
                return sendJson(res, 409, { message: 'Альбом із такою назвою вже є' });
            }

            const album = { id: crypto.randomUUID(), title, year: body.year ?? null };
            albums.push(album);
            res.setHeader('Location', `/api/albums/${album.id}`);
            return sendJson(res, 201, album);
        }

        // GET /api/slow — БЛОКУЄ цикл подій на 5 секунд синхронними обчисленнями
        if (req.method === 'GET' && pathname === '/api/slow') {
            const end = Date.now() + 5000;
            while (Date.now() < end) {
                // «важкі обчислення»: увесь сервер чекає
            }
            return sendJson(res, 200, { message: 'Нарешті!' });
        }

        return sendJson(res, 404, { message: `Маршрут ${req.method} ${pathname} не знайдено` });
    } catch (error) {
        if (error.status) return sendJson(res, error.status, { message: error.message });
        console.error(error);
        return sendJson(res, 500, { message: 'Внутрішня помилка сервера' });
    }
});

server.listen(PORT, () => {
    console.log(`Сервер без фреймворку: http://localhost:${PORT}/api/albums`);
});