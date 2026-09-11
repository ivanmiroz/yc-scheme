'use client';

import React, {useRef} from 'react';
import block from 'bem-cn-lite';

import {useNetworkAnimation} from './canvasAnimation';
import './NetworkSingularity.scss';

const b = block('network-singularity');

interface NetworkSingularityProps {
    isFrozen?: boolean;
}

export const NetworkSingularity: React.FC<NetworkSingularityProps> = ({isFrozen = false}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useNetworkAnimation(canvasRef, isFrozen);

    return (
        <div className={b()}>
            <canvas ref={canvasRef} className={b('canvas')} />
        </div>
    );
};
