// src/components/InfrastructureChoose/canvasAnimation/drawers/icons.ts
import {getIconBackground} from '../iconBackgrounds';
import {PositionConfig} from '../schemes';
import {BG_PADDING_RATIO, BG_RADIUS_RATIO, ICON_DRAW_RATIO} from './config';

// Базовая «дизайнерская» иконка при ширине canvas 1920 (совпадает с базой
// в getPositionAnchor и drawPositions): 53 * 1.5 = 79.5 px.
const BASE_ICON_SIZE = 53 * 1.5;

// Зазор между соседними плитками подложки (в дизайнерских пикселях
// при ширине canvas 1920). Через `iconGapPx` в PositionConfig его можно
// переопределить для конкретной позиции.
const DEFAULT_ICON_GROUP_GAP_PX = 8;

export const drawIcon = (
    ctx: CanvasRenderingContext2D,
    icon: HTMLImageElement,
    centerX: number,
    centerY: number,
    containerSize: number,
) => {
    const iconDrawSize = containerSize * ICON_DRAW_RATIO;
    const iconX = centerX - iconDrawSize / 2;
    const iconY = centerY - iconDrawSize / 2;
    ctx.drawImage(icon, iconX, iconY, iconDrawSize, iconDrawSize);
};

// Внешний bounding box группы иконок: (N-1) * step + tileSize.
// Используется в geometry.ts для hover/click и якорей линий.
export const getBackgroundSize = (
    totalIcons: number,
    step: number,
    iconSize: number,
): {width: number; height: number} => {
    const iconDrawSize = iconSize * ICON_DRAW_RATIO;
    const padding = iconDrawSize * BG_PADDING_RATIO;
    const tileSize = iconDrawSize + padding * 2;

    const width = totalIcons > 1 ? (totalIcons - 1) * step + tileSize : tileSize;

    return {width, height: tileSize};
};

// Подложка под группой иконок: по одной плитке со скруглёнными углами
// на каждую иконку. Плитки стоят на расстоянии `step` друг от друга,
// а их размер (`tileSize`) меньше `step` — поэтому между плитками
// остаётся видимый зазор и они не сливаются в один прямоугольник.
export const drawIconBackground = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    totalIcons: number,
    step: number,
    iconSize: number,
    color: string,
) => {
    if (totalIcons <= 0) return;

    const iconDrawSize = iconSize * ICON_DRAW_RATIO;
    const padding = iconDrawSize * BG_PADDING_RATIO;
    const tileSize = iconDrawSize + padding * 2;
    const radius = tileSize * BG_RADIUS_RATIO;

    const totalWidth = totalIcons > 1 ? (totalIcons - 1) * step : 0;
    const startX = centerX - totalWidth / 2;
    const y = centerY - tileSize / 2;

    ctx.save();
    // eslint-disable-next-line no-param-reassign
    ctx.fillStyle = color;

    for (let i = 0; i < totalIcons; i++) {
        const tileCenterX = startX + i * step;
        const x = tileCenterX - tileSize / 2;

        ctx.beginPath();
        if (typeof (ctx as CanvasRenderingContext2D).roundRect === 'function') {
            ctx.roundRect(x, y, tileSize, tileSize, radius);
        } else {
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + tileSize - radius, y);
            ctx.arcTo(x + tileSize, y, x + tileSize, y + radius, radius);
            ctx.lineTo(x + tileSize, y + tileSize - radius);
            ctx.arcTo(x + tileSize, y + tileSize, x + tileSize - radius, y + tileSize, radius);
            ctx.lineTo(x + radius, y + tileSize);
            ctx.arcTo(x, y + tileSize, x, y + tileSize - radius, radius);
            ctx.lineTo(x, y + radius);
            ctx.arcTo(x, y, x + radius, y, radius);
            ctx.closePath();
        }
        ctx.fill();
    }

    ctx.restore();
};

// Иконки позиции в ряд (одна или несколько) — список, количество и шаг
// между центрами соседних иконок.
export const getIconsRow = (config: PositionConfig, iconSize: number) => {
    let iconsToDraw: string[] = [];
    if (config.iconKeys && config.iconKeys.length > 0) {
        iconsToDraw = config.iconKeys;
    } else if (config.iconKey) {
        iconsToDraw = [config.iconKey];
    }
    const totalIcons = iconsToDraw.length;

    if (totalIcons <= 1) {
        return {iconsToDraw, totalIcons, step: iconSize};
    }

    const iconDrawSize = iconSize * ICON_DRAW_RATIO;

    // Размер плитки подложки: иконка + её паддинги.
    const padding = iconDrawSize * BG_PADDING_RATIO;
    const tileSize = iconDrawSize + padding * 2;

    // Зазор между плитками (не между иконками!) в дизайнерских px.
    const gapPx = config.iconGapPx ?? DEFAULT_ICON_GROUP_GAP_PX;
    const gap = iconSize * (gapPx / BASE_ICON_SIZE);

    // step = плитка + зазор. Плитки стоят на шаге, который больше их
    // размера, поэтому не пересекаются — между ними виден зазор.
    const step = tileSize + gap;

    return {iconsToDraw, totalIcons, step};
};

// Реэкспорт для удобства — используется в geometry при проверке подложки
export {getIconBackground};
