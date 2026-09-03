// src/components/NetworkSingularity/NetworkSingularity.tsx
'use client';

import React, {useEffect, useRef, useState} from 'react';
import block from 'bem-cn-lite';

import './NetworkSingularity.scss';

const b = block('network-singularity');

interface Node3D {
    x: number;
    y: number;
    z: number;
    label: string;
}

interface Connection {
    from: number;
    to: number;
    spawnDelay: number;
    duration: number;
}

interface ProjectedNode {
    x: number;
    y: number;
    z: number;
    scale: number;
    label: string;
}

const LABELS = [
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
    'CUDA',
    'TPU',
    'NVMe',
    'FPGA',
    'ASIC',
    'BGP',
    'OSPF',
    'VPC',
    'IAM',
    'CI/CD',
    'Git',
    'Prom',
    'Graf',
    'ELK',
];

const NODE_COUNT = 50;
const MAX_CONNECTIONS = 100;
const SPHERE_RADIUS = 200;
const CONNECTION_DISTANCE = 180;
const SPAWN_WINDOW_MS = 6000;
const LINE_GROW_MS = 1500;

export const NetworkSingularity: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const [nodeCount, setNodeCount] = useState(0);
    const [connectionCount, setConnectionCount] = useState(0);

    const mouseRef = useRef({isDown: false, lastX: 0, lastY: 0});
    const rotationRef = useRef({x: 0.3, y: 0});
    const zoomRef = useRef(1);
    const velocityRef = useRef({x: 0, y: 0});

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        const ctx = canvas.getContext('2d');
        if (!ctx) return undefined;

        startTimeRef.current = performance.now();

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);

        const nodes: Node3D[] = [];
        for (let i = 0; i < NODE_COUNT; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = SPHERE_RADIUS * Math.cbrt(Math.random());

            nodes.push({
                x: r * Math.sin(phi) * Math.cos(theta),
                y: r * Math.sin(phi) * Math.sin(theta),
                z: r * Math.cos(phi),
                label: LABELS[i % LABELS.length],
            });
        }

        const candidates: {from: number; to: number; dist: number}[] = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dz = nodes[i].z - nodes[j].z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist < CONNECTION_DISTANCE) {
                    candidates.push({from: i, to: j, dist});
                }
            }
        }

        candidates.sort((a, c) => a.dist - c.dist);

        const picked = candidates.slice(0, MAX_CONNECTIONS);
        for (let i = picked.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [picked[i], picked[j]] = [picked[j], picked[i]];
        }

        const connections: Connection[] = picked.map((c, idx) => {
            const spawnDelay =
                (idx / Math.max(1, picked.length - 1)) * SPAWN_WINDOW_MS +
                (Math.random() - 0.5) * 400;
            return {
                from: c.from,
                to: c.to,
                spawnDelay: Math.max(0, spawnDelay),
                duration: LINE_GROW_MS + Math.random() * 400,
            };
        });

        setNodeCount(nodes.length);
        setConnectionCount(connections.length);

        // Исправлено: все переменные теперь const, переназначения исключены
        const project = (
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

            const perspective = 700;
            const scale = perspective / (perspective + z2);

            return {
                x: centerX + x * scale * zoom,
                y: centerY + y2 * scale * zoom,
                z: z2,
                scale,
                label: node.label,
            };
        };

        const drawLabel = (p: ProjectedNode, zoom: number) => {
            const depthFactor = (SPHERE_RADIUS - p.z) / (SPHERE_RADIUS * 2);
            const opacity = Math.max(0.25, Math.min(1, 0.35 + depthFactor * 0.85));

            const baseW = 44;
            const baseH = 20;
            const numScale = Number(p.scale);

            // Явное преобразование для удовлетворения строгого правила no-implicit-coercion
            const w = baseW * Number(numScale) * zoom;
            const h = baseH * Number(numScale) * zoom;
            const fontSize = Math.max(7, 10 * Number(numScale) * zoom);
            const radius = Math.max(2, 4 * Number(numScale) * zoom);

            ctx.fillStyle = `rgba(18, 32, 60, ${opacity * 0.85})`;
            ctx.strokeStyle = `rgba(140, 195, 255, ${opacity * 0.9})`;
            ctx.lineWidth = Math.max(0.5, 1 * Number(numScale) * zoom);

            const x0 = p.x - w / 2;
            const y0 = p.y - h / 2;
            ctx.beginPath();
            ctx.moveTo(x0 + radius, y0);
            ctx.lineTo(x0 + w - radius, y0);
            ctx.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + radius);
            ctx.lineTo(x0 + w, y0 + h - radius);
            ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - radius, y0 + h);
            ctx.lineTo(x0 + radius, y0 + h);
            ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - radius);
            ctx.lineTo(x0, y0 + radius);
            ctx.quadraticCurveTo(x0, y0, x0 + radius, y0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = `rgba(220, 240, 255, ${opacity})`;
            ctx.font = `600 ${fontSize}px ui-monospace, "SF Mono", Menlo, monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.label, p.x, p.y + 0.5);
        };

        const animate = (time: number) => {
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            const centerX = width / 2;
            const centerY = height / 2;

            ctx.clearRect(0, 0, width, height);

            const bg = ctx.createRadialGradient(
                centerX,
                centerY,
                0,
                centerX,
                centerY,
                Math.max(width, height) / 1.2,
            );
            bg.addColorStop(0, '#0f1a35');
            bg.addColorStop(1, '#05070f');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, width, height);

            const t = time - startTimeRef.current;
            const autoY = 0.0025 + 0.0015 * Math.sin(t * 0.00023);
            const autoX = 0.0012 + 0.0009 * Math.sin(t * 0.00017 + 1.3);

            if (mouseRef.current.isDown) {
                velocityRef.current.y *= 0.9;
                velocityRef.current.x *= 0.9;
            } else {
                rotationRef.current.y += autoY + velocityRef.current.y;
                rotationRef.current.x += autoX + velocityRef.current.x;
                velocityRef.current.y *= 0.94;
                velocityRef.current.x *= 0.94;
            }

            rotationRef.current.x = Math.max(
                -Math.PI / 2.2,
                Math.min(Math.PI / 2.2, rotationRef.current.x),
            );

            const rotX = rotationRef.current.x;
            const rotY = rotationRef.current.y;
            const zoom = zoomRef.current;

            const projected: ProjectedNode[] = nodes.map((n) =>
                project(n, rotX, rotY, centerX, centerY, zoom),
            );

            ctx.lineCap = 'round';
            connections.forEach((conn) => {
                const elapsed = t - conn.spawnDelay;
                if (elapsed < 0) {
                    return;
                }

                const progress = Math.min(1, elapsed / conn.duration);
                const eased = 1 - Math.pow(1 - progress, 3);

                const nodeA = projected[conn.from];
                const nodeB = projected[conn.to];
                const avgZ = (nodeA.z + nodeB.z) / 2;
                const baseOpacity = Math.max(0.04, Math.min(0.55, (SPHERE_RADIUS - avgZ) / 420));
                const opacity = baseOpacity * eased;

                const endX = nodeA.x + (nodeB.x - nodeA.x) * eased;
                const endY = nodeA.y + (nodeB.y - nodeA.y) * eased;

                ctx.strokeStyle = `rgba(120, 180, 255, ${opacity})`;
                ctx.lineWidth = 0.7 * ((nodeA.scale + nodeB.scale) / 2);
                ctx.beginPath();
                ctx.moveTo(nodeA.x, nodeA.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();

                if (progress < 1) {
                    const headOpacity = (1 - progress) * 0.9;
                    const headRadius = 2.2 * ((nodeA.scale + nodeB.scale) / 2);
                    const headGlow = ctx.createRadialGradient(
                        endX,
                        endY,
                        0,
                        endX,
                        endY,
                        headRadius * 4,
                    );
                    headGlow.addColorStop(0, `rgba(200, 230, 255, ${headOpacity})`);
                    headGlow.addColorStop(1, 'rgba(200, 230, 255, 0)');
                    ctx.fillStyle = headGlow;
                    ctx.beginPath();
                    ctx.arc(endX, endY, headRadius * 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            const sorted = [...projected].sort((node1, node2) => node2.z - node1.z);
            sorted.forEach((p) => drawLabel(p, zoom));

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        const handleMouseDown = (e: MouseEvent) => {
            mouseRef.current.isDown = true;
            mouseRef.current.lastX = e.clientX;
            mouseRef.current.lastY = e.clientY;
            velocityRef.current.x = 0;
            velocityRef.current.y = 0;
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!mouseRef.current.isDown) {
                return;
            }
            const dx = e.clientX - mouseRef.current.lastX;
            const dy = e.clientY - mouseRef.current.lastY;
            rotationRef.current.y += dx * 0.008;
            rotationRef.current.x += dy * 0.008;
            velocityRef.current.y = dx * 0.003;
            velocityRef.current.x = dy * 0.003;
            mouseRef.current.lastX = e.clientX;
            mouseRef.current.lastY = e.clientY;
        };

        const handleMouseUp = () => {
            mouseRef.current.isDown = false;
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 0.93 : 1.07;
            zoomRef.current = Math.max(0.4, Math.min(2.5, zoomRef.current * factor));
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                mouseRef.current.isDown = true;
                mouseRef.current.lastX = e.touches[0].clientX;
                mouseRef.current.lastY = e.touches[0].clientY;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!mouseRef.current.isDown || e.touches.length !== 1) {
                return;
            }
            e.preventDefault();
            const dx = e.touches[0].clientX - mouseRef.current.lastX;
            const dy = e.touches[0].clientY - mouseRef.current.lastY;
            rotationRef.current.y += dx * 0.008;
            rotationRef.current.x += dy * 0.008;
            mouseRef.current.lastX = e.touches[0].clientX;
            mouseRef.current.lastY = e.touches[0].clientY;
        };

        const handleTouchEnd = () => {
            mouseRef.current.isDown = false;
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('wheel', handleWheel, {passive: false});
        canvas.addEventListener('touchstart', handleTouchStart, {passive: true});
        canvas.addEventListener('touchmove', handleTouchMove, {passive: false});
        canvas.addEventListener('touchend', handleTouchEnd);

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('wheel', handleWheel);
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);

    return (
        <div className={b()}>
            <canvas ref={canvasRef} className={b('canvas')} />
            <div className={b('overlay')}>
                <div className={b('title')}>Сетевая сингулярность</div>
                <div className={b('subtitle')}>Формирование сети</div>
                <div className={b('stats')}>
                    <span className={b('num')}>{String(nodeCount).padStart(2, '0')}</span>
                    <span className={b('label')}> объектов · </span>
                    <span className={b('num')}>{String(connectionCount).padStart(2, '0')}</span>
                    <span className={b('label')}> связей</span>
                </div>
                <div className={b('hint')}>Тяните, чтобы вращать · колесо, чтобы приблизить</div>
            </div>
        </div>
    );
};
