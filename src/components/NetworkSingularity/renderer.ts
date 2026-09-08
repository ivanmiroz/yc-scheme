/* eslint-disable no-param-reassign */
import type {ProjectedNode} from './types';
import {
    APPEAR_SCALE_MAX,
    APPEAR_SCALE_MIN,
    BASE_FONT_SIZE,
    BASE_LINE_WIDTH,
    BASE_RADIUS,
    CARD_PADDING_X,
    CARD_PADDING_Y,
    ICON_BORDER_RADIUS,
    ICON_SIZE,
    LABEL_ICON_GAP,
    MIN_FONT_SIZE,
    MIN_RADIUS,
    SPHERE_RADIUS,
} from './constants';
import {getIcon, getIconKeyByLabel} from '../InfrastructureChoose/canvasAnimation/icons';

type ProjectedNodeWithIndex = ProjectedNode & {index: number};

const MAX_CACHE_SIZE = 300;
const textWidthCache = new Map<string, number>();
const colorCache = new Map<number, {r: number; g: number; b: number; depthFactor: number}>();

const measureCanvas = document.createElement('canvas');
const measureCtx = measureCanvas.getContext('2d');

export const getCardDimensions = (
    p: ProjectedNodeWithIndex,
    zoom: number,
    currentTime: number,
    scaleFactor: number,
): {width: number; height: number} => {
    const elapsed = currentTime - p.spawnDelay;
    if (elapsed < 0) {
        return {width: 0, height: 0};
    }

    const progress = Math.min(1, elapsed / p.duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const appearScale = APPEAR_SCALE_MIN + APPEAR_SCALE_MAX * eased;

    const numScale = Math.max(0.1, Number(p.scale));

    const currentIconSize = Math.max(1, ICON_SIZE * numScale * zoom * appearScale * scaleFactor);
    const currentFontSize = Math.max(
        MIN_FONT_SIZE * scaleFactor,
        BASE_FONT_SIZE * numScale * zoom * appearScale * scaleFactor,
    );
    const currentGap = Math.max(1, LABEL_ICON_GAP * numScale * zoom * appearScale * scaleFactor);
    const currentPaddingX = Math.max(
        1,
        CARD_PADDING_X * numScale * zoom * appearScale * scaleFactor,
    );
    const currentPaddingY = Math.max(
        1,
        CARD_PADDING_Y * numScale * zoom * appearScale * scaleFactor,
    );

    const cacheKey = `${p.label}_${currentFontSize.toFixed(2)}`;
    let textWidth = textWidthCache.get(cacheKey);
    if (textWidth === undefined && measureCtx) {
        measureCtx.font = `500 ${currentFontSize}px ui-monospace, "SF Mono", Menlo, monospace`;
        textWidth = measureCtx.measureText(p.label).width;
        if (textWidthCache.size >= MAX_CACHE_SIZE) {
            const firstKey = textWidthCache.keys().next().value;
            if (firstKey !== undefined) textWidthCache.delete(firstKey);
        }
        textWidthCache.set(cacheKey, textWidth);
    }

    const cardHeight = currentIconSize + currentPaddingY * 2;
    const cardWidth =
        currentPaddingX + currentIconSize + currentGap + (textWidth ?? 0) + currentPaddingX;

    return {width: cardWidth, height: cardHeight};
};

const getDepthColor = (
    z: number,
    scaleFactor: number,
): {r: number; g: number; b: number; depthFactor: number} => {
    const zKey = Math.round(z);
    let cached = colorCache.get(zKey);
    if (!cached) {
        const depthFactor = Math.max(
            0,
            Math.min(1, (SPHERE_RADIUS * scaleFactor - z) / (SPHERE_RADIUS * scaleFactor * 2)),
        );
        cached = {
            r: Math.round(233 * (1 - depthFactor)),
            g: Math.round(236 * (1 - depthFactor)),
            b: Math.round(245 * (1 - depthFactor)),
            depthFactor,
        };
        if (colorCache.size >= MAX_CACHE_SIZE) {
            const firstKey = colorCache.keys().next().value;
            if (firstKey !== undefined) colorCache.delete(firstKey);
        }
        colorCache.set(zKey, cached);
    }
    return cached;
};

export const getCardColor = (p: ProjectedNodeWithIndex, scaleFactor: number) =>
    getDepthColor(p.z, scaleFactor);

export const drawLabel = (
    ctx: CanvasRenderingContext2D,
    p: ProjectedNodeWithIndex,
    zoom: number,
    currentTime: number,
    shakeIntensity: number,
    index: number,
    scaleFactor: number,
    fallOffsetY: number,
): boolean => {
    const elapsed = currentTime - p.spawnDelay;
    if (elapsed < 0) {
        return false;
    }

    const progress = Math.min(1, elapsed / p.duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const appearScale = APPEAR_SCALE_MIN + APPEAR_SCALE_MAX * eased;

    const {r: bgR, g: bgG, b: bgB, depthFactor} = getDepthColor(p.z, scaleFactor);

    const shakeX =
        shakeIntensity > 0 ? Math.sin(currentTime * 0.005 + index * 13.7) * shakeIntensity : 0;
    const shakeY =
        shakeIntensity > 0 ? Math.cos(currentTime * 0.007 + index * 7.3) * shakeIntensity : 0;

    const drawX = p.x + shakeX;
    const drawY = p.y + shakeY + fallOffsetY;

    const numScale = Math.max(0.1, Number(p.scale));

    const currentIconSize = Math.max(1, ICON_SIZE * numScale * zoom * appearScale * scaleFactor);
    const currentFontSize = Math.max(
        MIN_FONT_SIZE * scaleFactor,
        BASE_FONT_SIZE * numScale * zoom * appearScale * scaleFactor,
    );
    const currentRadius = Math.max(
        MIN_RADIUS * scaleFactor,
        BASE_RADIUS * numScale * zoom * appearScale * scaleFactor,
    );
    const currentGap = Math.max(1, LABEL_ICON_GAP * numScale * zoom * appearScale * scaleFactor);
    const currentPaddingX = Math.max(
        1,
        CARD_PADDING_X * numScale * zoom * appearScale * scaleFactor,
    );
    const currentPaddingY = Math.max(
        1,
        CARD_PADDING_Y * numScale * zoom * appearScale * scaleFactor,
    );
    const currentIconRadius = Math.max(
        1,
        ICON_BORDER_RADIUS * numScale * zoom * appearScale * scaleFactor,
    );

    const iconKey = getIconKeyByLabel(p.label) || 'servers';
    const img = getIcon(iconKey);

    const fontString = `500 ${currentFontSize}px ui-monospace, "SF Mono", Menlo, monospace`;
    ctx.font = fontString;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const cacheKey = `${p.label}_${currentFontSize.toFixed(2)}`;
    let textWidth = textWidthCache.get(cacheKey);
    if (textWidth === undefined) {
        textWidth = ctx.measureText(p.label).width;
        if (textWidthCache.size >= MAX_CACHE_SIZE) {
            const firstKey = textWidthCache.keys().next().value;
            if (firstKey !== undefined) textWidthCache.delete(firstKey);
        }
        textWidthCache.set(cacheKey, textWidth);
    }

    const cardHeight = currentIconSize + currentPaddingY * 2;
    const cardWidth = currentPaddingX + currentIconSize + currentGap + textWidth + currentPaddingX;

    const cardX = drawX - cardWidth / 2;
    const cardY = drawY - cardHeight / 2;

    ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
    ctx.strokeStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
    ctx.lineWidth = Math.max(0.5, BASE_LINE_WIDTH * numScale * zoom * appearScale * scaleFactor);

    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, currentRadius);
    ctx.fill();
    ctx.stroke();

    const iconX = cardX + currentPaddingX;
    const iconY = cardY + currentPaddingY;

    ctx.fillStyle = `rgb(242, 242, 242)`;
    ctx.beginPath();
    ctx.roundRect(iconX, iconY, currentIconSize, currentIconSize, currentIconRadius);
    ctx.fill();

    if (img && img.complete) {
        const iconPadding = currentIconSize * 0.18;
        const drawIconX = iconX + iconPadding;
        const drawIconY = iconY + iconPadding;
        const drawIconSize = Math.max(1, currentIconSize - iconPadding * 2);

        const iconAlpha = 0.3 + depthFactor * 0.7;

        const prevAlpha = ctx.globalAlpha;
        ctx.globalAlpha = iconAlpha;
        ctx.drawImage(img, drawIconX, drawIconY, drawIconSize, drawIconSize);
        ctx.globalAlpha = prevAlpha;
    }

    const textX = iconX + currentIconSize + currentGap;
    const textY = drawY;

    ctx.fillStyle = `rgb(255, 255, 255)`;
    ctx.fillText(p.label, textX, textY);

    return true;
};
