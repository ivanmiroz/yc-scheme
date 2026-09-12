export interface PositionConfig {
    positionNumber: string;
    iconKey?: string;
    label?: string;
}

export interface PlatformScheme {
    platformId: number;
    positions: PositionConfig[];
}

// ==========================================
// Схема 1 (Оригинальная)
// ==========================================
export const scheme1: PlatformScheme[] = [
    {
        platformId: 0,
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
        platformId: 1,
        positions: [
            {positionNumber: '3.1', iconKey: 'servers', label: 'Серверы и СХД'},
            {positionNumber: '3.2', iconKey: 'dwn', label: 'DWN'},
            {positionNumber: '3.3'},
            {positionNumber: '3.4'},
            {positionNumber: '3.5', iconKey: 'storage', label: 'Object Storage'},
            {positionNumber: '3.6'},
        ],
    },
    {
        platformId: 2,
        positions: [
            {positionNumber: '2.1', iconKey: 'kubernetes', label: 'Kubernetes'},
            {
                positionNumber: '2.2',
                iconKey: 'hypervisor',
                label: 'Гипервизор,\n виртуальные машины',
            },
            {positionNumber: '2.3', iconKey: 'stackland', label: 'Yandex Cloud Stackland'},
            {
                positionNumber: '2.4',
                iconKey: 'baremetal',
                label: 'BareMetal\n Extend: Virtualization',
            },
            {positionNumber: '2.5', iconKey: 'backup', label: 'Cloud Backup'},
            {positionNumber: '2.6', iconKey: 'compute', label: 'Cloud Compute'},
        ],
    },
    {
        platformId: 3,
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

// ==========================================
// Схема 2
// ==========================================
export const scheme2: PlatformScheme[] = [
    {
        platformId: 0,
        positions: [
            {positionNumber: '4.1', iconKey: 'apps', label: 'Приложения'},
            {positionNumber: '4.2', iconKey: 'apps', label: 'Приложения'},
            {positionNumber: '4.3', iconKey: 'apps', label: 'Приложения'},
            {positionNumber: '4.4', iconKey: 'apps', label: 'Приложения'},
            {positionNumber: '4.5', iconKey: 'datalens', label: 'DataLens'},
            {positionNumber: '4.6', iconKey: 'aistudio', label: 'AI Studio'},
        ],
    },
    {
        platformId: 1,
        positions: [
            {positionNumber: '3.1', iconKey: 'servers', label: 'Серверы\n и СХД'},
            {positionNumber: '3.2', iconKey: 'dwn', label: 'DWN'},
            {positionNumber: '3.3'},
            {positionNumber: '3.4'},
            {positionNumber: '3.5'},
            {positionNumber: '3.6', iconKey: 'storage', label: 'Object\n Storage'},
        ],
    },
    {
        platformId: 2,
        positions: [
            {positionNumber: '2.1', iconKey: 'kubernetes', label: 'Kubernetes'},
            {
                positionNumber: '2.2',
                iconKey: 'hypervisor',
                label: 'Гипервизор,\n виртуальные\n машины',
            },
            {positionNumber: '2.3', iconKey: 'stackland', label: 'Yandex Cloud Stackland'},
            {
                positionNumber: '2.4',
                iconKey: 'baremetal',
                label: 'BareMetal\n Extend:\n Virtualization',
            },
            {positionNumber: '2.5'},
            {positionNumber: '2.6', iconKey: 'compute', label: 'Cloud\n Compute'},
        ],
    },
    {
        platformId: 3,
        positions: [
            {positionNumber: '1.1', iconKey: 'servers', label: 'Серверы\n и СХД'},
            {positionNumber: '1.2', iconKey: 'network', label: 'Сетевое\n подключение'},
            {positionNumber: '1.3'},
            {
                positionNumber: '1.4',
                iconKey: 'baremetal',
                label: 'BareMetal\n Extend:\n Virtualization',
            },
            {positionNumber: '1.5'},
            {positionNumber: '1.6', iconKey: 'servers', label: 'Серверы\n и СХД'},
        ],
    },
];

// ==========================================
// Схема 3
// ==========================================
export const scheme3: PlatformScheme[] = [
    {
        platformId: 0,
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
        platformId: 1,
        positions: [
            {positionNumber: '3.1', iconKey: 'storage', label: 'Object\n Storage'},
            {positionNumber: '3.2', iconKey: 'dwn', label: 'DWN'},
            {positionNumber: '3.3', iconKey: 'servers', label: 'Серверы\n и СХД'},
            {positionNumber: '3.4', iconKey: 'dwn', label: 'Yandex Managed\ndatabase'},
            {positionNumber: '3.5'},
            {positionNumber: '3.6', iconKey: 'storage', label: 'Object\n Storage'},
        ],
    },
    {
        platformId: 2,
        positions: [
            {positionNumber: '2.1', iconKey: 'kubernetes', label: 'Kubernetes'},
            {
                positionNumber: '2.2',
                iconKey: 'hypervisor',
                label: 'Гипервизор,\n виртуальные\n машины',
            },
            {positionNumber: '2.3', iconKey: 'stackland', label: 'Yandex Cloud Stackland'},
            {
                positionNumber: '2.4',
                iconKey: 'baremetal',
                label: 'BareMetal\n Extend:\n Virtualization',
            },
            {positionNumber: '2.5', iconKey: 'compute', label: 'Cloud\n Compute'},
            {positionNumber: '2.6', iconKey: 'backup', label: 'Cloud\n Backup'},
        ],
    },
    {
        platformId: 3,
        positions: [
            {positionNumber: '1.1', iconKey: 'servers', label: 'Серверы\n и СХД'},
            {positionNumber: '1.2', iconKey: 'network', label: 'Сетевое\n подключение'},
            {positionNumber: '1.3'},
            {
                positionNumber: '1.4',
                iconKey: 'baremetal',
                label: 'BareMetal\n Extend:\n Virtualization',
            },
            {positionNumber: '1.5'},
            {positionNumber: '1.6', iconKey: 'servers', label: 'Серверы\n и СХД'},
        ],
    },
];

// ==========================================
// Схема 4
// ==========================================
export const scheme4: PlatformScheme[] = [
    {
        platformId: 0,
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
        platformId: 1,
        positions: [
            {positionNumber: '3.1', iconKey: 'servers', label: 'Серверы\n и СХД'},
            {positionNumber: '3.2', iconKey: 'dwn', label: 'DWN'},
            {positionNumber: '3.3', iconKey: 'storage', label: 'Object\n Storage'},
            {positionNumber: '3.4', iconKey: 'storage', label: 'Object\n Storage'},
            {positionNumber: '3.5', iconKey: 'dwn', label: 'Yandex Managed\ndatabase'},
            {positionNumber: '3.6'},
        ],
    },
    {
        platformId: 2,
        positions: [
            {positionNumber: '2.1', iconKey: 'kubernetes', label: 'Kubernetes'},
            {
                positionNumber: '2.2',
                iconKey: 'hypervisor',
                label: 'Гипервизор,\n виртуальные\n машины',
            },
            {positionNumber: '2.3', iconKey: 'stackland', label: 'Yandex Cloud\n Stackland'},
            {
                positionNumber: '2.4',
                iconKey: 'mfsk', // <-- Изменено с 'kubernetes' на 'mfsk'
                label: 'Managed Service\n for Kubernetes®',
            },
            {
                positionNumber: '2.5',
                iconKey: 'baremetal',
                label: 'BareMetal\n Extend:\n Virtualization',
            },
            {positionNumber: '2.6', iconKey: 'cloudcdn', label: 'Cloud Cdn'}, // <-- Изменено с 'network' на 'cloudcdn'
        ],
    },
    {
        platformId: 3,
        positions: [
            {positionNumber: '1.1', iconKey: 'servers', label: 'Серверы\n и СХД'},
            {positionNumber: '1.2', iconKey: 'network', label: 'Сетевое\n подключение'},
            {positionNumber: '1.3'},
            {
                positionNumber: '1.4',
                iconKey: 'baremetal',
                label: 'BareMetal\n Extend:\n Virtualization',
            },
            {positionNumber: '1.5'},
            {positionNumber: '1.6', iconKey: 'servers', label: 'Серверы\n и СХД'},
        ],
    },
];

// Массив всех доступных схем
export const schemes: PlatformScheme[][] = [scheme1, scheme2, scheme3, scheme4];

// Глобальное состояние текущей схемы
let activeSchemeIndex = 0;

// Функция для переключения схемы извне
export const setActiveScheme = (index: number) => {
    activeSchemeIndex = Math.max(0, Math.min(index, schemes.length - 1));
};

export const getActiveScheme = () => schemes[activeSchemeIndex];

// Функция для получения конфигурации позиции (использует активную схему)
export const getPositionConfig = (positionNumber: string): PositionConfig | null => {
    const platformNumber = parseInt(positionNumber.split('.')[0], 10);
    const platformId = 4 - platformNumber;

    const scheme = getActiveScheme();
    if (!scheme) return null;

    const platform = scheme.find((s) => s.platformId === platformId);
    if (!platform) return null;

    return platform.positions.find((p) => p.positionNumber === positionNumber) || null;
};
