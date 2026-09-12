export interface PodiumState {
    id: number;
    targetY: number;
    currentY: number;
    targetX: number;
    currentX: number;
    scaledWidth: number;
    scaledHeight: number;
}

export interface Position {
    x: number;
    y: number;
    platformId: number;
    positionNumber: string;
}

export interface CanvasAnimationCleanup {
    (): void;
    refreshScheme?: () => void; // <-- Добавлено
}
