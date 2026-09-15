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
    COLLAPSE_ACCELERATE_DURATION,
    COLLAPSE_ACCELERATE_SPEED,
    COLLAPSE_FADE_DURATION,
    COLLAPSE_FLY_DURATION,
    FADE_DURATION,
    LABEL_FONT_SIZE,
    MIN_AGE_FOR_FADE,
    RESPAWN_DELAY,
    TARGET_TOTAL_COUNT,
} from './constants';
import {LABELS, loadAllIcons} from './icons';

// ===== ОПАСИТИ / ЖИЗНЕННЫЙ ЦИКЛ =====

/**
 * Считает прозрачность узла с учётом фаз появления и исчезновения.
 *
 * @param node - Узел, для которого считается прозрачность.
 * @param currentTime - Текущее виртуальное время анимации (мс).
 * @param timeScale - Множитель скорости времени (1 — обычная скорость).
 * @returns Прозрачность узла в диапазоне [0..1].
 */
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

/**
 * Ищет самый старый узел, который уже достиг возраста MIN_AGE_FOR_FADE
 * и ещё не начал исчезать.
 *
 * @param nodes - Массив узлов для поиска.
 * @param currentTime - Текущее виртуальное время (мс).
 * @returns Старейший «созревший» узел или null, если такого нет.
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
 * Удаляет из массива полностью исчезнувшие узлы, возвращает освободившиеся
 * подписи в пул и перестраивает маршруты у узлов, чьи источники были удалены.
 *
 * @param coreNodes - Массив постоянных core-узлов.
 * @param dynamicNodes - Текущий массив динамических узлов.
 * @param scaleFactor - Коэффициент масштабирования.
 * @param currentTime - Текущее виртуальное время (мс).
 * @param availableLabels - Пул доступных подписей (мутируется: возвращает освободившиеся).
 * @returns Новый массив динамических узлов без удалённых.
 */
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
        if (node.sourceIdx >= 0 && node.sourceIdx >= coreCount) {
            const oldDynamicIdx = node.sourceIdx - coreCount;
            const mapped = dynamicIndexMap.get(oldDynamicIdx);
            node.sourceIdx = mapped === undefined ? -1 : coreCount + mapped;
        }
    }

    return filteredDynamic;
};

/**
 * Управляет жизненным циклом в обычном режиме: когда активных узлов
 * становится больше TARGET_TOTAL_COUNT, помечает старейший из них
 * на исчезновение.
 *
 * @param dynamicNodes - Текущий массив динамических узлов (мутируется).
 * @param currentTime - Текущее виртуальное время (мс).
 * @returns Ничего не возвращает; может установить fadeStart у одного узла.
 */
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

/**
 * Обновляет жизненный цикл узлов: удаляет исчезнувшие, добавляет новые.
 *
 * @param coreNodes - Массив постоянных core-узлов.
 * @param dynamicNodes - Текущий массив динамических узлов.
 * @param availableLabels - Пул доступных подписей (мутируется).
 * @param scaleFactor - Коэффициент масштабирования.
 * @param width - Ширина канваса в CSS-пикселях.
 * @param height - Высота канваса в CSS-пикселях.
 * @param t - Текущее виртуальное время анимации (мс).
 * @param unlimited - Если true, верхний лимит TARGET_TOTAL_COUNT снимается:
 *                    старые узлы не уходят по возрасту, новые спавнятся
 *                    с частотой RESPAWN_DELAY по виртуальному времени.
 *                    Используется в фазе ускорения при схлопывании.
 * @param lastSpawnTRef - Ref с виртуальным временем последнего спавна
 *                        в unlimited-режиме (чтобы не спавнить каждый кадр).
 * @returns Обновлённый массив динамических узлов.
 */
