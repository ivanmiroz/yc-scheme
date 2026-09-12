// Словарь описаний и QR-кодов для позиций.
// Ключ — нормализованный label (без переносов строк и лишних пробелов).

// TODO: заменить на индивидуальные QR, когда появятся соответствующие ассеты.
import qrStackland from '@/assets/qr/stackland.png';

export interface DescriptionEntry {
    description: string;
    qr?: string;
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

    'Object Storage': {
        description:
            'S3-совместимое объектное хранилище для неструктурированных данных любого объёма.',
        qr: qrStackland.src,
    },

    Kubernetes: {
        description:
            'Управляемый сервис оркестрации контейнеров с автоматическим масштабированием и самовосстановлением.',
        qr: qrStackland.src,
    },

    'Гипервизор, виртуальные машины': {
        description:
            'Средства виртуализации и управления виртуальными машинами в облачной инфраструктуре.',
        qr: qrStackland.src,
    },

    'Yandex Cloud Stackland': {
        description:
            'Платформа контейнеризации с интегрированными PaaS‑сервисами Yandex Cloud. Объединяет все необходимые компоненты для централизованного управления микросервисными и ИИ‑приложениями.',
        qr: qrStackland.src,
    },

    'BareMetal Extend: Virtualization': {
        description:
            'Выделенные физические серверы с расширенными возможностями виртуализации и полным контролем над оборудованием.',
        qr: qrStackland.src,
    },

    'Cloud Backup': {
        description:
            'Сервис резервного копирования данных виртуальных машин и баз данных в облако.',
        qr: qrStackland.src,
    },

    'Cloud Compute': {
        description: 'Виртуальные вычислительные мощности с гибкой конфигурацией CPU, RAM и GPU.',
        qr: qrStackland.src,
    },

    'Сетевое подключение': {
        description: 'Сетевая инфраструктура: VPC, подсети, маршрутизация и подключение к облаку.',
        qr: qrStackland.src,
    },

    'Yandex BareMetal Независимый ДЦ': {
        description:
            'Выделенные физические серверы в независимом дата-центре с полным контролем над инфраструктурой.',
        qr: qrStackland.src,
    },

    DataLens: {
        description:
            'Сервис визуализации и анализа данных с поддержкой дашбордов и построения отчётов.',
        qr: qrStackland.src,
    },

    'AI Studio': {
        description:
            'Платформа для разработки, обучения и развёртывания ИИ‑моделей и нейросетевых приложений.',
        qr: qrStackland.src,
    },

    'Yandex Managed database': {
        description:
            'Управляемые реляционные базы данных PostgreSQL, MySQL и другие с автоматическим резервным копированием и масштабированием.',
        qr: qrStackland.src,
    },

    'Managed Service for Kubernetes®': {
        description:
            'Полностью управляемый сервис Kubernetes: мастер‑нода, автомасштабирование, интеграция с сетью и хранилищами Yandex Cloud.',
        qr: qrStackland.src,
    },

    'Cloud Cdn': {
        description:
            'Сеть доставки контента для ускорения загрузки статических и динамических ресурсов по всему миру.',
        qr: qrStackland.src,
    },
};

// Нормализация label: убираем переносы строк и схлопываем пробелы.
const normalizeLabel = (label: string): string => label.replace(/\s+/g, ' ').trim();

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
