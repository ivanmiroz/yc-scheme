/* eslint-disable no-param-reassign */

import {getIcon} from './icons';
import {
    BASE_ICON_SIZE,
    BASE_LINE_WIDTH,
    CONNECTION_POINT_RADIUS,
    LABEL_FONT_SIZE,
    LABEL_GAP,
    LINE_COLOR,
    LINE_CORNER_RADIUS,
    TEXT_BG_COLOR,
    TEXT_BG_PADDING_X,
    TEXT_BG_PADDING_Y,
    TEXT_BG_RADIUS,
} from './constants';
import {LineStyle, Node2D, Point} from './types';

const slicePath = (
    points: Point[],
    progress: number,
    lengths?: number[],
    totalLength?: number,
): Point[] => {
    const n = points.length;
    if (n < 2 || !lengths || !totalLength) return points;
    if (progress >= 1) return points;

    const target = totalLength * Math.max(0, progress);
    const result: Point[] = [points[0]];

    for (let i = 1; i < lengths.length; i++) {
        if (lengths[i] <= target) {
            result.push(points[i]);
        } else {
            const prevLen = lengths[i - 1];
            const segLen = lengths[i] - prevLen;
            const t = segLen > 0 ? (target - prevLen) / segLen : 0;
            result.push({
                x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
                y: points[i - 1].y + (points[i].y - points[i - 1].y) * t,
            });
            break;
        }
    }
    return result;
};

const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
): void => {
    const radius = Math.min(r, w / 2, h / 2);

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
};

export const drawGrowingPath = (
    ctx: CanvasRenderingContext2D,
    points: Point[],
    scaleFactor: number,
    progress: number,
    lineStyle: LineStyle = 'solid',
    lengths?: number[],
    totalLength?: number,
): void => {
    if (progress <= 0 || points.length < 2) return;

    const sliced = slicePath(points, Math.min(1, progress), lengths, totalLength);
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

export const drawNode = (
    ctx: CanvasRenderingContext2D,
    node: Node2D,
    scaleFactor: number,
    opacity: number,
): void => {
    ctx.globalAlpha = opacity;

    if (!node.isEmpty) {
        const img = getIcon(node.iconKey);
        if (img) {
            const iconW = BASE_ICON_SIZE * scaleFactor;
            const iconH = BASE_ICON_SIZE * scaleFactor;

            const iconX = node.x - iconW / 2;
            const iconY = node.y - iconH / 2;

            ctx.drawImage(img, iconX, iconY, iconW, iconH);

            // ===== ПОДЛОЖКА ПОД ТЕКСТОМ =====
            const textY = iconY + iconH + LABEL_GAP * scaleFactor;
            const textWidth = ctx.measureText(node.label).width;
            const textHeight = LABEL_FONT_SIZE * scaleFactor;
            const bgPadX = TEXT_BG_PADDING_X * scaleFactor;
            const bgPadY = TEXT_BG_PADDING_Y * scaleFactor;

            const bgX = node.x - textWidth / 2 - bgPadX;
            const bgY = textY - bgPadY;
            const bgW = textWidth + bgPadX * 2;
            const bgH = textHeight + bgPadY * 2;
            const bgRadius = TEXT_BG_RADIUS * scaleFactor;

            ctx.fillStyle = TEXT_BG_COLOR;
            drawRoundedRect(ctx, bgX, bgY, bgW, bgH, bgRadius);
            ctx.fill();

            // ===== ТЕКСТ =====
            ctx.fillStyle = '#000000';
            ctx.fillText(node.label, node.x, textY);
        }
    }

    const connRadius = CONNECTION_POINT_RADIUS * scaleFactor;
    const connY = node.isEmpty ? node.y : node.connectionPoint.y;

    ctx.beginPath();
    ctx.arc(node.x, connY, connRadius, 0, Math.PI * 2);

    // Точка закрашивается основным цветом линии
    ctx.fillStyle = LINE_COLOR;
    ctx.fill();

    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = BASE_LINE_WIDTH * scaleFactor;
    ctx.stroke();

    ctx.globalAlpha = 1;
};

export const prepareCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dpr: number,
): void => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
};
