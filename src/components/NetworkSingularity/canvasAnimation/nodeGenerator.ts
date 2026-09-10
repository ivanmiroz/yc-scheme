import {LABELS, getIconKeyByLabel} from '../../InfrastructureChoose/canvasAnimation/icons';
import {
    BASE_ICON_SIZE,
    CANVAS_PADDING_PERCENT,
    CELL_RANDOM_OFFSET,
    CONNECTION_POINT_GAP,
    CONNECTION_POINT_RADIUS,
    EMPTY_NODE_COUNT,
    LABEL_FONT_SIZE,
    LABEL_GAP,
    NODE_AVOIDANCE_MARGIN,
    NODE_COUNT,
    SNAKE_AMPLITUDE,
    SNAKE_COILS,
    SNAKE_LENGTH_RATIO,
    SNAKE_MIN_SEGMENT_LEN,
    SPAWN_DELAY_STEP,
} from './constants';
import {computeBBox, distanceBetween, distanceToCenter} from './utils';
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

/**
 * Случайно выбирает стиль линии:
 *   ~50% solid, ~25% dashed, ~25% snake
 *
 * @returns Стиль линии для нового соединения.
 */
const getRandomLineStyle = (): LineStyle => {
    const r = Math.random();
    if (r < 0.5) return 'solid';
    if (r < 0.75) return 'dashed';
    return 'snake';
};

const sortNodesByDistanceAndAssignDelays = (
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
        spawnDelay: index * SPAWN_DELAY_STEP,
    }));
};

const buildRoutes = (nodes: Node2D[], scaleFactor: number): void => {
    const obstacles: BBox[] = nodes
        .filter((n) => !n.isEmpty && n.bbox.w > 0 && n.bbox.h > 0)
        .map((n) => n.bbox);

    const margin = NODE_AVOIDANCE_MARGIN * scaleFactor;
    const snakeAmplitude = SNAKE_AMPLITUDE * scaleFactor;
    const snakeMinLen = SNAKE_MIN_SEGMENT_LEN * scaleFactor;

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        let closestIdx = -1;
        let minDist = Infinity;
        for (let j = 0; j < i; j++) {
            const d = distanceBetween(
                node.connectionPoint.x,
                node.connectionPoint.y,
                nodes[j].connectionPoint.x,
                nodes[j].connectionPoint.y,
            );
            if (d < minDist) {
                minDist = d;
                closestIdx = j;
            }
        }

        if (closestIdx < 0) {
            node.path = [];
            continue;
        }

        // 1. Базовый ортогональный маршрут в обход иконок и текста
        const basePath = routeOrthogonal(
            nodes[closestIdx].connectionPoint,
            node.connectionPoint,
            obstacles,
            margin,
        );

        // 2. Если стиль 'snake' — центральную часть самого длинного сегмента
        //    заменяем на змейку. По краям сегмента остаются прямые участки.
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
    }
};

export const generateNodes2D = (width: number, height: number, scaleFactor: number): Node2D[] => {
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

    const shuffledLabels = [...LABELS].sort(() => 0.5 - Math.random());
    const selectedLabels = shuffledLabels.slice(0, NODE_COUNT);
    let iconIndex = 0;

    const nodes: Node2D[] = [];

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
            const iconKey = getIconKeyByLabel(label) || 'servers';

            const bbox = computeBBox(x, y, scaleFactor, label);

            const iconHalfH = (BASE_ICON_SIZE / 2) * scaleFactor;
            const textTopY = y + iconHalfH + LABEL_GAP * scaleFactor;
            const textBottomY = textTopY + LABEL_FONT_SIZE * scaleFactor;
            const connRadius = CONNECTION_POINT_RADIUS * scaleFactor;
            const connY = textBottomY + CONNECTION_POINT_GAP * scaleFactor + connRadius;

            nodes.push({
                x,
                y,
                spawnDelay: 0,
                label,
                iconKey,
                bbox,
                connectionPoint: {x, y: connY},
                isEmpty: false,
                lineStyle,
                path: [],
            });
        } else {
            const connRadius = CONNECTION_POINT_RADIUS * scaleFactor;

            nodes.push({
                x,
                y,
                spawnDelay: 0,
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
            });
        }
    }

    const sorted = sortNodesByDistanceAndAssignDelays(nodes, width, height);
    buildRoutes(sorted, scaleFactor);

    return sorted;
};
