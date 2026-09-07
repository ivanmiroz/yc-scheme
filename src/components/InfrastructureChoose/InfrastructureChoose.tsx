'use client';

import React, {useEffect, useRef} from 'react';
import block from 'bem-cn-lite';
import './InfrastructureChoose.scss';
import {initCanvasAnimation} from './canvasAnimation';

// Импорт PNG-иконок для легенды
import legend1Src from '@/assets/icons/legend1.png';
import legend2Src from '@/assets/icons/legend2.png';
import legend3Src from '@/assets/icons/legend3.png';
import legend4Src from '@/assets/icons/legend4.png';
import legend5Src from '@/assets/icons/legend5.png';

const b = block('infrastructure-choose');

interface TabItem {
    value: string;
    label: string;
}

interface ListItem {
    icon: React.ReactNode;
    text: string;
}

const tabs: TabItem[] = [
    {value: 'scale', label: 'Масштабирование\nбез ограничений'},
    {value: 'ai', label: 'Инфраструктура\nдля ИИ'},
    {value: 'stability', label: 'Стабильная работа\nсервисов'},
    {value: 'ttm', label: 'Ускорение\ntime-to-market'},
];

const listItems: ListItem[] = [
    {
        icon: <img src={legend1Src.src} alt="Сетевая связность" />,
        text: 'Сетевая\nсвязность',
    },
    {
        icon: <img src={legend2Src.src} alt="VPS PE" />,
        text: 'VPS PE',
    },
    {
        icon: <img src={legend3Src.src} alt="Cloud interconnect" />,
        text: 'Cloud\ninterconnect',
    },
    {
        icon: <img src={legend4Src.src} alt="VPS" />,
        text: 'VPS',
    },
    {
        icon: <img src={legend5Src.src} alt="Cloud Router" />,
        text: 'Cloud Router',
    },
];

export const InfrastructureChoose: React.FC = () => {
    const [activeTab, setActiveTab] = React.useState(tabs[0].value);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) {
            return () => {};
        }
        const cleanup = initCanvasAnimation(canvasRef.current);
        return () => {
            if (cleanup) cleanup();
        };
    }, []);

    const renderContent = () => {
        return null;
    };

    return (
        <div className={b()}>
            <div className={b('content')}>
                <div className={b('content-inner')}>
                    {renderContent()}
                    <div className={b('canvas-container')}>
                        <canvas ref={canvasRef} className={b('canvas')} />
                    </div>
                </div>
            </div>

            <div className={b('sidebar')}>
                <h2 className={b('title')}>Выбери инфраструктуру:</h2>
                <div className={b('tabs')}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            className={b('tab', {active: activeTab === tab.value})}
                            onClick={() => setActiveTab(tab.value)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <hr className={b('divider')} />

                <button className={b('architect-button')} type="button">
                    <span className={b('architect-button-text')}>Комментарии архитектора</span>
                    <svg
                        className={b('architect-button-arrow')}
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

                <hr className={b('divider')} />

                <h3 className={b('section-title')}>Легенда</h3>

                <div className={b('buttons')}>
                    {listItems.map((item, index) => (
                        <button key={index} type="button" className={b('button')}>
                            <div className={b('button-icon')}>{item.icon}</div>
                            <span className={b('button-text')}>{item.text}</span>
                        </button>
                    ))}
                </div>

                <div className={b('hint')}>
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
    );
};
