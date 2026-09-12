export interface Point {
    x: number;
    y: number;
}

export interface BBox {
    x: number;
    y: number;
    w: number;
    h: number;
}

export type LineStyle = 'solid' | 'dashed' | 'snake';

export interface Node2D {
    x: number;
    y: number;
    label: string;
    iconKey: string;
    bbox: BBox;
    connectionPoint: {x: number; y: number};
    isEmpty: boolean;
    lineStyle: LineStyle;
    path: Point[];
    pathLengths?: number[];
    totalPathLength?: number;

    // ===== ПОЛЯ ДЛЯ ЖИЗНЕННОГО ЦИКЛА =====

    /** Время появления узла (время анимации, мс). Может быть > текущего t, если узел отложен. */
    createdAt: number;
    /** Время начала исчезновения (null, если ещё не начал исчезать) */
    fadeStart: number | null;
    /** Индекс узла-источника линии (-1, если нет источника). Индекс в общем массиве [core, ...dynamic]. */
    sourceIdx: number;
    /** Флаг постоянного core-узла «костяка». Такие узлы никогда не исчезают. */
    isCore?: boolean;
}

export interface NodeWithDistance {
    node: Node2D;
    distance: number;
}

export interface CanvasSize {
    width: number;
    height: number;
}

export interface MouseState {
    isDown: boolean;
    lastX: number;
    lastY: number;
}
