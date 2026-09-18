import {PodiumState, Position} from './types';

const createPosition = (x: number, y: number, platformNum: number, posNum: string): Position => ({
    x,
    y,
    positionNumber: `${platformNum}.${posNum}`,
});

// Y дополнительной 7-й позиции (в долях высоты платформы) — чуть выше
// центра, где стоят остальные шесть позиций (0.5).
const EXTRA_POSITION_Y_RATIO = 0.4;

// Сдвиг по X для 2.4.1 (в долях ширины платформы) — «чуть левее 2.4».
const EXTRA_POSITION_4_1_X_RATIO = 0.05;

// Сдвиг по Y для 2.4.1 (в долях высоты платформы) относительно
// центрального ряда. Y растёт вниз, поэтому итоговый Y = ph * (0.5 - delta).
//   delta > 0 → выше основного ряда;
//   delta = 0 → на уровне основного ряда;
//   delta < 0 → ниже основного ряда.
// Здесь ALB опущена ниже основного ряда.
const EXTRA_POSITION_4_1_Y_RATIO = -0.02;

// Сдвиг по X для 2.4.2 (в долях ширины платформы) — «чуть правее 2.4».
const EXTRA_POSITION_4_2_X_RATIO = 0.05;

// Сдвиг по Y для 2.4.2 и 2.6.1 (в долях высоты платформы) — «чуть выше»
// относительно центрального ряда.
const EXTRA_POSITION_SUB_Y_RATIO = 0.08;

// Сдвиг по X для 2.5.1 — точная середина между визуальными позициями
// 2.4.2 и 2.6.1.
const EXTRA_POSITION_5_1_X_RATIO = EXTRA_POSITION_4_2_X_RATIO / 2;

export const calculatePositions = (podiums: PodiumState[]): Position[] => {
    const positions: Position[] = [];

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

        // Под-позиция 2.4.1 — сосед 2.4, чуть левее и ниже.
        positions.push(
            createPosition(
                rhomb2CenterX - pw * EXTRA_POSITION_4_1_X_RATIO,
                py + ph * (0.5 - EXTRA_POSITION_4_1_Y_RATIO),
                platformNum,
                '4.1',
            ),
        );

        // Под-позиция 2.4.2 — сосед 2.4, чуть правее и выше.
        positions.push(
            createPosition(
                rhomb2CenterX + pw * EXTRA_POSITION_4_2_X_RATIO,
                py + ph * (0.5 - EXTRA_POSITION_SUB_Y_RATIO),
                platformNum,
                '4.2',
            ),
        );

        // Под-позиция 2.6.1 — сосед 2.6: по X как 2.6, по Y — как 2.4.2.
        positions.push(
            createPosition(
                rhomb2CenterX,
                py + ph * (0.5 - EXTRA_POSITION_SUB_Y_RATIO),
                platformNum,
                '6.1',
            ),
        );

        // Под-позиция 2.5.1 — сосед 2.5: по Y как 2.5 (0.5 ph),
        // по X — середина между 2.4.2 и 2.6.1.
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
