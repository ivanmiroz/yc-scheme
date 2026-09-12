'use client';

import React, {useState} from 'react';
import block from 'bem-cn-lite';
import './ScaleInfrastructure.scss';

import {ScaleTabs} from '../ScaleTabs/ScaleTabs';

const b = block('scale-infrastructure');

export const ScaleInfrastructure: React.FC = () => {
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const handleActionClick = (index: number) => {
        setSelectedIndex(index);
    };

    return (
        <div className={b()}>
            <div className={b('screen', {scale: true})}>
                <ScaleTabs activeIndex={selectedIndex} onActionClick={handleActionClick} />
            </div>
        </div>
    );
};
