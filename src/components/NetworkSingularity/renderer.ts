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

const textWidthCache = new Map<string, number>();

export const drawLabel = (
    ctx: CanvasRenderingContext2D,
    p: ProjectedNodeWithIndex,
    zoom: number,
    currentTime: number,
    shakeIntensity: number,
    fadeOpacity: number,
    index: number,
    scaleFactor: number,
    redProgress: number,
    fallOffsetY: number,
): boolean => {
    const elapsed = currentTime - p.spawnDelay;
    if (elapsed < 0) {
        return false;
    }

    const progress = Math.min(1, elapsed / p.duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const appearScale = APPEAR_SCALE_MIN + APPEAR_SCALE_MAX * eased;

    const depthFactor = (SPHERE_RADIUS * scaleFactor - p.z) / (SPHERE_RADIUS * scaleFactor * 2);
    const baseOpacity = Math.max(0.25, Math.min(1, 0.35 + depthFactor * 0.85));
    const opacity = baseOpacity * eased * fadeOpacity;

    const shakeX =
        shakeIntensity > 0 ? Math.sin(currentTime * 0.005 + index * 13.7) * shakeIntensity : 0;
    const shakeY =
        shakeIntensity > 0 ? Math.cos(currentTime * 0.007 + index * 7.3) * shakeIntensity : 0;

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

    // === НАЧАЛО ИЗМЕНЕНИЙ ===
    // Округляем координаты центра карточки до целых пикселей,
    // чтобы избежать субпиксельного дрожания на экранах с высоким DPR
    const drawX = Math.round(p.x + shakeX);
    const drawY = Math.round(p.y + shakeY + fallOffsetY);
    // === КОНЕЦ ИЗМЕНЕНИЙ ===

    // Получаем ключ иконки по названию
    const iconKey = getIconKeyByLabel(p.label) || 'servers';
    const img = getIcon(iconKey);

    const fontString = `500 ${currentFontSize}px ui-monospace, "SF Mono", Menlo, monospace`;
    ctx.font = fontString;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // === НАЧАЛО ИЗМЕНЕНИЙ ===
    // Точный ключ для кэша ширины текста (без округления до целого)
    const cacheKey = `${p.label}_${currentFontSize.toFixed(2)}`;
    // === КОНЕЦ ИЗМЕНЕНИЙ ===
    let textWidth = textWidthCache.get(cacheKey);
    if (textWidth === undefined) {
        textWidth = ctx.measureText(p.label).width;
        textWidthCache.set(cacheKey, textWidth);
    }

    const cardHeight = currentIconSize + currentPaddingY * 2;
    const cardWidth = currentPaddingX + currentIconSize + currentGap + textWidth + currentPaddingX;

    const cardX = drawX - cardWidth / 2;
    const cardY = drawY - cardHeight / 2;

    // Фон карточки
    const bgR = Math.round(0 + (200 - 0) * redProgress);
    const bgG = Math.round(0 + (20 - 0) * redProgress);
    const bgB = Math.round(0 + (20 - 0) * redProgress);
    ctx.fillStyle = `rgba(${bgR}, ${bgG}, ${bgB}, ${opacity})`;

    // Рамка
    ctx.strokeStyle = `rgba(233, 236, 245, ${opacity})`;
    ctx.lineWidth = Math.max(0.5, BASE_LINE_WIDTH * numScale * zoom * appearScale * scaleFactor);

    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, currentRadius);
    } else {
        ctx.rect(cardX, cardY, cardWidth, cardHeight);
    }
    ctx.fill();
    ctx.stroke();

    // Подложка иконки
    const iconX = cardX + currentPaddingX;
    const iconY = cardY + currentPaddingY;

    ctx.fillStyle = `rgba(242, 242, 242, ${opacity})`;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(iconX, iconY, currentIconSize, currentIconSize, currentIconRadius);
    } else {
        ctx.rect(iconX, iconY, currentIconSize, currentIconSize);
    }
    ctx.fill();

    // === НАЧАЛО ИЗМЕНЕНИЙ ===
    // Включаем сглаживание для иконок
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // === КОНЕЦ ИЗМЕНЕНИЙ ===

    if (img && img.complete) {
        ctx.save();
        ctx.globalAlpha = opacity;
        const iconPadding = currentIconSize * 0.18;
        ctx.drawImage(
            img,
            iconX + iconPadding,
            iconY + iconPadding,
            Math.max(1, currentIconSize - iconPadding * 2),
            Math.max(1, currentIconSize - iconPadding * 2),
        );
        ctx.restore();
    }

    // Текст
    const textX = iconX + currentIconSize + currentGap;
    const textY = drawY;

    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fillText(p.label, textX, textY);

    return true;
};
