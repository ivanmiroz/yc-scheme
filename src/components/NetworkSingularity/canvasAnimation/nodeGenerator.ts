/* eslint-disable no-param-reassign -- 
   Намеренная мутация свойств объекта node (path, sourceIdx и т.д.) используется 
   для предотвращения создания новых объектов в каждом кадре анимации, 
   что критично для производительности и избежания срабатывания GC. 
*/

import {getIconKeyByLabel} from './icons';
import {
    BASE_ICON_SIZE,
    CANVAS_PADDING_PERCENT,
    CELL_RANDOM_OFFSET,
    CONNECTION_POINT_GAP,
    CONNECTION_POINT_RADIUS,
    CORE_ICON_KEYS,
    CORE_LABELS,
    CORE_NODE_COUNT,
    CORE_RADIUS_RATIO,
    EMPTY_NODE_COUNT,
    LABEL_FONT_SIZE,
    LABEL_GAP,
    NODE_AVOIDANCE_MARGIN,
    NODE_COUNT,
    NODE_SPACING,
    POSITION_SEARCH_ATTEMPTS,
    SNAKE_AMPLITUDE,
    SNAKE_COILS,
    SNAKE_LENGTH_RATIO,
    SNAKE_MIN_SEGMENT_LEN,
    SPAWN_DELAY_STEP,
} from './constants';
import {computeBBox, distanceBetween, distanceToCenter, intersects} from './utils';
import {BBox, LineStyle, Node2D, NodeWithDistance} from './types';
import {applySnakeToPath, routeOrthogonal} from './route';

const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const getRandomLineStyle = (): LineStyle => {
    const r = Math.random();
    if (r < 0.5) return 'solid';
    if (r < 0.75) return 'dashed';
    return 'snake';
};

/**
 * Строит маршрут ТОЛЬКО для одного узла (не трогает остальные).
 * Мутирует переданный объект node, добавляя свойства sourceIdx, path, pathLengths и totalPathLength.
 *
 * @param node - Узел, для которого строится маршрут.
 * @param allNodes - Массив всех узлов на сцене (core + dynamic).
 * @param scaleFactor - Коэффициент масштабирования.
 * @returns Ничего не возвращает (мутирует переданный объект node).
 */
export const buildRouteForNode = (node: Node2D, allNodes: Node2D[], scaleFactor: number): void => {
    const obstacles: BBox[] = allNodes
        .filter((n) => n !== node && !n.isEmpty && n.bbox.w > 0 && n.bbox.h > 0)
        .map((n) => n.bbox);

    const margin = NODE_AVOIDANCE_MARGIN * scaleFactor;
    const snakeAmplitude = SNAKE_AMPLITUDE * scaleFactor;
    const snakeMinLen = SNAKE_MIN_SEGMENT_LEN * scaleFactor;

    let closestIdx = -1;
    let minDist = Infinity;

    for (let j = 0; j < allNodes.length; j++) {
        const other = allNodes[j];
        if (other === node) continue;
        if (other.createdAt > node.createdAt) continue;

        const d = distanceBetween(
            node.connectionPoint.x,
            node.connectionPoint.y,
            other.connectionPoint.x,
            other.connectionPoint.y,
        );
        if (d < minDist) {
            minDist = d;
            closestIdx = j;
        }
    }

    node.sourceIdx = closestIdx;

    if (closestIdx < 0) {
        node.path = [];
        node.pathLengths = undefined;
        node.totalPathLength = undefined;
        return;
    }

    const sourceNode = allNodes[closestIdx];
    const basePath = routeOrthogonal(
        sourceNode.connectionPoint,
        node.connectionPoint,
        obstacles,
        margin,
    );

    if (node.lineStyle === 'snake') {
        node.path = applySnakeToPath(
            basePath,
            snakeAmplitude,
            SNAKE_COILS,
            snakeMinLen,
            SNAKE_LENGTH_RATIO,
        );
    } else {
        node.path = basePath;
    }

    const path = node.path;
    if (path.length >= 2) {
        const lengths: number[] = [0];
        let total = 0;
        for (let k = 1; k < path.length; k++) {
            total += Math.hypot(path[k].x - path[k - 1].x, path[k].y - path[k - 1].y);
            lengths.push(total);
        }
        node.pathLengths = lengths;
        node.totalPathLength = total;
    } else {
        node.pathLengths = undefined;
        node.totalPathLength = undefined;
    }
};

