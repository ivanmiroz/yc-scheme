'use client';

import React, {useState} from 'react';
import block from 'bem-cn-lite';
import './ScaleInfrastructure.scss';

import {ScaleTabs} from '../ScaleTabs/ScaleTabs';
import {InfrastructureChoose} from '../InfrastructureChoose/InfrastructureChoose';

const b = block('scale-infrastructure');

export const ScaleInfrastructure: React.FC = () => {
    const [activeScreen, setActiveScreen] = useState<'scale' | 'infra'>('scale');
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const handleScaleAction = (index: number) => {
        setSelectedIndex(index);
        requestAnimationFrame(() => {
            setActiveScreen('infra');
        });
    };

    const handleBackToScale = () => {
        setSelectedIndex(-1);
        requestAnimationFrame(() => {
            setActiveScreen('scale');
        });
    };

    return (
        <div className={b({screen: activeScreen})}>
            <div className={b('screen', {scale: true})}>
                <ScaleTabs activeIndex={selectedIndex} onActionClick={handleScaleAction} />
            </div>
            <div className={b('screen', {infra: true})}>
                <InfrastructureChoose
                    activeIndex={selectedIndex}
                    onBack={handleBackToScale}
                    visible={activeScreen === 'infra'}
                />
            </div>
        </div>
    );
};
