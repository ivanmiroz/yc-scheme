import {
    BASE_ICON_SIZE,
    LABEL_FONT_SIZE,
    LABEL_GAP,
    MAX_CANVAS_DIMENSION,
    NODE_PADDING,
} from './constants';
import type {BBox} from './types';

/**
 * Вычисляет bounding box узла с учётом текущего scaleFactor
 * @param x - Координата X центра узла
 * @param y - Координата Y центра узла
 * @param scaleFactor - Коэффициент масштабирования
 * @returns Объект bounding box с координатами и размерами
 */
export const computeBBox = (x: number, y: number, scaleFactor: number): BBox => {
    const w = BASE_ICON_SIZE * scaleFactor;
    const h =
        BASE_ICON_SIZE * scaleFactor + LABEL_GAP * scaleFactor + LABEL_FONT_SIZE * scaleFactor;
    return {
        x: x - w / 2 - NODE_PADDING * scaleFactor,
        y: y - h / 2 - NODE_PADDING * scaleFactor,
        w: w + NODE_PADDING * scaleFactor * 2,
        h: h + NODE_PADDING * scaleFactor * 2,
    };
};

/**
 * Проверка пересечения двух прямоугольников (AABB)
 * @param a - Первый прямоугольник
 * @param b - Второй прямоугольник
 * @returns true, если прямоугольники пересекаются
 */
export const intersects = (a: BBox, b: BBox): boolean => {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
};

/**
 * Вычисляет расстояние от точки до центра
 * @param x - Координата X точки
 * @param y - Координата Y точки
 * @param centerX - Координата X центра
 * @param centerY - Координата Y центра
 * @returns Евклидово расстояние
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
 * Вычисляет коэффициент масштабирования так, чтобы иконка была 2.5% от ширины экрана
 * @param cssWidth - Ширина viewport в CSS пикселях
 * @returns Коэффициент масштабирования
 */
export const calculateScaleFactor = (cssWidth: number): number => {
    return cssWidth / 1120;
};

/**
 * Вычисляет физические размеры канваса с учётом DPR
 * @param cssWidth - Ширина viewport в CSS пикселях
 * @param cssHeight - Высота viewport в CSS пикселях
 * @returns Объект с физическими размерами канваса и DPR
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