const updateLifecycle = (
    coreNodes: Node2D[],
    dynamicNodes: Node2D[],
    availableLabels: string[],
    scaleFactor: number,
    width: number,
    height: number,
    t: number,
    unlimited: boolean,
    lastSpawnTRef: React.MutableRefObject<number>,
): Node2D[] => {
    if (!unlimited) {
        handleNormalLifecycle(dynamicNodes, t);
    }

    const afterRemoval = removeFadedNodes(coreNodes, dynamicNodes, scaleFactor, t, availableLabels);

    if (unlimited) {
        // Лимит создания снят: спавним новый узел каждый раз, когда виртуальное
        // время продвинулось на RESPAWN_DELAY. Старые при этом не уходят —
        // сцена непрерывно наполняется новыми объектами и связями.
        if (t - lastSpawnTRef.current >= RESPAWN_DELAY) {
            const allNodesForSpawn = [...coreNodes, ...afterRemoval];

            // В unlimited-режиме основной пул подписей быстро исчерпывается
            // (за фазу ускорения спавнится ~30 узлов против 14 доступных
            // подписей). Без этого условия spawnNewNode начинает штамповать
            // пустые узлы без иконок и названий. Здесь мы подставляем копию
            // полного списка — spawnNewNode мутирует именно её, а не
            // availableLabels, и внешний пул не портится.
            const labels = availableLabels.length > 0 ? availableLabels : [...LABELS];

            const newNode = spawnNewNode(
                allNodesForSpawn,
                width,
                height,
                scaleFactor,
                t + RESPAWN_DELAY,
                labels,
            );
            afterRemoval.push(newNode);
            lastSpawnTRef.current = t;
        }
    } else {
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
    }

    return afterRemoval;
};

// ===== ФАЗЫ СХЛОПЫВАНИЯ =====

type CollapsePhase = 'idle' | 'accelerate' | 'fadeOut' | 'flyToCenter';

/**
 * Индивидуальный прогресс полёта иконки к центру.
 * globalProgress ∈ [0..1] — общий прогресс фазы.
 * Каждая иконка получает детерминированный показатель степени,
 * поэтому прилетает в разное время, но все достигают центра к концу фазы.
 *
 * @param node - Узел, для которого считается прогресс полёта.
 * @param index - Индекс узла в общем массиве (для детерминированного разброса).
 * @param globalProgress - Общий прогресс фазы полёта в диапазоне [0..1].
 * @returns Индивидуальный прогресс полёта узла в диапазоне [0..1].
 */
const getFlyProgress = (node: Node2D, index: number, globalProgress: number): number => {
    const seed = Math.abs(Math.floor(node.createdAt) * 13 + index * 7) % 100;
    const exponent = 0.6 + (seed / 100) * 1.2; // 0.6 .. 1.8
    return Math.min(1, Math.pow(globalProgress, exponent));
};

/**
 * Множитель прозрачности линий и точек соединения по фазе схлопывания.
 *
 * @param phase - Текущая фаза схлопывания.
 * @param progress - Прогресс текущей фазы в диапазоне [0..1].
 * @returns Множитель прозрачности в диапазоне [0..1].
 */
const computeLineFactor = (phase: CollapsePhase, progress: number): number => {
    if (phase === 'fadeOut') return 1 - progress;
    if (phase === 'flyToCenter') return 0;
    return 1;
};

/**
 * Рисует все соединительные линии между узлами.
 *
 * @param ctx - Контекст рисования канваса.
 * @param allNodes - Объединённый массив core + dynamic узлов.
 * @param opacities - Прозрачности узлов (соответствуют allNodes по индексу).
 * @param opacityTime - Виртуальное время, по которому считается фаза роста линии.
 * @param lineFactor - Множитель прозрачности линий для текущей фазы схлопывания.
 * @param scaleFactor - Коэффициент масштабирования.
 * @returns Ничего не возвращает; побочный эффект — рисунок на канвасе.
 */
