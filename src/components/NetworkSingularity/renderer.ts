/* eslint-disable no-param-reassign */
import type {ProjectedNode} from './types';
import {
    APPEAR_SCALE_MAX,
    APPEAR_SCALE_MIN,
    BASE_FONT_SIZE,
    BASE_LABEL_HEIGHT,
    BASE_LABEL_WIDTH,
    BASE_LINE_WIDTH,
    BASE_RADIUS,
    MIN_FONT_SIZE,
    MIN_LINE_WIDTH,
    MIN_RADIUS,
    SPHERE_RADIUS,
} from './constants';

export const drawLabel = (
    ctx: CanvasRenderingContext2D,
    p: ProjectedNode,
    zoom: number,
    currentTime: number,
    shakeIntensity: number,
    isRed: boolean,
    fadeOpacity: number,
): boolean => {
    const elapsed = currentTime - p.spawnDelay;
    if (elapsed < 0) {
        return false;
    }

    const progress = Math.min(1, elapsed / p.duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const appearScale = APPEAR_SCALE_MIN + APPEAR_SCALE_MAX * eased;

    const depthFactor = (SPHERE_RADIUS - p.z) / (SPHERE_RADIUS * 2);
    const baseOpacity = Math.max(0.25, Math.min(1, 0.35 + depthFactor * 0.85));
    const opacity = baseOpacity * eased * fadeOpacity;

    const shakeX = shakeIntensity > 0 ? (Math.random() - 0.5) * shakeIntensity : 0;
    const shakeY = shakeIntensity > 0 ? (Math.random() - 0.5) * shakeIntensity : 0;

    const numScale = Number(p.scale);

    const w = BASE_LABEL_WIDTH * numScale * zoom * appearScale;
    const h = BASE_LABEL_HEIGHT * numScale * zoom * appearScale;
    const fontSize = Math.max(MIN_FONT_SIZE, BASE_FONT_SIZE * numScale * zoom * appearScale);
    const radius = Math.max(MIN_RADIUS, BASE_RADIUS * numScale * zoom * appearScale);

    const drawX = p.x + shakeX;
    const drawY = p.y + shakeY;

    const bgColor = isRed
        ? `rgba(60, 18, 18, ${opacity * 0.85})`
        : `rgba(18, 32, 60, ${opacity * 0.85})`;
    const borderColor = isRed
        ? `rgba(255, 80, 80, ${opacity * 0.9})`
        : `rgba(140, 195, 255, ${opacity * 0.9})`;
    const textColor = isRed ? `rgba(255, 220, 220, ${opacity})` : `rgba(220, 240, 255, ${opacity})`;

    ctx.fillStyle = bgColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = Math.max(MIN_LINE_WIDTH, BASE_LINE_WIDTH * numScale * zoom * appearScale);

    const x0 = drawX - w / 2;
    const y0 = drawY - h / 2;
    ctx.beginPath();
    ctx.moveTo(x0 + radius, y0);
    ctx.lineTo(x0 + w - radius, y0);
    ctx.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + radius);
    ctx.lineTo(x0 + w, y0 + h - radius);
    ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - radius, y0 + h);
    ctx.lineTo(x0 + radius, y0 + h);
    ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - radius);
    ctx.lineTo(x0, y0 + radius);
    ctx.quadraticCurveTo(x0, y0, x0 + radius, y0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = `600 ${fontSize}px ui-monospace, "SF Mono", Menlo, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.label, drawX, drawY + 0.5);

    return true;
};
