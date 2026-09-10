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

/**
 * solid  — сплошная;
 * dashed — пунктирная;
 * snake  — сплошная, у которой самый длинный сегмент превращён в «змейку»
 *          с несколькими витками.
 */
export type LineStyle = 'solid' | 'dashed' | 'snake';

export interface Node2D {
    x: number;
    y: number;
    spawnDelay: number;
    label: string;
    iconKey: string;
    bbox: BBox;
    /** Координаты центра точки соединения (кружочка под текстом) */
    connectionPoint: {x: number; y: number};
    /** Флаг для узлов без иконки и текста */
    isEmpty?: boolean;
    /** Стиль линии, которая будет идти к этому узлу */
    lineStyle: LineStyle;
    /**
     * Предрассчитанный ортогональный маршрут (уже с змейкой, если стиль 'snake').
     */
    path: Point[];
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