const renderLines = (
    ctx: CanvasRenderingContext2D,
    allNodes: Node2D[],
    opacities: number[],
    opacityTime: number,
    lineFactor: number,
    scaleFactor: number,
): void => {
    if (lineFactor <= 0) return;

    for (let i = 0; i < allNodes.length; i++) {
        const node = allNodes[i];
        if (node.sourceIdx < 0 || node.path.length < 2) continue;
        const sourceNode = allNodes[node.sourceIdx];
        if (!sourceNode) continue;

        const lineOpacity = Math.min(opacities[i], opacities[node.sourceIdx]) * lineFactor;
        if (lineOpacity <= 0) continue;

        const age = opacityTime - node.createdAt;
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
 * Рисует узлы с учётом фазы схлопывания: затухание точек и полёт иконок к центру.
 *
 * @param ctx - Контекст рисования канваса.
 * @param allNodes - Объединённый массив core + dynamic узлов.
 * @param opacities - Прозрачности узлов (соответствуют allNodes по индексу).
 * @param phase - Текущая фаза схлопывания.
 * @param phaseProgress - Прогресс текущей фазы в диапазоне [0..1].
 * @param scaleFactor - Коэффициент масштабирования.
 * @param centerX - Координата X центра канваса (точка прилёта).
 * @param centerY - Координата Y центра канваса (точка прилёта).
 * @returns Ничего не возвращает; побочный эффект — рисунок на канвасе.
 */
const renderNodesWithPhase = (
    ctx: CanvasRenderingContext2D,
    allNodes: Node2D[],
    opacities: number[],
    phase: CollapsePhase,
    phaseProgress: number,
    scaleFactor: number,
    centerX: number,
    centerY: number,
): void => {
    const isFlyPhase = phase === 'flyToCenter';

    for (let i = 0; i < allNodes.length; i++) {
        const node = allNodes[i];
        const baseOpacity = opacities[i];

        let pointOpacity = baseOpacity;
        let iconOpacity = baseOpacity;

        let renderX = node.x;
        let renderY = node.y;
        let connX = node.connectionPoint.x;
        let connY = node.connectionPoint.y;

        if (phase === 'fadeOut') {
            pointOpacity = baseOpacity * (1 - phaseProgress);
        } else if (isFlyPhase) {
            pointOpacity = 0;
            const p = getFlyProgress(node, i, phaseProgress);

            renderX = node.x + (centerX - node.x) * p;
            renderY = node.y + (centerY - node.y) * p;
            connX = node.connectionPoint.x + (centerX - node.connectionPoint.x) * p;
            connY = node.connectionPoint.y + (centerY - node.connectionPoint.y) * p;

            // Иконки гаснут по мере приближения к центру
            iconOpacity = baseOpacity * (1 - p);
        }

        if (pointOpacity <= 0 && iconOpacity <= 0) continue;

        if (renderX !== node.x || renderY !== node.y) {
            const dx = renderX - node.x;
            const dy = renderY - node.y;
            const movedNode: Node2D = {
                ...node,
                x: renderX,
                y: renderY,
                connectionPoint: {x: connX, y: connY},
                bbox: {
                    x: node.bbox.x + dx,
                    y: node.bbox.y + dy,
                    w: node.bbox.w,
                    h: node.bbox.h,
                },
            };
            drawNode(ctx, movedNode, scaleFactor, iconOpacity, pointOpacity);
        } else {
            drawNode(ctx, node, scaleFactor, iconOpacity, pointOpacity);
        }
    }
};

// ===== ХУК =====

/**
 * Состояние одного кадра анимации.
 */
interface FrameState {
    /** Виртуальное время анимации (мс). */
    t: number;
    /** Время для расчёта прозрачностей (может отличаться от t в фазе fadeOut). */
    opacityTime: number;
    /** Текущая фаза схлопывания (idle — обычный режим). */
    collapsePhase: CollapsePhase;
    /** Прогресс текущей фазы схлопывания в диапазоне [0..1]. */
    phaseProgress: number;
    /** true, если анимация завершена и кадр нужно пропустить. */
    shouldStop: boolean;
}

/**
 * Хук анимации сети. Управляет жизненным циклом узлов, маршрутами,
 * отрисовкой и последовательностью схлопывания при клике на таб.
 *
 * @param canvasRef - Ref на HTML-элемент канваса.
 * @param isScattering - Запущена ли анимация схлопывания (ускорение → fade → полёт иконок).
 * @param onScatterComplete - Колбэк, вызываемый по завершении всех фаз схлопывания.
 * @returns Ничего не возвращает; работает через побочные эффекты (requestAnimationFrame).
 */
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

    // Опорные точки для последовательности схлопывания
    const collapseStartRealTimeRef = useRef<number | null>(null);
    const collapseStartTRef = useRef<number>(0);

    // Виртуальное время последнего спавна в unlimited-режиме
    const lastSpawnTRef = useRef<number>(Number.NEGATIVE_INFINITY);

    const isScatterCompletedRef = useRef(false);
    const onScatterCompleteRef = useRef(onScatterComplete);
    const animateRef = useRef<(time: number) => void>(() => {});

    useEffect(() => {
        onScatterCompleteRef.current = onScatterComplete;
    }, [onScatterComplete]);

    useEffect(() => {
        if (isScattering && !isScatteringRef.current) {
            // Вход в схлопывание.
            collapseStartRealTimeRef.current = null;
            isScatterCompletedRef.current = false;
            lastSpawnTRef.current = Number.NEGATIVE_INFINITY;

            // Оживляем все узлы, которые уже начали исчезать, — во время
            // схлопывания старые объекты и связи не должны пропадать.
            for (const node of nodesRef.current) {
                node.fadeStart = null;
            }
        } else if (!isScattering && isScatteringRef.current) {
            // Выход из схлопывания — перезапуск анимации.
            isScatterCompletedRef.current = false;
            collapseStartRealTimeRef.current = null;
            lastSpawnTRef.current = Number.NEGATIVE_INFINITY;
            startTimeRef.current = performance.now();

            const cssWidth = sizeRef.current.width;
            const cssHeight = sizeRef.current.height;
            const scaleFactor = scaleFactorRef.current;

            if (cssWidth > 0 && cssHeight > 0) {
                // Сбрасываем пул подписей и отдаём его core-узлам,
                // чтобы они выбрали себе 4 случайные подписи и изъяли их из пула.
                availableLabelsRef.current = [...LABELS];

                const coreNodes = generateCoreNodes(
                    cssWidth,
                    cssHeight,
                    scaleFactor,
                    availableLabelsRef.current,
                );
                buildCoreRingRoutes(coreNodes, scaleFactor);
                coreNodesRef.current = coreNodes;

                nodesRef.current = generateNodes2D(
                    cssWidth,
                    cssHeight,
                    scaleFactor,
                    availableLabelsRef.current,
                    coreNodes,
                );
            }

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

                if (cssWidth === 0 || cssHeight === 0) return;

                const dimensions = calculateCanvasDimensions(cssWidth, cssHeight);
                canvas.width = dimensions.width;
                canvas.height = dimensions.height;
                dprRef.current = dimensions.dpr;

                const scaleFactor = calculateScaleFactor(cssWidth);
                scaleFactorRef.current = scaleFactor;
                sizeRef.current = {width: cssWidth, height: cssHeight};

                // Сбрасываем пул подписей и отдаём его core-узлам,
                // чтобы они выбрали себе 4 случайные подписи и изъяли их из пула.
                availableLabelsRef.current = [...LABELS];

                const coreNodes = generateCoreNodes(
                    cssWidth,
                    cssHeight,
                    scaleFactor,
                    availableLabelsRef.current,
                );
                buildCoreRingRoutes(coreNodes, scaleFactor);
                coreNodesRef.current = coreNodes;

                nodesRef.current = generateNodes2D(
                    cssWidth,
                    cssHeight,
                    scaleFactor,
                    availableLabelsRef.current,
                    coreNodes,
                );
            }, 150);
        };

        /**
         * Вычисляет виртуальное время и фазу для текущего кадра анимации.
         *
         * @param time - Монотонное время из requestAnimationFrame.
         * @returns Объект FrameState с полями t, opacityTime, collapsePhase,
         *          phaseProgress и shouldStop.
         */
        const computeFrame = (time: number): FrameState => {
            const isCollapsingNow = isScatteringRef.current;

            if (!isCollapsingNow) {
                const t = time - startTimeRef.current;
                return {
                    t,
                    opacityTime: t,
                    collapsePhase: 'idle',
                    phaseProgress: 0,
                    shouldStop: false,
                };
            }

            if (collapseStartRealTimeRef.current === null) {
                collapseStartRealTimeRef.current = time;
                collapseStartTRef.current = time - startTimeRef.current;
                // Синхронизируем точку отсчёта спавнов с началом ускорения.
                lastSpawnTRef.current = collapseStartTRef.current;
            }

            const realElapsed = time - collapseStartRealTimeRef.current;
            const accelEnd = COLLAPSE_ACCELERATE_DURATION;
            const fadeEnd = accelEnd + COLLAPSE_FADE_DURATION;
            const flyEnd = fadeEnd + COLLAPSE_FLY_DURATION;
            const frozenT = collapseStartTRef.current + accelEnd * COLLAPSE_ACCELERATE_SPEED;

            if (realElapsed < accelEnd) {
                const t = collapseStartTRef.current + realElapsed * COLLAPSE_ACCELERATE_SPEED;
                return {
                    t,
                    opacityTime: t,
                    collapsePhase: 'accelerate',
                    phaseProgress: 0,
                    shouldStop: false,
                };
            }

            if (realElapsed < fadeEnd) {
                return {
                    t: frozenT,
                    opacityTime: frozenT,
                    collapsePhase: 'fadeOut',
                    phaseProgress: (realElapsed - accelEnd) / COLLAPSE_FADE_DURATION,
                    shouldStop: false,
                };
            }

            if (realElapsed < flyEnd) {
                return {
                    t: frozenT,
                    opacityTime: frozenT,
                    collapsePhase: 'flyToCenter',
                    phaseProgress: (realElapsed - fadeEnd) / COLLAPSE_FLY_DURATION,
                    shouldStop: false,
                };
            }

            isScatterCompletedRef.current = true;
            if (onScatterCompleteRef.current) {
                onScatterCompleteRef.current();
            }
            return {
                t: 0,
                opacityTime: 0,
                collapsePhase: 'idle',
                phaseProgress: 0,
                shouldStop: true,
            };
        };

        const animate = (time: number) => {
            if (isMounted === false) return;
            if (isScatterCompletedRef.current) return;

            const {width, height} = sizeRef.current;
            const dpr = dprRef.current;
            const scaleFactor = scaleFactorRef.current;

            if (width === 0 || height === 0) {
                animationRef.current = requestAnimationFrame(animate);
                return;
            }

            prepareCanvas(ctx, width, height, dpr);

            const frame = computeFrame(time);
            if (frame.shouldStop) return;

            const coreNodes = coreNodesRef.current;

            // В обычном режиме работаем с лимитом TARGET_TOTAL_COUNT.
            // В фазе accelerate лимит снят — узлы и связи продолжают появляться
            // без верхней границы, а старые не исчезают.
            // В фазах fadeOut и flyToCenter жизненный цикл замораживается.
            const unlimited = frame.collapsePhase === 'accelerate';
            if (frame.collapsePhase === 'idle' || unlimited) {
                nodesRef.current = updateLifecycle(
                    coreNodes,
                    nodesRef.current,
                    availableLabelsRef.current,
                    scaleFactor,
                    width,
                    height,
                    frame.t,
                    unlimited,
                    lastSpawnTRef,
                );
            }

            const allNodes = [...coreNodes, ...nodesRef.current];
            const opacities: number[] = allNodes.map((node) =>
                getNodeOpacity(node, frame.opacityTime, 1),
            );

            ctx.font = `500 ${LABEL_FONT_SIZE * scaleFactor}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#000000';

            const lineFactor = computeLineFactor(frame.collapsePhase, frame.phaseProgress);

            renderLines(ctx, allNodes, opacities, frame.opacityTime, lineFactor, scaleFactor);

            renderNodesWithPhase(
                ctx,
                allNodes,
                opacities,
                frame.collapsePhase,
                frame.phaseProgress,
                scaleFactor,
                width / 2,
                height / 2,
            );

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
