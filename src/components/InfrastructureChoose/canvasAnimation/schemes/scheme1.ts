// src/components/InfrastructureChoose/canvasAnimation/schemes/scheme1.ts
import {PlatformScheme, SchemeLine} from './types';

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
            {positionNumber: '3.1', iconKey: 'dwn', label: 'DWH'},
            {positionNumber: '3.2'},
            {positionNumber: '3.3', iconKey: 'stackland', label: 'Yandex Cloud\n Stackland'},
            {positionNumber: '3.4'},
            {positionNumber: '3.5', iconKey: 'storage', label: 'Object\n Storage'},
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
            {positionNumber: '2.3'},
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
            {positionNumber: '1.2', iconKey: 'network', label: 'Сетевое\n оборудование'},
            {positionNumber: '1.3'},
            {positionNumber: '1.4', iconKey: 'baremetal', label: 'BareMetal'},
            {positionNumber: '1.5', iconKey: 'servers', label: 'Серверы\n и СХД'},
            {positionNumber: '1.6'},
        ],
    },
];

export const scheme1Lines: SchemeLine[] = [
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
        dashed: true,
    },
    {
        from: '1.4',
        fromAnchor: 'right',
        to: '1.5',
        toAnchor: 'left',
    },
    {
        from: '2.4',
        fromAnchor: 'text-bottom',
        to: '2.5',
        toAnchor: 'text-bottom',
        arc: true,
    },
    {
        from: '2.5',
        fromAnchor: 'text-bottom',
        to: '1.4',
        toAnchor: 'right',
        arc: true,
        arcFlip: true,
    },
    // Прямая пунктирная линия между 2.6 и 2.4 — соединяет соседей по ряду.
    {
        from: '2.6',
        fromAnchor: 'left',
        to: '2.4',
        toAnchor: 'right',
        dashed: true,
    },
];
