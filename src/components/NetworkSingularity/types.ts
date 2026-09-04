// src/components/NetworkSingularity/types.ts

export interface Node3D {
    x: number;
    y: number;
    z: number;
    label: string;
    spawnDelay: number;
    duration: number;
    colorDelay: number;
}

export interface Connection {
    from: number;
    to: number;
    spawnDelay: number;
    duration: number;
    colorDelay: number;
}

export interface ProjectedNode {
    x: number;
    y: number;
    z: number;
    scale: number;
    label: string;
    spawnDelay: number;
    duration: number;
    colorDelay: number;
}

export type Phase = 'building' | 'coloring' | 'collapsing';