/**
 * Перестраивает маршруты для динамических узлов, учитывая core как потенциальные источники.
 *
 * @param dynamicNodes - Массив динамических узлов, для которых перестраиваются маршруты.
 * @param coreNodes - Массив core-узлов (используются как препятствия и кандидаты на источник).
 * @param scaleFactor - Коэффициент масштабирования.
 * @returns Ничего не возвращает (мутирует элементы переданного массива dynamicNodes).
 */
const rebuildRoutes = (dynamicNodes: Node2D[], coreNodes: Node2D[], scaleFactor: number): void => {
    const allNodes = [...coreNodes, ...dynamicNodes];
    for (const node of dynamicNodes) {
        buildRouteForNode(node, allNodes, scaleFactor);
    }
};

/**
 * Создаёт постоянные core-узлы «костяка», расположенные по кругу в центре канваса.
 * Эти узлы имеют createdAt = 0 и никогда не исчезают.
 *
 * @param width - Ширина канваса в CSS-пикселях.
 * @param height - Высота канваса в CSS-пикселях.
 * @param scaleFactor - Коэффициент масштабирования.
 * @returns Массив core-узлов, расположенных по кругу в центре канваса.
 */
export const generateCoreNodes = (width: number, height: number, scaleFactor: number): Node2D[] => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * CORE_RADIUS_RATIO;

    const nodes: Node2D[] = [];

    for (let i = 0; i < CORE_NODE_COUNT; i++) {
        // Начинаем с верхней точки (-PI/2) и распределяем равномерно
        const angle = (i / CORE_NODE_COUNT) * Math.PI * 2 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        const label = CORE_LABELS[i % CORE_LABELS.length];
        const iconKey =
            CORE_ICON_KEYS[i % CORE_ICON_KEYS.length] || getIconKeyByLabel(label) || 'server';
        const bbox = computeBBox(x, y, scaleFactor, label);

        const iconHalfH = (BASE_ICON_SIZE / 2) * scaleFactor;
        const textTopY = y + iconHalfH + LABEL_GAP * scaleFactor;
        const textBottomY = textTopY + LABEL_FONT_SIZE * scaleFactor;
        const connRadius = CONNECTION_POINT_RADIUS * scaleFactor;
        const connY = textBottomY + CONNECTION_POINT_GAP * scaleFactor + connRadius;

        nodes.push({
            x,
            y,
            label,
            iconKey,
            bbox,
            connectionPoint: {x, y: connY},
            isEmpty: false,
            lineStyle: 'solid',
            path: [],
            createdAt: 0,
            fadeStart: null,
            sourceIdx: -1,
            isCore: true,
        });
    }

    return nodes;
};

/**
 * Соединяет core-узлы кольцом: каждый с предыдущим по кругу.
 * Мутирует переданные узлы, устанавливая sourceIdx, path и длины.
 *
 * @param coreNodes - Массив core-узлов для соединения кольцом.
 * @param scaleFactor - Коэффициент масштабирования.
 * @returns Ничего не возвращает (мутирует элементы переданного массива coreNodes).
 */
export const buildCoreRingRoutes = (coreNodes: Node2D[], scaleFactor: number): void => {
    const n = coreNodes.length;
    if (n < 2) return;

    const margin = NODE_AVOIDANCE_MARGIN * scaleFactor;

    // Собираем bbox'ы core-узлов как препятствия для ортогональных маршрутов
    const obstacles: BBox[] = coreNodes
        .filter((node) => node.bbox.w > 0 && node.bbox.h > 0)
        .map((node) => node.bbox);

    for (let i = 0; i < n; i++) {
        const prevIdx = (i - 1 + n) % n;
        const source = coreNodes[prevIdx];
        const target = coreNodes[i];

        target.sourceIdx = prevIdx;

        // Строим ортогональный маршрут, избегая bbox'ов других core-узлов
        const otherObstacles = obstacles.filter((_, idx) => idx !== i && idx !== prevIdx);
        const basePath = routeOrthogonal(
            source.connectionPoint,
            target.connectionPoint,
            otherObstacles,
            margin,
        );

        target.path = basePath;

        if (basePath.length >= 2) {
            const lengths: number[] = [0];
            let total = 0;
            for (let k = 1; k < basePath.length; k++) {
                total += Math.hypot(
                    basePath[k].x - basePath[k - 1].x,
                    basePath[k].y - basePath[k - 1].y,
                );
                lengths.push(total);
            }
            target.pathLengths = lengths;
            target.totalPathLength = total;
        } else {
            target.pathLengths = undefined;
            target.totalPathLength = undefined;
        }
    }
};

