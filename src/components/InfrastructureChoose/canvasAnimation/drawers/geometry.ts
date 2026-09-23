// src/components/InfrastructureChoose/canvasAnimation/drawers/geometry.ts
import {getIconBackground} from '../iconBackgrounds';
import {LineAnchor, PositionConfig, getPositionConfig} from '../schemes';
import {Position} from '../types';
import {CONNECTION_TEXT_ANCHOR_GAP_RATIO, ICON_DRAW_RATIO} from './config';
import {getBackgroundSize, getIconsRow} from './icons';
import {getPositionShiftX} from './positions'; // <-- ДОБАВЛЕНО

// Вспомогательная функция: по positionNumber ('X.Y' или 'X.Y.Z')
// возвращает средний сегмент ('1'..'7') и флаг «нижней» позиции.
const parsePositionHint = (positionNumber: string): {hint: string; isBottomPosition: boolean} => {
    const parts = positionNumber.split('.');
    const hint = parts[1] ?? '';
    const isBottomPosition = hint === '2' || hint === '5';
    return {hint, isBottomPosition};
};

// Геометрия иконки позиции в координатах канваса (CSS-пиксели).
export const getPositionAnchor = (
    pos: Position,
    canvasWidth: number,
): {centerX: number; centerY: number; topY: number; bottomY: number; iconSize: number} => {
    const baseWidth = 1920;
    const baseIconSize = 53 * 1.5;
    const iconSize = canvasWidth * (baseIconSize / baseWidth);

    const {hint, isBottomPosition} = parsePositionHint(pos.positionNumber);

    let adjustedX = pos.x;
    if (hint === '1' || hint === '4') {
        adjustedX = pos.x - iconSize * 2;
    } else if (hint === '3' || hint === '6') {
        adjustedX = pos.x + iconSize * 2;
    }

    // <-- ДОБАВЛЕНО: Применяем специальный сдвиг (например, для '3.6')
    adjustedX += getPositionShiftX(pos.positionNumber, iconSize);

    const iconCenterY = isBottomPosition ? pos.y + iconSize / 2 : pos.y - iconSize / 2;

    return {
        centerX: adjustedX,
        centerY: iconCenterY,
        topY: iconCenterY - iconSize / 2,
        bottomY: iconCenterY + iconSize / 2,
        iconSize,
    };
};

// Bounding box для иконки или текста позиции.
const getPositionBounds = (
    pos: Position,
    config: PositionConfig,
    iconSize: number,
    labelFontSize: number,
) => {
    const lineHeight = labelFontSize * 1.4;

    const {hint, isBottomPosition} = parsePositionHint(pos.positionNumber);

    let adjustedX = pos.x;
    if (hint === '1' || hint === '4') {
        adjustedX = pos.x - iconSize * 2;
    } else if (hint === '3' || hint === '6') {
        adjustedX = pos.x + iconSize * 2;
    }

    // <-- ДОБАВЛЕНО: Применяем специальный сдвиг (например, для '3.6')
    adjustedX += getPositionShiftX(pos.positionNumber, iconSize);

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

    let iconsBounds: {x: number; y: number; width: number; height: number} | null = null;
    const {totalIcons, step} = getIconsRow(config, iconSize);

    if (totalIcons > 0) {
        const totalWidth = (totalIcons - 1) * step;
        const startX = adjustedX - totalWidth / 2;
        const iconDrawSize = iconSize * ICON_DRAW_RATIO;

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

    let textBounds: {x: number; y: number; width: number; height: number} | null = null;
    if (config.label) {
        const lines = config.label.split('\n');
        const labelHeight = labelFontSize + (lines.length - 1) * lineHeight;

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
): boolean => {
    const {iconsBounds, textBounds} = getPositionBounds(pos, config, iconSize, labelFontSize);

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

// Визуальные границы объекта (иконки/подложки).
const getVisualBounds = (
    pos: Position,
    canvasWidth: number,
): {
    centerX: number;
    centerY: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
} | null => {
    const config = getPositionConfig(pos.positionNumber);
    if (!config) return null;

    const a = getPositionAnchor(pos, canvasWidth);
    const {totalIcons, step} = getIconsRow(config, a.iconSize);

    let halfW: number;
    let halfH: number;

    const bgColor = getIconBackground(config.label);
    if (bgColor && totalIcons > 0) {
        const {width, height} = getBackgroundSize(totalIcons, step, a.iconSize);
        halfW = width / 2;
        halfH = height / 2;
    } else {
        const iconDrawSize = a.iconSize * ICON_DRAW_RATIO;
        halfW = iconDrawSize / 2;
        halfH = iconDrawSize / 2;
    }

    return {
        centerX: a.centerX,
        centerY: a.centerY,
        left: a.centerX - halfW,
        right: a.centerX + halfW,
        top: a.centerY - halfH,
        bottom: a.centerY + halfH,
    };
};

// Точка привязки линии на объекте.
export const getAnchorPoint = (
    pos: Position,
    canvasWidth: number,
    anchor: LineAnchor,
): {x: number; y: number} | null => {
    const config = getPositionConfig(pos.positionNumber);
    if (!config) return null;

    if (anchor === 'text-top' || anchor === 'text-bottom') {
        const a = getPositionAnchor(pos, canvasWidth);
        const labelFontSize = canvasWidth * 0.00856;
        const {textBounds} = getPositionBounds(pos, config, a.iconSize, labelFontSize);
        if (!textBounds) return null;

        const gap = canvasWidth * CONNECTION_TEXT_ANCHOR_GAP_RATIO;

        return anchor === 'text-top'
            ? {
                  x: textBounds.x + textBounds.width / 2,
                  y: textBounds.y - gap,
              }
            : {
                  x: textBounds.x + textBounds.width / 2,
                  y: textBounds.y + textBounds.height + gap,
              };
    }

    const b = getVisualBounds(pos, canvasWidth);
    if (!b) return null;

    switch (anchor) {
        case 'left':
            return {x: b.left, y: b.centerY};
        case 'right':
            return {x: b.right, y: b.centerY};
        case 'top':
            return {x: b.centerX, y: b.top};
        case 'bottom':
            return {x: b.centerX, y: b.bottom};
        case 'center':
        default:
            return {x: b.centerX, y: b.centerY};
    }
};
