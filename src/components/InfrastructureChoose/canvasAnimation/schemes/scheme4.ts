// src/components/InfrastructureChoose/canvasAnimation/schemes/scheme4.ts
import {PlatformScheme, SchemeLine} from './types';

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
            {positionNumber: '3.1', iconKey: 'dwn', label: 'DWH'},
            {positionNumber: '3.2', iconKey: 'stackland', label: 'Yandex Cloud\n Stackland'},
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
            {positionNumber: '2.3'},
            {
                positionNumber: '2.4',
                iconKey: 'mfsk',
                label: 'Managed Service\n for Kubernetes®',
            },
            {positionNumber: '2.5', iconKey: 'cloudcdn', label: 'Cloud Cdn'},
            {
                positionNumber: '2.6',
                iconKey: 'baremetal',
                label: 'BareMetal Extend\n Managed Service\n for Kubernetes',
            },
            {positionNumber: '2.7', iconKey: 'alb', label: 'ALB'},
        ],
    },
    {
        platformId: 3,
        positions: [
            {positionNumber: '1.1', iconKey: 'servers', label: 'Серверы\n и СХД'},
            {positionNumber: '1.2', iconKey: 'network', label: 'Сетевое\n оборудование'},
            {positionNumber: '1.3'},
            {positionNumber: '1.4', iconKey: 'servers', label: 'Серверы\n и СХД'},
            {positionNumber: '1.5'},
            {
                positionNumber: '1.6',
                iconKey: 'baremetal',
                label: 'BareMetal\n Extend:\n Virtualization',
            },
        ],
    },
];

export const scheme4Lines: SchemeLine[] = [
    {from: '1.4', fromAnchor: 'right', to: '1.6', toAnchor: 'left'},
    {
        from: '2.5',
        fromAnchor: 'left',
        to: '2.4',
        toAnchor: 'right',
        dashed: true,
    },
    {
        from: '1.6',
        fromAnchor: 'right',
        toPlatform: 2,
        toPlatformAnchor: 'right',
        arc: true,
        platformAnchorShiftXRatio: -0.005,
    },
];