/**
 * Находит случайную позицию для нового узла, не пересекающуюся с существующими.
 * Если не удалось найти свободную позицию за все попытки, возвращает позицию
 * с минимальным пересечением, а не случайную.
 *
 * @param nodes - Массив существующих узлов для проверки пересечений.
 * @param width - Ширина канваса в CSS-пикселях.
 * @param height - Высота канваса в CSS-пикселях.
 * @param scaleFactor - Коэффициент масштабирования.
 * @param label - Текст подписи узла (пустая строка для пустых узлов).
 * @param isEmpty - Флаг, является ли узел пустым (без иконки и текста).
 * @returns Объект с координатами {x, y} для нового узла.
 */
const findRandomPosition = (
    nodes: Node2D[],
    width: number,
    height: number,
    scaleFactor: number,
    label: string,
    isEmpty: boolean,
): {x: number; y: number} => {
    const paddingX = width * CANVAS_PADDING_PERCENT;
    const paddingY = height * CANVAS_PADDING_PERCENT;
    const usableW = width - paddingX * 2;
    const usableH = height - paddingY * 2;

    const spacing = NODE_SPACING * scaleFactor;

    let bestPosition: {x: number; y: number} | null = null;
    let minOverlap = Infinity;

    for (let attempt = 0; attempt < POSITION_SEARCH_ATTEMPTS; attempt++) {
        const x = paddingX + Math.random() * usableW;
        const y = paddingY + Math.random() * usableH;

        let testBBox: BBox;
        if (isEmpty) {
            const connRadius = CONNECTION_POINT_RADIUS * scaleFactor;
            testBBox = {
                x: x - connRadius - spacing,
                y: y - connRadius - spacing,
                w: (connRadius + spacing) * 2,
                h: (connRadius + spacing) * 2,
            };
        } else {
            const realBBox = computeBBox(x, y, scaleFactor, label);
            testBBox = {
                x: realBBox.x - spacing,
                y: realBBox.y - spacing,
                w: realBBox.w + spacing * 2,
                h: realBBox.h + spacing * 2,
            };
        }

        let hasIntersection = false;
        let currentOverlap = 0;

        for (const node of nodes) {
            const expandedNodeBBox = {
                x: node.bbox.x - spacing,
                y: node.bbox.y - spacing,
                w: node.bbox.w + spacing * 2,
                h: node.bbox.h + spacing * 2,
            };

            if (intersects(testBBox, expandedNodeBBox)) {
                hasIntersection = true;
                const overlapX = Math.max(
                    0,
                    Math.min(testBBox.x + testBBox.w, expandedNodeBBox.x + expandedNodeBBox.w) -
                        Math.max(testBBox.x, expandedNodeBBox.x),
                );
                const overlapY = Math.max(
                    0,
                    Math.min(testBBox.y + testBBox.h, expandedNodeBBox.y + expandedNodeBBox.h) -
                        Math.max(testBBox.y, expandedNodeBBox.y),
                );
                currentOverlap += overlapX * overlapY;
            }
        }

        if (!hasIntersection) {
            return {x, y};
        }

        if (currentOverlap < minOverlap) {
            minOverlap = currentOverlap;
            bestPosition = {x, y};
        }
    }

    if (bestPosition !== null) {
        return bestPosition;
    }

    return {
        x: paddingX + usableW / 2,
        y: paddingY + usableH / 2,
    };
};

/**
 * Создаёт один новый динамический узел и сразу строит его маршрут.
 *
 * @param allNodes - Все узлы на сцене (core + dynamic) — используются для поиска позиции и маршрута.
 * @param width - Ширина канваса в CSS-пикселях.
 * @param height - Высота канваса в CSS-пикселях.
 * @param scaleFactor - Коэффициент масштабирования.
 * @param currentTime - Текущее время анимации (мс), используется для установки createdAt.
 * @param availableLabels - Массив доступных подписей (мутируется: использованная подпись удаляется).
 * @returns Новый созданный и инициализированный узел Node2D.
 */
