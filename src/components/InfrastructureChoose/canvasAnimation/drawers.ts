import {getIconBackground} from './iconBackgrounds';
import {getIcon} from './icons';
import {PositionConfig, getPositionConfig} from './schemes';
import {Position} from './types';

// Паддинг подложки вокруг иконок (доля от реального размера иконки = 0.6 · iconSize)
const BG_PADDING_RATIO = 0.2;
// Радиус скругления подложки (доля от её меньшей стороны)
const BG_RADIUS_RATIO = 0.15;
// Доля слота, которую занимает сама иконка (см. drawIcon)
const ICON_DRAW_RATIO = 0.6;

const drawIcon = (
    ctx: CanvasRenderingContext2D,
    icon: HTMLImageElement,
    centerX: number,
    centerY: number,
    containerSize: number,
) => {
    const iconRatio = ICON_DRAW_RATIO;
    const iconDrawSize = containerSize * iconRatio;
    const iconX = centerX - iconDrawSize / 2;
    const iconY = centerY - iconDrawSize / 2;
    ctx.drawImage(icon, iconX, iconY, iconDrawSize, iconDrawSize);
};

// Размеры подложки под группу иконок
const getBackgroundSize = (
    totalIcons: number,
    step: number,
    iconSize: number,
): {width: number; height: number} => {
    const iconDrawSize = iconSize * ICON_DRAW_RATIO;
    const padding = iconDrawSize * BG_PADDING_RATIO;
    const totalWidth = (totalIcons - 1) * step;

    // Ширина: расстояние между центрами крайних иконок + размер иконки
    // + паддинг с двух сторон.
    const width = totalWidth + iconDrawSize + padding * 2;
    const height = iconDrawSize + padding * 2;

    return {width, height};
};

