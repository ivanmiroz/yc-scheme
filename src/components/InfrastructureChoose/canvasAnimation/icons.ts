import serversSrc from '@/assets/icons/servers.png';
import dwnSrc from '@/assets/icons/dwn.png';
import storageSrc from '@/assets/icons/storage.png';
import kubernetesSrc from '@/assets/icons/kubernetes.png';
import hypervisorSrc from '@/assets/icons/hypervisor.png';
import stacklandSrc from '@/assets/icons/stackland.png';
import baremetalSrc from '@/assets/icons/baremetal.png';
import backupSrc from '@/assets/icons/backup.png';
import computeSrc from '@/assets/icons/compute.png';
import networkSrc from '@/assets/icons/network.png';
import appsSrc from '@/assets/icons/apps.png';
import datalensSrc from '@/assets/icons/datalens.png';
import aistudioSrc from '@/assets/icons/aistudio.png';
import mfskSrc from '@/assets/icons/msfk.png'; // <-- Добавлено
import cloudcdnSrc from '@/assets/icons/cloudcdn.png'; // <-- Добавлено

// Маппинг: ключ → путь к иконке
export const ICON_MAP: Record<string, string> = {
    servers: serversSrc.src,
    dwn: dwnSrc.src,
    storage: storageSrc.src,
    kubernetes: kubernetesSrc.src,
    hypervisor: hypervisorSrc.src,
    stackland: stacklandSrc.src,
    baremetal: baremetalSrc.src,
    backup: backupSrc.src,
    compute: computeSrc.src,
    network: networkSrc.src,
    apps: appsSrc.src,
    datalens: datalensSrc.src,
    aistudio: aistudioSrc.src,
    mfsk: mfskSrc.src, // <-- Добавлено
    cloudcdn: cloudcdnSrc.src, // <-- Добавлено
};

// Кэш загруженных изображений
const iconCache: Record<string, HTMLImageElement> = {};

// Загрузить все иконки и вернуть промис
export const loadAllIcons = (): Promise<Record<string, HTMLImageElement>> => {
    const promises = Object.entries(ICON_MAP).map(([key, src]) => {
        return new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.onload = () => {
                iconCache[key] = img;
                resolve(img);
            };
            img.src = src;
        });
    });

    return Promise.all(promises).then(() => iconCache);
};

// Получить иконку из кэша
export const getIcon = (key: string): HTMLImageElement | undefined => {
    return iconCache[key];
};

// Список названий (labels) для генерации узлов
export const LABELS: string[] = [
    'Кластер',
    'База данных',
    'IAM',
    'GPU',
    'Kubernetes',
    'Backup',
    'Серверы',
    'Гипервизор',
    'DWN',
    'Виртуальная машина',
    'Cloud Compute',
    'Приложения',
    'Сервер данных',
    'Сервер',
    'Docker-контейнер',
    'Балансировщик',
    'Мониторинг',
    'Хранилище',
    'DNS',
    'CDN',
    'Cloud Back',
    'Object Storage',
    'DataLens',
    'AI Studio',
    'Managed Service for Kubernetes®', // <-- Добавлено
    'Cloud CDN', // <-- Добавлено
];

// Сопоставление названий (labels) с ключами иконок
export const LABEL_TO_ICON_KEY: Record<string, string> = {
    Кластер: 'kubernetes',
    'База данных': 'dwn',
    IAM: 'apps',
    GPU: 'compute',
    Kubernetes: 'kubernetes',
    Backup: 'backup',
    Серверы: 'servers',
    Гипервизор: 'hypervisor',
    DWN: 'dwn',
    'Виртуальная машина': 'hypervisor',
    'Cloud Compute': 'compute',
    Приложения: 'apps',
    'Сервер данных': 'servers',
    Сервер: 'servers',
    'Docker-контейнер': 'kubernetes',
    Балансировщик: 'network',
    Мониторинг: 'network',
    Хранилище: 'storage',
    DNS: 'network',
    CDN: 'network',
    'Cloud Back': 'backup',
    'Object Storage': 'storage',
    DataLens: 'datalens',
    'AI Studio': 'aistudio',
    'Managed Service for Kubernetes®': 'msfk', // <-- Добавлено
    'Cloud CDN': 'cloudcdn', // <-- Добавлено
};

// Функция получения ключа иконки по названию
export const getIconKeyByLabel = (label: string): string | undefined => {
    return LABEL_TO_ICON_KEY[label];
};
