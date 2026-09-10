import type {BBox, Point} from './types';

const DIR_NONE = 0;
const DIR_H = 1;
const DIR_V = 2;

const TURN_PENALTY = 20;

/**
 * Проверяет, пересекает ли ортогональный отрезок внутренность препятствия.
 * Границы препятствия считаются «проходимыми».
 *
 * @param x1 - X начала отрезка.
 * @param y1 - Y начала отрезка.
 * @param x2 - X конца отрезка.
 * @param y2 - Y конца отрезка.
 * @param ob - Прямоугольник-препятствие.
 * @returns true, если отрезок заходит внутрь препятствия.
 */
const segmentHitsObstacle = (x1: number, y1: number, x2: number, y2: number, ob: BBox): boolean => {
    if (y1 === y2) {
        const y = y1;
        if (y <= ob.y || y >= ob.y + ob.h) return false;
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        return maxX > ob.x && minX < ob.x + ob.w;
    }
    const x = x1;
    if (x <= ob.x || x >= ob.x + ob.w) return false;
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return maxY > ob.y && minY < ob.y + ob.h;
};

/**
 * Бинарная мин-куча для A*.
 * Хранит параллельные массивы значений f и индексов состояний.
 */
class MinHeap {
    private readonly f: number[] = [];
    private readonly idx: number[] = [];

    /** Текущее количество элементов в куче. */
    get size(): number {
        return this.f.length;
    }

    /**
     * Добавляет пару (f, idx) в кучу.
     *
     * @param fv - Значение f (приоритет).
     * @param iv - Индекс состояния A*.
     * @returns Ничего не возвращает.
     */
    push(fv: number, iv: number): void {
        let i = this.f.length;
        this.f.push(fv);
        this.idx.push(iv);
        while (i > 0) {
            const p = Math.floor((i - 1) / 2);
            if (this.f[p] <= this.f[i]) break;
            const tf = this.f[p];
            this.f[p] = this.f[i];
            this.f[i] = tf;
            const ti = this.idx[p];
            this.idx[p] = this.idx[i];
            this.idx[i] = ti;
            i = p;
        }
    }

    /**
     * Извлекает пару с минимальным f.
     *
     * @returns Кортеж [f, idx] или null, если куча пуста.
     */
    pop(): [number, number] | null {
        const size = this.f.length;
        if (size === 0) return null;

        const topF = this.f[0];
        const topIdx = this.idx[0];
        const lastF = this.f[size - 1];
        const lastIdx = this.idx[size - 1];
        this.f.pop();
        this.idx.pop();

        if (size > 1) {
            this.f[0] = lastF;
            this.idx[0] = lastIdx;
            const heapSize = size - 1;
            let i = 0;
            for (;;) {
                const l = 2 * i + 1;
                const r = l + 1;
                let m = i;
                if (l < heapSize && this.f[l] < this.f[m]) m = l;
                if (r < heapSize && this.f[r] < this.f[m]) m = r;
                if (m === i) break;
                const tf = this.f[m];
                this.f[m] = this.f[i];
                this.f[i] = tf;
                const ti = this.idx[m];
                this.idx[m] = this.idx[i];
                this.idx[i] = ti;
                i = m;
            }
        }

        return [topF, topIdx];
    }
}

interface HananGrid {
    xs: number[];
    ys: number[];
    nx: number;
    ny: number;
    hCount: number;
    vCount: number;
    hBlocked: Uint8Array;
    vBlocked: Uint8Array;
}

/**
 * Строит сетку Ханана по границам препятствий плюс координаты start/end
 * и помечает сегменты, проходящие через внутренность препятствий.
 *
 * @param start - Стартовая точка маршрута.
 * @param end - Конечная точка маршрута.
 * @param obstacles - Прямоугольники-препятствия.
 * @param margin - Отступ от границ препятствий.
 * @returns Сетка Ханана с масками заблокированных сегментов.
 */