export const spawnNewNode = (
    allNodes: Node2D[],
    width: number,
    height: number,
    scaleFactor: number,
    currentTime: number,
    availableLabels: string[],
): Node2D => {
    const shouldBeEmpty = Math.random() < EMPTY_NODE_COUNT / (NODE_COUNT + EMPTY_NODE_COUNT);
    const lineStyle = getRandomLineStyle();

    let newNode: Node2D;

    if (shouldBeEmpty || availableLabels.length === 0) {
        const {x, y} = findRandomPosition(allNodes, width, height, scaleFactor, '', true);
        const connRadius = CONNECTION_POINT_RADIUS * scaleFactor;

        newNode = {
            x,
            y,
            label: '',
            iconKey: '',
            bbox: {
                x: x - connRadius,
                y: y - connRadius,
                w: connRadius * 2,
                h: connRadius * 2,
            },
            connectionPoint: {x, y},
            isEmpty: true,
            lineStyle,
            path: [],
            createdAt: currentTime,
            fadeStart: null,
            sourceIdx: -1,
            isCore: false,
        };
    } else {
        const labelIdx = Math.floor(Math.random() * availableLabels.length);
        const label = availableLabels[labelIdx];
        availableLabels.splice(labelIdx, 1);

        const iconKey = getIconKeyByLabel(label) || 'server';
        const {x, y} = findRandomPosition(allNodes, width, height, scaleFactor, label, false);
        const bbox = computeBBox(x, y, scaleFactor, label);

        const iconHalfH = (BASE_ICON_SIZE / 2) * scaleFactor;
        const textTopY = y + iconHalfH + LABEL_GAP * scaleFactor;
        const textBottomY = textTopY + LABEL_FONT_SIZE * scaleFactor;
        const connRadius = CONNECTION_POINT_RADIUS * scaleFactor;
        const connY = textBottomY + CONNECTION_POINT_GAP * scaleFactor + connRadius;

        newNode = {
            x,
            y,
            label,
            iconKey,
            bbox,
            connectionPoint: {x, y: connY},
            isEmpty: false,
            lineStyle,
            path: [],
            createdAt: currentTime,
            fadeStart: null,
            sourceIdx: -1,
            isCore: false,
        };
    }

    buildRouteForNode(newNode, allNodes, scaleFactor);

    return newNode;
};

/**
 * Сортирует узлы по расстоянию до центра и назначает им время появления (createdAt).
 *
 * @param nodes - Массив узлов для сортировки.
 * @param width - Ширина канваса в CSS-пикселях.
 * @param height - Высота канваса в CSS-пикселях.
 * @returns Новый отсортированный массив узлов с назначенными временами появления.
 */
const sortNodesByDistanceAndAssignTimes = (
    nodes: Node2D[],
    width: number,
    height: number,
): Node2D[] => {
    const centerX = width / 2;
    const centerY = height / 2;

    const nodesWithDistance: NodeWithDistance[] = nodes.map((node) => ({
        node,
        distance: distanceToCenter(node.x, node.y, centerX, centerY),
    }));

    nodesWithDistance.sort((a, b) => a.distance - b.distance);

    return nodesWithDistance.map((item, index) => ({
        ...item.node,
        createdAt: index * SPAWN_DELAY_STEP,
        fadeStart: null,
        sourceIdx: -1,
    }));
};

/**
 * Генерирует начальные динамические узлы, учитывая core как препятствия при позиционировании.
 *
 * @param width - Ширина канваса в CSS-пикселях.
 * @param height - Высота канваса в CSS-пикселях.
 * @param scaleFactor - Коэффициент масштабирования.
 * @param availableLabels - Массив доступных подписей (мутируется: использованные подписи удаляются).
 * @param coreNodes - Core-узлы, которые уже есть на сцене (используются как препятствия и источники).
 * @returns Массив сгенерированных динамических узлов Node2D.
 */
