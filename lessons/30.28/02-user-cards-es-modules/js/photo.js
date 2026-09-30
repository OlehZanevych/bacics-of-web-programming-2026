/* ==========================================================================
   photo.js — перетворення вибраного файлу на маленьку аватарку.

   Фото з телефона важить 3–8 МБ, а весь localStorage — близько 5 МБ.
   Тому зменшуємо зображення до 96×96 через <canvas> і зберігаємо як
   data: URL (рядок на кшталт "data:image/jpeg;base64,…", ~5 КБ).

   Зверніть увагу: і Image, і FileReader повідомляють про готовність
   ПОДІЯМИ (load / error) — це та сама модель подій, що й для кліків.
   ========================================================================== */

const AVATAR_SIZE = 96;

/**
 * @param {File} file
 * @param {(dataUrl: string) => void} onReady
 * @param {(message: string) => void} onError
 */
export function createAvatar(file, onReady, onError) {
    if (!file.type.startsWith('image/')) {
        onError(`«${file.name}» — не зображення`);
        return;
    }

    // Тимчасова адреса на файл у пам'яті браузера (blob:…)
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.addEventListener('load', () => {
        const canvas = document.createElement('canvas');   // у DOM не додаємо
        canvas.width = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;

        // Вирізаємо з центру квадрат (як object-fit: cover)
        const side = Math.min(image.naturalWidth, image.naturalHeight);
        const sx = (image.naturalWidth - side) / 2;
        const sy = (image.naturalHeight - side) / 2;

        canvas.getContext('2d')
            .drawImage(image, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

        URL.revokeObjectURL(objectUrl);   // звільняємо пам'ять
        onReady(canvas.toDataURL('image/jpeg', 0.85));
    }, { once: true });

    image.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        onError(`Не вдалося прочитати «${file.name}»`);
    }, { once: true });

    image.src = objectUrl;   // саме це запускає завантаження
}
