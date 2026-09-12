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
import {Node2D} from './types';
import {
    APPEAR_DURATION,
    FADE_DURATION,
    FROZEN_FILL_DURATION,
    FROZEN_TIME_SCALE,
    LABEL_FONT_SIZE,
    MAX_FROZEN_COUNT,
    MIN_AGE_FOR_FADE,
    RESPAWN_DELAY,
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

const handleFrozenSpawning = (
    coreNodes: Node2D[],
    dynamicNodes: Node2D[],
    width: number,
    height: number,
    scaleFactor: number,
    currentTime: number,
    availableLabels: string[],
    lastSpawnTimeRef: React.MutableRefObject<number>,
    frozenSpawnIntervalRef: React.MutableRefObject<number>,
): void => {
    const spawnInterval = frozenSpawnIntervalRef.current;
    const totalCount = coreNodes.length + dynamicNodes.length;

    if (
        isFinite(spawnInterval) &&
        currentTime - lastSpawnTimeRef.current > spawnInterval &&
        totalCount < MAX_FROZEN_COUNT
    ) {
        const allNodes = [...coreNodes, ...dynamicNodes];
        const newNode = spawnNewNode(
            allNodes,
            width,
            height,
            scaleFactor,
            currentTime,
            availableLabels,
        );
        dynamicNodes.push(newNode);
        lastSpawnTimeRef.current = currentTime;
    }
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

/**
 * Находит динамические узлы, оставшиеся без связей, и запускает их исчезновение.
 * Узел считается изолированным, если:
 *   - у него нет sourceIdx (он ни к кому не подключён), И
 *   - ни один другой узел не подключён к нему.
 * Core-узлы не проверяются — они всегда соединены кольцом.
 *
 * @param coreNodes - Массив core-узлов (используются для вычисления глобальных индексов).
 * @param dynamicNodes - Массив динамических узлов для проверки изоляции.
 * @param currentTime - Текущее время анимации (мс), используется для установки fadeStart.
 * @returns Ничего не возвращает (мутирует элементы переданного массива dynamicNodes).
 */
const fadeDisconnectedNodes = (
    coreNodes: Node2D[],
    dynamicNodes: Node2D[],
    currentTime: number,
): void => {
    const coreCount = coreNodes.length;

    // Множество индексов узлов, к которым кто-то подключён (в общей нумерации)
    const connectedTargets = new Set<number>();
    for (const node of dynamicNodes) {
        if (node.sourceIdx >= 0) {
            connectedTargets.add(node.sourceIdx);
        }
    }

    for (let i = 0; i < dynamicNodes.length; i++) {
        const node = dynamicNodes[i];
        if (node.fadeStart !== null) continue; // уже исчезает

        const globalIdx = coreCount + i;

        const hasOutgoing = node.sourceIdx >= 0;
        const hasIncoming = connectedTargets.has(globalIdx);

        if (!hasOutgoing && !hasIncoming) {
            // Узел полностью изолирован — запускаем fade
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

const drawLines = (
    ctx: CanvasRenderingContext2D,
    allNodes: Node2D[],
    opacities: number[],
    scaleFactor: number,
    currentTime: number,
    timeScale: number,
): void => {
    for (let i = 0; i < allNodes.length; i++) {
        const node = allNodes[i];
        if (node.sourceIdx < 0 || node.path.length < 2) continue;

        const sourceNode = allNodes[node.sourceIdx];
        if (sourceNode === null || sourceNode === undefined) continue;

        const targetOpacity = opacities[i];
        const sourceOpacity = opacities[node.sourceIdx];
        const lineOpacity = Math.min(sourceOpacity, targetOpacity);

        if (lineOpacity <= 0) continue;

        const age = (currentTime - node.createdAt) * timeScale;
        const appearProgress = Math.min(1, age / APPEAR_DURATION);

        ctx.globalAlpha = lineOpacity;
        drawGrowingPath(
            ctx,
            node.path,
            scaleFactor,
            appearProgress,
            node.lineStyle,
            node.pathLengths,
            node.totalPathLength,
        );
        ctx.globalAlpha = 1;
    }
};

const drawNodes = (
    ctx: CanvasRenderingContext2D,
    allNodes: Node2D[],
    opacities: number[],
    scaleFactor: number,
): void => {
    for (let i = 0; i < allNodes.length; i++) {
        const node = allNodes[i];
        const opacity = opacities[i];
        if (opacity === 0) continue;

        drawNode(ctx, node, scaleFactor, opacity);
    }
};

export const useNetworkAnimation = (
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    isFrozen = false,
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
    const lastSpawnTimeRef = useRef<number>(0);

    const frozenSpawnIntervalRef = useRef<number>(RESPAWN_DELAY / 2);

    const isFrozenRef = useRef(isFrozen);
    const prevFrozenRef = useRef(isFrozen);

    useEffect(() => {
        isFrozenRef.current = isFrozen;
    }, [isFrozen]);

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

            const {width, height} = sizeRef.current;
            const dpr = dprRef.current;
            const scaleFactor = scaleFactorRef.current;

            prepareCanvas(ctx, width, height, dpr);

            const t = time - startTimeRef.current;
            const coreNodes = coreNodesRef.current;
            const dynamicNodes = nodesRef.current;
            const frozen = isFrozenRef.current;
            const timeScale = frozen ? FROZEN_TIME_SCALE : 1;

            if (frozen && prevFrozenRef.current === false) {
                const nodesToAdd = MAX_FROZEN_COUNT - (coreNodes.length + dynamicNodes.length);
                if (nodesToAdd > 0) {
                    frozenSpawnIntervalRef.current = FROZEN_FILL_DURATION / nodesToAdd;
                } else {
                    frozenSpawnIntervalRef.current = Infinity;
                }
                lastSpawnTimeRef.current = t;
            }
            prevFrozenRef.current = frozen;

            if (frozen) {
                handleFrozenSpawning(
                    coreNodes,
                    dynamicNodes,
                    width,
                    height,
                    scaleFactor,
                    t,
                    availableLabelsRef.current,
                    lastSpawnTimeRef,
                    frozenSpawnIntervalRef,
                );
            } else {
                handleNormalLifecycle(dynamicNodes, t);

                nodesRef.current = removeFadedNodes(
                    coreNodes,
                    dynamicNodes,
                    scaleFactor,
                    t,
                    availableLabelsRef.current,
                );

                // Спавн новых динамических узлов на основе активных
                const currentDynamic = nodesRef.current;
                const activeCount = currentDynamic.filter((n) => n.fadeStart === null).length;
                const countToAdd = TARGET_TOTAL_COUNT - activeCount;

                if (countToAdd > 0) {
                    for (let i = 0; i < countToAdd; i++) {
                        const allNodesForSpawn = [...coreNodes, ...currentDynamic];
                        const newNode = spawnNewNode(
                            allNodesForSpawn,
                            width,
                            height,
                            scaleFactor,
                            t + RESPAWN_DELAY,
                            availableLabelsRef.current,
                        );
                        currentDynamic.push(newNode);
                    }
                }

                // Удаляем узлы, оставшиеся без связей
                fadeDisconnectedNodes(coreNodes, nodesRef.current, t);
            }

            const allNodes = [...coreNodesRef.current, ...nodesRef.current];
            const opacities: number[] = [];
            for (const node of allNodes) {
                opacities.push(getNodeOpacity(node, t, timeScale));
            }

            ctx.font = `500 ${LABEL_FONT_SIZE * scaleFactor}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#000000';

            drawLines(ctx, allNodes, opacities, scaleFactor, t, timeScale);
            drawNodes(ctx, allNodes, opacities, scaleFactor);

            animationRef.current = requestAnimationFrame(animate);
        };

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
