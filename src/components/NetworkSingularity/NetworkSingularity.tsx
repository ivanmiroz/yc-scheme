// src/components/NetworkSingularity/NetworkSingularity.tsx
'use client';

import React, {useRef} from 'react';
import block from 'bem-cn-lite';

import {useNetworkAnimation} from './useNetworkAnimation';
import './NetworkSingularity.scss';

const b = block('network-singularity');

export const NetworkSingularity: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const subtitleRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const {nodeCount, connectionCount} = useNetworkAnimation(canvasRef, subtitleRef, indicatorRef);

    return (
        <div className={b()}>
            <canvas ref={canvasRef} className={b('canvas')} />
            <div className={b('overlay')}>
                <div className={b('title')}>Сетевая сингулярность</div>
                <div className={b('subtitle-row')}>
                    {/* БЕЗ style! React не будет трогать стили */}
                    <div ref={indicatorRef} className={b('indicator')} />
                    <div ref={subtitleRef} className={b('subtitle')} />
                </div>
                <div className={b('stats')}>
                    <span className={b('num')}>{String(nodeCount).padStart(2, '0')}</span>
                    <span className={b('label')}> объектов · </span>
                    <span className={b('num')}>{String(connectionCount).padStart(2, '0')}</span>
                    <span className={b('label')}> связей</span>
                </div>
                <div className={b('hint')}>Тяните, чтобы вращать · колесо, чтобы приблизить</div>
            </div>
        </div>
    );
};
