/* eslint-disable no-param-reassign */

import {useEffect, useRef} from 'react';

import {
    buildCoreRingRoutes,
    buildRouteForNode,
    generateCoreNodes,
    generateNodes2D,
    spawnNewNode,
} from './nodeGenerator';
import {drawGrowingPath, drawNode, prepareCanvas} from './renderer';
import {calculateCanvasDimensions, calculateScaleFactor} from './utils';
import {Node2D, Point} from './types';
import {
    APPEAR_DURATION,
    FADE_DURATION,
    LABEL_FONT_SIZE,
    MIN_AGE_FOR_FADE,
    RESPAWN_DELAY,
    SCATTER_DISTANCE,
    SCATTER_DURATION,
    TARGET_TOTAL_COUNT,
} from './constants';
import {LABELS, loadAllIcons} from '../../InfrastructureChoose/canvasAnimation/icons';

const getNodeOpacity = (node: Node2D, currentTime: number, timeScale: number): number => {
    if (currentTime < node.createdAt) return 0;

    const age = (currentTime - node.createdAt) * timeScale;

    const appearProgress = Math.min(1, age / APPEAR_DURATION);
    const appearOpacity = 1 - Math.pow(1 - appearProgress, 3);

    if (node.fadeStart !== null) {
        const fadeElapsed = (currentTime - node.fadeStart) * timeScale;
        const fadeProgress = Math.min(1, fadeElapsed / FADE_DURATION);
        const fadeOpacity = 1 - Math.pow(fadeProgress, 2);
        return Math.min(appearOpacity, fadeOpacity);
    }

    return appearOpacity;
};

const findOldestMatureNode = (nodes: Node2D[], currentTime: number): Node2D | null => {
    let oldest: Node2D | null = null;

    for (const node of nodes) {
        if (node.fadeStart !== null) continue;
        if (currentTime - node.createdAt < MIN_AGE_FOR_FADE) continue;

        if (oldest === null || node.createdAt < oldest.createdAt) {
            oldest = node;
        }
    }

    return oldest;
};

const removeFadedNodes = (
    coreNodes: Node2D[],
    dynamicNodes: Node2D[],
    scaleFactor: number,
    currentTime: number,
    availableLabels: string[],
): Node2D[] => {
    const nodesToRemove: number[] = [];
    for (let i = 0; i < dynamicNodes.length; i++) {
        const opacity = getNodeOpacity(dynamicNodes[i], currentTime, 1);
        if (opacity === 0 && dynamicNodes[i].fadeStart !== null) {
            nodesToRemove.push(i);
        }
    }

    if (nodesToRemove.length === 0) return dynamicNodes;

    const removedSet = new Set(nodesToRemove);
    const coreCount = coreNodes.length;

    for (const idx of nodesToRemove) {
        const node = dynamicNodes[idx];
        if (node.isEmpty === false && node.label) {
            availableLabels.push(node.label);
        }
    }

    const allNodesBefore = [...coreNodes, ...dynamicNodes];

    for (let i = 0; i < dynamicNodes.length; i++) {
        if (removedSet.has(i)) continue;
        const node = dynamicNodes[i];
        if (node.sourceIdx >= coreCount) {
            const sourceDynamicIdx = node.sourceIdx - coreCount;
            if (removedSet.has(sourceDynamicIdx)) {
                buildRouteForNode(node, allNodesBefore, scaleFactor);
            }
        }
    }

    const filteredDynamic = dynamicNodes.filter((_, i) => !removedSet.has(i));

    const dynamicIndexMap = new Map<number, number>();
    let newIdx = 0;
    for (let oldIdx = 0; oldIdx < dynamicNodes.length; oldIdx++) {
        if (!removedSet.has(oldIdx)) {
            dynamicIndexMap.set(oldIdx, newIdx);
            newIdx++;
        }
    }

    for (const node of filteredDynamic) {
        if (node.sourceIdx >= 0) {
            if (node.sourceIdx < coreCount) {
                // Указывает на core — индекс не меняется
            } else {
                const oldDynamicIdx = node.sourceIdx - coreCount;
                const mapped = dynamicIndexMap.get(oldDynamicIdx);
                node.sourceIdx = mapped === undefined ? -1 : coreCount + mapped;
            }
        }
    }

    return filteredDynamic;
};

