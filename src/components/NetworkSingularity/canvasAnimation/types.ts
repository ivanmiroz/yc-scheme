export interface BBox {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Node2D {
    x: number;
    y: number;
    spawnDelay: number;
    label: string;
    iconKey: string;
    bbox: BBox;
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
