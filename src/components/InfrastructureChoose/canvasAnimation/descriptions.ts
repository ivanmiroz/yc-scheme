// src/components/InfrastructureChoose/canvasAnimation/descriptions.ts
// Словарь описаний и QR-кодов для позиций.
// Ключ — нормализованный label (без переносов строк и лишних пробелов).

import qrStackland from '@/assets/qr/stackland.png';
import qrBareMetal from '@/assets/qr/bare-metal.png';
import qrBareMetalExtend from '@/assets/qr/bare-metal-extend.png';
import qrBareMetalKubernetes from '@/assets/qr/bare-metal-kuberbetes.png';
import qrBareMetalGpu from '@/assets/qr/bare-metal-gpu.png';
import qrComputeCloudGpu from '@/assets/qr/compute-cloud-gpu.png';
import qrAlb from '@/assets/qr/alb.png';
import qrAlbGwin from '@/assets/qr/alb-gwin.png';
import qrVpc from '@/assets/qr/vpc.png';
import qrVpcPe from '@/assets/qr/vpc-pe.png';
import qrCloudRouter from '@/assets/qr/cloud-router.png';
import qrComputeCloud from '@/assets/qr/compute-cloud.png';
import qrObjectStorage from '@/assets/qr/object-storage.png';
import qrStoragePremises from '@/assets/qr/storage-premises.png';
import qrCloudInterconnect from '@/assets/qr/cloud-interconnect.png';
import qrCloudBackup from '@/assets/qr/cloud-backup.png';
import qrCloudDns from '@/assets/qr/cloud-dns.png';
import qrKubernetes from '@/assets/qr/kubernetes.png';
import qrManagedDatabases from '@/assets/qr/managed-databases.png';
import qrDatalens from '@/assets/qr/datalens.png';
import qrAi from '@/assets/qr/ai.png';
import qrCloudCdn from '@/assets/qr/cloud-cdn.png';
import qrDataTransfer from '@/assets/qr/data-transfer.png';

export interface DescriptionEntry {
    title?: string;
    description: string;
    qr?: string;
    link?: string; // <-- ДОБАВЛЕНО: поле для реальной ссылки на сервис
}

