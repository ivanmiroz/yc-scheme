'use client';

import React, {useEffect, useRef, useState} from 'react';
import block from 'bem-cn-lite';

import {useNetworkAnimation} from './canvasAnimation';
import {initCanvasAnimation} from '../InfrastructureChoose/canvasAnimation';
import './NetworkSingularity.scss';

const b = block('network-singularity');

interface NetworkSingularityProps {
    isScattering?: boolean;
}

export const NetworkSingularity: React.FC<NetworkSingularityProps> = ({isScattering = false}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [startInfrastructure, setStartInfrastructure] = useState(false);

    // Запускаем сетевую анимацию. По завершении разлёта вызывается callback
    useNetworkAnimation(canvasRef, isScattering, () => {
        setStartInfrastructure(true);
    });

    // Если пользователь закрыл сайдбар, сбрасываем состояние, чтобы анимация инфраструктуры очистилась,
    // а сетевая анимация могла перезапуститься
    useEffect(() => {
        if (!isScattering) {
            setStartInfrastructure(false);
        }
    }, [isScattering]);

    // Когда пришло время, запускаем анимацию платформ на ТОМ ЖЕ канвасе
    useEffect(() => {
        if (startInfrastructure && canvasRef.current) {
            const cleanup = initCanvasAnimation(canvasRef.current);
            return cleanup; // Очистка при размонтировании или сбросе состояния
        }
        return undefined;
    }, [startInfrastructure]);

    return (
        <div className={b()}>
            <canvas ref={canvasRef} className={b('canvas')} />
        </div>
    );
};