const buildHananGrid = (start: Point, end: Point, obstacles: BBox[], margin: number): HananGrid => {
    const xSet = new Set<number>([start.x, end.x]);
    const ySet = new Set<number>([start.y, end.y]);
    for (const ob of obstacles) {
        xSet.add(ob.x - margin);
        xSet.add(ob.x + ob.w + margin);
        ySet.add(ob.y - margin);
        ySet.add(ob.y + ob.h + margin);
    }
    const xs = Array.from(xSet).sort((a, b) => a - b);
    const ys = Array.from(ySet).sort((a, b) => a - b);
    const nx = xs.length;
    const ny = ys.length;

    const hCount = Math.max(0, nx - 1);
    const vCount = Math.max(0, ny - 1);
    const hBlocked = new Uint8Array(ny * hCount);
    const vBlocked = new Uint8Array(nx * vCount);

    for (let j = 0; j < ny; j++) {
        const y = ys[j];
        const relevant: BBox[] = [];
        for (const ob of obstacles) {
            if (y > ob.y && y < ob.y + ob.h) relevant.push(ob);
        }
        if (relevant.length === 0) continue;
        for (let i = 0; i < hCount; i++) {
            const x1 = xs[i];
            const x2 = xs[i + 1];
            for (const ob of relevant) {
                if (segmentHitsObstacle(x1, y, x2, y, ob)) {
                    hBlocked[j * hCount + i] = 1;
                    break;
                }
            }
        }
    }

    for (let i = 0; i < nx; i++) {
        const x = xs[i];
        const relevant: BBox[] = [];
        for (const ob of obstacles) {
            if (x > ob.x && x < ob.x + ob.w) relevant.push(ob);
        }
        if (relevant.length === 0) continue;
        for (let j = 0; j < vCount; j++) {
            const y1 = ys[j];
            const y2 = ys[j + 1];
            for (const ob of relevant) {
                if (segmentHitsObstacle(x, y1, x, y2, ob)) {
                    vBlocked[i * vCount + j] = 1;
                    break;
                }
            }
        }
    }

    return {xs, ys, nx, ny, hCount, vCount, hBlocked, vBlocked};
};

/**
 * Ищет путь по сетке Ханана с помощью A* с учётом направления
 * (штраф за поворот TURN_PENALTY).
 *
 * @param grid - Сетка Ханана с масками заблокированных сегментов.
 * @param start - Стартовая точка.
 * @param end - Конечная точка.
 * @returns Полилиния пути или null, если путь не найден.
 */
const runAStar = (grid: HananGrid, start: Point, end: Point): Point[] | null => {
    const {xs, ys, nx, ny, hCount, vCount, hBlocked, vBlocked} = grid;

    const startXi = xs.indexOf(start.x);
    const startYi = ys.indexOf(start.y);
    const endXi = xs.indexOf(end.x);
    const endYi = ys.indexOf(end.y);

    const stateCount = nx * ny * 3;
    const gScore = new Float64Array(stateCount).fill(Infinity);
    const cameFrom = new Int32Array(stateCount).fill(-1);
    const closed = new Uint8Array(stateCount);

    const stateIdx = (xi: number, yi: number, dir: number): number => (yi * nx + xi) * 3 + dir;
    const heur = (xi: number, yi: number): number =>
        Math.abs(xs[xi] - end.x) + Math.abs(ys[yi] - end.y);

    const heap = new MinHeap();
    const startState = stateIdx(startXi, startYi, DIR_NONE);
    gScore[startState] = 0;
    heap.push(heur(startXi, startYi), startState);

    let foundIdx = -1;

    while (heap.size > 0) {
        const popped = heap.pop();
        if (!popped) break;
        const idx = popped[1];
        if (closed[idx]) continue;
        closed[idx] = 1;

        const dir = idx % 3;
        const cell = (idx - dir) / 3;
        const xi = cell % nx;
        const yi = (cell - xi) / nx;

        if (xi === endXi && yi === endYi) {
            foundIdx = idx;
            break;
        }

        const g = gScore[idx];

        const tryMove = (toXi: number, toYi: number, moveDir: number, stepCost: number): void => {
            if (toXi < 0 || toXi >= nx || toYi < 0 || toYi >= ny) return;

            if (moveDir === DIR_H) {
                const segI = Math.min(xi, toXi);
                if (hBlocked[yi * hCount + segI]) return;
            } else {
                const segJ = Math.min(yi, toYi);
                if (vBlocked[xi * vCount + segJ]) return;
            }

            const turnCost = dir === DIR_NONE || dir === moveDir ? 0 : TURN_PENALTY;
            const ng = g + stepCost + turnCost;
            const nIdx = stateIdx(toXi, toYi, moveDir);

            if (ng < gScore[nIdx]) {
                gScore[nIdx] = ng;
                cameFrom[nIdx] = idx;
                heap.push(ng + heur(toXi, toYi), nIdx);
            }
        };

        if (xi + 1 < nx) tryMove(xi + 1, yi, DIR_H, xs[xi + 1] - xs[xi]);
        if (xi - 1 >= 0) tryMove(xi - 1, yi, DIR_H, xs[xi] - xs[xi - 1]);
        if (yi + 1 < ny) tryMove(xi, yi + 1, DIR_V, ys[yi + 1] - ys[yi]);
        if (yi - 1 >= 0) tryMove(xi, yi - 1, DIR_V, ys[yi] - ys[yi - 1]);
    }

    if (foundIdx === -1) return null;

    const rawPath: Point[] = [];
    let cur = foundIdx;
    while (cur !== -1) {
        const dir = cur % 3;
        const cell = (cur - dir) / 3;
        const xi = cell % nx;
        const yi = (cell - xi) / nx;
        rawPath.push({x: xs[xi], y: ys[yi]});
        cur = cameFrom[cur];
    }
    rawPath.reverse();

    return rawPath;
};

