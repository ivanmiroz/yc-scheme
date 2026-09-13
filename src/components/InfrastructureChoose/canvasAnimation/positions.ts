import {PodiumState, Position} from './types';

const createPosition = (x: number, y: number, platformNum: number, posNum: string): Position => ({
    x,
    y,
    positionNumber: `${platformNum}.${posNum}`,
});

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
    });

    return positions;
};
