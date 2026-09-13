export const ANIMATION_CONFIG = {
    PLATFORM_DURATION: 1000,
    STAGGER_DELAY: 150,
    PLATFORMS_COUNT: 4,
} as const;

export const POSITION_ANIMATION_CONFIG = {
    BASE_DELAY: 100, // базовая задержка перед появлением позиции
    MAX_RANDOM_DELAY: 500, // максимальная случайная задержка
    DURATION: 400, // длительность появления каждой позиции
} as const;

export const POSITION_CONFIG = {
    RHOMB_WIDTH_RATIO: 0.4,
    RHOMB_HEIGHT_RATIO: 0.6,
    RHOMB1_CENTER_X_RATIO: 0.25,
    RHOMB2_CENTER_X_RATIO: 0.75,
    RHOMB_CENTER_Y_RATIO: 0.5,
} as const;

export const POSITION_ICON_CONFIG = {
    ICON_SIZE_RATIO: 0.015,
    ICON_FONT_SIZE_RATIO: 0.008,
    ICON_TEXT_GAP_RATIO: 0.6,
    ICON_STROKE_WIDTH_RATIO: 0.001,
    MIN_STROKE_WIDTH: 2,
} as const;

// ==========================================
//  Общие параметры отрисовки иконок
// ==========================================
export const ICON_DRAW_CONFIG = {
    // Паддинг подложки вокруг иконок (доля от реального размера иконки = 0.6 · iconSize)
    BG_PADDING_RATIO: 0.2,
    // Радиус скругления подложки (доля от её меньшей стороны)
    BG_RADIUS_RATIO: 0.15,
    // Доля слота, которую занимает сама иконка (см. drawIcon)
    ICON_DRAW_RATIO: 0.6,
} as const;

// ==========================================
//  Параметры линий-соединений между платформами
// ==========================================
export const CONNECTIONS_CONFIG = {
    // Длительность прорисовки одной линии, мс
    LINE_DURATION: 500,
    // Толщина линии (доля от css-ширины канваса)
    LINE_WIDTH_RATIO: 3 / 1920,
    // Радиус «жирных» точек на концах линии (доля от css-ширины канваса)
    DOT_RADIUS_RATIO: 7 / 1920,
    // Цвет линии и точек
    COLOR: '#000000',

    // Отступ точки привязки от текста (text-top / text-bottom),
    // чтобы линия не касалась текста вплотную.
    // Доля от css-ширины канваса.
    TEXT_ANCHOR_GAP_RATIO: 12 / 1920,

    // Параметры «змейки» между платформами
    SERPENTINE: {
        TURNS: 10,
        AMPLITUDE_RATIO: (40 / 1920) * 0.7,
        STRAIGHT_FRACTION: 0.15,
    },

    // Параметры «змейки» внутри линий схемы (когда у SchemeLine
    // указан флаг serpentine: true). Углы змейки скруглены.
    SCHEME_SERPENTINE: {
        TURNS: 10,
        AMPLITUDE_RATIO: (40 / 1920) * 0.7,
        // Прямые участки на входе и выходе — по 25% с каждой стороны,
        // тогда змейка занимает центральные 50% длины линии.
        STRAIGHT_FRACTION: 0.25,
        // Радиус скругления углов (доля от css-ширины канваса)
        CORNER_RADIUS_RATIO: 8 / 1920,
        // Сколько сегментов на каждое скругление
        CORNER_SEGMENTS: 8,
    },

    // Параметры круговой дуги для статичных соединений между платформами
    ARC: {
        BULGE_RATIO: 120 / 1920,
        SEGMENTS: 64,
    },

    // Параметры круговой дуги для линий активной схемы (SchemeLine.arc === true)
    SCHEME_ARC: {
        BULGE_RATIO: 40 / 1920,
        SEGMENTS: 48,
    },

    // Параметры пунктира
    DASH: {
        LENGTH_RATIO: 12 / 1920,
        GAP_RATIO: 8 / 1920,
    },
} as const;

// ==========================================
//  Пятая линия — короткий отрезок на первой (нижней) платформе
// ==========================================
export const PLATFORM_MARKER_CONFIG = {
    // Длина отрезка — доля от ширины платформы
    LENGTH_RATIO: 1 / 3,
    // Отступ от нижнего края платформы — доля от её высоты
    BOTTOM_OFFSET_RATIO: 0.2,
    // Толщина линии (доля от css-ширины канваса)
    LINE_WIDTH_RATIO: 3 / 1920,
    // Радиус «жирных» точек на концах (доля от css-ширины канваса)
    DOT_RADIUS_RATIO: 7 / 1920,
    // Цвет линии и точек
    COLOR: '#000000',
    // Длительность прорисовки, мс
    LINE_DURATION: 500,
} as const;

// ==========================================
//  Анимация появления линий активной схемы
//  (линии появляются как иконки — с индивидуальной задержкой и длительностью)
// ==========================================
export const SCHEME_LINES_ANIMATION_CONFIG = {
    BASE_DELAY: 100, // базовая задержка перед появлением линии
    MAX_RANDOM_DELAY: 500, // максимальная случайная задержка
    DURATION: 400, // длительность прорисовки каждой линии
} as const;
