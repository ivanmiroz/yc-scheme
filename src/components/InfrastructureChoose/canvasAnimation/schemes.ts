export interface PositionConfig {
    positionNumber: string;
    iconKey?: string;
    iconKeys?: string[];
    label?: string;
}

export interface PlatformScheme {
    platformId: number;
    positions: PositionConfig[];
}

// Точка крепления линии на объекте.
// left/right/top/bottom/center — по иконке (или её цветной подложке).
// text-top/text-bottom — по текстовому блоку под иконкой.
export type LineAnchor =
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'center'
    | 'text-top'
    | 'text-bottom';

// Линия между двумя объектами схемы. Координаты вычисляются
// на этапе отрисовки — здесь только описание "откуда-куда".
export interface SchemeLine {
    from: string; // positionNumber, например '2.4'
    to: string; // positionNumber, например '2.6'
    fromAnchor?: LineAnchor; // по умолчанию 'center'
    toAnchor?: LineAnchor; // по умолчанию 'center'
    dashed?: boolean; // пунктир (по умолчанию — сплошная)
    // Если true — середина линии рисуется змейкой
    serpentine?: boolean;
    // Если true — углы змейки остаются прямыми (без скругления).
    // Работает только вместе с serpentine: true.
    sharpCorners?: boolean;
    // Переопределяет SCHEME_SERPENTINE.STRAIGHT_FRACTION для этой линии.
    // 0.25 (по умолчанию) — прямые участки по 25%, змейка на центральные 50%.
    // 0 — змейка на всю длину линии, без прямых участков.
    serpentineStraightFraction?: number;
    // Если true — линия рисуется по круговой дуге.
    // Направление выпуклости определяется геометрией A→B автоматически:
    //   A→B вправо → дуга вниз
    //   A→B влево  → дуга вверх
    //   A→B вниз   → дуга влево
    //   A→B вверх  → дуга вправо
    arc?: boolean;
}

// Схема целиком: платформы + линии между объектами этой схемы.
export interface Scheme {
    platforms: PlatformScheme[];
    lines: SchemeLine[];
}

