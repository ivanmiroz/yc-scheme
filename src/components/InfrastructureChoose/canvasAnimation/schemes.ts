// src/components/InfrastructureChoose/canvasAnimation/schemes.ts
export interface PositionConfig {
    positionNumber: string;
    iconKey?: string;
    iconKeys?: string[];
    label?: string;
    // Горизонтальный отступ между иконками в группе (для 2+ иконок),
    // в дизайнерских пикселях при ширине canvas 1920.
    // Если не задан — используется DEFAULT_ICON_GROUP_GAP_PX = 5.
    iconGapPx?: number;
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

// Линия между двумя объектами схемы.
export interface SchemeLine {
    from: string; // positionNumber, например '2.4'
    to: string; // positionNumber, например '2.6'
    fromAnchor?: LineAnchor; // по умолчанию 'center'
    toAnchor?: LineAnchor; // по умолчанию 'center'
    dashed?: boolean; // пунктир (по умолчанию — сплошная)
    // Если true — середина линии рисуется змейкой
    serpentine?: boolean;
    // Если true — углы змейки остаются прямыми (без скругления).
    sharpCorners?: boolean;
    // Переопределяет SCHEME_SERPENTINE.STRAIGHT_FRACTION для этой линии.
    serpentineStraightFraction?: number;
    // Если true — линия рисуется по круговой дуге.
    arc?: boolean;
}

// Схема целиком: платформы + линии между объектами этой схемы.
export interface Scheme {
    platforms: PlatformScheme[];
    lines: SchemeLine[];
}

// ==========================================
//  Тип линии и связь с легендой
// ==========================================

// Ключи кнопок легенды. Совпадают с value в listItems в ScaleTabs.
export type LegendValue =
    | 'network'
    | 'vps-pe'
    | 'cloud-interconnect'
    | 'vps'
    | 'cloud-router'
    | 'data-transfer';

// Визуальный тип линии.
export type LineKind =
    | 'sharp-serpentine'
    | 'rounded-serpentine'
    | 'sharp-dashed-serpentine'
    | 'straight'
    | 'dashed'
    | 'arc';

// Какая легенда какому типу линии соответствует.
export const LEGEND_TO_LINE_KIND: Record<LegendValue, LineKind> = {
    network: 'sharp-serpentine',
    'vps-pe': 'rounded-serpentine',
    'cloud-interconnect': 'straight',
    vps: 'dashed',
    'cloud-router': 'arc',
    'data-transfer': 'sharp-dashed-serpentine',
};

// Тип линии по её описанию.
// Приоритет: sharp-dashed-serpentine > dashed > serpentine > arc > straight.
export const getLineKind = (line: SchemeLine): LineKind => {
    if (line.dashed && line.serpentine && line.sharpCorners) {
        return 'sharp-dashed-serpentine';
    }
    if (line.dashed && !line.serpentine) return 'dashed';
    if (line.serpentine) {
        return line.sharpCorners ? 'sharp-serpentine' : 'rounded-serpentine';
    }
    if (line.arc) return 'arc';
    return 'straight';
};

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
    {from: '2.4', fromAnchor: 'right', to: '2.6', toAnchor: 'left'},
    {
        from: '2.5',
        fromAnchor: 'top',
        to: '3.5',
        toAnchor: 'text-bottom',
        serpentine: true,
    },
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
    {from: '1.4', fromAnchor: 'right', to: '1.6', toAnchor: 'left'},
    {from: '2.4', fromAnchor: 'right', to: '2.6', toAnchor: 'left', arc: true},
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
                iconGapPx: 8,
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
    {from: '1.4', fromAnchor: 'right', to: '1.6', toAnchor: 'left'},
    {from: '2.4', fromAnchor: 'right', to: '2.6', toAnchor: 'left', arc: true},
    {
        from: '2.6',
        fromAnchor: 'top',
        to: '3.6',
        toAnchor: 'text-bottom',
        serpentine: true,
    },
    {
        from: '2.5',
        fromAnchor: 'right',
        to: '2.6',
        toAnchor: 'left',
        serpentine: true,
    },
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
                iconGapPx: 8,
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
    {from: '1.4', fromAnchor: 'right', to: '1.6', toAnchor: 'left'},
    {
        from: '2.4',
        fromAnchor: 'right',
        to: '2.6',
        toAnchor: 'left',
        dashed: true,
    },
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

let activeSchemeIndex = 0;

export const setActiveScheme = (index: number) => {
    activeSchemeIndex = Math.max(0, Math.min(index, schemes.length - 1));
};

export const getActiveScheme = (): Scheme => schemes[activeSchemeIndex];

export const getActiveSchemeLines = (): SchemeLine[] => schemes[activeSchemeIndex]?.lines ?? [];

export const getPositionConfig = (positionNumber: string): PositionConfig | null => {
    const platformNumber = parseInt(positionNumber.split('.')[0], 10);
    const platformId = 4 - platformNumber;

    const scheme = getActiveScheme();
    if (!scheme) return null;

    const platform = scheme.platforms.find((s) => s.platformId === platformId);
    if (!platform) return null;

    return platform.positions.find((p) => p.positionNumber === positionNumber) || null;
};

// ==========================================
//  Доступные значения легенды для схемы
//  (объявлено после `schemes`, чтобы не было use-before-define)
// ==========================================

// Типы линий, которые всегда присутствуют на канвасе (статичные соединения
// между платформами + базовые линии схемы). Эти кнопки легенды показываем всегда.
export const STATIC_LEGEND_KINDS: LineKind[] = [
    'sharp-serpentine',
    'rounded-serpentine',
    'straight',
    'dashed',
    'arc',
];

// Список значений легенды, релевантных для схемы с указанным индексом.
// К базовым типам добавляются те, что встречаются в линиях самой схемы.
export const getAvailableLegendValues = (schemeIndex: number): LegendValue[] => {
    const scheme = schemes[schemeIndex];
    if (!scheme) return [];

    const availableKinds = new Set<LineKind>(STATIC_LEGEND_KINDS);
    scheme.lines.forEach((line) => availableKinds.add(getLineKind(line)));

    return (Object.keys(LEGEND_TO_LINE_KIND) as LegendValue[]).filter((value) =>
        availableKinds.has(LEGEND_TO_LINE_KIND[value]),
    );
};
