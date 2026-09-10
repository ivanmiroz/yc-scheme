import {
    BASE_ICON_SIZE,
    LABEL_FONT_SIZE,
    LABEL_GAP,
    MAX_CANVAS_DIMENSION,
    NODE_BBOX_PADDING,
} from './constants';
import type {BBox} from './types';

/**
 * Offscreen canvas для измерения текста — создаётся один раз, лениво.
 */
let measureCtx: CanvasRenderingContext2D | null = null;

/**
 * Лениво создаёт 2D-контекст offscreen-канваса для измерения текста.
 *
 * @returns Общий 2D-контекст или null, если document недоступен.
 */
const getMeasureContext = (): CanvasRenderingContext2D | null => {
    if (measureCtx) return measureCtx;
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    measureCtx = c.getContext('2d');
    return measureCtx;
};

/**
 * Измеряет ширину подписи тем же шрифтом, что используется в renderer.drawNode.
 *
 * @param label - Текст подписи.
 * @param scaleFactor - Коэффициент масштабирования относительно базового размера.
 * @returns Ширина текста в пикселях.
 */
const measureLabelWidth = (label: string, scaleFactor: number): number => {
    const ctx = getMeasureContext();
    if (!ctx) return 0;
    const textHeight = LABEL_FONT_SIZE * scaleFactor;
    ctx.font = `500 ${textHeight}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    return ctx.measureText(label).width;
};

/**
 * Вычисляет bounding box узла — рамку вокруг иконки и подписи
 * ПЛЮС внутреннюю «подушку» NODE_BBOX_PADDING со всех сторон.
 *
 * Это гарантирует, что A* (который дополнительно применяет
 * NODE_AVOIDANCE_MARGIN) проложит линию на безопасном расстоянии
 * и от иконки, и от текста.
 *
 * Для пустого узла (label === '') возвращает bbox нулевого размера.
 *
 * @param x - X-координата центра узла.
 * @param y - Y-координата центра иконки.
 * @param scaleFactor - Коэффициент масштабирования.
 * @param label - Текст подписи (пустая строка — пустой узел).
 * @returns Прямоугольник bbox'а.
 */
export const computeBBox = (x: number, y: number, scaleFactor: number, label = ''): BBox => {
    if (!label) {
        return {x, y, w: 0, h: 0};
    }

    const iconW = BASE_ICON_SIZE * scaleFactor;
    const iconH = BASE_ICON_SIZE * scaleFactor;
    const textH = LABEL_FONT_SIZE * scaleFactor;
    const gap = LABEL_GAP * scaleFactor;
    const pad = NODE_BBOX_PADDING * scaleFactor;

    const textWidth = measureLabelWidth(label, scaleFactor);

    const contentW = Math.max(iconW, textWidth);
    const contentH = iconH + gap + textH;

    const w = contentW + pad * 2;
    const h = contentH + pad * 2;

    // Центр bbox по X совпадает с центром узла, по Y bbox начинается
    // от верхнего края иконки минус padding.
    return {
        x: x - w / 2,
        y: y - iconH / 2 - pad,
        w,
        h,
    };
};

/**
 * Проверка пересечения двух прямоугольников (AABB).
 *
 * @param a - Первый прямоугольник.
 * @param b - Второй прямоугольник.
 * @returns true, если прямоугольники пересекаются.
 */
export const intersects = (a: BBox, b: BBox): boolean => {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
};

/**
 * Вычисляет расстояние от точки до центра.
 *
 * @param x - X-координата точки.
 * @param y - Y-координата точки.
 * @param centerX - X-координата центра.
 * @param centerY - Y-координата центра.
 * @returns Расстояние между точкой и центром.
 */
export const distanceToCenter = (
    x: number,
    y: number,
    centerX: number,
    centerY: number,
): number => {
    const dx = x - centerX;
    const dy = y - centerY;
    return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Вычисляет расстояние между двумя точками.
 *
 * @param x1 - X первой точки.
 * @param y1 - Y первой точки.
 * @param x2 - X второй точки.
 * @param y2 - Y второй точки.
 * @returns Расстояние между точками.
 */
export const distanceBetween = (x1: number, y1: number, x2: number, y2: number): number => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Вычисляет коэффициент масштабирования так, чтобы иконка была ~2.5% от ширины экрана.
 *
 * @param cssWidth - Ширина канваса в CSS-пикселях.
 * @returns Коэффициент масштабирования.
 */
export const calculateScaleFactor = (cssWidth: number): number => {
    return cssWidth / 1120;
};

/**
 * Вычисляет физические размеры канваса с учётом DPR.
 *
 * @param cssWidth - Ширина в CSS-пикселях.
 * @param cssHeight - Высота в CSS-пикселях.
 * @returns Физические размеры канваса и применённый DPR.
 */
export const calculateCanvasDimensions = (
    cssWidth: number,
    cssHeight: number,
): {width: number; height: number; dpr: number} => {
    const maxCssDim = Math.max(cssWidth, cssHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const targetPhysical = maxCssDim * dpr;

    if (targetPhysical > MAX_CANVAS_DIMENSION) {
        dpr = MAX_CANVAS_DIMENSION / maxCssDim;
    }

    return {
        width: Math.floor(cssWidth * dpr),
        height: Math.floor(cssHeight * dpr),
        dpr,
    };
};
