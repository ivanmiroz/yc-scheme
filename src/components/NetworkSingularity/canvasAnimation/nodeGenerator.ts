import {LABELS, getIconKeyByLabel} from '../../InfrastructureChoose/canvasAnimation/icons';
import {
    CANVAS_PADDING_PERCENT,
    CELL_RANDOM_OFFSET,
    NODE_COUNT,
    SPAWN_DELAY_STEP,
} from './constants';
import {computeBBox, distanceToCenter} from './utils';
import {Node2D, NodeWithDistance} from './types';

/**
 * Сортирует узлы по расстоянию до центра и назначает задержки появления
 * @param nodes - Массив узлов для сортировки
 * @param width - Ширина канваса
 * @param height - Высота канваса
 * @returns Отсортированный массив узлов с назначенными задержками
 */
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

    // Сортируем по расстоянию (от ближних к центру к дальним)
    nodesWithDistance.sort((a, b) => a.distance - b.distance);

    // Назначаем spawnDelay на основе порядка от центра к краям
    // Создаём новые объекты вместо мутации существующих
    return nodesWithDistance.map((item, index) => ({
        ...item.node,
        spawnDelay: index * SPAWN_DELAY_STEP,
    }));
};

/**
 * Генерирует узлы с равномерным распределением по центральной части канваса
 * @param width - Ширина канваса
 * @param height - Высота канваса
 * @param scaleFactor - Коэффициент масштабирования
 * @returns Массив сгенерированных узлов
 */
export const generateNodes2D = (width: number, height: number, scaleFactor: number): Node2D[] => {
    // Отступы 10% с каждой стороны
    const paddingX = width * CANVAS_PADDING_PERCENT;
    const paddingY = height * CANVAS_PADDING_PERCENT;
    const usableW = width - paddingX * 2;
    const usableH = height - paddingY * 2;

    const shuffledLabels = [...LABELS].sort(() => 0.5 - Math.random());
    const selectedLabels = shuffledLabels.slice(0, NODE_COUNT);

    // Вычисляем оптимальное количество колонок и рядов
    const aspectRatio = usableW / usableH;
    const cols = Math.ceil(Math.sqrt(NODE_COUNT * aspectRatio));
    const rows = Math.ceil(NODE_COUNT / cols);

    const cellW = usableW / cols;
    const cellH = usableH / rows;

    const nodes: Node2D[] = [];

    // Размещаем иконки по сетке с небольшим случайным смещением
    for (let i = 0; i < selectedLabels.length; i++) {
        const label = selectedLabels[i];
        const iconKey = getIconKeyByLabel(label) || 'servers';

        const col = i % cols;
        const row = Math.floor(i / cols);

        // Центр ячейки
        const cellCenterX = paddingX + cellW * (col + 0.5);
        const cellCenterY = paddingY + cellH * (row + 0.5);

        // Небольшое случайное смещение внутри ячейки
        const offsetX = (Math.random() - 0.5) * cellW * CELL_RANDOM_OFFSET;
        const offsetY = (Math.random() - 0.5) * cellH * CELL_RANDOM_OFFSET;

        const x = cellCenterX + offsetX;
        const y = cellCenterY + offsetY;

        const bbox = computeBBox(x, y, scaleFactor);

        nodes.push({
            x,
            y,
            spawnDelay: 0, // Заполним после сортировки по расстоянию
            label,
            iconKey,
            bbox,
        });
    }

    // Сортируем узлы по расстоянию до центра и назначаем задержки появления
    return sortNodesByDistanceAndAssignDelays(nodes, width, height);
};
