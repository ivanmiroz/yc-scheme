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
