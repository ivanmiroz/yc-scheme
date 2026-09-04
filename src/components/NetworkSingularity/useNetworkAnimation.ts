// src/components/NetworkSingularity/useNetworkAnimation.ts
import {useEffect, useRef, useState} from 'react';

import {
    COLLAPSE_END_MS,
    COLLAPSE_START_MS,
    COLORING_DURATION_MS,
    COLORING_START_MS,
    FADE_DURATION_MS,
    PAUSE_BETWEEN_CYCLES_MS,
    SHAKE_DURATION_MS,
    SPHERE_RADIUS,
} from './constants';
import {project} from './geometry';
import {drawLabel} from './renderer';
import {generateConnections, generateNodes} from './scene';
import type {Connection, Node3D, Phase, ProjectedNode} from './types';

interface AnimationState {
    nodeCount: number;
    connectionCount: number;
}

export const useNetworkAnimation = (
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    subtitleRef: React.RefObject<HTMLDivElement | null>,
    indicatorRef: React.RefObject<HTMLDivElement | null>,
): AnimationState => {
    const animationRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const [nodeCount, setNodeCount] = useState(0);
    const [connectionCount, setConnectionCount] = useState(0);

    const mouseRef = useRef({isDown: false, lastX: 0, lastY: 0});
    const rotationRef = useRef({x: 0.3, y: 0});
    const zoomRef = useRef(1);
    const velocityRef = useRef({x: 0, y: 0});

    const updateSubtitle = (text: string, isCritical: boolean) => {
        const subtitleEl = subtitleRef.current;
        const indicatorEl = indicatorRef.current;
        if (!subtitleEl || !indicatorEl) return;

        subtitleEl.textContent = text;

        if (isCritical) {
            subtitleEl.style.color = '#ff5050';
            subtitleEl.style.opacity = '1';
            subtitleEl.style.textShadow = '0 0 10px rgba(255, 80, 80, 0.5)';

            indicatorEl.style.background = '#ff5050';
            indicatorEl.style.boxShadow = '0 0 8px rgba(255, 80, 80, 0.8)';
            indicatorEl.style.animation = 'pulse-dot 1s ease-in-out infinite';
        } else {
            subtitleEl.style.color = '#fff';
            subtitleEl.style.opacity = '0.6';
            subtitleEl.style.textShadow = 'none';

            indicatorEl.style.background = '#7ab8ff';
            indicatorEl.style.boxShadow = 'none';
            indicatorEl.style.animation = 'none';
        }
    };

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

        let nodes: Node3D[] = [];
        let connections: Connection[] = [];
        let currentPhase: Phase = 'building';

        const initScene = () => {
            nodes = generateNodes();
            connections = generateConnections(nodes);
            currentPhase = 'building';
            updateSubtitle('Формирование сети', false);
            setNodeCount(0);
            setConnectionCount(0);
        };

        initScene();

        const animate = (time: number) => {
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            const centerX = width / 2;
            const centerY = height / 2;

            ctx.clearRect(0, 0, width, height);

            const t = time - startTimeRef.current;

            const isColoring = t >= COLORING_START_MS;
            const shakeStart = COLORING_START_MS + COLORING_DURATION_MS;
            const isShaking = t >= shakeStart && t < COLLAPSE_START_MS;
            const isFading = t >= COLLAPSE_START_MS;

            if (t >= COLLAPSE_START_MS && currentPhase !== 'collapsing') {
                currentPhase = 'collapsing';
                updateSubtitle('Распад сети', true);
            } else if (t >= COLORING_START_MS && currentPhase === 'building') {
                currentPhase = 'coloring';
                updateSubtitle('Критическая связь', true);
            }

            const fadeOpacity = isFading
                ? Math.max(0, 1 - (t - COLLAPSE_START_MS) / FADE_DURATION_MS)
                : 1;

            if (fadeOpacity <= 0 && t >= COLLAPSE_END_MS) {
                if (t < COLLAPSE_END_MS + PAUSE_BETWEEN_CYCLES_MS) {
                    ctx.globalAlpha = 1;
                    ctx.fillStyle = '#05070f';
                    ctx.fillRect(0, 0, width, height);
                    animationRef.current = requestAnimationFrame(animate);
                    return undefined;
                }

                startTimeRef.current = time;
                initScene();

                rotationRef.current = {x: 0.3, y: 0};
                zoomRef.current = 1;
                velocityRef.current = {x: 0, y: 0};

                animationRef.current = requestAnimationFrame(animate);
                return undefined;
            }

            ctx.globalAlpha = fadeOpacity;

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

            const autoY = 0.00125 + 0.00075 * Math.sin(t * 0.00023);
            const autoX = 0.0006 + 0.00045 * Math.sin(t * 0.00017 + 1.3);

            if (mouseRef.current.isDown || isShaking || isFading) {
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

            const shakeIntensity = isShaking
                ? Math.sin(((t - shakeStart) / SHAKE_DURATION_MS) * Math.PI) * 10
                : 0;

            let visibleNodes = 0;
            let visibleConnections = 0;

            ctx.lineCap = 'round';
            connections.forEach((conn) => {
                const nodeA = nodes[conn.from];
                const nodeB = nodes[conn.to];

                if (t < nodeA.spawnDelay || t < nodeB.spawnDelay) {
                    return;
                }

                const elapsed = t - conn.spawnDelay;
                if (elapsed < 0) {
                    return;
                }

                visibleConnections++;

                const progress = Math.min(1, elapsed / conn.duration);
                const eased = 1 - Math.pow(1 - progress, 3);

                const projectedA = projected[conn.from];
                const projectedB = projected[conn.to];
                const avgZ = (projectedA.z + projectedB.z) / 2;
                const baseOpacity = Math.max(0.04, Math.min(0.55, (SPHERE_RADIUS - avgZ) / 420));

                const isRed = isColoring && t >= conn.colorDelay;
                const opacity = baseOpacity * eased * fadeOpacity;

                const endX = projectedA.x + (projectedB.x - projectedA.x) * eased;
                const endY = projectedA.y + (projectedB.y - projectedA.y) * eased;

                ctx.strokeStyle = isRed
                    ? `rgba(255, 80, 80, ${opacity})`
                    : `rgba(120, 180, 255, ${opacity})`;
                ctx.lineWidth = 0.7 * ((projectedA.scale + projectedB.scale) / 2);
                ctx.beginPath();
                ctx.moveTo(projectedA.x, projectedA.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();

                if (progress < 1 && !isRed) {
                    const headOpacity = (1 - progress) * 0.9;
                    const headRadius = 2.2 * ((projectedA.scale + projectedB.scale) / 2);
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
            sorted.forEach((p) => {
                const isRed = isColoring && t >= p.colorDelay;
                const appeared = drawLabel(ctx, p, zoom, t, shakeIntensity, isRed, fadeOpacity);
                if (appeared) {
                    visibleNodes++;
                }
            });

            setNodeCount((prev) => (prev === visibleNodes ? prev : visibleNodes));
            setConnectionCount((prev) => (prev === visibleConnections ? prev : visibleConnections));

            ctx.globalAlpha = 1;
            animationRef.current = requestAnimationFrame(animate);
            return undefined;
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
        canvas.addEventListener('touchstart', handleTouchStart, {
            passive: true,
        });
        canvas.addEventListener('touchmove', handleTouchMove, {
            passive: false,
        });
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
    }, [canvasRef, subtitleRef, indicatorRef]);

    return {
        nodeCount,
        connectionCount,
    };
};
