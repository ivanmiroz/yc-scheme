'use client';

import React, {useEffect, useRef, useState} from 'react';
import block from 'bem-cn-lite';

import {useNetworkAnimation} from './canvasAnimation';
import {CanvasAnimationCleanup, initCanvasAnimation} from '../InfrastructureChoose/canvasAnimation';
import './NetworkSingularity.scss';

const b = block('network-singularity');

interface NetworkSingularityProps {
    isScattering?: boolean;
    activeSchemeIndex?: number;
    onStart?: () => void;
    onReady?: () => void;
}

export const NetworkSingularity: React.FC<NetworkSingularityProps> = ({
    isScattering = false,
    activeSchemeIndex = 0,
    onStart,
    onReady,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [startInfrastructure, setStartInfrastructure] = useState(false);
    const cleanupRef = useRef<CanvasAnimationCleanup | void>(undefined);

    // Храним колбэки в ref, чтобы useEffect с initCanvasAnimation
    // не пересоздавался при каждом ре-рендере родителя.
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

    return (
        <div className={b()}>
            <canvas ref={canvasRef} className={b('canvas')} />
        </div>
    );
};
