import {getIconBackground} from '../iconBackgrounds';
import {PositionConfig} from '../schemes';
import {BG_PADDING_RATIO, BG_RADIUS_RATIO, ICON_DRAW_RATIO} from './config';

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

// Размеры подложки под группу иконок
export const getBackgroundSize = (
    totalIcons: number,
    step: number,
    iconSize: number,
): {width: number; height: number} => {
    const iconDrawSize = iconSize * ICON_DRAW_RATIO;
    const padding = iconDrawSize * BG_PADDING_RATIO;
    const totalWidth = (totalIcons - 1) * step;

    const width = totalWidth + iconDrawSize + padding * 2;
    const height = iconDrawSize + padding * 2;

    return {width, height};
};

// Цветная подложка со скруглёнными углами под всю группу иконок позиции.
export const drawIconBackground = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    totalIcons: number,
    step: number,
    iconSize: number,
    color: string,
) => {
    const {width, height} = getBackgroundSize(totalIcons, step, iconSize);
    const x = centerX - width / 2;
    const y = centerY - height / 2;
    const radius = Math.min(width, height) * BG_RADIUS_RATIO;

    ctx.save();
    // eslint-disable-next-line no-param-reassign
    ctx.fillStyle = color;
    ctx.beginPath();
    if (typeof (ctx as CanvasRenderingContext2D).roundRect === 'function') {
        ctx.roundRect(x, y, width, height, radius);
    } else {
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
    }
    ctx.fill();
    ctx.restore();
};

// Иконки позиции в ряд (одна или несколько) — список, количество и шаг
export const getIconsRow = (config: PositionConfig, iconSize: number) => {
    let iconsToDraw: string[] = [];
    if (config.iconKeys && config.iconKeys.length > 0) {
        iconsToDraw = config.iconKeys;
    } else if (config.iconKey) {
        iconsToDraw = [config.iconKey];
    }
    const totalIcons = iconsToDraw.length;
    const step = totalIcons > 1 ? iconSize * 0.75 : iconSize;
    return {iconsToDraw, totalIcons, step};
};

// Реэкспорт для удобства — используется в geometry при проверке подложки
export {getIconBackground};
