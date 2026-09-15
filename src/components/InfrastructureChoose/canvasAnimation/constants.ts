// src/components/InfrastructureChoose/canvasAnimation/constants.ts
export const ANIMATION_CONFIG = {
    PLATFORM_DURATION: 1000,
    STAGGER_DELAY: 150,
    PLATFORMS_COUNT: 4,
} as const;

export const POSITION_ANIMATION_CONFIG = {
    BASE_DELAY: 100,
    MAX_RANDOM_DELAY: 500,
    DURATION: 400,
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

export const ICON_DRAW_CONFIG = {
    BG_PADDING_RATIO: 0.2,
    BG_RADIUS_RATIO: 0.15,
    ICON_DRAW_RATIO: 0.6,
} as const;

export const CONNECTIONS_CONFIG = {
    // Соединения между платформами рисуются по 2 секунды каждое.
    LINE_DURATION: 2000,
    LINE_WIDTH_RATIO: 3 / 1920,
    DOT_RADIUS_RATIO: 7 / 1920,
    COLOR: '#000000',
    HIGHLIGHT_COLOR: 'rgba(42, 159, 255, 1)',

    TEXT_ANCHOR_GAP_RATIO: 12 / 1920,

    SERPENTINE: {
        TURNS: 10,
        AMPLITUDE_RATIO: (40 / 1920) * 0.7,
        STRAIGHT_FRACTION: 0.15,
    },

    SCHEME_SERPENTINE: {
        TURNS: 6,
        AMPLITUDE_RATIO: (40 / 1920) * 0.5,
        STRAIGHT_FRACTION: 0.25,
        CORNER_RADIUS_RATIO: 16 / 1920,
        CORNER_SEGMENTS: 8,
    },

    ARC: {
        BULGE_RATIO: 120 / 1920,
        SEGMENTS: 64,
    },

    SCHEME_ARC: {
        BULGE_RATIO: 40 / 1920,
        SEGMENTS: 48,
    },

    DASH: {
        LENGTH_RATIO: 12 / 1920,
        GAP_RATIO: 8 / 1920,
    },
} as const;

export const PLATFORM_MARKER_CONFIG = {
    LENGTH_RATIO: 1 / 3,
    BOTTOM_OFFSET_RATIO: 0.2,
    LINE_WIDTH_RATIO: 3 / 1920,
    DOT_RADIUS_RATIO: 7 / 1920,
    COLOR: '#000000',
    LINE_DURATION: 500,
} as const;

// Линии схемы (те, что описаны в scheme1Lines / scheme2Lines / …) рисуются
// суммарно 2 секунды: BASE_DELAY + MAX_RANDOM_DELAY + DURATION === 2000.
// Значения используются и в интро-анимации, и в refreshScheme()
// при переключении схем — тайминг одинаковый.
export const SCHEME_LINES_ANIMATION_CONFIG = {
    BASE_DELAY: 200,
    MAX_RANDOM_DELAY: 800,
    DURATION: 1000,
} as const;

// ==========================================
//  Параметры canvas и DPR
// ==========================================
export const CANVAS_CONFIG = {
    // Порог CSS-ширины вьюпорта, при превышении которого DPR ограничивается.
    LARGE_VIEWPORT_WIDTH: 2500,
    // Максимальный DPR на широких вьюпортах (4K/Retina).
    // При dpr=2 на 4K canvas получается 7680×4320 — ~33 млн пикселей,
    // из-за чего панорамирование подтормаживает. Ограничение до 1.5
    // режет объём работы почти вдвое без заметной потери резкости.
    MAX_DPR: 1.5,
} as const;

// Эффективный DPR с учётом ширины вьюпорта.
// На обычных экранах возвращает реальный DPR, на 4K — ограниченный.
export const getEffectiveDpr = (): number => {
    const dpr = window.devicePixelRatio || 1;
    if (window.innerWidth > CANVAS_CONFIG.LARGE_VIEWPORT_WIDTH) {
        return Math.min(dpr, CANVAS_CONFIG.MAX_DPR);
    }
    return dpr;
};
