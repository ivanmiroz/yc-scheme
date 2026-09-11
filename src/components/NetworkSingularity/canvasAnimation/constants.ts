/** Базовый размер канваса для расчёта масштабирования */
export const BASE_CANVAS_SIZE = 1920;

/** Максимальный физический размер канваса (для ограничения DPR на 4K+ экранах) */
export const MAX_CANVAS_DIMENSION = 3840;

/** Количество отображаемых иконок */
export const NODE_COUNT = 20;

/** Количество дополнительных узлов без иконок и текста */
export const EMPTY_NODE_COUNT = 20;

/** Целевой FPS для анимации */
export const TARGET_FPS = 60;

/** Базовый размер иконки в пикселях */
export const BASE_ICON_SIZE = 28;

/** Размер шрифта подписи в пикселях */
export const LABEL_FONT_SIZE = 12;

/** Отступ между иконкой и подписью */
export const LABEL_GAP = 8;

/**
 * Внутренняя «подушка» bbox'а — дополнительный отступ вокруг иконки и текста
 * внутри самого bounding box. Работает и для иконок, и для подписей.
 */
export const NODE_BBOX_PADDING = 4;

/**
 * Дополнительный зазор, который A* оставляет между линией и bbox'ом узла.
 */
export const NODE_AVOIDANCE_MARGIN = 24;

/**
 * Амплитуда колебаний змейки (в пикселях, умножается на scaleFactor).
 */
export const SNAKE_AMPLITUDE = 7.8;

/** Количество полных витков змейки */
export const SNAKE_COILS = 3;

/**
 * Какую долю от самого длинного сегмента занимает змейка.
 */
export const SNAKE_LENGTH_RATIO = 0.4;

/**
 * Минимальная длина сегмента (в пикселях, умножается на scaleFactor),
 * при которой змейка вообще имеет смысл.
 */
export const SNAKE_MIN_SEGMENT_LEN = 80;

/** Отступы от краёв канваса (10%) */
export const CANVAS_PADDING_PERCENT = 0.1;

/** Задержка между появлениями иконок при старте (мс) */
export const SPAWN_DELAY_STEP = 150;

/** Длительность появления иконки (мс) */
export const APPEAR_DURATION = 600;

/** Максимальное случайное смещение внутри ячейки (40%) */
export const CELL_RANDOM_OFFSET = 0.4;

/** Цвет соединительных линий */
export const LINE_COLOR = '#334155';

/** Базовая толщина линии в пикселях */
export const BASE_LINE_WIDTH = 2;

/** Базовый радиус скругления поворотов линии */
export const LINE_CORNER_RADIUS = 20;

/** Радиус точки соединения (кружочка) в пикселях */
export const CONNECTION_POINT_RADIUS = 4;

/** Отступ точки соединения от нижнего края текста в пикселях */
export const CONNECTION_POINT_GAP = 8;

// ===== КОНСТАНТЫ ДЛЯ ЖИЗНЕННОГО ЦИКЛА =====

/**
 * Минимальное время, которое узел должен быть полностью виден
 * после появления, прежде чем он сможет начать исчезать (мс).
 */
export const MIN_VISIBLE_TIME = 3000;

/** Длительность плавного исчезновения узла и его связи (мс) */
export const FADE_DURATION = 800;

/** Задержка перед появлением нового узла после удаления старого (мс) */
export const RESPAWN_DELAY = 300;

/** Максимальное количество попыток найти свободную позицию для нового узла */
export const POSITION_SEARCH_ATTEMPTS = 50;

/**
 * Минимальный отступ между узлами (в пикселях, умножается на scaleFactor).
 * Гарантирует, что новые узлы не будут спавниться вплотную к существующим.
 */
export const NODE_SPACING = 20;

// ===== ПРОИЗВОДНЫЕ КОНСТАНТЫ =====

/** Общее целевое количество узлов (иконки + пустые) */
export const TARGET_TOTAL_COUNT = NODE_COUNT + EMPTY_NODE_COUNT;

/**
 * Минимальный возраст узла (от createdAt), при котором он может начать исчезать.
 * Узел должен полностью появиться (APPEAR_DURATION) и прожить минимум MIN_VISIBLE_TIME.
 */
export const MIN_AGE_FOR_FADE = APPEAR_DURATION + MIN_VISIBLE_TIME;

// ===== КОНСТАНТЫ ДЛЯ ЗАМОРОЖЕННОГО РЕЖИМА =====

/**
 * Максимальное количество узлов в "замороженном" состоянии.
 * В 4 раза больше обычного (TARGET_TOTAL_COUNT * 4 = 160).
 */
export const MAX_FROZEN_COUNT = TARGET_TOTAL_COUNT * 4;

/**
 * Множитель скорости анимации в замороженном режиме.
 * Значение 4 означает, что анимация появления/исчезновения идёт в 4 раза быстрее.
 */
export const FROZEN_TIME_SCALE = 4;

/**
 * Время (в мс), за которое нужно достичь лимита узлов при входе в замороженный режим.
 * Интервал спавна вычисляется адаптивно: FROZEN_FILL_DURATION / (MAX_FROZEN_COUNT - текущее_количество).
 */
export const FROZEN_FILL_DURATION = 2000;
