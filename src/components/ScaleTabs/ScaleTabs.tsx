'use client';

import React, {useState} from 'react';
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

const actions = [
    {value: 'scale', label: 'Масштабирование без ограничений'},
    {value: 'time-to-market', label: 'Разработка ИИ-приложений'},
    {value: 'ai', label: 'Стабильная работа сервисов'},
    {value: 'security', label: 'Ускорение time-to-market'},
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

    // СНАЧАЛА определяем handleInfraTabClick, чтобы он был доступен ниже
    const handleInfraTabClick = (index: number) => {
        setLocalActiveIndex(index);
        setActiveScheme(index);
    };

    // Теперь handleButtonClick может безопасно использовать handleInfraTabClick
    const handleButtonClick = (index: number) => {
        onActionClick?.(index);
        handleInfraTabClick(index);
    };

    const isSidebarActive = activeIndex !== -1;

    return (
        <div className={b()}>
            <div className={b('content')}>
                <div className={b('panel')}>
                    <NetworkSingularity
                        activeSchemeIndex={localActiveIndex}
                        isScattering={isSidebarActive}
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
                        {actions.map((action, index) => (
                            <button
                                key={action.value}
                                className={b('button', {
                                    active: activeIndex === index,
                                })}
                                type="button"
                                onClick={() => handleButtonClick(index)}
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

                    <div className="infrastructure-choose__hint">
                        <svg
                            width="17"
                            height="17"
                            viewBox="0 0 17 17"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <g clipPath="url(#clip0_386_46687)">
                                <path
                                    d="M9.21244 0.527343L16.4688 0.527344L16.4687 7.78365M16.4688 0.527344L9.21244 7.78365"
                                    stroke="black"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M7.78756 16.4727L0.53125 16.4727L0.531251 9.21635M0.53125 16.4727L6.43276 10.5712L7.78756 9.21635"
                                    stroke="black"
                                    strokeLinecap="round"
                                />
                            </g>
                            <defs>
                                <clipPath id="clip0_386_46687">
                                    <rect width="17" height="17" fill="white" />
                                </clipPath>
                            </defs>
                        </svg>
                        <span>Увеличивай чтобы рассмотреть</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
