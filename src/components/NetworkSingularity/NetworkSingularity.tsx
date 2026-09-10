'use client';

import React from 'react';
import block from 'bem-cn-lite';

import './NetworkSingularity.scss';

const b = block('network-singularity');

export const NetworkSingularity: React.FC = () => {
    return (
        <div className={b()}>
            <canvas className={b('canvas')} />
        </div>
    );
};
