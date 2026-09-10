/** Базовый размер канваса для расчёта масштабирования */
export const BASE_CANVAS_SIZE = 1920;

/** Максимальный физический размер канваса (для ограничения DPR на 4K+ экранах) */
export const MAX_CANVAS_DIMENSION = 3840;

/** Количество отображаемых иконок */
export const NODE_COUNT = 20;

/** Целевой FPS для анимации */
export const TARGET_FPS = 60;

/** Базовый размер иконки в пикселях (при scaleFactor = 1, т.е. на экране 1400px) */
export const BASE_ICON_SIZE = 28;

/** Размер шрифта подписи в пикселях */
export const LABEL_FONT_SIZE = 12;

/** Отступ между иконкой и подписью */
export const LABEL_GAP = 8;

/** Минимальный зазор между bounding box'ами (умножается на scaleFactor) */
export const NODE_PADDING = 16;

/** Отступы от краёв канваса (10%) */
export const CANVAS_PADDING_PERCENT = 0.1;

/** Задержка между появлениями иконок (мс) */
export const SPAWN_DELAY_STEP = 150;

/** Длительность появления иконки (мс) */
export const APPEAR_DURATION = 600;

/** Максимальное случайное смещение внутри ячейки (40%) */
export const CELL_RANDOM_OFFSET = 0.4;