// ==========================================
// Схема 1 (Оригинальная)
// ==========================================
export const scheme1Platforms: PlatformScheme[] = [
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

export const scheme1Lines: SchemeLine[] = [
    // 1. Прямая от правого края 2.4 к левому краю 2.6
    {from: '2.4', fromAnchor: 'right', to: '2.6', toAnchor: 'left'},
    // 2. От верхнего края иконки 2.5 к низу текста под 3.5.
    //    Середина — змейка со скруглёнными углами.
    {
        from: '2.5',
        fromAnchor: 'top',
        to: '3.5',
        toAnchor: 'text-bottom',
        serpentine: true,
    },
    // 3. От правого края 2.5 к левому краю 2.6.
    //    Визуально как вторая — со змейкой и скруглёнными углами.
    {
        from: '2.5',
        fromAnchor: 'right',
        to: '2.6',
        toAnchor: 'left',
        serpentine: true,
    },
];

// ==========================================
// Схема 2
// ==========================================
export const scheme2Platforms: PlatformScheme[] = [
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

export const scheme2Lines: SchemeLine[] = [
    // 1. Прямая от правого края 1.4 к левому краю 1.6
    {from: '1.4', fromAnchor: 'right', to: '1.6', toAnchor: 'left'},
    // 2. Круговая дуга от правого края 2.4 к левому краю 2.6.
    //    A→B направлено вправо — дуга выгибается вниз.
    {from: '2.4', fromAnchor: 'right', to: '2.6', toAnchor: 'left', arc: true},
    // 3. Змейка от верхнего края 2.6 к низу текста под 3.6.
    {
        from: '2.6',
        fromAnchor: 'top',
        to: '3.6',
        toAnchor: 'text-bottom',
        serpentine: true,
    },
];

// ==========================================
// Схема 3
// ==========================================
export const scheme3Platforms: PlatformScheme[] = [
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
            {
                positionNumber: '3.4',
                iconKeys: ['code', 'elephant', 'sticks'],
                label: 'Yandex Managed\ndatabase',
            },
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

export const scheme3Lines: SchemeLine[] = [
    // 1. Прямая от правого края 1.4 к левому краю 1.6 (как в схеме 2)
    {from: '1.4', fromAnchor: 'right', to: '1.6', toAnchor: 'left'},
    // 2. Круговая дуга от правого края 2.4 к левому краю 2.6 (как в схеме 2)
    {from: '2.4', fromAnchor: 'right', to: '2.6', toAnchor: 'left', arc: true},
    // 3. Змейка от верхнего края 2.6 к низу текста под 3.6 (как в схеме 2)
    {
        from: '2.6',
        fromAnchor: 'top',
        to: '3.6',
        toAnchor: 'text-bottom',
        serpentine: true,
    },
    // 4. Змейка от правого края 2.5 к левому краю 2.6
    {
        from: '2.5',
        fromAnchor: 'right',
        to: '2.6',
        toAnchor: 'left',
        serpentine: true,
    },
    // 5. Пунктирная змейка с прямыми углами на всю длину линии —
    //    от правого края 3.3 к левому краю 3.4.
    {
        from: '3.3',
        fromAnchor: 'right',
        to: '3.4',
        toAnchor: 'left',
        serpentine: true,
        dashed: true,
        sharpCorners: true,
        serpentineStraightFraction: 0.125,
    },
];

// ==========================================
// Схема 4
// ==========================================
export const scheme4Platforms: PlatformScheme[] = [
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
            {
                positionNumber: '3.5',
                iconKeys: ['code', 'elephant', 'sticks'],
                label: 'Yandex Managed\ndatabase',
            },
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
                iconKey: 'mfsk',
                label: 'Managed Service\n for Kubernetes®',
            },
            {
                positionNumber: '2.5',
                iconKey: 'baremetal',
                label: 'BareMetal\n Extend:\n Virtualization',
            },
            {positionNumber: '2.6', iconKey: 'cloudcdn', label: 'Cloud Cdn'},
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

export const scheme4Lines: SchemeLine[] = [
    // 1. Прямая от правого края 1.4 к левому краю 1.6
    {from: '1.4', fromAnchor: 'right', to: '1.6', toAnchor: 'left'},
    // 2. Пунктирная от правого края 2.4 к левому краю 2.6
    {
        from: '2.4',
        fromAnchor: 'right',
        to: '2.6',
        toAnchor: 'left',
        dashed: true,
    },
    // 3. Змейка со скруглёнными углами от верхнего края 2.5 к низу текста под 3.5
    {
        from: '2.5',
        fromAnchor: 'top',
        to: '3.5',
        toAnchor: 'text-bottom',
        serpentine: true,
    },
];

// ==========================================
// Массив всех доступных схем
// ==========================================
export const schemes: Scheme[] = [
    {platforms: scheme1Platforms, lines: scheme1Lines},
    {platforms: scheme2Platforms, lines: scheme2Lines},
    {platforms: scheme3Platforms, lines: scheme3Lines},
    {platforms: scheme4Platforms, lines: scheme4Lines},
];

// Глобальное состояние текущей схемы
let activeSchemeIndex = 0;

// Функция для переключения схемы извне
export const setActiveScheme = (index: number) => {
    activeSchemeIndex = Math.max(0, Math.min(index, schemes.length - 1));
};

export const getActiveScheme = (): Scheme => schemes[activeSchemeIndex];

// Линии текущей активной схемы
export const getActiveSchemeLines = (): SchemeLine[] => schemes[activeSchemeIndex]?.lines ?? [];

// Функция для получения конфигурации позиции (использует активную схему)
export const getPositionConfig = (positionNumber: string): PositionConfig | null => {
    const platformNumber = parseInt(positionNumber.split('.')[0], 10);
    const platformId = 4 - platformNumber;

    const scheme = getActiveScheme();
    if (!scheme) return null;

    const platform = scheme.platforms.find((s) => s.platformId === platformId);
    if (!platform) return null;

    return platform.positions.find((p) => p.positionNumber === positionNumber) || null;
};
