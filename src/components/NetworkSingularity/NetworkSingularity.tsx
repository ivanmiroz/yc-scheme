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
}

export const NetworkSingularity: React.FC<NetworkSingularityProps> = ({
    isScattering = false,
    activeSchemeIndex = 0,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [startInfrastructure, setStartInfrastructure] = useState(false);
    const cleanupRef = useRef<CanvasAnimationCleanup | void>(undefined);

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
            cleanupRef.current = initCanvasAnimation(canvasRef.current);
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