export const generateNodes2D = (
    width: number,
    height: number,
    scaleFactor: number,
    availableLabels: string[],
    coreNodes: Node2D[] = [],
): Node2D[] => {
    const paddingX = width * CANVAS_PADDING_PERCENT;
    const paddingY = height * CANVAS_PADDING_PERCENT;
    const usableW = width - paddingX * 2;
    const usableH = height - paddingY * 2;

    const totalNodes = NODE_COUNT + EMPTY_NODE_COUNT;
    const aspectRatio = usableW / usableH;
    const cols = Math.ceil(Math.sqrt(totalNodes * aspectRatio));
    const rows = Math.ceil(totalNodes / cols);

    const cellW = usableW / cols;
    const cellH = usableH / rows;

    const allPositions: {col: number; row: number}[] = [];
    for (let i = 0; i < totalNodes; i++) {
        allPositions.push({
            col: i % cols,
            row: Math.floor(i / cols),
        });
    }

    const shuffledPositions = shuffleArray(allPositions);
    const nodeTypes: ('icon' | 'empty')[] = [
        ...Array(NODE_COUNT).fill('icon'),
        ...Array(EMPTY_NODE_COUNT).fill('empty'),
    ];
    const shuffledTypes = shuffleArray(nodeTypes);
    const shuffledLabels = [...availableLabels].sort(() => 0.5 - Math.random());
    const selectedLabels = shuffledLabels.slice(0, NODE_COUNT);

    for (const label of selectedLabels) {
        const idx = availableLabels.indexOf(label);
        if (idx !== -1) availableLabels.splice(idx, 1);
    }

    let iconIndex = 0;
    // Начинаем с core-узлов — они будут учитываться при проверке пересечений
    const allNodesForCollision: Node2D[] = [...coreNodes];
    const dynamicNodes: Node2D[] = [];

    for (let i = 0; i < totalNodes; i++) {
        const position = shuffledPositions[i];
        const nodeType = shuffledTypes[i];
        const {col, row} = position;

        const cellCenterX = paddingX + cellW * (col + 0.5);
        const cellCenterY = paddingY + cellH * (row + 0.5);

        const offsetX = (Math.random() - 0.5) * cellW * CELL_RANDOM_OFFSET;
        const offsetY = (Math.random() - 0.5) * cellH * CELL_RANDOM_OFFSET;

        const x = cellCenterX + offsetX;
        const y = cellCenterY + offsetY;
        const lineStyle = getRandomLineStyle();

        if (nodeType === 'icon') {
            const label = selectedLabels[iconIndex++];
            const iconKey = getIconKeyByLabel(label) || 'server';
            const bbox = computeBBox(x, y, scaleFactor, label);

            const iconHalfH = (BASE_ICON_SIZE / 2) * scaleFactor;
            const textTopY = y + iconHalfH + LABEL_GAP * scaleFactor;
            const textBottomY = textTopY + LABEL_FONT_SIZE * scaleFactor;
            const connRadius = CONNECTION_POINT_RADIUS * scaleFactor;
            const connY = textBottomY + CONNECTION_POINT_GAP * scaleFactor + connRadius;

            const node: Node2D = {
                x,
                y,
                label,
                iconKey,
                bbox,
                connectionPoint: {x, y: connY},
                isEmpty: false,
                lineStyle,
                path: [],
                createdAt: 0,
                fadeStart: null,
                sourceIdx: -1,
                isCore: false,
            };
            allNodesForCollision.push(node);
            dynamicNodes.push(node);
        } else {
            const connRadius = CONNECTION_POINT_RADIUS * scaleFactor;
            const node: Node2D = {
                x,
                y,
                label: '',
                iconKey: '',
                bbox: {
                    x: x - connRadius,
                    y: y - connRadius,
                    w: connRadius * 2,
                    h: connRadius * 2,
                },
                connectionPoint: {x, y},
                isEmpty: true,
                lineStyle,
                path: [],
                createdAt: 0,
                fadeStart: null,
                sourceIdx: -1,
                isCore: false,
            };
            allNodesForCollision.push(node);
            dynamicNodes.push(node);
        }
    }

    const sorted = sortNodesByDistanceAndAssignTimes(dynamicNodes, width, height);
    rebuildRoutes(sorted, coreNodes, scaleFactor);

    return sorted;
};
