import {useEffect, useRef} from 'react';

import {
    BASE_CANVAS_SIZE,
    CONNECTIONS_FADE_DURATION_MS, // ← добавлено
    FALL_DURATION_MS,
    MAX_SCALE_FACTOR,
    PAUSE_BETWEEN_CYCLES_MS,
    REDDEN_DELAY_MS,
    REDDEN_DURATION_MS,
    SPHERE_RADIUS,
} from './constants';
import {project} from './geometry';
import {drawLabel} from './renderer';
import {generateConnections, generateNodes} from './scene';
import type {Connection, Node3D, ProjectedNode} from './types';

type ProjectedNodeWithIndex = ProjectedNode & {index: number; fallDelay: number};

export const useNetworkAnimation = (canvasRef: React.RefObject<HTMLCanvasElement | null>): void => {
    const animationRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const mouseRef = useRef({isDown: false, lastX: 0, lastY: 0});
    const rotationRef = useRef({x: 0.3, y: 0});
    const zoomRef = useRef(1);
    const velocityRef = useRef({x: 0, y: 0});
    const dprRef = useRef(1);
    const scaleFactorRef = useRef(1);

    const connectionsEndTimeRef = useRef<number>(0);
    const cycleEndRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        const ctx = canvas.getContext('2d');
        if (!ctx) return undefined;

        startTimeRef.current = performance.now();

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const MAX_DIMENSION = 2560;
            const dpr = Math.min(
                window.devicePixelRatio || 1,
                MAX_DIMENSION / Math.max(rect.width, rect.height),
            );

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

            connectionsEndTimeRef.current = connections.reduce(
                (max, conn) => Math.max(max, conn.spawnDelay + conn.duration),
                0,
            );

            const redStart = connectionsEndTimeRef.current + REDDEN_DELAY_MS;
            const fallStart = redStart + REDDEN_DURATION_MS;
            const maxFallDelay = nodes.reduce((max, n) => Math.max(max, n.fallDelay), 0);
            cycleEndRef.current = fallStart + FALL_DURATION_MS + maxFallDelay;
        };

        initScene();

        const animate = (time: number) => {
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            const centerX = width / 2;
            const centerY = height / 2;
            const scaleFactor = scaleFactorRef.current;

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
            ctx.clearRect(0, 0, width, height);

            const t = time - startTimeRef.current;

            const connectionsEndTime = connectionsEndTimeRef.current;
            const redStart = connectionsEndTime + REDDEN_DELAY_MS;
            const fallStart = redStart + REDDEN_DURATION_MS;
            const cycleEnd = cycleEndRef.current;

            const isReddening = t >= redStart && t < fallStart;
            const isFalling = t >= fallStart;

            const redProgress =
                isReddening || isFalling ? Math.min(1, (t - redStart) / REDDEN_DURATION_MS) : 0;

            // 🔑 Плавное появление и исчезновение связей
            // Связи полностью исчезают к моменту начала падения
            let connectionsFade = 1;
            if (t < redStart) {
                // Фаза прорастания — связи видимы
                connectionsFade = 1;
            } else if (t < fallStart - CONNECTIONS_FADE_DURATION_MS) {
                // Фаза покраснения (до начала затухания) — связи видимы
                connectionsFade = 1;
            } else if (t < fallStart) {
                // Плавное исчезновение в конце покраснения
                connectionsFade = Math.max(0, (fallStart - t) / CONNECTIONS_FADE_DURATION_MS);
            } else {
                // Фаза падения — связей больше нет
                connectionsFade = 0;
            }

            // Перезапуск цикла
            if (t >= cycleEnd) {
                if (t < cycleEnd + PAUSE_BETWEEN_CYCLES_MS) {
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

            ctx.globalAlpha = 1;

            const autoY = 0.00125 + 0.00075 * Math.sin(t * 0.00023);
            const autoX = 0.0006 + 0.00045 * Math.sin(t * 0.00017 + 1.3);

            if (mouseRef.current.isDown || isReddening || isFalling) {
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
            }));

            // 🔑 Пропускаем отрисовку связей, если они полностью исчезли
            if (connectionsFade > 0) {
                ctx.lineCap = 'round';
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
                    const avgZ = (projectedA.z + projectedB.z) / 2;
                    const baseOpacity = Math.max(
                        0.04,
                        Math.min(0.55, (SPHERE_RADIUS * scaleFactor - avgZ) / (420 * scaleFactor)),
                    );

                    const fallProgressA = isFalling
                        ? Math.min(
                              1,
                              Math.max(
                                  0,
                                  (t - fallStart - projectedA.fallDelay) / FALL_DURATION_MS,
                              ),
                          )
                        : 0;
                    const fallProgressB = isFalling
                        ? Math.min(
                              1,
                              Math.max(
                                  0,
                                  (t - fallStart - projectedB.fallDelay) / FALL_DURATION_MS,
                              ),
                          )
                        : 0;

                    const fallOffsetYA = fallProgressA * (height + 1000);
                    const fallOffsetYB = fallProgressB * (height + 1000);

                    const avgFallProgress = (fallProgressA + fallProgressB) / 2;
                    const fadeOpacity = isFalling ? Math.max(0, 1 - avgFallProgress) : 1;

                    // 🔑 Применяем connectionsFade к итоговой прозрачности
                    const opacity = baseOpacity * eased * fadeOpacity * connectionsFade;

                    ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
                    ctx.lineWidth = 4 * scaleFactor;

                    const fallYA = projectedA.y + fallOffsetYA;
                    const fallYB = projectedB.y + fallOffsetYB;

                    const currentEndX = projectedA.x + (projectedB.x - projectedA.x) * eased;
                    const currentEndY = fallYA + (fallYB - fallYA) * eased;

                    ctx.beginPath();
                    ctx.moveTo(projectedA.x, fallYA);
                    ctx.lineTo(currentEndX, currentEndY);
                    ctx.stroke();

                    if (progress < 1) {
                        // 🔑 "Голова" линии тоже затухает вместе с connectionsFade
                        const headOpacity = (1 - progress) * 0.9 * connectionsFade;
                        const headRadius =
                            2.2 * ((projectedA.scale + projectedB.scale) / 2) * scaleFactor;

                        ctx.save();
                        ctx.shadowBlur = headRadius * 4;
                        ctx.shadowColor = `rgba(0, 0, 0, ${headOpacity})`;
                        ctx.fillStyle = `rgba(0, 0, 0, ${headOpacity})`;
                        ctx.beginPath();
                        ctx.arc(currentEndX, currentEndY, headRadius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                });
            }

            projected.sort((node1, node2) => node2.z - node1.z);

            projected.forEach((p) => {
                const fallProgress = isFalling
                    ? Math.min(1, Math.max(0, (t - fallStart - p.fallDelay) / FALL_DURATION_MS))
                    : 0;

                const fallOffsetY = fallProgress * (height + 1000);
                const fadeOpacity = isFalling ? Math.max(0, 1 - fallProgress) : 1;

                if (
                    p.y + fallOffsetY < -200 ||
                    p.y + fallOffsetY > height + 200 ||
                    p.x < -100 ||
                    p.x > width + 100
                ) {
                    return;
                }

                drawLabel(
                    ctx,
                    p,
                    zoom,
                    t,
                    0,
                    fadeOpacity,
                    p.index,
                    scaleFactor,
                    redProgress,
                    fallOffsetY,
                );
            });

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
    }, [canvasRef]);
};
