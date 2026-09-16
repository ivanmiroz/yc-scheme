// src/components/InfrastructureChoose/canvasAnimation/drawers/schemeLines.ts
import {LEGEND_TO_LINE_KIND, LegendValue, getActiveSchemeLines, getLineKind} from '../schemes';
import {PodiumState, Position} from '../types';
import {
    CONNECTION_COLOR,
    CONNECTION_DOT_RADIUS_RATIO,
    CONNECTION_HIGHLIGHT_COLOR,
    CONNECTION_LINE_WIDTH_RATIO,
    DASH_GAP_RATIO,
    DASH_LENGTH_RATIO,
    SCHEME_ARC_BULGE_RATIO,
    SCHEME_ARC_SEGMENTS,
    SCHEME_SERPENTINE_AMPLITUDE_RATIO,
    SCHEME_SERPENTINE_CORNER_RADIUS_RATIO,
    SCHEME_SERPENTINE_CORNER_SEGMENTS,
    SCHEME_SERPENTINE_STRAIGHT_FRACTION,
    SCHEME_SERPENTINE_TURNS,
} from './config';
import {getAnchorPoint} from './geometry';
import {
    buildCircularArc,
    buildSerpentineBetween,
    drawPolylineWithProgress,
    smoothCorners,
} from './paths';
import {applyConnectionStroke} from './stroke';

// Во сколько раз толще рисуется подсвеченная линия.
const HIGHLIGHT_WIDTH_MULTIPLIER = 1.5;

interface Point {
    x: number;
    y: number;
}

// Поля линии, которые нужны для разрешения её концов.
// Это подмножество SchemeLine — чтобы не тянуть сюда полный тип
// и не плодить циклические импорты.
interface EndpointSpec {
    fromPlatform?: number;
    fromPlatformAnchor?: string;
    from?: string;
    fromAnchor?: string;
    toPlatform?: number;
    toPlatformAnchor?: string;
    to?: string;
    toAnchor?: string;
}

// Поля линии, которые нужны для выбора формы её отрисовки.
interface PathSpec {
    dashed?: boolean;
    serpentine?: boolean;
    sharpCorners?: boolean;
    serpentineStraightFraction?: number;
    arc?: boolean;
    arcFlip?: boolean;
}

// Номер платформы по её позиции в массиве podiums:
// последний элемент — платформа 1 (нижняя), первый — платформа 4 (верхняя).
const getPlatformNumber = (podiums: PodiumState[], podium: PodiumState): number =>
    podiums.length - podium.id;

// Найти платформу по её номеру (1..4).
const findPodiumByPlatformNumber = (
    podiums: PodiumState[],
    platformNumber: number,
): PodiumState | null => {
    for (let i = 0; i < podiums.length; i++) {
        if (getPlatformNumber(podiums, podiums[i]) === platformNumber) return podiums[i];
    }
    return null;
};

// Точка крепления линии на платформе — по её границе/центру.
// shiftXRatio — доп. сдвиг по X в долях ширины платформы.
// shiftYRatio — доп. сдвиг по Y в долях высоты платформы.
const getPlatformAnchorPoint = (
    podium: PodiumState,
    anchor: 'left' | 'right' | 'top' | 'bottom' | 'center',
    shiftXRatio: number,
    shiftYRatio: number,
): Point => {
    const left = podium.currentX;
    const right = podium.currentX + podium.scaledWidth;
    const top = podium.currentY;
    const bottom = podium.currentY + podium.scaledHeight;
    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;

    const shiftX = podium.scaledWidth * shiftXRatio;
    const shiftY = podium.scaledHeight * shiftYRatio;

    switch (anchor) {
        case 'left':
            return {x: left + shiftX, y: centerY + shiftY};
        case 'right':
            return {x: right + shiftX, y: centerY + shiftY};
        case 'top':
            return {x: centerX + shiftX, y: top + shiftY};
        case 'bottom':
            return {x: centerX + shiftX, y: bottom + shiftY};
        default:
            return {x: centerX + shiftX, y: centerY + shiftY};
    }
};

// Разрешить точку привязки для одного конца линии.
// Приоритет: платформенный якорь → якорь иконки → null.
const resolveEndpoint = (
    line: EndpointSpec,
    podiums: PodiumState[],
    byNumber: Map<string, Position>,
    canvasWidth: number,
    end: 'from' | 'to',
    platformShiftX: number,
    platformShiftY: number,
): Point | null => {
    const platformNumber = end === 'from' ? line.fromPlatform : line.toPlatform;
    const platformAnchor = end === 'from' ? line.fromPlatformAnchor : line.toPlatformAnchor;
    const positionNumber = end === 'from' ? line.from : line.to;
    const positionAnchor = end === 'from' ? line.fromAnchor : line.toAnchor;

    if (typeof platformNumber === 'number') {
        const podium = findPodiumByPlatformNumber(podiums, platformNumber);
        if (!podium) return null;
        return getPlatformAnchorPoint(
            podium,
            (platformAnchor as 'left' | 'right' | 'top' | 'bottom' | 'center') ?? 'center',
            platformShiftX,
            platformShiftY,
        );
    }

    if (positionNumber) {
        const pos = byNumber.get(positionNumber);
        if (!pos) return null;
        return getAnchorPoint(pos, canvasWidth, (positionAnchor as never) ?? 'center');
    }

    return null;
};

