export type Node3D = {
    x: number;
    y: number;
    z: number;
    label: string;
    spawnDelay: number;
    duration: number;
    fallDelay: number;
    fallSpeed: number;
};

export type ProjectedNode = {
    x: number;
    y: number;
    z: number;
    scale: number;
    label: string;
    spawnDelay: number;
    duration: number;
};

export type Connection = {
    from: number;
    to: number;
    spawnDelay: number;
    duration: number;
};
