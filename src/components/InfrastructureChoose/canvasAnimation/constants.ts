export const ANIMATION_CONFIG = {
    PLATFORM_DURATION: 2000,
    TEXT_DURATION: 400,
    STAGGER_DELAY: 150,
    PLATFORMS_COUNT: 4,
    TEXT_STAGGER_DELAY: 150,
} as const;

export const POSITION_ANIMATION_CONFIG = {
    BASE_DELAY: 100, // базовая задержка перед появлением позиции
    MAX_RANDOM_DELAY: 500, // максимальная случайная задержка
    DURATION: 400, // длительность появления каждой позиции
} as const;

export const TEXT_DATA = [
    {id: 3, number: '1', text: 'Физическая\nинфраструктура'},
    {id: 2, number: '2', text: 'Визуализация\nи контейнеризация'},
    {id: 1, number: '3', text: 'Данные\nи интеграции'},
    {id: 0, number: '4', text: 'Приложения'},
] as const;

export const POSITION_CONFIG = {
    RHOMB_WIDTH_RATIO: 0.4,
    RHOMB_HEIGHT_RATIO: 0.6,
    RHOMB1_CENTER_X_RATIO: 0.25,
    RHOMB2_CENTER_X_RATIO: 0.75,
    RHOMB_CENTER_Y_RATIO: 0.5,
} as const;

export const TEXT_CONFIG = {
    FONT_SIZE_RATIO: 0.011,
    LINE_HEIGHT_RATIO: 1.4,
    GAP_RATIO: 0.5,
    LINE_WIDTH_RATIO: 0.1,
    LINE_LENGTH_RATIO: 7.5,
    TEXT_X_RATIO: 0.06,
} as const;

export const POSITION_ICON_CONFIG = {
    ICON_SIZE_RATIO: 0.015,
    ICON_FONT_SIZE_RATIO: 0.008,
    ICON_TEXT_GAP_RATIO: 0.6,
    ICON_STROKE_WIDTH_RATIO: 0.001,
    MIN_STROKE_WIDTH: 2,
} as const;
