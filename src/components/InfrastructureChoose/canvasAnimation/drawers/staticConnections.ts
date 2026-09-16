import {LEGEND_TO_LINE_KIND, LegendValue} from '../schemes';
import {PodiumState} from '../types';
import {
    CONNECTIONS_LINE_DURATION,
    CONNECTION_COLOR,
    CONNECTION_DOT_RADIUS_RATIO,
    CONNECTION_HIGHLIGHT_COLOR,
    CONNECTION_LINE_WIDTH_RATIO,
    MARKER_BOTTOM_OFFSET_RATIO,
    MARKER_COLOR,
    MARKER_DOT_RADIUS_RATIO,
    MARKER_LENGTH_RATIO,
    MARKER_LINE_WIDTH_RATIO,
    SERPENTINE_AMPLITUDE_RATIO,
    SERPENTINE_STRAIGHT_FRACTION,
    SERPENTINE_TURNS,
} from './config';
import {buildSerpentine, drawPolylineWithProgress} from './paths';
import {applyConnectionStroke} from './stroke';

// Во сколько раз толще рисуется подсвеченная линия.
const HIGHLIGHT_WIDTH_MULTIPLIER = 1.5;

// Во сколько раз дополнительная горизонтальная линия на платформе
// короче основного маркера (по ширине).
const EXTRA_LINE_WIDTH_DIVISOR = 1.8;

// Дополнительный сдвиг влево для новой горизонтальной линии
// относительно основного маркера, в долях ширины платформы.
// Знак: отрицательное значение — влево.
const EXTRA_LINE_SHIFT_RATIO = -0.005;

export const getConnectionsTotalDuration = (): number => CONNECTIONS_LINE_DURATION;

// Подсвечена ли линия данного типа активной легендой.
const isKindHighlighted = (
    activeLegend: LegendValue | null,
    kind: 'sharp-serpentine' | 'rounded-serpentine' | 'straight' | 'dashed' | 'arc',
): boolean => activeLegend !== null && LEGEND_TO_LINE_KIND[activeLegend] === kind;

// Цвет для конкретного типа линии с учётом активной легенды.
const resolveColor = (
    activeLegend: LegendValue | null,
    kind: 'sharp-serpentine' | 'rounded-serpentine' | 'straight' | 'dashed' | 'arc',
    baseColor: string,
): string => {
    if (!activeLegend) return baseColor;
    return LEGEND_TO_LINE_KIND[activeLegend] === kind ? CONNECTION_HIGHLIGHT_COLOR : baseColor;
};

