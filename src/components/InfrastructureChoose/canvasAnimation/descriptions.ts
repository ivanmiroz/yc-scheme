// Словарь описаний и QR-кодов для позиций.
// Ключ — нормализованный label (без переносов строк и лишних пробелов).
// Это позволяет не трогать сами схемы: подпись под иконкой остаётся
// короткой, а заголовок попапа берётся из поля `title`.

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
    // Полное название сервиса для заголовка попапа.
    // Если не задано — заголовком станет сам label.
    title?: string;
    description: string;
    qr?: string;
}

export const DESCRIPTIONS: Record<string, DescriptionEntry> = {
    // ===== Позиции, которых нет в присланном списке — оставляем как было =====
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

    // ===== Обновлено по присланному списку =====
    'Yandex Cloud Stackland': {
        title: 'Yandex Cloud Stackland',
        description:
            'Платформа контейнеризации с интегрированными PaaS‑сервисами Yandex Cloud. Объединяет все необходимые компоненты для централизованного управления микросервисными и ИИ‑приложениями.',
        qr: qrStackland.src,
    },

    'BareMetal Extend: Virtualization': {
        title: 'Yandex BareMetal Extend',
        description:
            'Выделенные серверы Yandex BareMetal с расширенными возможностями для быстрого запуска корпоративных приложений в изолированной среде.',
        qr: qrBareMetalExtend.src,
    },

    // BareMetal Extend в связке с Managed Service for Kubernetes.
    'BareMetal Extend Managed Service for Kubernetes': {
        title: 'BareMetal Extend: Managed Service for Kubernetes®',
        description:
            'Готовая Kubernetes-инфраструктура на выделенных серверах: всё настроено для разработки и запуска контейнерных приложений — без самостоятельной настройки и поддержки Kubernetes, с полным контролем над кластером и приложениями.',
        qr: qrBareMetalKubernetes.src,
    },

    // Короткая подпись «BareMetal» — используется, когда позиция помечена
    // одним словом (например, 1.4 в scheme1).
    BareMetal: {
        title: 'Yandex BareMetal',
        description:
            'Сервис по аренде выделенного физического сервера, все ресурсы которого доступны для решения только ваших задач.',
        qr: qrBareMetal.src,
    },

    // BareMetal с GPU — тот же сервис, но с GPU-конфигурацией.
    'BareMetal с GPU': {
        title: 'Yandex BareMetal с GPU',
        description:
            'Выделенные физические серверы с графическими ускорителями для обучения и инференса ML-моделей, высокопроизводительных вычислений и рендеринга — без «шумных соседей» и конкуренции за вычислительные мощности.',
        qr: qrBareMetalGpu.src,
    },

    'Сетевое оборудование': {
        title: 'Yandex Virtual Private Cloud (VPC)',
        description:
            'Сервис для управления облачными сетями, обеспечивающий связность между ресурсами Yandex Cloud и доступ в интернет.',
        qr: qrVpc.src,
    },

    'Yandex Cloud Router': {
        title: 'Yandex Cloud Router',
        description:
            'Сервис для управления маршрутизацией трафика между облачными сетями, локальной инфраструктурой и выделенными серверами Yandex BareMetal. Сервис находится на стадии Preview.',
        qr: qrCloudRouter.src,
    },

    'VPC Private Endpoint (VPC PE)': {
        title: 'VPC Private Endpoint (VPC PE)',
        description:
            'Функционал для подключения облачных ресурсов внутри VPC к сервисам Yandex Cloud по внутренней сети без использования публичных IP-адресов. Сервисы Yandex Cloud остаются доступными как через публичные IP-адреса, так и через сервисные подключения.',
        qr: qrVpcPe.src,
    },

    'Cloud Compute': {
        title: 'Yandex Compute Cloud',
        description:
            'Сервис предоставляет масштабируемые вычислительные мощности для размещения, тестирования и прототипирования ваших проектов.',
        qr: qrComputeCloud.src,
    },

    // Cloud Compute с GPU — тот же сервис, но с GPU-конфигурацией.
    'Cloud Compute с GPU': {
        title: 'Yandex Compute Cloud с GPU',
        description:
            'Виртуальные машины с графическими ускорителями для обучения и инференса ML-моделей, высокопроизводительных вычислений и обработки трёхмерной графики.',
        qr: qrComputeCloudGpu.src,
    },

    'Object Storage': {
        title: 'Yandex Object Storage',
        description:
            'Универсальное масштабируемое S3‑хранилище. Доступны три класса хранения в зависимости от частоты обращения к данным и объёма хранения, а также Intelligent Tiering — для случаев, когда паттерн использования заранее неизвестен.',
        qr: qrObjectStorage.src,
    },

    'Yandex Object Storage on-premises': {
        title: 'Yandex Object Storage on-premises',
        description:
            'Универсальное масштабируемое S3‑хранилище развёрнутое в закрытом контуре (самостоятельно или в составе Stackland) — для данных, которые нельзя выносить за периметр.',
        qr: qrStoragePremises.src,
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
            'Сервис для создания резервных копий и восстановления виртуальных машин и физических серверов из Yandex Cloud, локальной инфраструктуры и других площадок. Копии надёжно хранятся в хранилище бэкапов с размещением в трёх ЦОД, а восстановить их можно как в Yandex Cloud, так и в исходную среду.',
        qr: qrCloudBackup.src,
    },

    'Yandex Cloud DNS': {
        title: 'Yandex Cloud DNS',
        description: 'Сервис администрирования ресурсных записей DNS и обслуживания DNS‑запросов.',
        qr: qrCloudDns.src,
    },

    Kubernetes: {
        title: 'Yandex Managed Service for Kubernetes®',
        description:
            'Сервис для управления кластерами Kubernetes® в Yandex Cloud. Масштабирование до 1000+ нод. Экономия затрат до 60%.',
        qr: qrKubernetes.src,
    },

    'Managed Service for Kubernetes®': {
        title: 'Yandex Managed Service for Kubernetes®',
        description:
            'Сервис для управления кластерами Kubernetes® в Yandex Cloud. Масштабирование до 1000+ нод. Экономия затрат до 60%.',
        qr: qrKubernetes.src,
    },

    'Yandex Managed database': {
        title: 'Yandex Managed Databases',
        description:
            'Платформа данных Yandex Cloud. Фокусируйтесь на работе с данными и приносите ценность бизнесу, а мы возьмём на себя обслуживание вашей инфраструктуры и баз данных (PostgreSQL, MySQL®, ClickHouse® и другие).',
        qr: qrManagedDatabases.src,
    },

    DataLens: {
        title: 'Yandex DataLens',
        description:
            'Визуализация и анализ данных — построение дашбордов и отчётов для бизнеса без дополнительных инструментов BI в облаке или On-premises.',
        qr: qrDatalens.src,
    },

    'AI Studio': {
        title: 'Yandex AI Studio',
        description:
            'Платформа, которая объединяет модели и инструменты Яндекса, чтобы вы могли создавать собственные ИИ-решения и внедрять их в бизнес‑процессы и продукты.',
        qr: qrAi.src,
    },

    'Cloud Cdn': {
        title: 'Yandex Cloud CDN',
        description:
            'Сервис доставки контента до конечных потребителей с помощью сети распространения контента (Content Delivery Network; CDN).',
        qr: qrCloudCdn.src,
    },

    'Data Transfer': {
        title: 'Yandex Data Transfer',
        description:
            'Сервис для логического переноса данных между СУБД, объектными хранилищами и брокерами сообщений.',
        qr: qrDataTransfer.src,
    },

    // ALB — Application Load Balancer (позиция 2.4.1 на 3-й схеме).
    ALB: {
        title: 'Yandex Application Load Balancer',
        description:
            'Сервис для распределения входящего трафика между разными компонентами ваших веб‑приложений.',
        qr: qrAlb.src,
    },

    // ALB/GWIN — та же связка с Gwin, что и у ALB, но с расширенным
    // описанием и отдельным QR. Используется на 4-й схеме в позиции 2.7.
    'ALB/GWIN': {
        title: 'Yandex Application Load Balancer',
        description:
            'Инструмент для создания балансировщиков нагрузки и управления ими в кластерах Yandex Managed Service for Kubernetes — Gwin. Контроллер Gwin, установленный в кластер, автоматически разворачивает L7-балансировщики на основе конфигурации созданных вами ресурсов Kubernetes.',
        qr: qrAlbGwin.src,
    },
};

// Нормализация label: убираем переносы строк и схлопываем пробелы.
const normalizeLabel = (label: string): string => label.replace(/\s+/g, ' ').trim();

// Заголовок попапа: если в словаре задан `title` — берём его,
// иначе возвращаем нормализованный label.
export const getTitle = (label: string): string => {
    const key = normalizeLabel(label);
    return DESCRIPTIONS[key]?.title ?? key;
};

// Получить описание по label.
export const getDescription = (label: string): string | undefined => {
    const key = normalizeLabel(label);
    return DESCRIPTIONS[key]?.description;
};

// Получить путь к QR-коду по label.
export const getQr = (label: string): string | undefined => {
    const key = normalizeLabel(label);
    return DESCRIPTIONS[key]?.qr;
};
