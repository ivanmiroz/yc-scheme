import {useEffect, useRef} from 'react';

import {generateNodes2D} from './nodeGenerator';
import {calculateAppearOpacity, drawGrowingPath, drawNode, prepareCanvas} from './renderer';
import {calculateCanvasDimensions, calculateScaleFactor} from './utils';
import {Node2D} from './types';
import {APPEAR_DURATION, LABEL_FONT_SIZE} from './constants';
import {loadAllIcons} from '../../InfrastructureChoose/canvasAnimation/icons';

export const useNetworkAnimation = (canvasRef: React.RefObject<HTMLCanvasElement | null>): void => {
    const animationRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const dprRef = useRef(1);
    const scaleFactorRef = useRef(1);
    const nodesRef = useRef<Node2D[]>([]);
    const sizeRef = useRef({width: 0, height: 0});
    const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        const ctx = canvas.getContext('2d', {alpha: true, desynchronized: true});
        if (!ctx) return undefined;

        let isMounted = true;

        const resize = () => {
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);

            resizeTimeoutRef.current = setTimeout(() => {
                if (!isMounted) return;

                const rect = canvas.getBoundingClientRect();
                const cssWidth = rect.width;
                const cssHeight = rect.height;

                const dimensions = calculateCanvasDimensions(cssWidth, cssHeight);
                canvas.width = dimensions.width;
                canvas.height = dimensions.height;
                dprRef.current = dimensions.dpr;

                scaleFactorRef.current = calculateScaleFactor(cssWidth);
                sizeRef.current = {width: cssWidth, height: cssHeight};

                nodesRef.current = generateNodes2D(cssWidth, cssHeight, scaleFactorRef.current);
            }, 150); // Debounce 150ms для защиты от тяжелых пересчетов при драге окна
        };

        const animate = (time: number) => {
            if (!isMounted) return;

            const {width, height} = sizeRef.current;
            const dpr = dprRef.current;
            const scaleFactor = scaleFactorRef.current;

            prepareCanvas(ctx, width, height, dpr);

            const t = time - startTimeRef.current;

            // Оптимизация: выносим общие настройки контекста из цикла отрисовки узлов
            ctx.font = `500 ${LABEL_FONT_SIZE * scaleFactor}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#000000';

            for (const node of nodesRef.current) {
                const appearElapsed = t - node.spawnDelay;
                if (appearElapsed <= 0) continue;

                const appearProgress = Math.min(1, appearElapsed / APPEAR_DURATION);
                if (node.path.length < 2) continue;

                drawGrowingPath(
                    ctx,
                    node.path,
                    scaleFactor,
                    appearProgress,
                    node.lineStyle,
                    node.pathLengths,
                    node.totalPathLength,
                );
            }

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
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
        };
    }, [canvasRef]);
};
