// src/components/InfrastructureChoose/InfrastructureChoose.tsx
'use client';

import React from 'react';
import block from 'bem-cn-lite';
import './InfrastructureChoose.scss';

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
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle cx="10" cy="10" r="8" fill="#00a2ff" />
            </svg>
        ),
        text: 'Сетевая\nсвязность',
    },
    {
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle cx="10" cy="10" r="8" fill="#00a2ff" />
            </svg>
        ),
        text: 'VPS PE',
    },
    {
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle cx="10" cy="10" r="8" fill="#00a2ff" />
            </svg>
        ),
        text: 'Cloud\ninterconnect',
    },
    {
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle cx="10" cy="10" r="8" fill="#00a2ff" />
            </svg>
        ),
        text: 'VPS',
    },
    {
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle cx="10" cy="10" r="8" fill="#00a2ff" />
            </svg>
        ),
        text: 'Cloud Router',
    },
];

export const InfrastructureChoose: React.FC = () => {
    const [activeTab, setActiveTab] = React.useState(tabs[0].value);

    const renderContent = () => {
        switch (activeTab) {
            case 'scale':
                return <h3>Масштабирование без ограничений</h3>;
            case 'ai':
                return <h3>Инфраструктура для ИИ</h3>;
            case 'stability':
                return <h3>Стабильная работа сервисов</h3>;
            case 'ttm':
                return <h3>Ускорение time-to-market</h3>;
            default:
                return null;
        }
    };

    return (
        <div className={b()}>
            <div className={b('content')}>
                <div className={b('content-inner')}>{renderContent()}</div>
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
            </div>
        </div>
    );
};
