export interface Position {
    positionNumber: string;
    x: number;
    y: number;
}

export interface PodiumState {
    id: number;
    targetX: number;
    targetY: number;
    currentX: number;
    currentY: number;
    scaledWidth: number;
    scaledHeight: number;
}

export interface CanvasAnimationCleanup {
    (): void;
    refreshScheme?: () => void;
    setActiveLegend?: (legend: import('./schemes').LegendValue | null) => void;
    /** Обратная анимация: фейдаут линий/объектов, затем схлопывание платформ в центр. */
    startReverse?: (cb?: () => void) => void;
}
