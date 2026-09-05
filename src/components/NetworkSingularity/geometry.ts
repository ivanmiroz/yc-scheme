import type {Node3D, ProjectedNode} from './types';
import {PERSPECTIVE} from './constants';

export const project = (
    node: Node3D,
    rotX: number,
    rotY: number,
    centerX: number,
    centerY: number,
    zoom: number,
    scaleFactor: number,
): ProjectedNode => {
    const x = node.x * Math.cos(rotY) - node.z * Math.sin(rotY);
    const z1 = node.x * Math.sin(rotY) + node.z * Math.cos(rotY);
    const y1 = node.y;

    const y2 = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
    const z2 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);

    // Ограничиваем z2, чтобы scale не стал отрицательным
    const clampedZ2 = Math.max(z2, -PERSPECTIVE + 50);
    const scale = PERSPECTIVE / (PERSPECTIVE + clampedZ2);

    return {
        x: centerX + x * scale * zoom * scaleFactor,
        y: centerY + y2 * scale * zoom * scaleFactor,
        z: clampedZ2,
        scale,
        label: node.label,
        spawnDelay: node.spawnDelay,
        duration: node.duration,
    };
};
