import {LEGEND_TO_LINE_KIND, LegendValue} from '../schemes';
import {PodiumState} from '../types';
import {
    ARC_BULGE_RATIO,
    ARC_SEGMENTS,
    CONNECTIONS_LINE_DURATION,
    CONNECTION_COLOR,
    CONNECTION_DOT_RADIUS_RATIO,
    CONNECTION_HIGHLIGHT_COLOR,
    CONNECTION_LINE_WIDTH_RATIO,
    DASH_GAP_RATIO,
    DASH_LENGTH_RATIO,
    MARKER_BOTTOM_OFFSET_RATIO,
    MARKER_COLOR,
    MARKER_DOT_RADIUS_RATIO,
    MARKER_LENGTH_RATIO,
    MARKER_LINE_WIDTH_RATIO,
    SERPENTINE_AMPLITUDE_RATIO,
    SERPENTINE_STRAIGHT_FRACTION,
    SERPENTINE_TURNS,
} from './config';
import {buildCircularArc, buildSerpentine, drawPolylineWithProgress} from './paths';
import {applyConnectionStroke} from './stroke';

// Дополнительный горизонтальный сдвиг линий, идущих по правому краю
// платформы 1 (нижней): пунктир платформа 1 → платформа 3 и дуга
// платформа 1 → платформа 2.
// Отрицательное значение — влево. В долях ширины canvas.
const RIGHT_EDGE_SHIFT_RATIO = -6 / 1920;

// Во сколько раз толще рисуется подсвеченная линия.
const HIGHLIGHT_WIDTH_MULTIPLIER = 1.5;

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

const drawCircularArcConnection = (
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
    const bulge = canvasWidth * ARC_BULGE_RATIO;

    // Тот же сдвиг влево, что и у пунктирной линии — линии,
    // идущие по правому краю нижней платформы, двигаются синхронно.
    const shiftX = canvasWidth * RIGHT_EDGE_SHIFT_RATIO;

    const A = {
        x: bottom.currentX + bottom.scaledWidth + shiftX,
        y: bottom.currentY + bottom.scaledHeight / 2,
    };
    const B = {
        x: top.currentX + top.scaledWidth + shiftX,
        y: top.currentY + top.scaledHeight / 2,
    };

    const points = buildCircularArc(A, B, bulge, ARC_SEGMENTS);

    applyConnectionStroke(ctx, {lineWidth, color});

    drawPolylineWithProgress(ctx, points, progress);

    ctx.beginPath();
    ctx.arc(A.x, A.y, dotRadius, 0, Math.PI * 2);
    ctx.fill();

    if (progress >= 1) {
        ctx.beginPath();
        ctx.arc(B.x, B.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
    }
};

const drawDashedConnection = (
    ctx: CanvasRenderingContext2D,
    bottom: PodiumState,
    farTop: PodiumState,
    progress: number,
    canvasWidth: number,
    color: string,
    highlighted: boolean,
) => {
    const baseLineWidth = Math.max(1, canvasWidth * CONNECTION_LINE_WIDTH_RATIO);
    const lineWidth = highlighted ? baseLineWidth * HIGHLIGHT_WIDTH_MULTIPLIER : baseLineWidth;
    const dotRadius = Math.max(2, canvasWidth * CONNECTION_DOT_RADIUS_RATIO);
    const dash = Math.max(4, canvasWidth * DASH_LENGTH_RATIO);
    const gap = Math.max(3, canvasWidth * DASH_GAP_RATIO);

    // Горизонтальный сдвиг всей линии влево — сдвигаются оба конца
    // одинаково, поэтому наклон линии сохраняется.
    const shiftX = canvasWidth * RIGHT_EDGE_SHIFT_RATIO;

    const A = {
        x: bottom.currentX + bottom.scaledWidth + shiftX,
        y: bottom.currentY + bottom.scaledHeight / 2,
    };
    const B = {
        x: farTop.currentX + farTop.scaledWidth + shiftX,
        y: farTop.currentY + farTop.scaledHeight / 2,
    };

    ctx.save();
    applyConnectionStroke(ctx, {lineWidth, lineCap: 'butt', color});
    ctx.setLineDash([dash, gap]);

    const currentX = A.x + (B.x - A.x) * progress;
    const currentY = A.y + (B.y - A.y) * progress;

    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(A.x, A.y, dotRadius, 0, Math.PI * 2);
    ctx.fill();

    if (progress >= 1) {
        ctx.beginPath();
        ctx.arc(B.x, B.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
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

    const centerX = podium.currentX + podium.scaledWidth / 2;
    const y = podium.currentY + podium.scaledHeight * (1 - MARKER_BOTTOM_OFFSET_RATIO);
    const halfLength = (podium.scaledWidth * MARKER_LENGTH_RATIO * progress) / 2;

    ctx.save();
    applyConnectionStroke(ctx, {lineWidth, color: color ?? MARKER_COLOR});

    ctx.beginPath();
    ctx.moveTo(centerX - halfLength, y);
    ctx.lineTo(centerX + halfLength, y);
    ctx.stroke();

    if (progress > 0) {
        ctx.beginPath();
        ctx.arc(centerX - halfLength, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + halfLength, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
};

// Пять статичных элементов, не зависящих от активной схемы.
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

    // Флаги подсветки и цвета — для каждого типа линии отдельно.
    const serpentineHighlighted = isKindHighlighted(activeLegend, 'sharp-serpentine');
    const serpentineColor = resolveColor(activeLegend, 'sharp-serpentine', CONNECTION_COLOR);

    const arcHighlighted = isKindHighlighted(activeLegend, 'arc');
    const arcColor = resolveColor(activeLegend, 'arc', CONNECTION_COLOR);

    const dashedHighlighted = isKindHighlighted(activeLegend, 'dashed');
    const dashedColor = resolveColor(activeLegend, 'dashed', CONNECTION_COLOR);

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
    drawCircularArcConnection(ctx, bottom, second, progress, canvasWidth, arcColor, arcHighlighted);
    drawDashedConnection(ctx, bottom, third, progress, canvasWidth, dashedColor, dashedHighlighted);
    drawPlatformMarker(ctx, bottom, progress, canvasWidth, markerColor, markerHighlighted);

    ctx.restore();
};
