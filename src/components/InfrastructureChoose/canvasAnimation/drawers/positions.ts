import {getIconBackground} from '../iconBackgrounds';
import {getIcon} from '../icons';
import {getPositionConfig} from '../schemes';
import {Position} from '../types';
import {drawIcon, drawIconBackground, getIconsRow} from './icons';

/**
 * Горизонтальный сдвиг отрисовки объекта относительно его «логического» x.
 * Используется и при отрисовке иконок/подписи, и при вычислении точки
 * подключения линий, чтобы линии сходились с визуальным положением объекта.
 *
 * @param positionNumber Номер позиции (например, '3.6').
 * @param iconSize Размер иконки в пикселях для текущей ширины канваса.
 * @returns Смещение по X в пикселях (0, если для позиции сдвиг не задан).
 */
export const getPositionShiftX = (positionNumber: string, iconSize: number): number => {
    // Специальный случай для схемы 1: объект 3.6 сдвигаем влево
    // на его полную ширину (ряд иконок + по половине иконки с боков).
    if (positionNumber !== '3.6') return 0;

    const config = getPositionConfig(positionNumber);
    if (!config) return 0;

    const {totalIcons, step} = getIconsRow(config, iconSize);
    if (totalIcons <= 0) return 0;

    const totalWidth = (totalIcons - 1) * step;
    return -(totalWidth + iconSize);
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

    const labelFontSize = canvasWidth * 0.00856;
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

        // Разбираем positionNumber на сегменты. Формат — 'X.Y' или 'X.Y.Z'
        // (например, '2.4', '2.4.2', '2.5.1'). Второй сегмент (parts[1])
        // определяет горизонтальное смещение и «сторону» отрисовки подписи.
        const parts = pos.positionNumber.split('.');
        const verticalHint = parts[1]; // '1'..'7'
        const isBottomPosition = verticalHint === '2' || verticalHint === '5';

        let adjustedX = pos.x;
        if (verticalHint === '1' || verticalHint === '4') {
            adjustedX = pos.x - iconSize * 2;
        } else if (verticalHint === '3' || verticalHint === '6') {
            adjustedX = pos.x + iconSize * 2;
        }

        // Применяем сдвиг для 3.6 (схема 1) — тот же, что используется
        // при вычислении точки подключения линий.
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

        const {iconsToDraw, totalIcons, step} = getIconsRow(config, iconSize);
        const totalWidth = totalIcons > 0 ? (totalIcons - 1) * step : 0;

        if (totalIcons > 0) {
            const startX = adjustedX - totalWidth / 2;

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