const drawSerpentineConnection = (
    ctx: CanvasRenderingContext2D,
    bottom: PodiumState,
    top: PodiumState,
    progress: number,
    canvasWidth: number,
    color: string,
    highlighted: boolean,
) => {
    const baseLineWidth = Math.max(1, canvasWidth * CONNECTION_LINE_WIDTH_RATIO);
    const lineWidth = highlighted ? baseLineWidth * HIGHLIGHT_WIDTH_MULTIPLIER : baseLineWidth;
    const dotRadius = Math.max(2, canvasWidth * CONNECTION_DOT_RADIUS_RATIO);
    const amp = canvasWidth * SERPENTINE_AMPLITUDE_RATIO;

    const A = {
        x: bottom.currentX,
        y: bottom.currentY + bottom.scaledHeight / 2,
    };
    const B = {
        x: top.currentX,
        y: top.currentY + top.scaledHeight / 2,
    };

    const f = SERPENTINE_STRAIGHT_FRACTION;
    const P1 = {
        x: A.x + (B.x - A.x) * f,
        y: A.y + (B.y - A.y) * f,
    };
    const P2 = {
        x: A.x + (B.x - A.x) * (1 - f),
        y: A.y + (B.y - A.y) * (1 - f),
    };

    const serpentinePoints = buildSerpentine(P1, P2, amp, SERPENTINE_TURNS);
    const fullPath = [A, ...serpentinePoints, B];

    applyConnectionStroke(ctx, {lineWidth, color});

    drawPolylineWithProgress(ctx, fullPath, progress);

    ctx.beginPath();
    ctx.arc(A.x, A.y, dotRadius, 0, Math.PI * 2);
    ctx.fill();

    if (progress >= 1) {
        ctx.beginPath();
        ctx.arc(B.x, B.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
    }
};

const drawPlatformMarker = (
    ctx: CanvasRenderingContext2D,
    podium: PodiumState,
    progress: number,
    canvasWidth: number,
    color: string,
    highlighted: boolean,
) => {
    const baseLineWidth = Math.max(1, canvasWidth * MARKER_LINE_WIDTH_RATIO);
    const lineWidth = highlighted ? baseLineWidth * HIGHLIGHT_WIDTH_MULTIPLIER : baseLineWidth;
    const dotRadius = Math.max(2, canvasWidth * MARKER_DOT_RADIUS_RATIO);
    const strokeColor = color ?? MARKER_COLOR;

    // Центр чуть левее середины платформы (2.01 вместо 2).
    const centerX = podium.currentX + podium.scaledWidth / 2.01;
    const platformCenterY = podium.currentY + podium.scaledHeight / 2;
    const markerY = podium.currentY + podium.scaledHeight * (1 - MARKER_BOTTOM_OFFSET_RATIO);

    // Y дополнительной линии — ровно посередине между маркером и центром платформы.
    const extraLineY = (markerY + platformCenterY) / 2;

    // Дополнительная линия смещена чуть левее основного маркера.
    const extraCenterX = centerX + podium.scaledWidth * EXTRA_LINE_SHIFT_RATIO;

    // Длина: основной маркер и дополнительная линия.
    const markerHalfLength = (podium.scaledWidth * MARKER_LENGTH_RATIO) / 2;
    const extraHalfLength = markerHalfLength / EXTRA_LINE_WIDTH_DIVISOR;

    ctx.save();
    applyConnectionStroke(ctx, {lineWidth, color: strokeColor});

    // Дополнительная горизонтальная линия с точками на концах.
    const extraCurrentHalf = extraHalfLength * progress;
    const extraLeftX = extraCenterX - extraCurrentHalf;
    const extraRightX = extraCenterX + extraCurrentHalf;

    ctx.beginPath();
    ctx.moveTo(extraLeftX, extraLineY);
    ctx.lineTo(extraRightX, extraLineY);
    ctx.stroke();

    if (progress > 0) {
        ctx.beginPath();
        ctx.arc(extraLeftX, extraLineY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(extraRightX, extraLineY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Основной горизонтальный маркер с точками на концах.
    const markerHalf = markerHalfLength * progress;
    const markerLeftX = centerX - markerHalf;
    const markerRightX = centerX + markerHalf;

    ctx.beginPath();
    ctx.moveTo(markerLeftX, markerY);
    ctx.lineTo(markerRightX, markerY);
    ctx.stroke();

    if (progress > 0) {
        ctx.beginPath();
        ctx.arc(markerLeftX, markerY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(markerRightX, markerY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
};

// Статичные элементы, не зависящие от активной схемы.
export const drawConnections = (
    ctx: CanvasRenderingContext2D,
    podiums: PodiumState[],
    elapsed: number,
    canvasWidth: number,
    activeLegend: LegendValue | null = null,
) => {
    if (podiums.length < 3) return;

    const progress = Math.max(0, Math.min(1, elapsed / CONNECTIONS_LINE_DURATION));
    if (progress <= 0) return;

    ctx.save();

    const bottom = podiums[podiums.length - 1];
    const second = podiums[podiums.length - 2];
    const third = podiums[podiums.length - 3];

    // Змейки между платформами: прямые углы (buildSerpentine не сглаживает) →
    // sharp-serpentine → подсвечиваются на «Сетевая связность».
    const serpentineHighlighted = isKindHighlighted(activeLegend, 'sharp-serpentine');
    const serpentineColor = resolveColor(activeLegend, 'sharp-serpentine', CONNECTION_COLOR);

    // Короткий отрезок на платформе — прямая → cloud-interconnect
    const markerHighlighted = isKindHighlighted(activeLegend, 'straight');
    const markerColor = resolveColor(activeLegend, 'straight', MARKER_COLOR);

    drawSerpentineConnection(
        ctx,
        bottom,
        second,
        progress,
        canvasWidth,
        serpentineColor,
        serpentineHighlighted,
    );
    drawSerpentineConnection(
        ctx,
        second,
        third,
        progress,
        canvasWidth,
        serpentineColor,
        serpentineHighlighted,
    );
    drawPlatformMarker(ctx, bottom, progress, canvasWidth, markerColor, markerHighlighted);

    ctx.restore();
};
