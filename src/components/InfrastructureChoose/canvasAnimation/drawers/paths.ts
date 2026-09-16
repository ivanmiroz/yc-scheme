// «Змейка» с прямыми углами между P1 и P2 (ориентация — строго вертикаль).
export const buildSerpentine = (
    P1: {x: number; y: number},
    P2: {x: number; y: number},
    amp: number,
    turns: number,
): {x: number; y: number}[] => {
    const points: {x: number; y: number}[] = [{x: P1.x, y: P1.y}];
    const dy = (P2.y - P1.y) / (turns - 1);

    for (let i = 0; i < turns; i++) {
        const yi = P1.y + dy * i;

        let endX: number;
        if (i === 0) {
            endX = P1.x + amp;
        } else if (i === turns - 1) {
            endX = P2.x;
        } else {
            endX = P1.x + (i % 2 === 1 ? -amp : amp);
        }

        points.push({x: endX, y: yi});

        if (i < turns - 1) {
            points.push({x: endX, y: yi + dy});
        }
    }

    return points;
};

// «Змейка» в произвольной ориентации между A и B.
export const buildSerpentineBetween = (
    A: {x: number; y: number},
    B: {x: number; y: number},
    amp: number,
    turns: number,
    straightFraction: number,
): {x: number; y: number}[] => {
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const L = Math.hypot(dx, dy);
    if (L < 1e-6 || turns < 1) return [A, B];

    const ax = dx / L;
    const ay = dy / L;
    const px = -ay;
    const py = ax;

    const straight = straightFraction * L;
    const zigzagStart = straight;
    const zigzagEnd = L - straight;
    const zigzagLength = zigzagEnd - zigzagStart;

    const P1 = {x: A.x + ax * zigzagStart, y: A.y + ay * zigzagStart};

    const points: {x: number; y: number}[] = [A, P1];

    const step = turns > 1 ? zigzagLength / (turns - 1) : 0;

    for (let i = 0; i < turns; i++) {
        const alongDist = zigzagStart + step * i;
        const cx = A.x + ax * alongDist;
        const cy = A.y + ay * alongDist;

        let oEnd: number;
        if (i === 0) oEnd = amp;
        else if (i === turns - 1) oEnd = 0;
        else oEnd = i % 2 === 1 ? -amp : amp;

        points.push({x: cx + px * oEnd, y: cy + py * oEnd});

        if (i < turns - 1) {
            const nextAlongDist = zigzagStart + step * (i + 1);
            const nextCx = A.x + ax * nextAlongDist;
            const nextCy = A.y + ay * nextAlongDist;
            points.push({x: nextCx + px * oEnd, y: nextCy + py * oEnd});
        }
    }

    points.push(B);

    return points;
};

// Скругляет углы ломаной квадратичной кривой Безье радиусом r.
export const smoothCorners = (
    points: {x: number; y: number}[],
    radius: number,
    segments: number,
): {x: number; y: number}[] => {
    if (points.length < 3 || radius <= 0) return points;

    const out: {x: number; y: number}[] = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
        const P0 = points[i - 1];
        const P1 = points[i];
        const P2 = points[i + 1];

        const d0 = Math.hypot(P1.x - P0.x, P1.y - P0.y);
        const d1 = Math.hypot(P2.x - P1.x, P2.y - P1.y);
        if (d0 < 1e-6 || d1 < 1e-6) continue;

        const r = Math.min(radius, d0 / 2, d1 / 2);
        if (r < 0.5) {
            out.push(P1);
            continue;
        }

        const A = {
            x: P1.x + ((P0.x - P1.x) / d0) * r,
            y: P1.y + ((P0.y - P1.y) / d0) * r,
        };
        const B = {
            x: P1.x + ((P2.x - P1.x) / d1) * r,
            y: P1.y + ((P2.y - P1.y) / d1) * r,
        };

        out.push(A);

        for (let s = 1; s <= segments; s++) {
            const t = s / segments;
            const mt = 1 - t;
            out.push({
                x: mt * mt * A.x + 2 * mt * t * P1.x + t * t * B.x,
                y: mt * mt * A.y + 2 * mt * t * P1.y + t * t * B.y,
            });
        }
    }

    out.push(points[points.length - 1]);
    return out;
};

// Круговая дуга между A и B.
// По умолчанию выпуклая вправо от отрезка A→B.
// При flip = true выпуклость отражается на противоположную сторону.
export const buildCircularArc = (
    A: {x: number; y: number},
    B: {x: number; y: number},
    bulge: number,
    segments: number,
    flip = false,
): {x: number; y: number}[] => {
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-6) return [A, B];

    const R = (d * d) / (8 * bulge) + bulge / 2;
    const M = {x: (A.x + B.x) / 2, y: (A.y + B.y) / 2};

    const sign = flip ? -1 : 1;
    const nx = (dy / d) * sign;
    const ny = (-dx / d) * sign;

    const h = R - bulge;
    const O = {x: M.x + nx * h, y: M.y + ny * h};

    const a0 = Math.atan2(A.y - O.y, A.x - O.x);
    const a1 = Math.atan2(B.y - O.y, B.x - O.x);

    let delta = a1 - a0;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;

    const points: {x: number; y: number}[] = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = a0 + delta * t;
        points.push({
            x: O.x + R * Math.cos(angle),
            y: O.y + R * Math.sin(angle),
        });
    }
    return points;
};

// Рисует ломаную points[0] → points[1] → ... с обрезкой по длине.
export const drawPolylineWithProgress = (
    ctx: CanvasRenderingContext2D,
    points: {x: number; y: number}[],
    progress: number,
) => {
    if (points.length < 2 || progress <= 0) return;

    const lengths: number[] = [];
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const len = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
        lengths.push(len);
        total += len;
    }

    if (total <= 0) return;

    const targetLen = total * Math.min(1, progress);

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    let accumulated = 0;
    for (let i = 0; i < lengths.length; i++) {
        if (accumulated >= targetLen) break;

        const remaining = targetLen - accumulated;
        if (remaining >= lengths[i]) {
            ctx.lineTo(points[i + 1].x, points[i + 1].y);
            accumulated += lengths[i];
        } else {
            const t = remaining / lengths[i];
            const x = points[i].x + (points[i + 1].x - points[i].x) * t;
            const y = points[i].y + (points[i + 1].y - points[i].y) * t;
            ctx.lineTo(x, y);
            accumulated += remaining;
        }
    }

    ctx.stroke();
};
