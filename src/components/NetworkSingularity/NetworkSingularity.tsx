'use client';

import React, {useEffect, useRef, useState} from 'react';
import block from 'bem-cn-lite';

import {useNetworkAnimation} from './canvasAnimation';
import {CanvasAnimationCleanup, initCanvasAnimation} from '../InfrastructureChoose/canvasAnimation';
import {LegendValue} from '../InfrastructureChoose/canvasAnimation/schemes';
import './NetworkSingularity.scss';

const b = block('network-singularity');

interface NetworkSingularityProps {
    isScattering?: boolean;
    activeSchemeIndex?: number;
    activeLegend?: LegendValue | null;
    onStart?: () => void;
    onReady?: () => void;
}

export const NetworkSingularity: React.FC<NetworkSingularityProps> = ({
    isScattering = false,
    activeSchemeIndex = 0,
    activeLegend = null,
    onStart,
    onReady,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [startInfrastructure, setStartInfrastructure] = useState(false);
    const cleanupRef = useRef<CanvasAnimationCleanup | void>(undefined);

    const onStartRef = useRef(onStart);
    const onReadyRef = useRef(onReady);
    useEffect(() => {
        onStartRef.current = onStart;
    }, [onStart]);
    useEffect(() => {
        onReadyRef.current = onReady;
    }, [onReady]);

    useNetworkAnimation(canvasRef, isScattering, () => {
        setStartInfrastructure(true);
    });

    useEffect(() => {
        if (!isScattering) {
            setStartInfrastructure(false);
        }
    }, [isScattering]);

    useEffect(() => {
        if (startInfrastructure && canvasRef.current) {
            if (cleanupRef.current) {
                cleanupRef.current();
            }
            cleanupRef.current = initCanvasAnimation(canvasRef.current, {
                onStart: () => onStartRef.current?.(),
                onReady: () => onReadyRef.current?.(),
            });
        }

        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
            }
        };
    }, [startInfrastructure]);

    useEffect(() => {
        if (cleanupRef.current && cleanupRef.current.refreshScheme) {
            cleanupRef.current.refreshScheme();
        }
    }, [activeSchemeIndex]);

    // Клик по легенде — обновляем подсветку без перезапуска анимации.
    useEffect(() => {
        if (cleanupRef.current && cleanupRef.current.setActiveLegend) {
            cleanupRef.current.setActiveLegend(activeLegend);
        }
    }, [activeLegend]);

    return (
        <div className={b()}>
            <canvas ref={canvasRef} className={b('canvas')} />
        </div>
    );
};
