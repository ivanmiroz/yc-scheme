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
    spawnDelay: number;
    label: string;
    iconKey: string;
    bbox: BBox;
    connectionPoint: {x: number; y: number};
    isEmpty: boolean; // Убрано '?', так как значение всегда присваивается
    lineStyle: LineStyle;
    path: Point[];
    // Оптимизация: кэш длин сегментов для анимации появления
    pathLengths?: number[];
    totalPathLength?: number;
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
