export interface PositionConfig {
    positionNumber: string;
    iconKey?: string; // Ключ иконки из ICON_MAP
    label?: string; // Текст под иконкой
}

export interface PlatformScheme {
    platformId: number;
    positions: PositionConfig[];
}

// Конфигурация для текущей схемы
// platformId: 0 = верхняя платформа (4), 3 = нижняя платформа (1)
export const currentScheme: PlatformScheme[] = [
    {
        platformId: 0, // Платформа 4 (Приложения)
        positions: [
            {positionNumber: '4.1', iconKey: 'apps', label: 'Приложения'},
            {positionNumber: '4.2', iconKey: 'apps', label: 'Приложения'},
            {positionNumber: '4.3', iconKey: 'apps', label: 'Приложения'},
            {positionNumber: '4.4', iconKey: 'apps', label: 'Приложения'},
            {positionNumber: '4.5', iconKey: 'apps', label: 'Приложения'},
            {positionNumber: '4.6', iconKey: 'apps', label: 'Приложения'},
        ],
    },
    {
        platformId: 1, // Платформа 3 (Данные и интеграции)
        positions: [
            {positionNumber: '3.1', iconKey: 'servers', label: 'Серверы и СХД'},
            {positionNumber: '3.2', iconKey: 'dwh', label: 'DWH'},
            {positionNumber: '3.3'},
            {positionNumber: '3.4'},
            {positionNumber: '3.5', iconKey: 'storage', label: 'Object Storage'},
            {positionNumber: '3.6'},
        ],
    },
    {
        platformId: 2, // Платформа 2 (Визуализация и контейнеризация)
        positions: [
            {positionNumber: '2.1', iconKey: 'kubernetes', label: 'Kubernetes'},
            {positionNumber: '2.2', iconKey: 'hypervisor', label: 'Гипервизор, виртуальные машины'},
            {positionNumber: '2.3', iconKey: 'stackland', label: 'Yandex Cloud Stackland'},
            {
                positionNumber: '2.4',
                iconKey: 'baremetal',
                label: 'BareMetal Extend: Virtualization',
            },
            {positionNumber: '2.5', iconKey: 'backup', label: 'Cloud Backup'},
            {positionNumber: '2.6', iconKey: 'compute', label: 'Cloud Compute'},
        ],
    },
    {
        platformId: 3, // Платформа 1 (Физическая инфраструктура)
        positions: [
            {positionNumber: '1.1', iconKey: 'servers', label: 'Серверы и СХД'},
            {positionNumber: '1.2', iconKey: 'network', label: 'Сетевое подключение'},
            {positionNumber: '1.3'},
            {
                positionNumber: '1.4',
                iconKey: 'baremetal',
                label: 'Yandex BareMetal\nНезависимый ДЦ',
            },
            {positionNumber: '1.5', iconKey: 'servers', label: 'Серверы и СХД'},
            {positionNumber: '1.6'},
        ],
    },
];

// Функция для получения конфигурации позиции
export const getPositionConfig = (positionNumber: string): PositionConfig | null => {
    const platformNumber = parseInt(positionNumber.split('.')[0], 10);
    const platformId = 4 - platformNumber;

    const scheme = currentScheme.find((s) => s.platformId === platformId);
    if (!scheme) return null;

    return scheme.positions.find((p) => p.positionNumber === positionNumber) || null;
};
