/* eslint-disable no-param-reassign */
import type {Connection, Node3D} from './types';
import {
    COLORING_DURATION_MS,
    COLORING_START_MS,
    CONNECTION_DISTANCE,
    LABELS,
    LINE_GROW_MS,
    MAX_CONNECTIONS,
    NODE_COUNT,
    NODE_GROW_MS,
    NODE_SPAWN_WINDOW_MS,
    SPAWN_WINDOW_MS,
    SPHERE_RADIUS,
} from './constants';

export const generateNodes = (): Node3D[] => {
    const nodes: Node3D[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = SPHERE_RADIUS * Math.cbrt(Math.random());

        const baseDelay = (i / Math.max(1, NODE_COUNT - 1)) * NODE_SPAWN_WINDOW_MS;
        const randomOffset = (Math.random() - 0.5) * 300;

        nodes.push({
            x: r * Math.sin(phi) * Math.cos(theta),
            y: r * Math.sin(phi) * Math.sin(theta),
            z: r * Math.cos(phi),
            label: LABELS[i % LABELS.length],
            spawnDelay: Math.max(0, baseDelay + randomOffset),
            duration: NODE_GROW_MS + Math.random() * 300,
            colorDelay: 0,
        });
    }
    return nodes;
};

export const generateConnections = (nodes: Node3D[]): Connection[] => {
    const connections: Connection[] = [];
    const connectionSet = new Set<string>();

    for (let i = 1; i < nodes.length; i++) {
        const candidates: {to: number; dist: number}[] = [];
        for (let j = 0; j < i; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dz = nodes[i].z - nodes[j].z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < CONNECTION_DISTANCE) {
                candidates.push({to: j, dist});
            }
        }

        candidates.sort((a, c) => a.dist - c.dist);

        if (candidates.length > 0) {
            const key = `${Math.min(i, candidates[0].to)}-${Math.max(i, candidates[0].to)}`;
            if (!connectionSet.has(key)) {
                connectionSet.add(key);
                connections.push({
                    from: i,
                    to: candidates[0].to,
                    spawnDelay: 0,
                    duration: 0,
                    colorDelay: 0,
                });
            }
        }

        for (let k = 1; k < candidates.length && connections.length < MAX_CONNECTIONS; k++) {
            const key = `${Math.min(i, candidates[k].to)}-${Math.max(i, candidates[k].to)}`;
            if (!connectionSet.has(key)) {
                connectionSet.add(key);
                connections.push({
                    from: i,
                    to: candidates[k].to,
                    spawnDelay: 0,
                    duration: 0,
                    colorDelay: 0,
                });
            }
        }
    }

    for (let i = connections.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [connections[i], connections[j]] = [connections[j], connections[i]];
    }

    connections.forEach((conn, idx) => {
        const spawnDelay =
            (idx / Math.max(1, connections.length - 1)) * SPAWN_WINDOW_MS +
            (Math.random() - 0.5) * 400;
        conn.spawnDelay = Math.max(0, spawnDelay);
        conn.duration = LINE_GROW_MS + Math.random() * 400;
        conn.colorDelay = COLORING_START_MS + Math.random() * COLORING_DURATION_MS;
    });

    nodes.forEach((node) => {
        node.colorDelay = COLORING_START_MS + Math.random() * COLORING_DURATION_MS;
    });

    return connections;
};
