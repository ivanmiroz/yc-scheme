import {
    BASE_ICON_SIZE,
    LABEL_FONT_SIZE,
    LABEL_GAP,
    MAX_CANVAS_DIMENSION,
    NODE_BBOX_PADDING,
    TEXT_BG_PADDING_X,
    TEXT_BG_PADDING_Y,
} from './constants';
import type {BBox} from './types';

let measureCtx: CanvasRenderingContext2D | null = null;

const getMeasureContext = (): CanvasRenderingContext2D | null => {
    if (measureCtx) return measureCtx;
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    measureCtx = c.getContext('2d');
    return measureCtx;
};

const measureLabelWidth = (label: string, scaleFactor: number): number => {
    const ctx = getMeasureContext();
    if (!ctx) return 0;
    const textHeight = LABEL_FONT_SIZE * scaleFactor;
    ctx.font = `500 ${textHeight}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    return ctx.measureText(label).width;
};

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
    const textBgPadX = TEXT_BG_PADDING_X * scaleFactor;
    const textBgPadY = TEXT_BG_PADDING_Y * scaleFactor;

    // ширина контента = максимум из иконки и текста с подложкой
    const contentW = Math.max(iconW, textWidth + textBgPadX * 2);
    // высота контента = иконка + gap + текст + вертикальная подложка (сверху и снизу)
    const contentH = iconH + gap + textH + textBgPadY * 2;

    const w = contentW + pad * 2;
    const h = contentH + pad * 2;

    return {
        x: x - w / 2,
        y: y - iconH / 2 - pad,
        w,
        h,
    };
};

export const intersects = (a: BBox, b: BBox): boolean => {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
};

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

export const distanceBetween = (x1: number, y1: number, x2: number, y2: number): number => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
};

const BASE_CANVAS_WIDTH_FOR_SCALE = 1120;

export const calculateScaleFactor = (cssWidth: number): number => {
    return cssWidth / BASE_CANVAS_WIDTH_FOR_SCALE;
};

export const calculateCanvasDimensions = (
    cssWidth: number,
    cssHeight: number,
): {width: number; height: number; dpr: number} => {
    const maxCssDim = Math.max(cssWidth, cssHeight);
    const deviceDpr = window.devicePixelRatio || 1;

    // Кламп DPR нужен только чтобы физический размер канваса
    // не превысил MAX_CANVAS_DIMENSION. На обычных экранах
    // (Full HD / 2K / Retina) он не срабатывает, и используется
    // реальный DPR — иконки и текст перестают мылиться.
    const maxCssSizeForDpr = MAX_CANVAS_DIMENSION / deviceDpr;
    const dpr = maxCssDim > maxCssSizeForDpr ? MAX_CANVAS_DIMENSION / maxCssDim : deviceDpr;

    return {
        width: Math.floor(cssWidth * dpr),
        height: Math.floor(cssHeight * dpr),
        dpr,
    };
};
