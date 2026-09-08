import type {Connection, Node3D} from './types';
import {
    CONNECTION_DISTANCE,
    LINE_GROW_MS,
    MAX_CONNECTIONS,
    MIN_NODE_DISTANCE,
    NODE_COUNT,
    NODE_GROW_MS,
    NODE_SPAWN_WINDOW_MS,
    SPAWN_WINDOW_MS,
    SPHERE_RADIUS,
} from './constants';
import {LABELS} from '../InfrastructureChoose/canvasAnimation/icons';

export const generateNodes = (scaleFactor: number): Node3D[] => {
    const nodes: Node3D[] = [];
    const scaledRadius = SPHERE_RADIUS * scaleFactor;
    const minDistance = MIN_NODE_DISTANCE * scaleFactor;

    let attempts = 0;
    const maxAttempts = 1000;

    while (nodes.length < NODE_COUNT && attempts < maxAttempts) {
        attempts++;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = scaledRadius * Math.cbrt(Math.random());

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        let tooClose = false;
        for (const existingNode of nodes) {
            const dx = x - existingNode.x;
            const dy = y - existingNode.y;
            const dz = z - existingNode.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < minDistance) {
                tooClose = true;
                break;
            }
        }

        if (!tooClose) {
            const baseDelay = (nodes.length / Math.max(1, NODE_COUNT - 1)) * NODE_SPAWN_WINDOW_MS;
            const randomOffset = (Math.random() - 0.5) * 300;

            nodes.push({
                x,
                y,
                z,
                label: LABELS[nodes.length % LABELS.length],
                spawnDelay: Math.max(0, baseDelay + randomOffset),
                duration: NODE_GROW_MS + Math.random() * 300,
                fallDelay: Math.random() * 800,
                fallSpeed: 0.7 + Math.random() * 0.8,
            });
        }
    }

    return nodes;
};

export const generateConnections = (
    nodes: Node3D[],
    scaleFactor: number,
    maxConnections: number = MAX_CONNECTIONS,
): Connection[] => {
    const connections: Connection[] = [];
    const connectionSet = new Set<string>();
    const scaledDistance = CONNECTION_DISTANCE * scaleFactor;
    const MAX_CONNECTIONS_PER_NODE = 3;

    for (let i = 1; i < nodes.length; i++) {
        const candidates: {to: number; dist: number}[] = [];
        for (let j = 0; j < i; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dz = nodes[i].z - nodes[j].z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < scaledDistance) {
                candidates.push({to: j, dist});
            }
        }

        candidates.sort((a, c) => a.dist - c.dist);
        const topCandidates = candidates.slice(0, MAX_CONNECTIONS_PER_NODE);

        for (const candidate of topCandidates) {
            const key = `${Math.min(i, candidate.to)}-${Math.max(i, candidate.to)}`;
            if (!connectionSet.has(key)) {
                connectionSet.add(key);
                connections.push({
                    from: i,
                    to: candidate.to,
                    spawnDelay: 0,
                    duration: 0,
                });
            }
        }
    }

    for (let i = connections.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [connections[i], connections[j]] = [connections[j], connections[i]];
    }

    // Используем переданный лимит
    const limitedConnections = connections.slice(0, maxConnections);

    const maxNodeAppearTime = Math.max(...nodes.map((n) => n.spawnDelay + n.duration));

    return limitedConnections.map((conn, idx) => {
        const spawnDelay =
            maxNodeAppearTime +
            (idx / Math.max(1, limitedConnections.length - 1)) * SPAWN_WINDOW_MS +
            (Math.random() - 0.5) * 400;

        return {
            ...conn,
            spawnDelay: Math.max(0, spawnDelay),
            duration: LINE_GROW_MS + Math.random() * 400,
        };
    });
};
