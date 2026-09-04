// src/components/NetworkSingularity/constants.ts

export const LABELS = [
    'GPU',
    'CPU',
    'RAM',
    'SSD',
    'NET',
    'API',
    'DB',
    'CDN',
    'POD',
    'VM',
    'K8S',
    'DNS',
    'LB',
    'SSL',
    'TCP',
    'UDP',
    'HTTP',
    'WS',
    'RPC',
    'MQ',
    'S3',
    'NFS',
    'VLAN',
    'SSH',
    'TLS',
    'JWT',
    'OAuth',
    'gRPC',
    'REST',
    'SQL',
    'NoSQL',
    'Redis',
    'Kafka',
    'Nginx',
    'Docker',
    'Linux',
];

export const NODE_COUNT = 36;
export const MAX_CONNECTIONS = 57;
export const SPHERE_RADIUS = 200;
export const CONNECTION_DISTANCE = 180;

export const SPAWN_WINDOW_MS = 6000;
export const LINE_GROW_MS = 1500;
export const NODE_SPAWN_WINDOW_MS = 3500;
export const NODE_GROW_MS = 800;

export const COLORING_START_MS = 8000;
export const COLORING_DURATION_MS = 2000;
export const SHAKE_DURATION_MS = 500;
export const FADE_DURATION_MS = 1500;
export const COLLAPSE_START_MS = COLORING_START_MS + COLORING_DURATION_MS + SHAKE_DURATION_MS;
export const COLLAPSE_END_MS = COLLAPSE_START_MS + FADE_DURATION_MS;
export const PAUSE_BETWEEN_CYCLES_MS = 1200;

export const PERSPECTIVE = 700;
export const BASE_LABEL_WIDTH = 44;
export const BASE_LABEL_HEIGHT = 20;
export const BASE_FONT_SIZE = 10;
export const MIN_FONT_SIZE = 7;
export const BASE_RADIUS = 4;
export const MIN_RADIUS = 2;
export const BASE_LINE_WIDTH = 1;
export const MIN_LINE_WIDTH = 0.5;
export const APPEAR_SCALE_MIN = 0.3;
export const APPEAR_SCALE_MAX = 0.7;
export const SHAKE_MAX_INTENSITY = 10;
export const HEAD_RADIUS_MULTIPLIER = 2.2;
export const HEAD_GLOW_MULTIPLIER = 4;
