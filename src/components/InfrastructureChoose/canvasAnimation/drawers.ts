/* eslint-disable no-param-reassign */
import {Position, TextDataItem} from './types';
import {TEXT_CONFIG} from './constants';
import {getPositionConfig} from './schemes';
import {getIcon} from './icons';

export const drawTextBlocks = (
    ctx: CanvasRenderingContext2D,
    podiums: Array<{id: number; currentY: number; scaledHeight: number}>,
    textData: readonly TextDataItem[],
    textOpacities: number[],
    canvasWidth: number,
) => {
    const fontSize = canvasWidth * TEXT_CONFIG.FONT_SIZE_RATIO;
    const lineHeight = fontSize * TEXT_CONFIG.LINE_HEIGHT_RATIO;
    const gap = fontSize * TEXT_CONFIG.GAP_RATIO;

    ctx.save();
    ctx.font = `400 ${fontSize}px "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    const textX = canvasWidth * TEXT_CONFIG.TEXT_X_RATIO;

    textData.forEach((item, index) => {
        const podium = podiums.find((p) => p.id === item.id);
        if (!podium) return;

        // Индивидуальная прозрачность для этого текстового блока
        ctx.save();
        ctx.globalAlpha = textOpacities[index] ?? 0;

        // Центр платформы по вертикали
        const podiumCenterY = podium.currentY + podium.scaledHeight / 2;

        // Линия между номером и текстом должна быть точно в центре платформы
        const lineY = podiumCenterY;

        // Верхняя координата номера (базовая линия номера = startY + fontSize)
        const startY = lineY - fontSize - gap;

        // Рисуем номер
        ctx.fillText(item.number, textX, startY + fontSize);

        // Рисуем линию
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
        ctx.lineWidth = Math.max(1, fontSize * TEXT_CONFIG.LINE_WIDTH_RATIO);
        ctx.moveTo(textX, lineY);
        ctx.lineTo(textX + fontSize * TEXT_CONFIG.LINE_LENGTH_RATIO, lineY);
        ctx.stroke();

        // Рисуем строки текста ниже линии с отступом gap
        const textStartY = lineY + gap + fontSize; // базовая линия первой строки
        const lines = item.text.split('\n');
        let textY = textStartY;
        lines.forEach((line) => {
            ctx.fillText(line.toUpperCase(), textX, textY);
            textY += lineHeight;
        });

        ctx.restore();
    });

    ctx.restore();
};

const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
) => {
    ctx.beginPath();
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
};

const drawRoundedTopRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
};

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

/**
 * Рисует позиции с индивидуальной прозрачностью для каждой.
 * @param {CanvasRenderingContext2D} ctx - Контекст canvas.
 * @param {Position[]} positions - Массив позиций для отрисовки.
 * @param {number[]} opacities - Массив прозрачностей (0..1) для каждой позиции.
 * @param {number} canvasWidth - Ширина canvas в логических пикселях.
 * @returns {void}
 */
export const drawPositions = (
    ctx: CanvasRenderingContext2D,
    positions: Position[],
    opacities: number[],
    canvasWidth: number,
) => {
    const baseWidth = 1920;
    const baseIconSize = 53 * 1.5;
    const iconSize = canvasWidth * (baseIconSize / baseWidth);

    const borderWidth = Math.max(2, canvasWidth * 0.003);
    const borderRadius = iconSize * (17 / 53);

    const labelFontSize = canvasWidth * 0.007;
    const labelPaddingX = canvasWidth * (8 / 1920);
    const labelPaddingY = canvasWidth * (5 / 1920);
    const labelBorderRadius = canvasWidth * (6 / 1920);
    const labelGap = iconSize * 0.2;

    // Межстрочный интервал для многострочных подписей
    const lineHeight = labelFontSize * 1.4;

    const lineWidth = Math.max(1, canvasWidth * (2 / 1920));
    const lineHeightForConnector = canvasWidth * (7 / 1920); // высота вертикальной линии-коннектора
    const lineBorderRadius = canvasWidth * (2 / 1920);

    ctx.font = `bold ${labelFontSize}px "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

    positions.forEach((pos, index) => {
        // Получаем конфигурацию позиции
        const config = getPositionConfig(pos.positionNumber);

        // Если позиция не указана в схеме - пропускаем (не рисуем ничего)
        if (!config || !config.label) return;

        // Индивидуальная прозрачность
        const opacity = opacities[index] ?? 0;
        if (opacity <= 0) return; // если полностью прозрачна, пропускаем

        ctx.save();
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
            labelY = iconTopY + iconSize + labelGap;
        } else {
            const iconBottomY = pos.y;
            iconCenterY = iconBottomY - iconSize / 2;
            labelY = iconBottomY + labelGap;
        }

        // Рисуем подложку и иконку только если есть iconKey
        if (config.iconKey) {
            const iconX = adjustedX - iconSize / 2;
            const iconY = iconCenterY - iconSize / 2;

            drawRoundedRect(ctx, iconX, iconY, iconSize, iconSize, borderRadius);
            ctx.fillStyle = 'rgba(242, 242, 242, 1)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(176, 189, 217, 1)';
            ctx.lineWidth = borderWidth;
            ctx.stroke();

            const icon = getIcon(config.iconKey);
            if (icon && icon.complete) {
                drawIcon(ctx, icon, adjustedX, iconCenterY, iconSize);
            }
        }

        // Рисуем текст и подложку для текста
        const label = config.label;
        const lines = label.split('\n');

        // Вычисляем максимальную ширину среди строк
        let maxLineWidth = 0;
        lines.forEach((line) => {
            const metrics = ctx.measureText(line);
            if (metrics.width > maxLineWidth) {
                maxLineWidth = metrics.width;
            }
        });

        // Горизонтальный отступ теперь одинаковый для всех подписей
        const horizontalPadding = labelPaddingX;

        const labelWidth = maxLineWidth + horizontalPadding * 2;
        const labelHeight = labelFontSize + labelPaddingY * 2 + (lines.length - 1) * lineHeight;

        const labelX = adjustedX - labelWidth / 2;

        const lineX = adjustedX - lineWidth / 2;
        const lineY = labelY - lineHeightForConnector;

        drawRoundedTopRect(ctx, lineX, lineY, lineWidth, lineHeightForConnector, lineBorderRadius);
        ctx.fillStyle = 'rgba(176, 189, 217, 1)';
        ctx.fill();

        drawRoundedRect(ctx, labelX, labelY, labelWidth, labelHeight, labelBorderRadius);
        ctx.fillStyle = 'rgba(176, 189, 217, 1)';
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Рисуем многострочный текст
        let currentY = labelY + labelHeight / 2 - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line) => {
            ctx.fillText(line, adjustedX, currentY);
            currentY += lineHeight;
        });

        ctx.restore();
    });
};
