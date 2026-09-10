import {useEffect, useRef} from 'react';

import {generateNodes2D} from './nodeGenerator';
import {calculateAppearOpacity, drawGrowingPath, drawNode, prepareCanvas} from './renderer';
import {calculateCanvasDimensions, calculateScaleFactor} from './utils';
import {Node2D} from './types';
import {APPEAR_DURATION, TARGET_FPS} from './constants';
import {loadAllIcons} from '../../InfrastructureChoose/canvasAnimation/icons';

export const useNetworkAnimation = (canvasRef: React.RefObject<HTMLCanvasElement | null>): void => {
    const animationRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const dprRef = useRef(1);
    const scaleFactorRef = useRef(1);
    const lastFrameTimeRef = useRef(0);
    const nodesRef = useRef<Node2D[]>([]);
    const sizeRef = useRef({width: 0, height: 0});

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        const ctx = canvas.getContext('2d', {alpha: true, desynchronized: true});
        if (!ctx) return undefined;

        let isMounted = true;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const cssWidth = rect.width;
            const cssHeight = rect.height;

            const dimensions = calculateCanvasDimensions(cssWidth, cssHeight);
            canvas.width = dimensions.width;
            canvas.height = dimensions.height;
            dprRef.current = dimensions.dpr;

            scaleFactorRef.current = calculateScaleFactor(cssWidth);
            sizeRef.current = {width: cssWidth, height: cssHeight};

            // Перегенерируем позиции и маршруты при ресайзе
            nodesRef.current = generateNodes2D(cssWidth, cssHeight, scaleFactorRef.current);
        };

        const animate = (time: number) => {
            if (!isMounted) return;

            const frameInterval = 1000 / TARGET_FPS;
            if (time - lastFrameTimeRef.current < frameInterval) {
                animationRef.current = requestAnimationFrame(animate);
                return;
            }
            lastFrameTimeRef.current = time;

            const {width, height} = sizeRef.current;
            const dpr = dprRef.current;
            const scaleFactor = scaleFactorRef.current;

            prepareCanvas(ctx, width, height, dpr);

            const t = time - startTimeRef.current;

            // 1. Сначала рисуем растущие линии соединений (чтобы они были ПОД иконками)
            for (const node of nodesRef.current) {
                const appearElapsed = t - node.spawnDelay;

                // Если узел ещё не начал появляться — пропускаем
                if (appearElapsed <= 0) continue;

                // Прогресс появления текущего узла (0.0 ... 1.0)
                const appearProgress = Math.min(1, appearElapsed / APPEAR_DURATION);

                if (node.path.length < 2) continue;

                drawGrowingPath(ctx, node.path, scaleFactor, appearProgress, node.lineStyle);
            }

            // 2. Затем рисуем сами узлы поверх линий
            for (const node of nodesRef.current) {
                const opacity = calculateAppearOpacity(t, node.spawnDelay);
                if (opacity === 0) continue;

                drawNode(ctx, node, scaleFactor, opacity);
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        const init = async () => {
            await loadAllIcons();
            if (!isMounted) return;

            startTimeRef.current = performance.now();
            resize();
            window.addEventListener('resize', resize);
            animationRef.current = requestAnimationFrame(animate);
        };

        init();

        return () => {
            isMounted = false;
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [canvasRef]);
};
