import {PodiumState, Position} from './types';

const createPosition = (x: number, y: number, platformNum: number, posNum: string): Position => ({
    x,
    y,
    positionNumber: `${platformNum}.${posNum}`,
});

// Y дополнительной 7-й позиции (в долях высоты платформы) — чуть выше
// центра, где стоят остальные шесть позиций (0.5). Используется только
// для тех схем, где в positionNumber есть 'X.7' (сейчас — 4-я схема, ALB).
const EXTRA_POSITION_Y_RATIO = 0.4;

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

        // Седьмая позиция — на второй ромбовидной группе:
        //   • по X — как 2.5 (в drawPositions для '.7' adjustedX = pos.x,
        //     то есть ромб-центр без сдвига);
        //   • по Y — чуть выше, чем у 2.4 (0.4 ph вместо 0.5 ph).
        // Позиция создаётся для всех платформ; отрисовка произойдёт только
        // там, где в активной схеме есть такой positionNumber.
        positions.push(
            createPosition(rhomb2CenterX, py + ph * EXTRA_POSITION_Y_RATIO, platformNum, '7'),
        );
    });

    return positions;
};
