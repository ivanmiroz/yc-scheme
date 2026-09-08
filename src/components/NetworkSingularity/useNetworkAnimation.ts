import {useEffect, useRef} from 'react';

import {
    BASE_CANVAS_SIZE,
    MAX_CANVAS_DIMENSION,
    MAX_CONNECTIONS,
    MAX_CONNECTIONS_4K,
    MAX_SCALE_FACTOR,
    SPHERE_RADIUS,
} from './constants';
import {project} from './geometry';
import {drawLabel} from './renderer';
import {generateConnections, generateNodes} from './scene';
import {loadAllIcons} from '../InfrastructureChoose/canvasAnimation/icons';
import type {Connection, Node3D, ProjectedNode} from './types';

type ProjectedNodeWithIndex = ProjectedNode & {
    index: number;
    fallDelay: number;
    fallSpeed: number;
};

export const useNetworkAnimation = (canvasRef: React.RefObject<HTMLCanvasElement | null>): void => {
    const animationRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const mouseRef = useRef({isDown: false, lastX: 0, lastY: 0});
    const rotationRef = useRef({x: 0.3, y: 0});
    const zoomRef = useRef(1);
    const velocityRef = useRef({x: 0, y: 0});
    const dprRef = useRef(1);
    const scaleFactorRef = useRef(1);
    const is4KRef = useRef(false);
    const lastFrameTimeRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        const ctx = canvas.getContext('2d', {alpha: true, desynchronized: true});
        if (!ctx) return undefined;

        loadAllIcons();

        startTimeRef.current = performance.now();

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const cssWidth = rect.width;
            const cssHeight = rect.height;
            const maxCssDim = Math.max(cssWidth, cssHeight);

            let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            const targetPhysical = maxCssDim * dpr;
            if (targetPhysical > MAX_CANVAS_DIMENSION) {
                dpr = MAX_CANVAS_DIMENSION / maxCssDim;
            }

            is4KRef.current = maxCssDim >= 2560;
            dprRef.current = dpr;

            canvas.width = Math.floor(cssWidth * dpr);
            canvas.height = Math.floor(cssHeight * dpr);

            const widthScale = cssWidth / BASE_CANVAS_SIZE;
            const rawScaleFactor = Math.pow(widthScale, 0.5);
            scaleFactorRef.current = Math.min(rawScaleFactor, MAX_SCALE_FACTOR);
        };

        resize();
        window.addEventListener('resize', resize);

        let nodes: Node3D[] = [];
        let connections: Connection[] = [];

        const initScene = () => {
            nodes = generateNodes(scaleFactorRef.current);
            const maxConn = is4KRef.current ? MAX_CONNECTIONS_4K : MAX_CONNECTIONS;
            connections = generateConnections(nodes, scaleFactorRef.current, maxConn);
        };

        initScene();

        const getTargetFPS = () => (is4KRef.current ? 30 : 60);

        const animate = (time: number) => {
            const frameInterval = 1000 / getTargetFPS();
            if (time - lastFrameTimeRef.current < frameInterval) {
                animationRef.current = requestAnimationFrame(animate);
                return;
            }
            lastFrameTimeRef.current = time;

            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            const centerX = width / 2;
            const centerY = height / 2;
            const scaleFactor = scaleFactorRef.current;

            const dpr = dprRef.current;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, width, height);

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

            const projected: ProjectedNodeWithIndex[] = nodes.map((n, i) => ({
                ...project(n, rotX, rotY, centerX, centerY, zoom, scaleFactor),
                index: i,
                fallDelay: n.fallDelay,
                fallSpeed: n.fallSpeed,
            }));

            ctx.lineCap = 'round';
            const lineWidth = 4 * scaleFactor;
            const margin = 200;
            const sphereR = SPHERE_RADIUS * scaleFactor;
            const invSphereR2 = 1 / (sphereR * 2);

            connections.forEach((conn) => {
                const nodeA = nodes[conn.from];
                const nodeB = nodes[conn.to];

                if (t < nodeA.spawnDelay || t < nodeB.spawnDelay) return;

                const elapsed = t - conn.spawnDelay;
                if (elapsed < 0) return;

                const progress = Math.min(1, elapsed / conn.duration);
                const eased = 1 - Math.pow(1 - progress, 3);

                const projectedA = projected[conn.from];
                const projectedB = projected[conn.to];

                const minX = Math.min(projectedA.x, projectedB.x);
                const maxX = Math.max(projectedA.x, projectedB.x);
                const minY = Math.min(projectedA.y, projectedB.y);
                const maxY = Math.max(projectedA.y, projectedB.y);

                if (
                    maxX < -margin ||
                    minX > width + margin ||
                    maxY < -margin ||
                    minY > height + margin
                ) {
                    return;
                }

                const avgZ = (projectedA.z + projectedB.z) * 0.5;
                const depthFactor = Math.max(0, Math.min(1, (sphereR - avgZ) * invSphereR2));

                const invDepth = 1 - depthFactor;
                const lineR = Math.round(233 * invDepth);
                const lineG = Math.round(236 * invDepth);
                const lineB = Math.round(245 * invDepth);

                const opacity = eased;

                ctx.strokeStyle = `rgba(${lineR},${lineG},${lineB},${opacity})`;
                ctx.lineWidth = lineWidth;

                const currentEndX = projectedA.x + (projectedB.x - projectedA.x) * eased;
                const currentEndY = projectedA.y + (projectedB.y - projectedA.y) * eased;

                ctx.beginPath();
                ctx.moveTo(projectedA.x, projectedA.y);
                ctx.lineTo(currentEndX, currentEndY);
                ctx.stroke();

                if (progress < 1) {
                    const headOpacity = (1 - progress) * 0.9;
                    const headRadius =
                        2.2 * ((projectedA.scale + projectedB.scale) * 0.5) * scaleFactor;

                    ctx.fillStyle = `rgba(${lineR},${lineG},${lineB},${headOpacity})`;
                    ctx.beginPath();
                    ctx.arc(currentEndX, currentEndY, headRadius, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            projected.sort((node1, node2) => node2.z - node1.z);

            projected.forEach((p) => {
                if (p.y < -200 || p.y > height + 200 || p.x < -100 || p.x > width + 100) {
                    return;
                }

                drawLabel(ctx, p, zoom, t, 0, 1, p.index, scaleFactor, 0, 0);
            });

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
            if (!mouseRef.current.isDown) return;
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
            if (!mouseRef.current.isDown || e.touches.length !== 1) return;
            e.preventDefault();
            const dx = e.touches[0].clientX - mouseRef.current.lastX;
            const dy = e.touches[0].clientY - mouseRef.current.lastY;

            rotationRef.current.y += dx * 0.0039;
            rotationRef.current.x += dy * 0.0039;

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
    }, [canvasRef]);
};
