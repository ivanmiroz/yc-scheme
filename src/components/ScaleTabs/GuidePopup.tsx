'use client';

import React, {useEffect} from 'react';
import block from 'bem-cn-lite';

import './GuidePopup.scss';

const b = block('guide-popup');

interface GuidePopupProps {
    open: boolean;
    onClose: () => void;
}

export const GuidePopup: React.FC<GuidePopupProps> = ({open, onClose}) => {
    // Закрытие по Escape
    useEffect(() => {
        if (!open) return undefined;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className={b()}>
            <div className={b('backdrop')} onClick={onClose} />

            <div className={b('body')}>
                <div className={b('panel')}>
                    {/* Блок 1: заголовок */}
                    <div className={b('block', {kind: 'title'})}>
                        <h1 className={b('title')}>
                            Как пользоваться картой гибридной инфраструктуры
                        </h1>
                    </div>

                    {/* Блок 2: возможности интерактива — инфраструктура */}
                    <div className={b('block', {kind: 'card'})}>
                        <h6 className={b('card-title')}>Возможности интерактива:</h6>
                        <ul className={b('list')}>
                            <li className={b('list-item')}>
                                Физическая инфраструктура — серверы, системы хранения и другие
                                ресурсы.
                            </li>
                            <li className={b('list-item')}>
                                Виртуализация и контейнеризация — сервисы для запуска ВМ и
                                контейнерных приложений.
                            </li>
                            <li className={b('list-item')}>
                                Данные и интеграции — хранение, обработка данных и обмен между
                                системами.
                            </li>
                            <li className={b('list-item')}>
                                Приложения — прикладные системы и сервисы.
                            </li>
                        </ul>
                        <p className={b('note')}>
                            На схеме видно, какие ресурсы находятся в локальной среде, а какие
                            предоставляет Yandex Cloud. Сетевые связи показывают взаимодействие
                            контуров и подключённых сервисов.
                        </p>
                    </div>

                    {/* Блок 3: возможности интерактива — сценарии */}
                    <div className={b('block', {kind: 'card'})}>
                        <h6 className={b('card-title')}>Возможности интерактива:</h6>
                        <ul className={b('list')}>
                            <li className={b('list-item')}>
                                Переключайтесь между задачами — для разных сценариев показаны
                                варианты архитектуры с разным набором сервисов, размещением ресурсов
                                и сетевыми связями. Каждая схема основана на практическом опыте
                                архитекторов Yandex Cloud.
                            </li>
                            <li className={b('list-item')}>
                                Выбирайте конкретный сервис — откроется подробное описание продукта
                                Yandex Cloud.
                            </li>
                            <li className={b('list-item')}>
                                Увеличивайте и изучайте схемы — смотрите, как объединить ваши
                                ресурсы с сервисами Yandex Cloud и организовать взаимодействие между
                                ними.
                            </li>
                        </ul>
                        <p className={b('note')}>
                            Если возникнут вопросы, обратитесь к стендисту или оставьте заявку по
                            QR-коду — поможем подобрать оптимальное гибридное решение для вашего
                            проекта.
                        </p>
                    </div>
                </div>

                {/* Кнопка закрытия — вне панели, справа сверху, с отступом 8px. */}
                <button
                    type="button"
                    className={b('close')}
                    aria-label="Закрыть"
                    onClick={onClose}
                />
            </div>
        </div>
    );
};