const fadeDisconnectedNodes = (
    coreNodes: Node2D[],
    dynamicNodes: Node2D[],
    currentTime: number,
): void => {
    const coreCount = coreNodes.length;

    const connectedTargets = new Set<number>();
    for (const node of dynamicNodes) {
        if (node.sourceIdx >= 0) {
            connectedTargets.add(node.sourceIdx);
        }
    }

    for (let i = 0; i < dynamicNodes.length; i++) {
        const node = dynamicNodes[i];
        if (node.fadeStart !== null) continue;

        const globalIdx = coreCount + i;

        const hasOutgoing = node.sourceIdx >= 0;
        const hasIncoming = connectedTargets.has(globalIdx);

        if (!hasOutgoing && !hasIncoming) {
            node.fadeStart = currentTime;
        }
    }
};

const handleNormalLifecycle = (dynamicNodes: Node2D[], currentTime: number): void => {
    let activeCount = 0;
    for (const node of dynamicNodes) {
        if (node.fadeStart === null && currentTime >= node.createdAt) {
            activeCount++;
        }
    }

    if (activeCount >= TARGET_TOTAL_COUNT) {
        const oldest = findOldestMatureNode(dynamicNodes, currentTime);
        if (oldest !== null) {
            oldest.fadeStart = currentTime;
        }
    }
};

// Детерминированный расчёт вектора разлёта узла
const getScatterOffset = (node: Node2D, progress: number): {x: number; y: number} => {
    const seed = node.createdAt + (node.isCore ? 10000 : 0) + (node.isEmpty ? 5000 : 0);
    const angle = (seed * 137.508) % 360;
    const rad = angle * (Math.PI / 180);
    const distance = SCATTER_DISTANCE * progress;
    return {
        x: Math.cos(rad) * distance,
        y: Math.sin(rad) * distance,
    };
};

// Обновление жизненного цикла узлов (вне режима разлёта).
// ВАЖНО: возвращает актуальный массив динамических узлов — вызывающая сторона
// обязана присвоить его обратно в nodesRef.current, иначе спавн и удаление
// будут «теряться» и анимация застынет.
const updateLifecycle = (
    coreNodes: Node2D[],
    dynamicNodes: Node2D[],
    availableLabels: string[],
    scaleFactor: number,
    width: number,
    height: number,
    t: number,
): Node2D[] => {
    handleNormalLifecycle(dynamicNodes, t);

    const afterRemoval = removeFadedNodes(coreNodes, dynamicNodes, scaleFactor, t, availableLabels);

    const activeCount = afterRemoval.filter((n) => n.fadeStart === null).length;
    const countToAdd = TARGET_TOTAL_COUNT - activeCount;

    if (countToAdd > 0) {
        for (let i = 0; i < countToAdd; i++) {
            const allNodesForSpawn = [...coreNodes, ...afterRemoval];
            const newNode = spawnNewNode(
                allNodesForSpawn,
                width,
                height,
                scaleFactor,
                t + RESPAWN_DELAY,
                availableLabels,
            );
            afterRemoval.push(newNode);
        }
    }

    fadeDisconnectedNodes(coreNodes, afterRemoval, t);

    return afterRemoval;
};

