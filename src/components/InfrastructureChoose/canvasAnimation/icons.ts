import serversSrc from '@/assets/icons/servers.png';
import dwhSrc from '@/assets/icons/dwh.png';
import storageSrc from '@/assets/icons/storage.png';
import kubernetesSrc from '@/assets/icons/kubernetes.png';
import hypervisorSrc from '@/assets/icons/hypervisor.png';
import stacklandSrc from '@/assets/icons/stackland.png';
import baremetalSrc from '@/assets/icons/baremetal.png';
import backupSrc from '@/assets/icons/backup.png';
import computeSrc from '@/assets/icons/compute.png';
import networkSrc from '@/assets/icons/network.png';
import appsSrc from '@/assets/icons/apps.png';

// Маппинг: ключ → путь к иконке
export const ICON_MAP: Record<string, string> = {
    servers: serversSrc.src,
    dwh: dwhSrc.src,
    storage: storageSrc.src,
    kubernetes: kubernetesSrc.src,
    hypervisor: hypervisorSrc.src,
    stackland: stacklandSrc.src,
    baremetal: baremetalSrc.src,
    backup: backupSrc.src,
    compute: computeSrc.src,
    network: networkSrc.src,
    apps: appsSrc.src,
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

// Получить иконку из кэша (может быть undefined, если ещё не загружена)
export const getIcon = (key: string): HTMLImageElement | undefined => {
    return iconCache[key];
};
