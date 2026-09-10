/* eslint-disable no-param-reassign -- CanvasRenderingContext2D по дизайну
   мутирует свои свойства (fillStyle, font, textAlign и т.д.) — это идиоматично. */

import {getIcon} from '../../InfrastructureChoose/canvasAnimation/icons';
import {
    APPEAR_DURATION,
    BASE_ICON_SIZE,
    BASE_LINE_WIDTH,
    CONNECTION_POINT_RADIUS,
    LABEL_FONT_SIZE,
    LABEL_GAP,
    LINE_COLOR,
    LINE_CORNER_RADIUS,
} from './constants';
import {LineStyle, Node2D, Point} from './types';

/**
 * Отрисовывает один узел (иконку + подпись + точку соединения) на канвасе.
 * Без фона — иконка и текст рисуются напрямую поверх линий.
 *
 * @param ctx - 2D-контекст канваса.
 * @param node - Узел, который нужно отрисовать.
 * @param scaleFactor - Коэффициент масштабирования относительно базового размера.
 * @param opacity - Прозрачность (0..1), используется при появлении.
 * @returns Ничего не возвращает.
 */
export const drawNode = (
    ctx: CanvasRenderingContext2D,
    node: Node2D,
    scaleFactor: number,
    opacity: number,
): void => {
    ctx.save();
    ctx.globalAlpha = opacity;

    if (!node.isEmpty) {
        const img = getIcon(node.iconKey);
        if (img) {
            const iconW = BASE_ICON_SIZE * scaleFactor;
            const iconH = BASE_ICON_SIZE * scaleFactor;
            const textHeight = LABEL_FONT_SIZE * scaleFactor;

            const iconX = node.x - iconW / 2;
            const iconY = node.y - iconH / 2;

            // Рисуем иконку
            ctx.drawImage(img, iconX, iconY, iconW, iconH);

            // Рисуем подпись под иконкой
            const textY = iconY + iconH + LABEL_GAP * scaleFactor;
            ctx.font = `500 ${textHeight}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(node.label, node.x, textY);
        }
    }

    // Рисуем точку соединения (кружочек)
    const connRadius = CONNECTION_POINT_RADIUS * scaleFactor;
    const connY = node.isEmpty ? node.y : node.connectionPoint.y;

    ctx.beginPath();
    ctx.arc(node.x, connY, connRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = BASE_LINE_WIDTH * scaleFactor;
    ctx.stroke();

    ctx.restore();
};

/**
 * Отрезает от полилинии её начальную часть, длина которой равна
 * `progress * totalLength`.
 *
 * @param points - Точки полилинии (первая — старт, последняя — конец).
 * @param progress - Доля длины (0..1), которую нужно оставить.
 * @returns Новая полилиния, обрезанная по указанной доле длины.
 */
const slicePath = (points: Point[], progress: number): Point[] => {
    const n = points.length;
    if (n < 2) return points;
    if (progress >= 1) return points;

    const segLens: number[] = [];
    let total = 0;
    for (let i = 1; i < n; i++) {
        const l = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
        segLens.push(l);
        total += l;
    }

    const target = total * Math.max(0, progress);

    const result: Point[] = [points[0]];
    let acc = 0;
    for (let i = 1; i < n; i++) {
        const l = segLens[i - 1];
        if (acc + l <= target) {
            result.push(points[i]);
            acc += l;
        } else {
            const t = l > 0 ? (target - acc) / l : 0;
            result.push({
                x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
                y: points[i - 1].y + (points[i].y - points[i - 1].y) * t,
            });
            break;
        }
    }
    return result;
};

/**
 * Отрисовывает полилинию, которая плавно "растёт" от начала к концу,
 * со скруглёнными поворотами.
 *
 * @param ctx - 2D-контекст канваса.
 * @param points - Точки маршрута (первая — старт, последняя — конец).
 * @param scaleFactor - Коэффициент масштабирования относительно базового размера.
 * @param progress - Прогресс отрисовки от 0.0 до 1.0.
 * @param lineStyle - Стиль линии ('solid', 'dashed' или 'snake').
 * @returns Ничего не возвращает.
 */
export const drawGrowingPath = (
    ctx: CanvasRenderingContext2D,
    points: Point[],
    scaleFactor: number,
    progress: number,
    lineStyle: LineStyle = 'solid',
): void => {
    if (progress <= 0 || points.length < 2) return;

    const sliced = slicePath(points, Math.min(1, progress));
    const n = sliced.length;
    if (n < 2) return;

    const radius = LINE_CORNER_RADIUS * scaleFactor;

    const segLens: number[] = [];
    for (let i = 1; i < n; i++) {
        segLens.push(Math.hypot(sliced[i].x - sliced[i - 1].x, sliced[i].y - sliced[i - 1].y));
    }

    ctx.save();
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = BASE_LINE_WIDTH * scaleFactor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (lineStyle === 'dashed') {
        const dashLength = 8 * scaleFactor;
        const gapLength = 4 * scaleFactor;
        ctx.setLineDash([dashLength, gapLength]);
    }

    ctx.beginPath();
    ctx.moveTo(sliced[0].x, sliced[0].y);

    for (let i = 1; i < n - 1; i++) {
        const r = Math.min(radius, segLens[i - 1] / 2, segLens[i] / 2);
        if (r > 0.5) {
            ctx.arcTo(sliced[i].x, sliced[i].y, sliced[i + 1].x, sliced[i + 1].y, r);
        } else {
            ctx.lineTo(sliced[i].x, sliced[i].y);
        }
    }

    ctx.lineTo(sliced[n - 1].x, sliced[n - 1].y);
    ctx.stroke();
    ctx.restore();
};

/**
 * Вычисляет opacity для плавного появления (easeOutCubic).
 *
 * @param currentTime - Текущее время анимации (мс от старта).
 * @param spawnDelay - Задержка появления узла (мс от старта).
 * @returns Прозрачность от 0 (ещё не появился) до 1 (полностью виден).
 */
export const calculateAppearOpacity = (currentTime: number, spawnDelay: number): number => {
    if (currentTime < spawnDelay) return 0;

    const appearElapsed = currentTime - spawnDelay;
    const appearProgress = Math.min(1, appearElapsed / APPEAR_DURATION);
    return 1 - Math.pow(1 - appearProgress, 3); // easeOutCubic
};

/**
 * Очищает канвас и устанавливает трансформацию для отрисовки.
 *
 * @param ctx - 2D-контекст канваса.
 * @param width - Ширина в CSS-пикселях.
 * @param height - Высота в CSS-пикселях.
 * @param dpr - Device pixel ratio.
 * @returns Ничего не возвращает.
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
