// src/components/NetworkSingularity/geometry.ts

import type {Node3D, ProjectedNode} from './types';
import {PERSPECTIVE} from './constants';

export const project = (
    node: Node3D,
    rotX: number,
    rotY: number,
    centerX: number,
    centerY: number,
    zoom: number,
): ProjectedNode => {
    const x = node.x * Math.cos(rotY) - node.z * Math.sin(rotY);
    const z1 = node.x * Math.sin(rotY) + node.z * Math.cos(rotY);
    const y1 = node.y;

    const y2 = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
    const z2 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);

    const scale = PERSPECTIVE / (PERSPECTIVE + z2);

    return {
        x: centerX + x * scale * zoom,
        y: centerY + y2 * scale * zoom,
        z: z2,
        scale,
        label: node.label,
        spawnDelay: node.spawnDelay,
        duration: node.duration,
        colorDelay: node.colorDelay,
    };
};