// Нарисовать линию заданной формы между A и B с прогрессом 0..1.
const drawLinePath = (
    ctx: CanvasRenderingContext2D,
    A: Point,
    B: Point,
    progress: number,
    canvasWidth: number,
    line: PathSpec,
) => {
    const dash = Math.max(4, canvasWidth * DASH_LENGTH_RATIO);
    const gap = Math.max(3, canvasWidth * DASH_GAP_RATIO);
    const serpentineAmp = canvasWidth * SCHEME_SERPENTINE_AMPLITUDE_RATIO;
    const cornerRadius = canvasWidth * SCHEME_SERPENTINE_CORNER_RADIUS_RATIO;
    const arcBulge = canvasWidth * SCHEME_ARC_BULGE_RATIO;

    if (line.dashed) {
        ctx.setLineDash([dash, gap]);
    } else {
        ctx.setLineDash([]);
    }

    if (line.serpentine) {
        const straightFraction =
            line.serpentineStraightFraction ?? SCHEME_SERPENTINE_STRAIGHT_FRACTION;

        const rawPoints = buildSerpentineBetween(
            A,
            B,
            serpentineAmp,
            SCHEME_SERPENTINE_TURNS,
            straightFraction,
        );
        const finalPoints = line.sharpCorners
            ? rawPoints
            : smoothCorners(rawPoints, cornerRadius, SCHEME_SERPENTINE_CORNER_SEGMENTS);
        drawPolylineWithProgress(ctx, finalPoints, progress);
        return;
    }

    if (line.arc) {
        const points = buildCircularArc(A, B, arcBulge, SCHEME_ARC_SEGMENTS, line.arcFlip ?? false);
        drawPolylineWithProgress(ctx, points, progress);
        return;
    }

    const currentX = A.x + (B.x - A.x) * progress;
    const currentY = A.y + (B.y - A.y) * progress;

    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
};

// Линии, специфичные для активной схемы.
// progresses[i] — прогресс 0..1 для i-й линии (по порядку из getActiveSchemeLines()).
// activeLegend — если задан, линии соответствующего типа рисуются цветом подсветки
// и увеличенной толщиной.
// podiums — нужны для линий, крепящихся к краю платформы (fromPlatform/toPlatform).
export const drawSchemeLines = (
    ctx: CanvasRenderingContext2D,
    positions: Position[],
    progresses: number[],
    canvasWidth: number,
    activeLegend: LegendValue | null,
    podiums: PodiumState[],
) => {
    const lines = getActiveSchemeLines();
    if (lines.length === 0 || positions.length === 0) return;

    const byNumber = new Map<string, Position>();
    positions.forEach((p) => byNumber.set(p.positionNumber, p));

    const baseLineWidth = Math.max(1, canvasWidth * CONNECTION_LINE_WIDTH_RATIO);
    const dotRadius = Math.max(2, canvasWidth * CONNECTION_DOT_RADIUS_RATIO);

    // Какой тип линий сейчас подсвечиваем (null — не подсвечиваем ничего).
    const activeKind = activeLegend ? LEGEND_TO_LINE_KIND[activeLegend] : null;

    ctx.save();

    lines.forEach((line, index) => {
        const progress = progresses[index] ?? 0;
        if (progress <= 0) return;

        const shiftX = line.platformAnchorShiftXRatio ?? 0;
        const shiftY = line.platformAnchorShiftYRatio ?? 0;

        const A = resolveEndpoint(line, podiums, byNumber, canvasWidth, 'from', shiftX, shiftY);
        if (!A) return;

        const B = resolveEndpoint(line, podiums, byNumber, canvasWidth, 'to', shiftX, shiftY);
        if (!B) return;

        const isHighlighted = activeKind !== null && getLineKind(line) === activeKind;
        const color = isHighlighted ? CONNECTION_HIGHLIGHT_COLOR : CONNECTION_COLOR;
        const lineWidth = isHighlighted
            ? baseLineWidth * HIGHLIGHT_WIDTH_MULTIPLIER
            : baseLineWidth;

        applyConnectionStroke(ctx, {lineWidth, color});

        drawLinePath(ctx, A, B, progress, canvasWidth, line);

        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(A.x, A.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        if (progress >= 1) {
            ctx.beginPath();
            ctx.arc(B.x, B.y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    ctx.restore();
};