/**
 * Удаляет дубликаты и коллинеарные промежуточные точки из полилинии.
 *
 * @param rawPath - Исходная полилиния.
 * @returns Упрощённая полилиния без избыточных точек.
 */
const simplifyPath = (rawPath: Point[]): Point[] => {
    if (rawPath.length === 0) return rawPath;

    const dedup: Point[] = [rawPath[0]];
    for (let i = 1; i < rawPath.length; i++) {
        const last = dedup[dedup.length - 1];
        if (last.x !== rawPath[i].x || last.y !== rawPath[i].y) {
            dedup.push(rawPath[i]);
        }
    }

    if (dedup.length <= 2) return dedup;

    const simplified: Point[] = [dedup[0]];
    for (let i = 1; i < dedup.length - 1; i++) {
        const a = simplified[simplified.length - 1];
        const b = dedup[i];
        const c = dedup[i + 1];
        const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
        if (Math.abs(cross) > 0.001) {
            simplified.push(b);
        }
    }
    simplified.push(dedup[dedup.length - 1]);

    return simplified;
};

/**
 * Прокладывает ортогональный маршрут от start к end, обходя препятствия.
 *
 * Алгоритм:
 *  1. Строится сетка Ханана — вертикальные/горизонтальные линии на границах
 *     препятствий (с отступом margin) плюс координаты start/end.
 *  2. По этой сетке запускается A* с штрафом за поворот (учёт направления).
 *  3. Путь упрощается удалением коллинеарных точек.
 *
 * @param start - Стартовая точка маршрута.
 * @param end - Конечная точка маршрута.
 * @param obstacles - Прямоугольники-препятствия.
 * @param margin - Зазор между линией и препятствием.
 * @returns Точки маршрута: первая — start, последняя — end.
 */
export const routeOrthogonal = (
    start: Point,
    end: Point,
    obstacles: BBox[],
    margin: number,
): Point[] => {
    if (start.x === end.x && start.y === end.y) return [start];

    const grid = buildHananGrid(start, end, obstacles, margin);
    const rawPath = runAStar(grid, start, end);

    if (!rawPath) {
        return [
            {x: start.x, y: start.y},
            {x: start.x, y: end.y},
            {x: end.x, y: end.y},
        ];
    }

    return simplifyPath(rawPath);
};

// =====================================================================
//                         ЗМЕЙКА (SNAKE)
// =====================================================================

/**
 * Строит ортогональную «змейку» между start и end:
 * линия колеблется перпендикулярно направлению start→end
 * с амплитудой amplitude и делает coils полных витков.
 *
 * @param start - Начало змейки.
 * @param end - Конец змейки.
 * @param coils - Количество полных витков.
 * @param amplitude - Амплитуда колебаний (в пикселях).
 * @returns Точки полилинии-змейки.
 */
