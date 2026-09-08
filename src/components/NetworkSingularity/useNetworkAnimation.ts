import {useEffect, useRef} from 'react';

import {
    APPEAR_SCALE_MAX,
    APPEAR_SCALE_MIN,
    BASE_CANVAS_SIZE,
    ICON_BORDER_RADIUS,
    MAX_SCALE_FACTOR,
} from './constants';
import {project} from './geometry';
import {drawLabel, getCardColor, getCardDimensions} from './renderer';
import {generateConnections, generateNodes} from './scene';
import {loadAllIcons} from '../InfrastructureChoose/canvasAnimation/icons';
import type {Connection, Node3D, ProjectedNode} from './types';

type ProjectedNodeWithIndex = ProjectedNode & {
    index: number;
    fallDelay: number;
    fallSpeed: number;
};

type RenderItem =
    | {
          type: 'line';
          z: number;
          edgeA: {x: number; y: number};
          edgeB: {x: number; y: number};
          eased: number;
          progress: number;
          r: number;
          g: number;
          b: number;
          headRadius: number;
          lineWidth: number;
      }
    | {
          type: 'node';
          z: number;
          node: ProjectedNodeWithIndex;
      };

const getEdgePoint = (
    cx: number,
    cy: number,
    w: number,
    h: number,
    tx: number,
    ty: number,
    radius = 0,
): {x: number; y: number} => {
    const dx = tx - cx;
    const dy = ty - cy;

    if (dx === 0 && dy === 0) {
        return {x: cx, y: cy};
    }

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let t: number;
    if (absDx * h > absDy * w) {
        t = w / 2 / absDx;
    } else {
        t = h / 2 / absDy;
    }

    const edgeX = cx + dx * t;
    const edgeY = cy + dy * t;

    if (radius <= 0) {
        return {x: edgeX, y: edgeY};
    }

    const halfW = w / 2;
    const halfH = h / 2;

    let cornerCenterX: number;
    let cornerCenterY: number;

    if (edgeX > cx) {
        cornerCenterX = cx + halfW - radius;
    } else {
        cornerCenterX = cx - halfW + radius;
    }

    if (edgeY > cy) {
        cornerCenterY = cy + halfH - radius;
    } else {
        cornerCenterY = cy - halfH + radius;
    }

    const vecX = edgeX - cornerCenterX;
    const vecY = edgeY - cornerCenterY;
    const dist = Math.sqrt(vecX * vecX + vecY * vecY);

    if (dist > radius) {
        return {x: edgeX, y: edgeY};
    }

    const normalizedX = vecX / dist;
    const normalizedY = vecY / dist;

    return {
        x: cornerCenterX + normalizedX * radius,
        y: cornerCenterY + normalizedY * radius,
    };
};

