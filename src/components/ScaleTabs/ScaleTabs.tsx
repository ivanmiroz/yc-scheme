// src/components/ScaleTabs/ScaleTabs.tsx
'use client';

import React from 'react';
import {Tab, TabList, TabPanel, TabProvider} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';

import {NetworkSingularity} from '../NetworkSingularity/NetworkSingularity';
import './ScaleTabs.scss';

const b = block('scale-tabs');

export const ScaleTabs: React.FC = () => {
    const [activeTab, setActiveTab] = React.useState('client');

    return (
        <div className={b()}>
            <TabProvider value={activeTab} onUpdate={setActiveTab}>
                <TabList size="m">
                    <Tab value="client">Масштабирование</Tab>
                    <Tab value="managed">Инфраструктура для ИИ</Tab>
                    <Tab value="virtualization">Ускорение time-to-market</Tab>
                    <Tab value="hardware">Стабильная работа сервисов</Tab>
                </TabList>

                <div className={b('content')}>
                    <TabPanel value="client">
                        <div className="scale-tabs__panel">
                            <h2>Клиентские приложения</h2>
                            <p>
                                Здесь размещается информация о клиентских приложениях, их
                                особенностях и преимуществах безопасного масштабирования на стороне
                                пользователя.
                            </p>
                            <NetworkSingularity />
                        </div>
                    </TabPanel>

                    <TabPanel value="managed">
                        <div className="scale-tabs__panel">
                            <h2>Управляемые сервисы / платформы</h2>
                            <p>
                                Описание управляемых сервисов и PaaS-решений, обеспечивающих
                                надежность, безопасность и автоматизацию вашей инфраструктуры.
                            </p>
                            <NetworkSingularity />
                        </div>
                    </TabPanel>

                    <TabPanel value="virtualization">
                        <div className="scale-tabs__panel">
                            <h2>Виртуализация + контейнеризация</h2>
                            <p>
                                Решения для виртуализации и контейнеризации, позволяющие гибко
                                управлять вычислительными ресурсами и изолировать рабочие нагрузки.
                            </p>
                            <NetworkSingularity />
                        </div>
                    </TabPanel>

                    <TabPanel value="hardware">
                        <div className="scale-tabs__panel">
                            <h2>Аппаратный слой</h2>
                            <p>
                                Информация о физическом аппаратном обеспечении, его
                                отказоустойчивости, возможностях горизонтального масштабирования и
                                дата-центрах.
                            </p>
                            <NetworkSingularity />
                        </div>
                    </TabPanel>
                </div>
            </TabProvider>
        </div>
    );
};
