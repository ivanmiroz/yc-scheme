/* eslint-disable no-param-reassign --
   Намеренная мутация свойств ref-объектов (lastSpawnTimeRef.current) и
   CanvasRenderingContext2D (ctx.globalAlpha, ctx.font и т.д.) — это
   идиоматичный подход для Canvas-анимаций, так как создание новых объектов
   в каждом кадре вызывало бы лишнюю нагрузку на GC и микро-фризы.
*/

import {useEffect, useRef} from 'react';

import {buildRouteForNode, generateNodes2D, spawnNewNode} from './nodeGenerator';
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

/**
 * Вычисляет opacity узла с учётом появления и исчезновения.
 *
 * @param node - Узел, для которого вычисляется прозрачность.
 * @param currentTime - Текущее время анимации (мс).
 * @param timeScale - Множитель скорости (1 = обычная, FROZEN_TIME_SCALE = ускоренная).
 * @returns Прозрачность узла от 0 до 1.
 */
const getNodeOpacity = (node: Node2D, currentTime: number, timeScale: number): number => {
    if (currentTime < node.createdAt) return 0;

    const age = (currentTime - node.createdAt) * timeScale;

    const appearProgress = Math.min(1, age / APPEAR_DURATION);
    const appearOpacity = 1 - Math.pow(1 - appearProgress, 3);

    if (node.fadeStart !== null) {
        const fadeElapsed = (currentTime - node.fadeStart) * timeScale;
        const fadeProgress = Math.min(1, fadeElapsed / FADE_DURATION);
        const fadeOpacity = 1 - fadeProgress;
        return Math.min(appearOpacity, fadeOpacity);
    }

    return appearOpacity;
};

/**
 * Находит самый старый "зрелый" узел, который можно начать скрывать.
 *
 * @param nodes - Массив всех узлов на сцене.
 * @param currentTime - Текущее время анимации (мс).
 * @returns Самый старый зрелый узел или null, если такого нет.
 */
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

/**
 * Обрабатывает спавн узлов в замороженном режиме.
 *
 * @param nodes - Массив текущих узлов (мутируется: добавляются новые узлы).
 * @param width - Ширина канваса в CSS-пикселях.
 * @param height - Высота канваса в CSS-пикселях.
 * @param scaleFactor - Коэффициент масштабирования.
 * @param currentTime - Текущее время анимации (мс).
 * @param availableLabels - Массив доступных подписей.
 * @param lastSpawnTimeRef - Ref с временем последнего спавна.
 * @param frozenSpawnIntervalRef - Ref с вычисленным интервалом спавна.
 * @returns Ничего не возвращает.
 */
const handleFrozenSpawning = (
    nodes: Node2D[],
    width: number,
    height: number,
    scaleFactor: number,
    currentTime: number,
    availableLabels: string[],
    lastSpawnTimeRef: React.MutableRefObject<number>,
    frozenSpawnIntervalRef: React.MutableRefObject<number>,
): void => {
    const spawnInterval = frozenSpawnIntervalRef.current;

    if (
        isFinite(spawnInterval) &&
        currentTime - lastSpawnTimeRef.current > spawnInterval &&
        nodes.length < MAX_FROZEN_COUNT
    ) {
        const newNode = spawnNewNode(
            nodes,
            width,
            height,
            scaleFactor,
            currentTime,
            availableLabels,
        );
        nodes.push(newNode);
        lastSpawnTimeRef.current = currentTime;
    }
};

/**
 * Обрабатывает удаление исчезнувших узлов и переподключение оставшихся.
 *
 * @param nodes - Массив текущих узлов.
 * @param scaleFactor - Коэффициент масштабирования.
 * @param currentTime - Текущее время анимации (мс).
 * @param availableLabels - Массив доступных подписей (мутируется).
 * @returns Новый массив узлов после удаления исчезнувших.
 */
const removeFadedNodes = (
    nodes: Node2D[],
    scaleFactor: number,
    currentTime: number,
    availableLabels: string[],
): Node2D[] => {
    const nodesToRemove: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
        const opacity = getNodeOpacity(nodes[i], currentTime, 1);
        if (opacity === 0 && nodes[i].fadeStart !== null) {
            nodesToRemove.push(i);
        }
    }

    if (nodesToRemove.length === 0) return nodes;

    const removedSet = new Set(nodesToRemove);

    // Возвращаем labels удалённых узлов в пул
    for (const idx of nodesToRemove) {
        const node = nodes[idx];
        if (node.isEmpty === false && node.label) {
            availableLabels.push(node.label);
        }
    }

    // Переподключаем узлы, которые ссылались на удаляемые
    for (let i = 0; i < nodes.length; i++) {
        if (removedSet.has(i)) continue;
        const node = nodes[i];
        if (node.sourceIdx >= 0 && removedSet.has(node.sourceIdx)) {
            buildRouteForNode(node, nodes, scaleFactor);
        }
    }

    // Строим карту старых индексов -> новых
    const indexMap = new Map<number, number>();
    let newIdx = 0;
    for (let oldIdx = 0; oldIdx < nodes.length; oldIdx++) {
        if (removedSet.has(oldIdx) === false) {
            indexMap.set(oldIdx, newIdx);
            newIdx++;
        }
    }

    const filteredNodes = nodes.filter((_, i) => removedSet.has(i) === false);

    // Обновляем sourceIdx у оставшихся узлов
    for (const node of filteredNodes) {
        if (node.sourceIdx >= 0) {
            const mapped = indexMap.get(node.sourceIdx);
            node.sourceIdx = mapped === undefined ? -1 : mapped;
        }
    }

    return filteredNodes;
};

