import {Position} from './types';
import {getPositionConfig} from './schemes';
import {getIcon} from './icons';

const drawIcon = (
    ctx: CanvasRenderingContext2D,
    icon: HTMLImageElement,
    centerX: number,
    centerY: number,
    containerSize: number,
) => {
    const iconRatio = 0.6;
    const iconDrawSize = containerSize * iconRatio;
    const iconX = centerX - iconDrawSize / 2;
    const iconY = centerY - iconDrawSize / 2;
    ctx.drawImage(icon, iconX, iconY, iconDrawSize, iconDrawSize);
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
