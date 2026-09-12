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
export const CELL_RANDOM_OFFSET = 0.15;

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

// ===== КОНСТАНТЫ ДЛЯ КОСТЯКА (CORE) =====

/**
 * Количество постоянных узлов «костяка» в центре сцены.
 * Эти узлы не исчезают и всегда соединены между собой кольцом.
 */
export const CORE_NODE_COUNT = 4;

/**
 * Радиус расположения core-узлов от центра канваса.
 * Задаётся как доля от меньшей стороны канваса.
 */
export const CORE_RADIUS_RATIO = 0.3;

/** Подписи для core-узлов (должны быть устойчивыми «якорными» понятиями). */
export const CORE_LABELS = ['Core', 'Hub', 'Router', 'Switch'];

/** Ключи иконок для core-узлов (соответствуют CORE_LABELS по порядку). */
export const CORE_ICON_KEYS = ['servers', 'cloud', 'database', 'network'];

// ===== КОНСТАНТЫ ДЛЯ ЖИЗНЕННОГО ЦИКЛА =====

/**
 * Минимальное время, которое узел должен быть полностью виден
 * после появления, прежде чем он сможет начать исчезать (мс).
 */
export const MIN_VISIBLE_TIME = 1500;

/** Длительность плавного исчезновения узла и его связи (мс). */
export const FADE_DURATION = 600;

/** Задержка перед появлением нового узла после начала исчезновения старого (мс). */
export const RESPAWN_DELAY = 100;

/** Максимальное количество попыток найти свободную позицию для нового узла. */
export const POSITION_SEARCH_ATTEMPTS = 150;

/**
 * Минимальный отступ между узлами (в пикселях, умножается на scaleFactor).
 */
export const NODE_SPACING = 50;

// ===== ПРОИЗВОДНЫЕ КОНСТАНТЫ =====

/** Общее целевое количество динамических узлов (иконки + пустые) */
export const TARGET_TOTAL_COUNT = NODE_COUNT + EMPTY_NODE_COUNT;

/**
 * Минимальный возраст узла (от createdAt), при котором он может начать исчезать.
 */
export const MIN_AGE_FOR_FADE = APPEAR_DURATION + MIN_VISIBLE_TIME;

// ===== КОНСТАНТЫ ДЛЯ ЗАМОРОЖЕННОГО РЕЖИМА =====

/**
 * Максимальное количество узлов в "замороженном" состоянии.
 */
export const MAX_FROZEN_COUNT = TARGET_TOTAL_COUNT * 4;

/**
 * Множитель скорости анимации в замороженном режиме.
 */
export const FROZEN_TIME_SCALE = 4;

/**
 * Время (в мс), за которое нужно достичь лимита узлов при входе в замороженный режим.
 */
export const FROZEN_FILL_DURATION = 2000;

// ===== КОНСТАНТЫ ДЛЯ АНИМАЦИИ РАЗЛЁТА (SCATTER) =====

/**
 * Длительность анимации разлёта объектов при клике на кнопку (мс).
 */
export const SCATTER_DURATION = 500;

/**
 * Максимальное расстояние разлёта объектов от их исходной позиции (в пикселях).
 */
export const SCATTER_DISTANCE = 200;