// Цветная подложка со скруглёнными углами под всю группу иконок позиции.
const drawIconBackground = (
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
        // Ручной path на случай старого браузера без ctx.roundRect
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

// Вычисление bounding box для иконки или текста позиции
const getPositionBounds = (
    pos: Position,
    config: PositionConfig,
    iconSize: number,
    labelFontSize: number,
    _canvasWidth: number,
) => {
    const lineHeight = labelFontSize * 1.4;

    const isBottomPosition = pos.positionNumber.endsWith('.2') || pos.positionNumber.endsWith('.5');

    let adjustedX = pos.x;
    if (pos.positionNumber.endsWith('.1') || pos.positionNumber.endsWith('.4')) {
        adjustedX = pos.x - iconSize * 2;
    } else if (pos.positionNumber.endsWith('.3') || pos.positionNumber.endsWith('.6')) {
        adjustedX = pos.x + iconSize * 2;
    }

    let iconCenterY: number;
    let labelY: number;

    if (isBottomPosition) {
        const iconTopY = pos.y;
        iconCenterY = iconTopY + iconSize / 2;
        labelY = iconTopY + iconSize;
    } else {
        const iconBottomY = pos.y;
        iconCenterY = iconBottomY - iconSize / 2;
        labelY = iconBottomY;
    }

    // Bounding box для иконок
    let iconsBounds: {x: number; y: number; width: number; height: number} | null = null;
    let iconsToDraw: string[] = [];
    if (config.iconKeys && config.iconKeys.length > 0) {
        iconsToDraw = config.iconKeys;
    } else if (config.iconKey) {
        iconsToDraw = [config.iconKey];
    }

    if (iconsToDraw.length > 0) {
        const totalIcons = iconsToDraw.length;
        const step = totalIcons > 1 ? iconSize * 0.75 : iconSize;
        const totalWidth = (totalIcons - 1) * step;
        const startX = adjustedX - totalWidth / 2;
        const iconDrawSize = iconSize * ICON_DRAW_RATIO;

        // Если под группой иконок есть цветная подложка — расширяем bbox
        // до её размеров, чтобы hover срабатывал по видимым границам.
        const hasBackground = Boolean(getIconBackground(config.label));

        if (hasBackground) {
            const {width: bgWidth, height: bgHeight} = getBackgroundSize(
                totalIcons,
                step,
                iconSize,
            );
            iconsBounds = {
                x: adjustedX - bgWidth / 2,
                y: iconCenterY - bgHeight / 2,
                width: bgWidth,
                height: bgHeight,
            };
        } else {
            iconsBounds = {
                x: startX - iconDrawSize / 2,
                y: iconCenterY - iconDrawSize / 2,
                width: totalWidth + iconDrawSize,
                height: iconDrawSize,
            };
        }
    }

    // Bounding box для текста
    let textBounds: {x: number; y: number; width: number; height: number} | null = null;
    if (config.label) {
        const lines = config.label.split('\n');
        const labelHeight = labelFontSize + (lines.length - 1) * lineHeight;

        // Приблизительная ширина текста (можно улучшить через ctx.measureText)
        const maxLineWidth = Math.max(...lines.map((line) => line.length)) * labelFontSize * 0.6;

        textBounds = {
            x: adjustedX - maxLineWidth / 2,
            y: labelY,
            width: maxLineWidth,
            height: labelHeight,
        };
    }

    return {iconsBounds, textBounds};
};

// Проверка, находится ли точка над позицией
export const isPointOverPosition = (
    mouseX: number,
    mouseY: number,
    pos: Position,
    config: PositionConfig,
    iconSize: number,
    labelFontSize: number,
    canvasWidth: number,
): boolean => {
    const {iconsBounds, textBounds} = getPositionBounds(
        pos,
        config,
        iconSize,
        labelFontSize,
        canvasWidth,
    );

    if (iconsBounds) {
        if (
            mouseX >= iconsBounds.x &&
            mouseX <= iconsBounds.x + iconsBounds.width &&
            mouseY >= iconsBounds.y &&
            mouseY <= iconsBounds.y + iconsBounds.height
        ) {
            return true;
        }
    }

    if (textBounds) {
        if (
            mouseX >= textBounds.x &&
            mouseX <= textBounds.x + textBounds.width &&
            mouseY >= textBounds.y &&
            mouseY <= textBounds.y + textBounds.height
        ) {
            return true;
        }
    }

    return false;
};

// Геометрия иконки позиции в координатах канваса (CSS-пиксели).
// Возвращает центр иконки, её верхнюю/нижнюю границу и размер.
export const getPositionAnchor = (
    pos: Position,
    canvasWidth: number,
): {centerX: number; centerY: number; topY: number; bottomY: number; iconSize: number} => {
    const baseWidth = 1920;
    const baseIconSize = 53 * 1.5;
    const iconSize = canvasWidth * (baseIconSize / baseWidth);

    const isBottomPosition = pos.positionNumber.endsWith('.2') || pos.positionNumber.endsWith('.5');

    let adjustedX = pos.x;
    if (pos.positionNumber.endsWith('.1') || pos.positionNumber.endsWith('.4')) {
        adjustedX = pos.x - iconSize * 2;
    } else if (pos.positionNumber.endsWith('.3') || pos.positionNumber.endsWith('.6')) {
        adjustedX = pos.x + iconSize * 2;
    }

    const iconCenterY = isBottomPosition ? pos.y + iconSize / 2 : pos.y - iconSize / 2;

    return {
        centerX: adjustedX,
        centerY: iconCenterY,
        topY: iconCenterY - iconSize / 2,
        bottomY: iconCenterY + iconSize / 2,
        iconSize,
    };
};

export const drawPositions = (
    ctx: CanvasRenderingContext2D,
    positions: Position[],
    opacities: number[],
    canvasWidth: number,
) => {
    const baseWidth = 1920;
    const baseIconSize = 53 * 1.5;
    const iconSize = canvasWidth * (baseIconSize / baseWidth);

    const labelFontSize = canvasWidth * 0.007;
    const lineHeight = labelFontSize * 1.4;

    // eslint-disable-next-line no-param-reassign
    ctx.font = `bold ${labelFontSize}px "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

    positions.forEach((pos, index) => {
        const config = getPositionConfig(pos.positionNumber);
        if (!config || !config.label) return;

        const opacity = opacities[index] ?? 0;
        if (opacity <= 0) return;

        ctx.save();
        // eslint-disable-next-line no-param-reassign
        ctx.globalAlpha = opacity;

        const isBottomPosition =
            pos.positionNumber.endsWith('.2') || pos.positionNumber.endsWith('.5');

        let adjustedX = pos.x;
        if (pos.positionNumber.endsWith('.1') || pos.positionNumber.endsWith('.4')) {
            adjustedX = pos.x - iconSize * 2;
        } else if (pos.positionNumber.endsWith('.3') || pos.positionNumber.endsWith('.6')) {
            adjustedX = pos.x + iconSize * 2;
        }

        let iconCenterY: number;
        let labelY: number;

        if (isBottomPosition) {
            const iconTopY = pos.y;
            iconCenterY = iconTopY + iconSize / 2;
            labelY = iconTopY + iconSize;
        } else {
            const iconBottomY = pos.y;
            iconCenterY = iconBottomY - iconSize / 2;
            labelY = iconBottomY;
        }

        // Рисуем иконки (поддержка как одной, так и нескольких иконок в ряд)
        let iconsToDraw: string[] = [];
        if (config.iconKeys && config.iconKeys.length > 0) {
            iconsToDraw = config.iconKeys;
        } else if (config.iconKey) {
            iconsToDraw = [config.iconKey];
        }

        if (iconsToDraw.length > 0) {
            const totalIcons = iconsToDraw.length;
            const step = totalIcons > 1 ? iconSize * 0.75 : iconSize;
            const totalWidth = (totalIcons - 1) * step;

            const startX = adjustedX - totalWidth / 2;

            // Цветная подложка со скруглёнными углами под всей группой иконок
            const bgColor = getIconBackground(config.label);
            if (bgColor) {
                drawIconBackground(
                    ctx,
                    adjustedX,
                    iconCenterY,
                    totalIcons,
                    step,
                    iconSize,
                    bgColor,
                );
            }

            iconsToDraw.forEach((key, idx) => {
                const icon = getIcon(key);
                if (icon && icon.complete) {
                    drawIcon(ctx, icon, startX + idx * step, iconCenterY, iconSize);
                }
            });
        }

        // Рисуем текст
        const label = config.label;
        const lines = label.split('\n');

        const labelHeight = labelFontSize + (lines.length - 1) * lineHeight;

        // eslint-disable-next-line no-param-reassign
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        // eslint-disable-next-line no-param-reassign
        ctx.textAlign = 'center';
        // eslint-disable-next-line no-param-reassign
        ctx.textBaseline = 'middle';

        let currentY = labelY + labelHeight / 2 - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line) => {
            ctx.fillText(line, adjustedX, currentY);
            currentY += lineHeight;
        });

        ctx.restore();
    });
};