// Отрисовка всех линий между узлами
const renderLines = (
    ctx: CanvasRenderingContext2D,
    allNodes: Node2D[],
    opacities: number[],
    scaleFactor: number,
    renderTime: number,
    isScatteringNow: boolean,
    scatterProgress: number,
): void => {
    for (let i = 0; i < allNodes.length; i++) {
        const node = allNodes[i];
        if (node.sourceIdx < 0 || node.path.length < 2) continue;
        const sourceNode = allNodes[node.sourceIdx];
        if (!sourceNode) continue;

        let lineOpacity = Math.min(opacities[i], opacities[node.sourceIdx]);
        if (isScatteringNow) {
            lineOpacity *= 1 - scatterProgress;
        }

        if (lineOpacity <= 0) continue;

        const age = (renderTime - node.createdAt) * 1;
        const appearProgress = Math.min(1, age / APPEAR_DURATION);

        ctx.globalAlpha = lineOpacity;

        if (isScatteringNow) {
            const targetOffset = getScatterOffset(node, scatterProgress);
            const scatteredPath: Point[] = node.path.map((p) => ({
                x: p.x + targetOffset.x,
                y: p.y + targetOffset.y,
            }));

            drawGrowingPath(
                ctx,
                scatteredPath,
                scaleFactor,
                appearProgress,
                node.lineStyle,
                node.pathLengths,
                node.totalPathLength,
            );
        } else {
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
        ctx.globalAlpha = 1;
    }
};

// Отрисовка всех узлов
const renderNodes = (
    ctx: CanvasRenderingContext2D,
    allNodes: Node2D[],
    opacities: number[],
    scaleFactor: number,
    isScatteringNow: boolean,
    scatterProgress: number,
): void => {
    for (let i = 0; i < allNodes.length; i++) {
        const node = allNodes[i];
        let opacity = opacities[i];

        if (isScatteringNow) {
            opacity *= 1 - scatterProgress;
        }

        if (opacity <= 0) continue;

        if (isScatteringNow) {
            const offset = getScatterOffset(node, scatterProgress);

            const scatteredNode = {
                ...node,
                x: node.x + offset.x,
                y: node.y + offset.y,
                connectionPoint: {
                    x: node.connectionPoint.x + offset.x,
                    y: node.connectionPoint.y + offset.y,
                },
                bbox: {
                    x: node.bbox.x + offset.x,
                    y: node.bbox.y + offset.y,
                    w: node.bbox.w,
                    h: node.bbox.h,
                },
            };
            drawNode(ctx, scatteredNode, scaleFactor, opacity);
        } else {
            drawNode(ctx, node, scaleFactor, opacity);
        }
    }
};

export const useNetworkAnimation = (
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    isScattering = false,
    onScatterComplete?: () => void,
): void => {
    const animationRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const dprRef = useRef(1);
    const scaleFactorRef = useRef(1);
    const coreNodesRef = useRef<Node2D[]>([]);
    const nodesRef = useRef<Node2D[]>([]);
    const sizeRef = useRef({width: 0, height: 0});
    const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const availableLabelsRef = useRef<string[]>([...LABELS]);

    const isScatteringRef = useRef(isScattering);
    const scatterStartTimeRef = useRef<number | null>(null);
    const frozenTimeRef = useRef<number>(0);

    const isScatterCompletedRef = useRef(false);
    const onScatterCompleteRef = useRef(onScatterComplete);
    const animateRef = useRef<(time: number) => void>(() => {});

    useEffect(() => {
        onScatterCompleteRef.current = onScatterComplete;
    }, [onScatterComplete]);

    useEffect(() => {
        if (isScattering && !isScatteringRef.current) {
            scatterStartTimeRef.current = null;
            isScatterCompletedRef.current = false;
        } else if (!isScattering && isScatteringRef.current) {
            isScatterCompletedRef.current = false;
            scatterStartTimeRef.current = null;
            startTimeRef.current = performance.now();

            const cssWidth = sizeRef.current.width;
            const cssHeight = sizeRef.current.height;
            const scaleFactor = scaleFactorRef.current;

            const coreNodes = generateCoreNodes(cssWidth, cssHeight, scaleFactor);
            buildCoreRingRoutes(coreNodes, scaleFactor);
            coreNodesRef.current = coreNodes;

            availableLabelsRef.current = [...LABELS];
            nodesRef.current = generateNodes2D(
                cssWidth,
                cssHeight,
                scaleFactor,
                availableLabelsRef.current,
                coreNodes,
            );

            cancelAnimationFrame(animationRef.current);
            animationRef.current = requestAnimationFrame(animateRef.current);
        }
        isScatteringRef.current = isScattering;
    }, [isScattering]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas === null) return undefined;

        const ctx = canvas.getContext('2d', {alpha: true, desynchronized: true});
        if (ctx === null) return undefined;

        let isMounted = true;

        const resize = () => {
            if (resizeTimeoutRef.current !== null) {
                clearTimeout(resizeTimeoutRef.current);
            }

            resizeTimeoutRef.current = setTimeout(() => {
                if (isMounted === false) return;

                const rect = canvas.getBoundingClientRect();
                const cssWidth = rect.width;
                const cssHeight = rect.height;

                // Пропускаем «нулевые» размеры — если контейнер ещё не отдал габариты,
                // повторять попытку через 150 мс бессмысленно, но безопасно.
                if (cssWidth === 0 || cssHeight === 0) return;

                const dimensions = calculateCanvasDimensions(cssWidth, cssHeight);
                canvas.width = dimensions.width;
                canvas.height = dimensions.height;
                dprRef.current = dimensions.dpr;

                const scaleFactor = calculateScaleFactor(cssWidth);
                scaleFactorRef.current = scaleFactor;
                sizeRef.current = {width: cssWidth, height: cssHeight};

                const coreNodes = generateCoreNodes(cssWidth, cssHeight, scaleFactor);
                buildCoreRingRoutes(coreNodes, scaleFactor);
                coreNodesRef.current = coreNodes;

                availableLabelsRef.current = [...LABELS];
                nodesRef.current = generateNodes2D(
                    cssWidth,
                    cssHeight,
                    scaleFactor,
                    availableLabelsRef.current,
                    coreNodes,
                );
            }, 150);
        };

        const animate = (time: number) => {
            if (isMounted === false) return;
            if (isScatterCompletedRef.current) return;

            const {width, height} = sizeRef.current;
            const dpr = dprRef.current;
            const scaleFactor = scaleFactorRef.current;

            // Не рисуем и не спавним узлы, пока канвас не получил реальные размеры.
            // Иначе при нулевых width/height спавн попадает в (0,0) и на кадр
            // «мелькает» в левом верхнем углу.
            if (width === 0 || height === 0) {
                animationRef.current = requestAnimationFrame(animate);
                return;
            }

            prepareCanvas(ctx, width, height, dpr);

            const t = time - startTimeRef.current;
            const coreNodes = coreNodesRef.current;
            const dynamicNodes = nodesRef.current;
            const isScatteringNow = isScatteringRef.current;

            let scatterProgress = 0;

            if (isScatteringNow) {
                if (scatterStartTimeRef.current === null) {
                    scatterStartTimeRef.current = t;
                    frozenTimeRef.current = t;
                }

                const scatterElapsed = t - (scatterStartTimeRef.current || t);
                scatterProgress = Math.min(1, scatterElapsed / SCATTER_DURATION);

                if (scatterProgress >= 1 && !isScatterCompletedRef.current) {
                    isScatterCompletedRef.current = true;
                    if (onScatterCompleteRef.current) {
                        onScatterCompleteRef.current();
                    }
                    return;
                }
            } else {
                scatterStartTimeRef.current = null;

                // Сохраняем возвращённый массив обратно в ref, иначе новые узлы
                // теряются, а исчезнувшие не удаляются — анимация застывает.
                nodesRef.current = updateLifecycle(
                    coreNodes,
                    dynamicNodes,
                    availableLabelsRef.current,
                    scaleFactor,
                    width,
                    height,
                    t,
                );
            }

            const allNodes = [...coreNodesRef.current, ...nodesRef.current];
            const renderTime = isScatteringNow ? frozenTimeRef.current : t;

            const opacities: number[] = allNodes.map((node) => getNodeOpacity(node, renderTime, 1));

            ctx.font = `500 ${LABEL_FONT_SIZE * scaleFactor}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#000000';

            renderLines(
                ctx,
                allNodes,
                opacities,
                scaleFactor,
                renderTime,
                isScatteringNow,
                scatterProgress,
            );
            renderNodes(ctx, allNodes, opacities, scaleFactor, isScatteringNow, scatterProgress);

            animationRef.current = requestAnimationFrame(animate);
        };

        animateRef.current = animate;

        const init = async () => {
            await loadAllIcons();
            if (isMounted === false) return;

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
            if (resizeTimeoutRef.current !== null) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };
    }, [canvasRef]);
};
