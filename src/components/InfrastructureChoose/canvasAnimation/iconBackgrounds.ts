// Цветные подложки со скруглёнными углами под иконками позиций.
// Ключ — нормализованный label (без переносов строк и лишних пробелов).

const normalizeLabel = (label: string): string => label.replace(/\s+/g, ' ').trim();

export const ICON_BACKGROUNDS: Record<string, string> = {
    // Голубая группа
    'Object Storage': 'rgba(148, 207, 255, 1)',
    'Yandex Cloud Stackland': 'rgba(148, 207, 255, 1)',
    'BareMetal Extend: Virtualization': 'rgba(148, 207, 255, 1)',
    'Cloud Backup': 'rgba(148, 207, 255, 1)',
    'Cloud Compute': 'rgba(148, 207, 255, 1)',
    'Cloud Cdn': 'rgba(148, 207, 255, 1)',

    // Сиреневая группа
    DataLens: 'rgba(202, 184, 255, 1)',
    'Yandex Managed database': 'rgba(202, 184, 255, 1)',

    // Розовая группа
    'AI Studio': 'rgba(250, 189, 250, 1)',

    // Зелёная группа
    'Managed Service for Kubernetes®': 'rgba(157, 233, 175, 1)',
};

// Получить цвет подложки по label. undefined — подложка не рисуется.
export const getIconBackground = (label: string | undefined): string | undefined => {
    if (!label) return undefined;
    return ICON_BACKGROUNDS[normalizeLabel(label)];
};