/**
 * Обрабатывает обычный жизненный цикл: запускает fade у старых узлов.
 *
 * @param nodes - Массив текущих узлов.
 * @param currentTime - Текущее время анимации (мс).
 * @returns Ничего не возвращает.
 */
const handleNormalLifecycle = (nodes: Node2D[], currentTime: number): void => {
    let aliveCount = 0;
    for (const node of nodes) {
        if (node.fadeStart === null && currentTime >= node.createdAt) {
            aliveCount++;
        }
    }

    if (aliveCount >= TARGET_TOTAL_COUNT) {
        const oldest = findOldestMatureNode(nodes, currentTime);
        if (oldest !== null) {
            oldest.fadeStart = currentTime;
        }
    }
};

/**
 * Отрисовывает все линии соединений на канвасе.
 *
 * @param ctx - 2D-контекст канваса.
 * @param nodes - Массив узлов для отрисовки.
 * @param opacities - Массив прозрачностей узлов.
 * @param scaleFactor - Коэффициент масштабирования.
 * @param currentTime - Текущее время анимации (мс).
 * @param timeScale - Множитель скорости анимации.
 * @returns Ничего не возвращает.
 */
const drawLines = (
    ctx: CanvasRenderingContext2D,
    nodes: Node2D[],
    opacities: number[],
    scaleFactor: number,
    currentTime: number,
    timeScale: number,
): void => {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.sourceIdx < 0 || node.path.length < 2) continue;

        const sourceNode = nodes[node.sourceIdx];
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

/**
 * Отрисовывает все узлы на канвасе.
 *
 * @param ctx - 2D-контекст канваса.
 * @param nodes - Массив узлов для отрисовки.
 * @param opacities - Массив прозрачностей узлов.
 * @param scaleFactor - Коэффициент масштабирования.
 * @returns Ничего не возвращает.
 */
const drawNodes = (
    ctx: CanvasRenderingContext2D,
    nodes: Node2D[],
    opacities: number[],
    scaleFactor: number,
): void => {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const opacity = opacities[i];
        if (opacity === 0) continue;

        drawNode(ctx, node, scaleFactor, opacity);
    }
};

/**
 * Хук для управления анимацией сети узлов на Canvas.
 *
 * @param canvasRef - Ref на HTMLCanvasElement.
 * @param isFrozen - Флаг замороженного режима (по умолчанию false).
 * @returns Ничего не возвращает.
 */
export const useNetworkAnimation = (
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    isFrozen = false,
): void => {
    const animationRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const dprRef = useRef(1);
    const scaleFactorRef = useRef(1);
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

                scaleFactorRef.current = calculateScaleFactor(cssWidth);
                sizeRef.current = {width: cssWidth, height: cssHeight};

                availableLabelsRef.current = [...LABELS];
                nodesRef.current = generateNodes2D(
                    cssWidth,
                    cssHeight,
                    scaleFactorRef.current,
                    availableLabelsRef.current,
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
            const nodes = nodesRef.current;
            const frozen = isFrozenRef.current;
            const timeScale = frozen ? FROZEN_TIME_SCALE : 1;

            // Детектим вход в frozen режим и вычисляем адаптивный интервал спавна
            if (frozen && prevFrozenRef.current === false) {
                const nodesToAdd = MAX_FROZEN_COUNT - nodes.length;
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
                    nodes,
                    width,
                    height,
                    scaleFactor,
                    t,
                    availableLabelsRef.current,
                    lastSpawnTimeRef,
                    frozenSpawnIntervalRef,
                );
            } else {
                handleNormalLifecycle(nodes, t);
                nodesRef.current = removeFadedNodes(
                    nodes,
                    scaleFactor,
                    t,
                    availableLabelsRef.current,
                );

                // Добавляем новые узлы на место удалённых
                const currentCount = nodesRef.current.length;
                const countToAdd = TARGET_TOTAL_COUNT - currentCount;
                if (countToAdd > 0) {
                    for (let i = 0; i < countToAdd; i++) {
                        const newNode = spawnNewNode(
                            nodesRef.current,
                            width,
                            height,
                            scaleFactor,
                            t + RESPAWN_DELAY,
                            availableLabelsRef.current,
                        );
                        nodesRef.current.push(newNode);
                    }
                }
            }

            const currentNodes = nodesRef.current;
            const opacities: number[] = [];
            for (const node of currentNodes) {
                opacities.push(getNodeOpacity(node, t, timeScale));
            }

            ctx.font = `500 ${LABEL_FONT_SIZE * scaleFactor}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#000000';

            drawLines(ctx, currentNodes, opacities, scaleFactor, t, timeScale);
            drawNodes(ctx, currentNodes, opacities, scaleFactor);

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
