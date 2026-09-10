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
 * Должен быть больше SNAKE_AMPLITUDE + BASE_LINE_WIDTH / 2, иначе линия
 * (в том числе колебания змейки) может задеть иконку или текст.
 *
 * Эффективный зазор до содержимого узла = NODE_BBOX_PADDING + NODE_AVOIDANCE_MARGIN
 * = 4 + 24 = 28 * scaleFactor.
 */
export const NODE_AVOIDANCE_MARGIN = 24;

/**
 * Амплитуда колебаний змейки (в пикселях, умножается на scaleFactor).
 * 7.8 < NODE_AVOIDANCE_MARGIN (24) — колебания не выходят за пределы
 * безопасного коридора.
 */
export const SNAKE_AMPLITUDE = 7.8;

/** Количество полных витков змейки */
export const SNAKE_COILS = 3;

/**
 * Какую долю от самого длинного сегмента занимает змейка.
 * 0.4 — на 20% меньше прежних 0.5, из-за чего при том же числе
 * витков шаг витка уменьшается на 20% (витки ложатся плотнее).
 */
export const SNAKE_LENGTH_RATIO = 0.4;

/**
 * Минимальная длина сегмента (в пикселях, умножается на scaleFactor),
 * при которой змейка вообще имеет смысл.
 */
export const SNAKE_MIN_SEGMENT_LEN = 80;

/** Отступы от краёв канваса (10%) */
export const CANVAS_PADDING_PERCENT = 0.1;

/** Задержка между появлениями иконок (мс) */
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
