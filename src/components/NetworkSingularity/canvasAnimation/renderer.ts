import {getIcon} from '../../InfrastructureChoose/canvasAnimation/icons';
import {APPEAR_DURATION, BASE_ICON_SIZE, LABEL_FONT_SIZE, LABEL_GAP} from './constants';
import {Node2D} from './types';

/**
 * Отрисовывает один узел (иконку + подпись) на канвасе
 * @param ctx - Контекст 2D канваса
 * @param node - Данные узла для отрисовки
 * @param scaleFactor - Коэффициент масштабирования
 * @param opacity - Прозрачность от 0 до 1
 * @returns void
 */
export const drawNode = (
    ctx: CanvasRenderingContext2D,
    node: Node2D,
    scaleFactor: number,
    opacity: number,
): void => {
    const img = getIcon(node.iconKey);
    if (!img) return;

    const w = BASE_ICON_SIZE * scaleFactor;
    const h = BASE_ICON_SIZE * scaleFactor;

    const drawX = node.x - w / 2;
    const drawY = node.y - h / 2;

    ctx.save();

    // Настройки отрисовки
    const drawSettings = {
        globalAlpha: opacity,
        font: `500 ${LABEL_FONT_SIZE * scaleFactor}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
        textAlign: 'center' as CanvasTextAlign,
        textBaseline: 'top' as CanvasTextBaseline,
        fillStyle: '#000000',
    };

    // Применяем настройки через Object.assign для избежания прямых присваиваний
    Object.assign(ctx, drawSettings);

    // Рисуем иконку
    ctx.drawImage(img, drawX, drawY, w, h);

    // Рисуем подпись под иконкой чёрным цветом
    ctx.fillText(node.label, node.x, drawY + h + LABEL_GAP * scaleFactor);

    ctx.restore();
};

/**
 * Вычисляет opacity для плавного появления (easeOutCubic)
 * @param currentTime - Текущее время анимации в мс
 * @param spawnDelay - Задержка появления узла в мс
 * @returns Прозрачность от 0 до 1
 */
export const calculateAppearOpacity = (currentTime: number, spawnDelay: number): number => {
    if (currentTime < spawnDelay) return 0;

    const appearElapsed = currentTime - spawnDelay;
    const appearProgress = Math.min(1, appearElapsed / APPEAR_DURATION);
    return 1 - Math.pow(1 - appearProgress, 3); // easeOutCubic
};

/**
 * Очищает канвас и устанавливает трансформацию для отрисовки
 * @param ctx - Контекст 2D канваса
 * @param width - Ширина канваса в CSS пикселях
 * @param height - Высота канваса в CSS пикселях
 * @param dpr - Device Pixel Ratio
 * @returns void
 */
export const prepareCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dpr: number,
): void => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
};