export const DESCRIPTIONS: Record<string, DescriptionEntry> = {
    Приложения: {
        description:
            'Развертывание и управление приложениями в облачной инфраструктуре Yandex Cloud.',
        qr: qrStackland.src,
    },
    'Серверы и СХД': {
        description:
            'Физические серверы и системы хранения данных для размещения рабочих нагрузок.',
        qr: qrStackland.src,
    },
    DWN: {
        description: 'Распределенная веб-платформа для высоконагруженных сервисов.',
        qr: qrStackland.src,
    },
    DWH: {
        description: 'Распределенная веб-платформа для высоконагруженных сервисов.',
        qr: qrStackland.src,
    },
    'Гипервизор, виртуальные машины': {
        description:
            'Средства виртуализации и управления виртуальными машинами в облачной инфраструктуре.',
        qr: qrStackland.src,
    },

    'Yandex Cloud Stackland': {
        title: 'Yandex Cloud Stackland',
        description:
            'Платформа контейнеризации с интегрированными PaaS‑сервисами Yandex Cloud. Объединяет все необходимые компоненты для централизованного управления микросервисными и ИИ‑приложениями.',
        qr: qrStackland.src,
        link: 'https://yandex.cloud/ru/services/stackland/?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    'BareMetal Extend: Virtualization': {
        title: 'Yandex BareMetal Extend: Virtualization',
        description:
            'Готовая виртуальная инфраструктура на выделенных физических серверах — с полным контролем ресурсов, без необходимости покупать и настраивать физическое оборудование и гипервизор.',
        qr: qrBareMetalExtend.src,
        link: 'https://yandex.cloud/ru/blog/yandex-baremetal-extend/?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    'BareMetal Extend: Managed Service for Kubernetes®': {
        title: 'BareMetal Extend: Managed Service for Kubernetes®',
        description:
            'Готовая Kubernetes-инфраструктура на выделенных серверах: всё настроено для разработки и запуска контейнерных приложений.',
        qr: qrBareMetalKubernetes.src,
        link: 'https://yandex.cloud/ru/services/managed-kubernetes/?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },
    'BareMetal Extend Managed Service for Kubernetes': {
        title: 'BareMetal Extend: Managed Service for Kubernetes®',
        description:
            'Готовая Kubernetes-инфраструктура на выделенных серверах: всё настроено для разработки и запуска контейнерных приложений.',
        qr: qrBareMetalKubernetes.src,
        link: 'https://yandex.cloud/ru/services/managed-kubernetes/?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    BareMetal: {
        title: 'Yandex BareMetal',
        description:
            'Сервис по аренде выделенного физического сервера, все ресурсы которого доступны для решения только ваших задач.',
        qr: qrBareMetal.src,
        link: 'https://yandex.cloud/ru/services/baremetal/?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    'BareMetal с GPU': {
        title: 'Yandex BareMetal с GPU',
        description:
            'Выделенные физические серверы с графическими ускорителями для обучения и инференса ML-моделей.',
        qr: qrBareMetalGpu.src,
        link: 'https://yandex.cloud/ru/services/baremetal/?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    'Сетевое оборудование': {
        title: 'Yandex Virtual Private Cloud (VPC)',
        description:
            'Сервис для управления облачными сетями, обеспечивающий связность между ресурсами Yandex Cloud и доступ в интернет.',
        qr: qrVpc.src,
        // Ссылка на VPC (добавлена стандартная, так как в списке её не было, но она логична)
        link: 'https://yandex.cloud/ru/services/vpc/?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    'Yandex Cloud Router': {
        title: 'Yandex Cloud Router',
        description:
            'Сервис для управления маршрутизацией трафика между облачными сетями, локальной инфраструктурой и выделенными серверами Yandex BareMetal.',
        qr: qrCloudRouter.src,
    },

    'VPC Private Endpoint (VPC PE)': {
        title: 'VPC Private Endpoint (VPC PE)',
        description:
            'Функционал для подключения облачных ресурсов внутри VPC к сервисам Yandex Cloud по внутренней сети без использования публичных IP-адресов.',
        qr: qrVpcPe.src,
    },

    'Cloud Compute': {
        title: 'Yandex Compute Cloud',
        description:
            'Сервис предоставляет масштабируемые вычислительные мощности для размещения, тестирования и прототипирования ваших проектов.',
        qr: qrComputeCloud.src,
        link: 'https://yandex.cloud/ru/services/compute/?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    'Cloud Compute с GPU': {
        title: 'Yandex Compute Cloud с GPU',
        description:
            'Виртуальные машины с графическими ускорителями для обучения и инференса ML-моделей, высокопроизводительных вычислений и обработки трёхмерной графики.',
        qr: qrComputeCloudGpu.src,
        link: 'https://yandex.cloud/ru/services/compute?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    'Object Storage': {
        title: 'Yandex Object Storage',
        description: 'Универсальное масштабируемое S3‑хранилище.',
        qr: qrObjectStorage.src,
        link: 'https://yandex.cloud/ru/services/storage/?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    'Yandex Object Storage on-premises': {
        title: 'Yandex Object Storage on-premises',
        description: 'Универсальное масштабируемое S3‑хранилище развёрнутое в закрытом контуре.',
        qr: qrStoragePremises.src,
        link: 'https://yandex.cloud/ru/services/storage/?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    'Cloud Interconnect': {
        title: 'Yandex Cloud Interconnect',
        description:
            'Сервис для создания приватных выделенных сетевых соединений между локальной инфраструктурой и Yandex Cloud.',
        qr: qrCloudInterconnect.src,
    },

    'Cloud Backup': {
        title: 'Yandex Cloud Backup',
        description:
            'Сервис для создания резервных копий и восстановления виртуальных машин и физических серверов.',
        qr: qrCloudBackup.src,
        link: 'https://yandex.cloud/ru/services/backup/?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    'Yandex Cloud DNS': {
        title: 'Yandex Cloud DNS',
        description: 'Сервис администрирования ресурсных записей DNS и обслуживания DNS‑запросов.',
        qr: qrCloudDns.src,
    },

    'Kubernetes®': {
        title: 'Yandex Managed Service for Kubernetes®',
        description: 'Сервис для управления кластерами Kubernetes® в Yandex Cloud.',
        qr: qrKubernetes.src,
        link: 'https://yandex.cloud/ru/services/managed-kubernetes/?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    'Managed Service for Kubernetes®': {
        title: 'Yandex Managed Service for Kubernetes®',
        description: 'Сервис для управления кластерами Kubernetes® в Yandex Cloud.',
        qr: qrKubernetes.src,
        link: 'https://yandex.cloud/ru/services/managed-kubernetes/?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    'Yandex Managed Database': {
        title: 'Yandex Managed Database',
        description:
            'Платформа данных Yandex Cloud. Фокусируйтесь на работе с данными и приносите ценность бизнесу.',
        qr: qrManagedDatabases.src,
        link: 'https://yandex.cloud/ru/data-platform/?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    DataLens: {
        title: 'Yandex DataLens',
        description: 'Визуализация и анализ данных — построение дашбордов и отчётов для бизнеса.',
        qr: qrDatalens.src,
        link: 'https://datalens.ru/?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    'AI Studio': {
        title: 'Yandex AI Studio',
        description:
            'Платформа, которая объединяет модели и инструменты Яндекса, чтобы вы могли создавать собственные ИИ-решения.',
        qr: qrAi.src,
        link: 'https://aistudio.yandex.ru/ru/?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    'Cloud CDN': {
        title: 'Yandex Cloud CDN',
        description:
            'Сервис доставки контента до конечных потребителей с помощью сети распространения контента (CDN).',
        qr: qrCloudCdn.src,
        link: 'https://yandex.cloud/ru/services/cdn/?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    'Data Transfer': {
        title: 'Yandex Data Transfer',
        description:
            'Сервис для логического переноса данных между СУБД, объектными хранилищами и брокерами сообщений.',
        qr: qrDataTransfer.src,
    },

    ALB: {
        title: 'Yandex Application Load Balancer',
        description:
            'Сервис для распределения входящего трафика между разными компонентами ваших веб‑приложений.',
        qr: qrAlb.src,
        link: 'https://yandex.cloud/ru/services/application-load-balancer?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },

    'ALB/GWIN': {
        title: 'Yandex Application Load Balancer',
        description:
            'Инструмент для создания балансировщиков нагрузки и управления ими в кластерах Yandex Managed Service for Kubernetes — Gwin.',
        qr: qrAlbGwin.src,
        link: 'https://yandex.cloud/ru/services/application-load-balancer?utm_source=scale&utm_medium=tachgibrid&utm_campaign=t:iaas;gl:awrn',
    },
};

const TITLE_OVERRIDES_BY_SCHEME: Record<number, Record<string, string>> = {
    2: {
        'Object Storage': 'Yandex Object Storage on-premises',
    },
};

const DESCRIPTION_KEY_OVERRIDES_BY_POSITION: Record<number, Record<string, string>> = {
    2: {
        '3.4.3': 'Object Storage',
    },
    3: {
        '3.3': 'Yandex Object Storage on-premises',
    },
};

const normalizeLabel = (label: string): string => label.replace(/\s+/g, ' ').trim();

const resolveDescriptionKey = (
    label: string,
    schemeIndex?: number,
    positionNumber?: string,
): string => {
    if (typeof schemeIndex === 'number' && typeof positionNumber === 'string') {
        const posKey = DESCRIPTION_KEY_OVERRIDES_BY_POSITION[schemeIndex]?.[positionNumber];
        if (posKey) return posKey;
    }
    return normalizeLabel(label);
};

export const getTitle = (label: string, schemeIndex?: number, positionNumber?: string): string => {
    const key = resolveDescriptionKey(label, schemeIndex, positionNumber);
    if (
        typeof schemeIndex === 'number' &&
        typeof positionNumber === 'string' &&
        DESCRIPTION_KEY_OVERRIDES_BY_POSITION[schemeIndex]?.[positionNumber]
    ) {
        return DESCRIPTIONS[key]?.title ?? key;
    }
    if (typeof schemeIndex === 'number') {
        const override = TITLE_OVERRIDES_BY_SCHEME[schemeIndex]?.[key];
        if (override) return override;
    }
    return DESCRIPTIONS[key]?.title ?? key;
};

export const getDescription = (
    label: string,
    schemeIndex?: number,
    positionNumber?: string,
): string | undefined => {
    const key = resolveDescriptionKey(label, schemeIndex, positionNumber);
    return DESCRIPTIONS[key]?.description;
};

export const getQr = (
    label: string,
    schemeIndex?: number,
    positionNumber?: string,
): string | undefined => {
    const key = resolveDescriptionKey(label, schemeIndex, positionNumber);
    return DESCRIPTIONS[key]?.qr;
};

// <-- ДОБАВЛЕНО: Функция получения ссылки, которая использует ту же логику переопределений, что и getQr
export const getLink = (
    label: string,
    schemeIndex?: number,
    positionNumber?: string,
): string | undefined => {
    const key = resolveDescriptionKey(label, schemeIndex, positionNumber);
    return DESCRIPTIONS[key]?.link;
};
