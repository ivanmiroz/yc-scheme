export type Node3D = {
    x: number;
    y: number;
    z: number;
    label: string;
    spawnDelay: number;
    duration: number;
    fallDelay: number; // ← добавлено
};

export interface Connection {
    from: number;
    to: number;
    spawnDelay: number;
    duration: number;
}

export interface ProjectedNode {
    x: number;
    y: number;
    z: number;
    scale: number;
    label: string;
    spawnDelay: number;
    duration: number;
}
