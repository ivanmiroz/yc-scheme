import {PodiumState, Position} from './types';

const createPosition = (x: number, y: number, platformNum: number, posNum: string): Position => ({
    x,
    y,
    positionNumber: `${platformNum}.${posNum}`,
});

// Y дополнительной 7-й позиции (в долях высоты платформы).
const EXTRA_POSITION_Y_RATIO = 0.4;

// Сдвиги по X для под-позиций (в долях ширины платформы).
const EXTRA_POSITION_4_1_X_RATIO = 0.05;
const EXTRA_POSITION_4_2_X_RATIO = 0.05;
const EXTRA_POSITION_4_3_X_RATIO = 0.15;
const EXTRA_POSITION_4_4_X_RATIO = 0.25;
const EXTRA_POSITION_5_1_X_RATIO = EXTRA_POSITION_4_2_X_RATIO / 2;

// Y «верхнего» ряда под-позиций (2.4.1, 2.4.3, 2.4.4, 2.6.1).
const Y_4_UPPER = 0.52;

// Y «нижнего» ряда (2.4.2).
const Y_4_LOWER = 0.72;

// Схемы, где 2.4.2 и 2.4.3 меняются вертикальными рядами: 2.4.2
// уходит наверх, 2.4.3 — вниз. Ключ — индекс схемы (0..3).
const SCHEMES_WITH_SWAPPED_42_43: Record<number, true> = {
    3: true, // схема 4
};

// Точечные переопределения Y по полному positionNumber (в долях ph).
// Применяются поверх логики рядов — если для позиции задан override,
// используется он. Сейчас нужен только для 3.4.3.
const POSITION_Y_OVERRIDES: Record<string, number> = {
    '3.4.3': 0.5,
};

export const calculatePositions = (podiums: PodiumState[], schemeIndex?: number): Position[] => {
    const positions: Position[] = [];
    const swapPositions42And43 =
        typeof schemeIndex === 'number' && SCHEMES_WITH_SWAPPED_42_43[schemeIndex] === true;

    podiums.forEach((podium) => {
        const platformNum = podiums.length - podium.id;

        const px = podium.currentX;
        const py = podium.currentY;
        const pw = podium.scaledWidth;
        const ph = podium.scaledHeight;

        // Центры ромбов
        const rhomb1CenterX = px + pw * 0.25;
        const rhomb1CenterY = py + ph * 0.5;

        const rhomb2CenterX = px + pw * 0.75;
        const rhomb2CenterY = py + ph * 0.5;

        // Все позиции в группе имеют одинаковую X (центр ромба).
        // Горизонтальное смещение будет сделано в drawers.ts
        positions.push(
            createPosition(rhomb1CenterX, rhomb1CenterY, platformNum, '1'),
            createPosition(rhomb1CenterX, rhomb1CenterY, platformNum, '2'),
            createPosition(rhomb1CenterX, rhomb1CenterY, platformNum, '3'),
        );

        positions.push(
            createPosition(rhomb2CenterX, rhomb2CenterY, platformNum, '4'),
            createPosition(rhomb2CenterX, rhomb2CenterY, platformNum, '5'),
            createPosition(rhomb2CenterX, rhomb2CenterY, platformNum, '6'),
        );

        // Седьмая позиция — на второй ромбовидной группе.
        positions.push(
            createPosition(rhomb2CenterX, py + ph * EXTRA_POSITION_Y_RATIO, platformNum, '7'),
        );

        // Под-позиция 4.1 — всегда верхний ряд.
        positions.push(
            createPosition(
                rhomb2CenterX - pw * EXTRA_POSITION_4_1_X_RATIO,
                py + ph * Y_4_UPPER,
                platformNum,
                '4.1',
            ),
        );

        // Под-позиция 4.2 — по умолчанию нижний ряд; на схемах из
        // SCHEMES_WITH_SWAPPED_42_43 поднимается в верхний.
        const y42 = swapPositions42And43 ? Y_4_UPPER : Y_4_LOWER;
        positions.push(
            createPosition(
                rhomb2CenterX + pw * EXTRA_POSITION_4_2_X_RATIO,
                py + ph * y42,
                platformNum,
                '4.2',
            ),
        );

        // Под-позиция 4.3 — по умолчанию верхний ряд; на схемах
        // из SCHEMES_WITH_SWAPPED_42_43 опускается в нижний. Может
        // быть переопределена через POSITION_Y_OVERRIDES.
        const key43 = `${platformNum}.4.3`;
        const defaultY43 = swapPositions42And43 ? Y_4_LOWER : Y_4_UPPER;
        const y43 = POSITION_Y_OVERRIDES[key43] ?? defaultY43;
        positions.push(
            createPosition(
                rhomb2CenterX + pw * EXTRA_POSITION_4_3_X_RATIO,
                py + ph * y43,
                platformNum,
                '4.3',
            ),
        );

        // Под-позиция 4.4 — всегда верхний ряд (не следует за 4.3).
        positions.push(
            createPosition(
                rhomb2CenterX + pw * EXTRA_POSITION_4_4_X_RATIO,
                py + ph * Y_4_UPPER,
                platformNum,
                '4.4',
            ),
        );

        // Под-позиция 6.1 — по вертикали как 4.1, по горизонтали как 4.2.
        positions.push(
            createPosition(
                rhomb2CenterX + pw * EXTRA_POSITION_4_2_X_RATIO,
                py + ph * Y_4_UPPER,
                platformNum,
                '6.1',
            ),
        );

        // Под-позиция 5.1 — по Y как 5 (0.5 ph), по X — середина
        // между 4.2 и 6.1.
        positions.push(
            createPosition(
                rhomb2CenterX + pw * EXTRA_POSITION_5_1_X_RATIO,
                py + ph * 0.5,
                platformNum,
                '5.1',
            ),
        );
    });

    return positions;
};
