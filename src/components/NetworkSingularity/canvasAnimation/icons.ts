import type {StaticImageData} from 'next/image';

import backupIcon from '../../../assets/for-animation/backup.png';
import balancerIcon from '../../../assets/for-animation/balancer.png';
import bdIcon from '../../../assets/for-animation/bd.png';
import cdnIcon from '../../../assets/for-animation/cdn.png';
import clusterIcon from '../../../assets/for-animation/cluster.png';
import dnsIcon from '../../../assets/for-animation/dns.png';
import dockerIcon from '../../../assets/for-animation/docker.png';
import gpuIcon from '../../../assets/for-animation/gpu.png';
import iamIcon from '../../../assets/for-animation/iam.png';
import kubernetesIcon from '../../../assets/for-animation/kubernetes.png';
import monitoringIcon from '../../../assets/for-animation/monitoring.png';
import serverIcon from '../../../assets/for-animation/server.png';
import storageIcon from '../../../assets/for-animation/storage.png';
import vmIcon from '../../../assets/for-animation/vm.png';

export const ICON_KEYS = [
    'backup',
    'balancer',
    'bd',
    'cdn',
    'cluster',
    'dns',
    'docker',
    'gpu',
    'iam',
    'kubernetes',
    'monitoring',
    'server',
    'storage',
    'vm',
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

const ICON_SOURCES: Record<IconKey, StaticImageData> = {
    backup: backupIcon,
    balancer: balancerIcon,
    bd: bdIcon,
    cdn: cdnIcon,
    cluster: clusterIcon,
    dns: dnsIcon,
    docker: dockerIcon,
    gpu: gpuIcon,
    iam: iamIcon,
    kubernetes: kubernetesIcon,
    monitoring: monitoringIcon,
    server: serverIcon,
    storage: storageIcon,
    vm: vmIcon,
};

export const LABELS = [
    'Backup',
    'Balancer',
    'База данных',
    'CDN',
    'Кластер',
    'DNS',
    'Docker-контейнер',
    'GPU',
    'IAM',
    'Kubernetes',
    'Мониторинг',
    'Сервер',
    'Хранилище',
    'Виртуальная машина',
];

const labelToKey = new Map<string, IconKey>([
    ['Backup', 'backup'],
    ['Balancer', 'balancer'],
    ['База данных', 'bd'],
    ['CDN', 'cdn'],
    ['Кластер', 'cluster'],
    ['DNS', 'dns'],
    ['Docker-контейнер', 'docker'],
    ['GPU', 'gpu'],
    ['IAM', 'iam'],
    ['Kubernetes', 'kubernetes'],
    ['Мониторинг', 'monitoring'],
    ['Сервер', 'server'],
    ['Хранилище', 'storage'],
    ['Виртуальная машина', 'vm'],
]);

const iconCache = new Map<IconKey, HTMLImageElement>();
let loadPromise: Promise<void> | null = null;

export const getIconKeyByLabel = (label: string): IconKey | undefined => labelToKey.get(label);

export const getIcon = (key: string): HTMLImageElement | undefined => iconCache.get(key as IconKey);

export const loadAllIcons = (): Promise<void> => {
    if (loadPromise !== null) return loadPromise;

    loadPromise = Promise.all(
        ICON_KEYS.map(
            (key) =>
                new Promise<void>((resolve) => {
                    const img = new Image();
                    // StaticImageData -> .src (строка URL)
                    img.src = ICON_SOURCES[key].src;
                    img.onload = () => {
                        iconCache.set(key, img);
                        resolve();
                    };
                    img.onerror = () => {
                        // не валим анимацию, если конкретная иконка не загрузилась
                        resolve();
                    };
                }),
        ),
    ).then(() => undefined);

    return loadPromise;
};
