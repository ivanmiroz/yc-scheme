'use client';

import React, {useRef} from 'react';
import block from 'bem-cn-lite';

import {useNetworkAnimation} from './canvasAnimation';
import './NetworkSingularity.scss';

const b = block('network-singularity');

export const NetworkSingularity: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useNetworkAnimation(canvasRef);

    return (
        <div className={b()}>
            <canvas ref={canvasRef} className={b('canvas')} />
        </div>
    );
};
