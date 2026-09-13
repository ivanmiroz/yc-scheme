'use client';

import React, {useCallback, useState} from 'react';
import block from 'bem-cn-lite';

import {NetworkSingularity} from '../NetworkSingularity/NetworkSingularity';
import {setActiveScheme} from '../InfrastructureChoose/canvasAnimation/schemes';

import legend1Src from '@/assets/icons/legend1.png';
import legend2Src from '@/assets/icons/legend2.png';
import legend3Src from '@/assets/icons/legend3.png';
import legend4Src from '@/assets/icons/legend4.png';
import legend5Src from '@/assets/icons/legend5.png';

import './ScaleTabs.scss';

const b = block('scale-tabs');

// value — общий ключ между actions и infraTabs. По нему однозначно
// находится соответствующая вкладка независимо от порядка в массиве.
const actions = [
    {value: 'scale', label: 'Масштабирование без ограничений'},
    {value: 'ai', label: 'Разработка ИИ-приложений'},
    {value: 'stability', label: 'Стабильная работа сервисов'},
    {value: 'ttm', label: 'Ускорение time-to-market'},
];

const infraTabs = [
    {value: 'scale', label: 'Масштабирование\nбез ограничений'},
    {value: 'ai', label: 'Инфраструктура\nдля ИИ'},
    {value: 'stability', label: 'Стабильная работа\nсервисов'},
    {value: 'ttm', label: 'Ускорение\ntime-to-market'},
];

const listItems = [
    {icon: <img src={legend1Src.src} alt="Сетевая связность" />, text: 'Сетевая\nсвязность'},
    {icon: <img src={legend2Src.src} alt="VPS PE" />, text: 'VPS PE'},
    {icon: <img src={legend3Src.src} alt="Cloud interconnect" />, text: 'Cloud\ninterconnect'},
    {icon: <img src={legend4Src.src} alt="VPS" />, text: 'VPS'},
    {icon: <img src={legend5Src.src} alt="Cloud Router" />, text: 'Cloud Router'},
];

interface ScaleTabsProps {
    activeIndex?: number;
    onActionClick?: (index: number) => void;
}

export const ScaleTabs: React.FC<ScaleTabsProps> = ({activeIndex = -1, onActionClick}) => {
    const [localActiveIndex, setLocalActiveIndex] = useState(0);
    // isCanvasReady используется только для disabled на табах —
    // клик по sidebar-кнопке от него не зависит.
    const [isCanvasReady, setIsCanvasReady] = useState(false);

    const handleCanvasStart = useCallback(() => {
        setIsCanvasReady(false);
    }, []);

    const handleCanvasReady = useCallback(() => {
        setIsCanvasReady(true);
    }, []);

    // СНАЧАЛА определяем handleInfraTabClick, чтобы он был доступен ниже.
    // Табы и так недоступны, пока isCanvasReady === false (disabled),
    // поэтому внутренний guard тут не нужен.
    const handleInfraTabClick = (index: number) => {
        setLocalActiveIndex(index);
        setActiveScheme(index);
    };

    // Клик по action-кнопке: находим соответствующую вкладку по value
    // и активируем именно её. Работает независимо от isCanvasReady.
    const handleButtonClick = (actionValue: string) => {
        const tabIndex = infraTabs.findIndex((tab) => tab.value === actionValue);
        if (tabIndex === -1) return;
        onActionClick?.(tabIndex);
        setLocalActiveIndex(tabIndex);
        setActiveScheme(tabIndex);
    };

    const isSidebarActive = activeIndex !== -1;
    const activeTabValue = infraTabs[activeIndex]?.value;

    return (
        <div className={b()}>
            <div className={b('content')}>
                <div className={b('panel')}>
                    <NetworkSingularity
                        activeSchemeIndex={localActiveIndex}
                        isScattering={isSidebarActive}
                        onStart={handleCanvasStart}
                        onReady={handleCanvasReady}
                    />
                </div>
            </div>

            <div className={b('sidebar', {frozen: isSidebarActive})}>
                <div className={b('sidebar-scale')}>
                    <div className={b('header')}>
                        <h2 className={b('title')}>Платформа для гибридных решений</h2>
                        <p className={b('description')}>
                            Выберите сценарий и готовую архитектуру для локального и облачного
                            контура. Адаптируйте решение под свои требования с помощью архитектора.
                        </p>
                    </div>

                    <div className={b('actions')}>
                        {actions.map((action) => (
                            <button
                                key={action.value}
                                className={b('button', {
                                    active: activeTabValue === action.value,
                                })}
                                type="button"
                                onClick={() => handleButtonClick(action.value)}
                            >
                                <span className={b('button-text')}>{action.label}</span>
                                <span className={b('button-arrow')}>
                                    <svg
                                        width="9"
                                        height="16"
                                        viewBox="0 0 9 16"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M0.329505 15.4205C-0.109835 14.9812 -0.109835 14.2688 0.329505 13.8295L6.28401 7.875L0.329504 1.9205C-0.109836 1.48116 -0.109836 0.768849 0.329504 0.32951C0.768844 -0.10983 1.48115 -0.10983 1.92049 0.32951L8.67049 7.07951C9.10983 7.51885 9.10983 8.23116 8.67049 8.6705L1.92049 15.4205C1.48115 15.8598 0.768844 15.8598 0.329505 15.4205Z"
                                            fill="currentColor"
                                            fillOpacity="0.7"
                                        />
                                    </svg>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`${b('sidebar-infra')} infrastructure-choose__sidebar`}>
                    <h2 className="infrastructure-choose__title">Выбери инфраструктуру:</h2>

                    <div className="infrastructure-choose__tabs">
                        {infraTabs.map((tab, index) => (
                            <button
                                key={tab.value}
                                type="button"
                                disabled={!isCanvasReady}
                                className={`infrastructure-choose__tab ${localActiveIndex === index ? 'infrastructure-choose__tab_active' : ''}`}
                                onClick={() => handleInfraTabClick(index)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <button className="infrastructure-choose__architect-button" type="button">
                        <span className="infrastructure-choose__architect-button-text">
                            Комментарии архитектора
                        </span>
                        <svg
                            className="infrastructure-choose__architect-button-arrow"
                            width="9"
                            height="16"
                            viewBox="0 0 9 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M0.329505 15.4205C-0.109835 14.9812 -0.109835 14.2688 0.329505 13.8295L6.28401 7.875L0.329504 1.9205C-0.109836 1.48116 -0.109836 0.768849 0.329504 0.32951C0.768844 -0.10983 1.48115 -0.10983 1.92049 0.32951L8.67049 7.07951C9.10983 7.51885 9.10983 8.23116 8.67049 8.6705L1.92049 15.4205C1.48115 15.8598 0.768844 15.8598 0.329505 15.4205Z"
                                fill="white"
                                fillOpacity="0.7"
                            />
                        </svg>
                    </button>

                    <h3 className="infrastructure-choose__section-title">Легенда</h3>

                    <div className="infrastructure-choose__buttons">
                        {listItems.map((item, index) => (
                            <button
                                key={index}
                                type="button"
                                className="infrastructure-choose__button"
                            >
                                <div className="infrastructure-choose__button-icon">
                                    {item.icon}
                                </div>
                                <span className="infrastructure-choose__button-text">
                                    {item.text}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
