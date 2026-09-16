import {LEGEND_TO_LINE_KIND, LegendValue, getActiveSchemeLines, getLineKind} from '../schemes';
import {Position} from '../types';
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

// Линии, специфичные для активной схемы.
// progresses[i] — прогресс 0..1 для i-й линии (по порядку из getActiveSchemeLines()).
// activeLegend — если задан, линии соответствующего типа рисуются цветом подсветки
// и увеличенной толщиной.
export const drawSchemeLines = (
    ctx: CanvasRenderingContext2D,
    positions: Position[],
    progresses: number[],
    canvasWidth: number,
    activeLegend: LegendValue | null,
) => {
    const lines = getActiveSchemeLines();
    if (lines.length === 0 || positions.length === 0) return;

    const byNumber = new Map<string, Position>();
    positions.forEach((p) => byNumber.set(p.positionNumber, p));

    const baseLineWidth = Math.max(1, canvasWidth * CONNECTION_LINE_WIDTH_RATIO);
    const dotRadius = Math.max(2, canvasWidth * CONNECTION_DOT_RADIUS_RATIO);
    const dash = Math.max(4, canvasWidth * DASH_LENGTH_RATIO);
    const gap = Math.max(3, canvasWidth * DASH_GAP_RATIO);

    const serpentineAmp = canvasWidth * SCHEME_SERPENTINE_AMPLITUDE_RATIO;
    const cornerRadius = canvasWidth * SCHEME_SERPENTINE_CORNER_RADIUS_RATIO;
    const arcBulge = canvasWidth * SCHEME_ARC_BULGE_RATIO;

    // Какой тип линий сейчас подсвечиваем (null — не подсвечиваем ничего).
    const activeKind = activeLegend ? LEGEND_TO_LINE_KIND[activeLegend] : null;

    ctx.save();

    lines.forEach((line, index) => {
        const progress = progresses[index] ?? 0;
        if (progress <= 0) return;

        const fromPos = byNumber.get(line.from);
        const toPos = byNumber.get(line.to);
        if (!fromPos || !toPos) return;

        const A = getAnchorPoint(fromPos, canvasWidth, line.fromAnchor ?? 'center');
        const B = getAnchorPoint(toPos, canvasWidth, line.toAnchor ?? 'center');
        if (!A || !B) return;

        // Подходит ли эта линия под активный тип легенды
        const isHighlighted = activeKind !== null && getLineKind(line) === activeKind;
        const color = isHighlighted ? CONNECTION_HIGHLIGHT_COLOR : CONNECTION_COLOR;
        const lineWidth = isHighlighted
            ? baseLineWidth * HIGHLIGHT_WIDTH_MULTIPLIER
            : baseLineWidth;

        applyConnectionStroke(ctx, {lineWidth, color});

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
        } else if (line.arc) {
            const points = buildCircularArc(
                A,
                B,
                arcBulge,
                SCHEME_ARC_SEGMENTS,
                line.arcFlip ?? false,
            );
            drawPolylineWithProgress(ctx, points, progress);
        } else {
            const currentX = A.x + (B.x - A.x) * progress;
            const currentY = A.y + (B.y - A.y) * progress;

            ctx.beginPath();
            ctx.moveTo(A.x, A.y);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
        }

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
