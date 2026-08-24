'use client';

import React from 'react';
import {Tab, TabList, TabPanel, TabProvider} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';

import './ScaleTabs.scss';

const b = block('scale-tabs');

export const ScaleTabs: React.FC = () => {
    const [activeTab, setActiveTab] = React.useState('client');

    return (
        <div className={b()}>
            <h1 className={b('title')}>Масштабируйтесь безопасно</h1>
            
            <TabProvider value={activeTab} onUpdate={setActiveTab}>
                <TabList size="l" contentOverflow="wrap">
                    <Tab value="client">Клиентские приложения</Tab>
                    <Tab value="managed">Управляемые сервисы / платформы</Tab>
                    <Tab value="virtualization">Виртуализация + контейнеризация</Tab>
                    <Tab value="hardware">Аппаратный слой</Tab>
                </TabList>
                
                <div className={b('content')}>
                    <TabPanel value="client">
                        <h2>Клиентские приложения</h2>
                        <p>Здесь размещается информация о клиентских приложениях, их особенностях и преимуществах безопасного масштабирования на стороне пользователя.</p>
                    </TabPanel>
                    <TabPanel value="managed">
                        <h2>Управляемые сервисы / платформы</h2>
                        <p>Описание управляемых сервисов и PaaS-решений, обеспечивающих надежность, безопасность и автоматизацию вашей инфраструктуры.</p>
                    </TabPanel>
                    <TabPanel value="virtualization">
                        <h2>Виртуализация + контейнеризация</h2>
                        <p>Решения для виртуализации и контейнеризации, позволяющие гибко управлять вычислительными ресурсами и изолировать рабочие нагрузки.</p>
                    </TabPanel>
                    <TabPanel value="hardware">
                        <h2>Аппаратный слой</h2>
                        <p>Информация о физическом аппаратном обеспечении, его отказоустойчивости, возможностях горизонтального масштабирования и дата-центрах.</p>
                    </TabPanel>
                </div>
            </TabProvider>
        </div>
    );
};
