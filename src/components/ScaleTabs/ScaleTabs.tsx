// src/components/ScaleTabs/ScaleTabs.tsx
'use client';

import React from 'react';
import {TabPanel, TabProvider} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';

import {NetworkSingularity} from '../NetworkSingularity/NetworkSingularity';
import './ScaleTabs.scss';

const b = block('scale-tabs');

interface TabItem {
    value: string;
    label: string;
}

const tabs: TabItem[] = [
    {
        value: 'scale',
        label: 'Масштабируйтесь безопасно',
    },
    {
        value: 'time-to-market',
        label: 'Ускорение Time to Market',
    },
    {
        value: 'ai',
        label: 'Разработка ИИ-приложений',
    },
    {
        value: 'security',
        label: 'Обеспечение безопасной работы сервисов',
    },
];

export const ScaleTabs: React.FC = () => {
    const [activeTab, setActiveTab] = React.useState('scale');

    return (
        <div className={b()}>
            <div className={b('sidebar')}>
                <div className={b('header')}>
                    <h2 className={b('title')}>Платформа для гибридных решений</h2>
                    <p className={b('description')}>
                        Выберите сценарий и готовую архитектуру для локального и облачного контура.
                        Адаптируйте решение под свои требования с помощью архитектора.
                    </p>
                </div>

                <div className={b('tabs')}>
                    {tabs.map((tab) => (
                        <div
                            key={tab.value}
                            className={b('tab', {active: activeTab === tab.value})}
                            onClick={() => setActiveTab(tab.value)}
                        >
                            <span className={b('tab-text')}>{tab.label}</span>
                            <span className={b('tab-arrow')}>
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
                        </div>
                    ))}
                </div>
            </div>

            <div className={b('content')}>
                <TabProvider value={activeTab}>
                    {tabs.map((tab) => (
                        <TabPanel key={tab.value} value={tab.value}>
                            <div className={b('panel')}>
                                <NetworkSingularity />
                            </div>
                        </TabPanel>
                    ))}
                </TabProvider>
            </div>
        </div>
    );
};
