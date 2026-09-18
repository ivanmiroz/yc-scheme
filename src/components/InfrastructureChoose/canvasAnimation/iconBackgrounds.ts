// Цветные подложки со скруглёнными углами под иконками позиций.
// Ключ — нормализованный label (без переносов строк и лишних пробелов).

const normalizeLabel = (label: string): string => label.replace(/\s+/g, ' ').trim();

export const ICON_BACKGROUNDS: Record<string, string> = {
    // Голубая группа
    'Object Storage': 'rgba(148, 207, 255, 1)',
    'Yandex Cloud Stackland': 'rgba(148, 207, 255, 1)',
    'BareMetal Extend: Virtualization': 'rgba(148, 207, 255, 1)',
    // Короткая форма — для позиций, где подпись умещается в одну строку.
    BareMetal: 'rgba(148, 207, 255, 1)',
    // BareMetal с GPU — та же подложка, что у обычного BareMetal.
    'BareMetal с GPU': 'rgba(148, 207, 255, 1)',
    // BareMetal Extend + Managed Service for Kubernetes — та же подложка,
    // что у BareMetal и BareMetal Extend.
    'BareMetal Extend Managed Service for Kubernetes': 'rgba(148, 207, 255, 1)',
    'Cloud Backup': 'rgba(148, 207, 255, 1)',
    'Cloud Compute': 'rgba(148, 207, 255, 1)',
    // Cloud Compute с GPU — та же подложка, что у обычного Cloud Compute.
    'Cloud Compute с GPU': 'rgba(148, 207, 255, 1)',
    'Cloud Cdn': 'rgba(148, 207, 255, 1)',
    // ALB — та же подложка, что у Cloud Cdn.
    ALB: 'rgba(148, 207, 255, 1)',
    // ALB/GWIN — для случая, когда подпись отображает связку с Gwin.
    'ALB/GWIN': 'rgba(148, 207, 255, 1)',

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
