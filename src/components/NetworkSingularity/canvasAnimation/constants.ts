/** Базовый размер канваса для расчёта масштабирования */
export const BASE_CANVAS_SIZE = 1920;

/** Максимальный физический размер канваса (для ограничения DPR на 4K+ экранах) */
export const MAX_CANVAS_DIMENSION = 3840;

/** Количество отображаемых иконок (динамических) */
export const NODE_COUNT = 20;

/** Количество дополнительных узлов без иконок и текста (динамических) */
export const EMPTY_NODE_COUNT = 1;

/** Целевой FPS для анимации */
export const TARGET_FPS = 60;

/** Базовый размер иконки в пикселях */
export const BASE_ICON_SIZE = 28;

/** Размер шрифта подписи в пикселях */
export const LABEL_FONT_SIZE = 12;

/** Отступ между иконкой и подписью */
export const LABEL_GAP = 8;

/** Внутренняя «подушка» bbox'а */
export const NODE_BBOX_PADDING = 4;

/** Дополнительный зазор A* между линией и bbox'ом узла. */
export const NODE_AVOIDANCE_MARGIN = 24;

/** Амплитуда колебаний змейки (умножается на scaleFactor). */
export const SNAKE_AMPLITUDE = 7.8;

/** Количество полных витков змейки */
export const SNAKE_COILS = 3;

/** Доля от самого длинного сегмента, которую занимает змейка. */
export const SNAKE_LENGTH_RATIO = 0.4;

/** Минимальная длина сегмента для змейки (умножается на scaleFactor). */
export const SNAKE_MIN_SEGMENT_LEN = 80;

/** Отступы от краёв канваса (10%) */
export const CANVAS_PADDING_PERCENT = 0.1;

// ===== ГЛОБАЛЬНЫЙ МНОЖИТЕЛЬ СКОРОСТИ АНИМАЦИИ =====

/**
 * Глобальный множитель скорости анимации.
 * 1.0 — базовая скорость, 2.0 — всё в 2 раза медленнее, 0.5 — в 2 раза быстрее.
 */
export const ANIMATION_SPEED_MULTIPLIER = 2;

/** Задержка между появлениями иконок при старте (мс) */
export const SPAWN_DELAY_STEP = 150 * ANIMATION_SPEED_MULTIPLIER;

/** Длительность появления иконки (мс) */
export const APPEAR_DURATION = 600 * ANIMATION_SPEED_MULTIPLIER;

/** Максимальное случайное смещение внутри ячейки */
export const CELL_RANDOM_OFFSET = 0.15;

/** Цвет соединительных линий */
export const LINE_COLOR = '#000';

/** Базовая толщина линии в пикселях */
export const BASE_LINE_WIDTH = 2;

/** Базовый радиус скругления поворотов линии */
export const LINE_CORNER_RADIUS = 20;

/** Радиус точки соединения (кружочка) в пикселях */
export const CONNECTION_POINT_RADIUS = 4;

/** Отступ точки соединения от нижнего края текста в пикселях */
export const CONNECTION_POINT_GAP = 8;

// ===== ПОДЛОЖКА ПОД ТЕКСТОМ =====

export const TEXT_BG_COLOR = 'rgba(233, 236, 245, 1)';
export const TEXT_BG_RADIUS = 8;
export const TEXT_BG_PADDING_X = 6;
export const TEXT_BG_PADDING_Y = 2;

// ===== КОСТЯК (CORE) =====

export const CORE_NODE_COUNT = 4;
export const CORE_RADIUS_RATIO = 0.3;

// ===== ЖИЗНЕННЫЙ ЦИКЛ =====

export const MIN_VISIBLE_TIME = 1500 * ANIMATION_SPEED_MULTIPLIER;
export const FADE_DURATION = 600 * ANIMATION_SPEED_MULTIPLIER;
export const RESPAWN_DELAY = 100 * ANIMATION_SPEED_MULTIPLIER;
export const POSITION_SEARCH_ATTEMPTS = 150;
export const NODE_SPACING = 50;

/**
 * Сколько самых старых динамических узлов исключается из выбора источника
 * для новых линий. Самые старые узлы первыми уходят по возрасту, поэтому
 * новые связи к ним не крепим — иначе линия обрывается вместе с узлом,
 * едва успев появиться. Core-узлы под это правило не попадают.
 */
export const SKIP_OLDEST_SOURCE_COUNT = 4;

// ===== ПРОИЗВОДНЫЕ =====

export const TARGET_TOTAL_COUNT = NODE_COUNT + EMPTY_NODE_COUNT;
export const MIN_AGE_FOR_FADE = APPEAR_DURATION + MIN_VISIBLE_TIME;

// ===== ЗАМОРОЖЕННЫЙ РЕЖИМ =====

export const MAX_FROZEN_COUNT = TARGET_TOTAL_COUNT * 4;
export const FROZEN_TIME_SCALE = 4;
export const FROZEN_FILL_DURATION = 2000 * ANIMATION_SPEED_MULTIPLIER;

// ===== АНИМАЦИЯ СХЛОПЫВАНИЯ (COLLAPSE) =====

/**
 * Длительность фазы ускорения анимации перед схлопыванием (мс).
 * В течение этой фазы всё идёт быстрее.
 */
export const COLLAPSE_ACCELERATE_DURATION = 2000;

/** Множитель скорости анимации в фазе ускорения. */
export const COLLAPSE_ACCELERATE_SPEED = 3;

/**
 * Длительность фазы «сжатия» линий (мс).
 * Линии не гаснут — они «сматываются» обратно к своему источнику
 * (визуально укорачиваются до нуля). Иконки и точки при этом остаются видимыми.
 */
export const COLLAPSE_SHRINK_DURATION = 500;

/**
 * Длительность фазы слёта иконок к центру (мс).
 * Каждая иконка летит со своей скоростью.
 */
export const COLLAPSE_FLY_DURATION = 500;