const computeCardRadius = (
    p: ProjectedNodeWithIndex,
    zoom: number,
    currentTime: number,
    scaleFactor: number,
): number => {
    const elapsed = currentTime - p.spawnDelay;
    if (elapsed < 0) return 1;

    const progress = Math.min(1, elapsed / p.duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const appearScale = APPEAR_SCALE_MIN + APPEAR_SCALE_MAX * eased;
    const numScale = Math.max(0.1, Number(p.scale));

    return Math.max(1, ICON_BORDER_RADIUS * numScale * zoom * appearScale * scaleFactor);
};

export const useNetworkAnimation = (canvasRef: React.RefObject<HTMLCanvasElement | null>): void => {
    const animationRef = useRef(0);
    const startTimeRef = useRef(0);
    const mouseRef = useRef({isDown: false, lastX: 0, lastY: 0});
    const rotationRef = useRef({x: 0.3, y: 0});
    const zoomRef = useRef(1);
    const velocityRef = useRef({x: 0, y: 0});
    const dprRef = useRef(1);
    const scaleFactorRef = useRef(1);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        const ctx = canvas.getContext('2d', {alpha: false, desynchronized: true});
        if (!ctx) return undefined;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        loadAllIcons();
        startTimeRef.current = performance.now();

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const MAX_DIMENSION = 2560;

            let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            if (rect.width >= 2560 || rect.height >= 1440) {
                dpr = 1;
            } else {
                dpr = Math.min(dpr, MAX_DIMENSION / Math.max(rect.width, rect.height));
            }

            dprRef.current = dpr;
            canvas.width = Math.floor(rect.width * dpr);
            canvas.height = Math.floor(rect.height * dpr);

            const widthScale = rect.width / BASE_CANVAS_SIZE;
            const rawScaleFactor = Math.pow(widthScale, 0.5);
            scaleFactorRef.current = Math.min(rawScaleFactor, MAX_SCALE_FACTOR);
        };

        resize();
        window.addEventListener('resize', resize);

        let nodes: Node3D[] = [];
        let connections: Connection[] = [];

        const initScene = () => {
            nodes = generateNodes(scaleFactorRef.current);
            connections = generateConnections(nodes, scaleFactorRef.current);
        };

        initScene();

        const animate = (time: number) => {
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            const centerX = width / 2;
            const centerY = height / 2;
            const scaleFactor = scaleFactorRef.current;

            ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
            ctx.fillStyle = 'rgb(233, 236, 245)';
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

            const projected: ProjectedNodeWithIndex[] = nodes.map((n, i) => ({
                ...project(n, rotX, rotY, centerX, centerY, zoom, scaleFactor),
                index: i,
                fallDelay: n.fallDelay,
                fallSpeed: n.fallSpeed,
            }));

            const lineWidth = 4 * scaleFactor;
            const margin = 200;
            const renderList: RenderItem[] = [];

            for (let ci = 0; ci < connections.length; ci++) {
                const conn = connections[ci];
                const nodeA = nodes[conn.from];
                const nodeB = nodes[conn.to];

                if (t < nodeA.spawnDelay || t < nodeB.spawnDelay) continue;

                const elapsed = t - conn.spawnDelay;
                if (elapsed < 0) continue;

                const progress = Math.min(1, elapsed / conn.duration);
                const eased = 1 - Math.pow(1 - progress, 3);

                const projectedA = projected[conn.from];
                const projectedB = projected[conn.to];

                const dimsA = getCardDimensions(projectedA, zoom, t, scaleFactor);
                const dimsB = getCardDimensions(projectedB, zoom, t, scaleFactor);
                const radiusA = computeCardRadius(projectedA, zoom, t, scaleFactor);
                const radiusB = computeCardRadius(projectedB, zoom, t, scaleFactor);

                const edgeA = getEdgePoint(
                    projectedA.x,
                    projectedA.y,
                    dimsA.width,
                    dimsA.height,
                    projectedB.x,
                    projectedB.y,
                    radiusA,
                );
                const edgeB = getEdgePoint(
                    projectedB.x,
                    projectedB.y,
                    dimsB.width,
                    dimsB.height,
                    projectedA.x,
                    projectedA.y,
                    radiusB,
                );

                const minX = Math.min(edgeA.x, edgeB.x);
                const maxX = Math.max(edgeA.x, edgeB.x);
                const minY = Math.min(edgeA.y, edgeB.y);
                const maxY = Math.max(edgeA.y, edgeB.y);

                if (
                    maxX < -margin ||
                    minX > width + margin ||
                    maxY < -margin ||
                    minY > height + margin
                ) {
                    continue;
                }

                const avgZ = (projectedA.z + projectedB.z) / 2;
                const {r, g, b} = getCardColor({z: avgZ} as ProjectedNodeWithIndex, scaleFactor);
                const headRadius = 2.2 * ((projectedA.scale + projectedB.scale) / 2) * scaleFactor;

                renderList.push({
                    type: 'line',
                    z: avgZ,
                    edgeA,
                    edgeB,
                    eased,
                    progress,
                    r,
                    g,
                    b,
                    headRadius,
                    lineWidth,
                });
            }

            for (let pi = 0; pi < projected.length; pi++) {
                const p = projected[pi];
                if (p.y < -200 || p.y > height + 200 || p.x < -100 || p.x > width + 100) {
                    continue;
                }
                renderList.push({type: 'node', z: p.z, node: p});
            }

            renderList.sort((a, b) => b.z - a.z);

            for (let i = 0; i < renderList.length; i++) {
                const item = renderList[i];
                if (item.type === 'line') {
                    // Вычисляем направление линии
                    const dx = item.edgeB.x - item.edgeA.x;
                    const dy = item.edgeB.y - item.edgeA.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist === 0) continue;

                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Компенсация lineCap: 'round' — сдвигаем оба конца на lineWidth/2 внутрь
                    const lineHalfWidth = item.lineWidth / 2;
                    const startX = item.edgeA.x + nx * lineHalfWidth;
                    const startY = item.edgeA.y + ny * lineHalfWidth;

                    const currentEndX = item.edgeA.x + dx * item.eased;
                    const currentEndY = item.edgeA.y + dy * item.eased;
                    const endX = currentEndX - nx * lineHalfWidth;
                    const endY = currentEndY - ny * lineHalfWidth;

                    // Проверяем, что линия не стала отрицательной длины
                    const adjustedDist = Math.sqrt(
                        Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2),
                    );
                    if (adjustedDist <= 0) continue;

                    ctx.lineCap = 'round';
                    ctx.lineWidth = item.lineWidth;
                    ctx.strokeStyle = `rgb(${item.r}, ${item.g}, ${item.b})`;

                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();

                    if (item.progress < 1) {
                        ctx.fillStyle = `rgb(${item.r}, ${item.g}, ${item.b})`;
                        ctx.beginPath();
                        ctx.arc(currentEndX, currentEndY, item.headRadius, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else {
                    drawLabel(ctx, item.node, zoom, t, 0, item.node.index, scaleFactor, 0);
                }
            }

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