export const buildSnakeSegment = (
    start: Point,
    end: Point,
    coils: number,
    amplitude: number,
): Point[] => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy);

    if (len < amplitude * 4 || coils < 1) return [start, end];

    const ux = dx / len;
    const uy = dy / len;
    const vx = -uy;
    const vy = ux;

    const totalSteps = coils * 2;
    const step = len / totalSteps;

    const onLine = (i: number): Point => ({
        x: start.x + ux * step * i,
        y: start.y + uy * step * i,
    });
    const side = (i: number, sign: number): Point => {
        const p = onLine(i);
        return {
            x: p.x + vx * amplitude * sign,
            y: p.y + vy * amplitude * sign,
        };
    };

    const points: Point[] = [];

    points.push(onLine(0));
    points.push(side(0, 1));

    for (let c = 0; c < coils; c++) {
        points.push(side(c * 2 + 1, 1));
        points.push(side(c * 2 + 1, -1));
        points.push(side(c * 2 + 2, -1));
        if (c < coils - 1) {
            points.push(side(c * 2 + 2, 1));
        }
    }

    points.push(onLine(totalSteps));

    return points;
};

/**
 * Если у пути есть достаточно длинный прямой сегмент — заменяет его
 * ЦЕНТРАЛЬНУЮ ЧАСТЬ на «змейку». По краям сегмента остаются прямые участки.
 *
 * Так как змейка занимает только `lengthRatio` от длины сегмента,
 * при том же количестве витков `coils` шаг витка уменьшается —
 * витки становятся плотнее.
 *
 * @param base - Исходная полилиния.
 * @param amplitude - Амплитуда колебаний змейки (в пикселях, уже умноженная на scaleFactor).
 * @param coils - Количество полных витков.
 * @param minSegmentLen - Минимальная длина сегмента для применения змейки (в пикселях, уже умноженная на scaleFactor).
 * @param lengthRatio - Доля длины сегмента, отводимая под змейку (0..1).
 * @returns Полилиния, у которой центральная часть самого длинного
 *          сегмента (если он достаточно длинный) заменена змейкой.
 */
export const applySnakeToPath = (
    base: Point[],
    amplitude: number,
    coils: number,
    minSegmentLen: number,
    lengthRatio = 0.5,
): Point[] => {
    if (base.length < 2) return base;

    // Ищем самый длинный сегмент
    let longestIdx = -1;
    let longestLen = 0;
    for (let i = 1; i < base.length; i++) {
        const len = Math.hypot(base[i].x - base[i - 1].x, base[i].y - base[i - 1].y);
        if (len > longestLen) {
            longestLen = len;
            longestIdx = i;
        }
    }

    if (longestIdx < 0 || longestLen < minSegmentLen) return base;

    const A = base[longestIdx - 1];
    const B = base[longestIdx];

    // Единичный вектор вдоль сегмента A→B
    const ux = (B.x - A.x) / longestLen;
    const uy = (B.y - A.y) / longestLen;

    // Длина змейки и отступ от каждого конца сегмента до её начала
    const snakeLen = longestLen * lengthRatio;
    const padLen = (longestLen - snakeLen) / 2;

    const P0: Point = {
        x: A.x + ux * padLen,
        y: A.y + uy * padLen,
    };
    const P1: Point = {
        x: A.x + ux * (padLen + snakeLen),
        y: A.y + uy * (padLen + snakeLen),
    };

    const snakePoints = buildSnakeSegment(P0, P1, coils, amplitude);

    // Собираем результат: всё до A, потом A → P0 (прямая) → змейка → P1 → B (прямая), потом всё после B.
    // snakePoints начинается с P0 и заканчивается P1 — дублировать их не нужно.
    const result: Point[] = [];
    for (let i = 0; i < longestIdx - 1; i++) result.push(base[i]);
    result.push(A);
    for (const p of snakePoints) result.push(p);
    result.push(B);
    for (let i = longestIdx + 1; i < base.length; i++) result.push(base[i]);

    return result;
};
