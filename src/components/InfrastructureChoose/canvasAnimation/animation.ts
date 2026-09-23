// src/components/InfrastructureChoose/canvasAnimation/animation.ts
import {PodiumState, Position} from './types';
import {
    ANIMATION_CONFIG,
    POSITION_ANIMATION_CONFIG,
    SCHEME_LINES_ANIMATION_CONFIG,
    getEffectiveDpr,
} from './constants';
import {calculatePositions} from './positions';
import {
    drawConnections,
    drawPositions,
    drawSchemeLines,
    getConnectionsTotalDuration,
    isPointOverPosition,
} from './drawers';
import {
    LegendValue,
    getActiveSchemeIndex,
    getActiveSchemeLines,
    getPositionConfig,
} from './schemes';
import {getIconBackground} from './iconBackgrounds';
import {loadAllIcons} from './icons';

interface AnimationParams {
    delay: number;
    duration: number;
}

export interface ViewState {
    scale: number;
    x: number;
    y: number;
}

export interface PodiumAnimatorCallbacks {
    onStart?: () => void;
    onReady?: () => void;
}

export interface InitPodiumsOptions {
    skipIntro?: boolean;
}

const SKIP_INTRO_TIME_OFFSET = 100000;
const REVERSE_FADE_DURATION_MS = 500;

export const createPodiumAnimator = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    podiumImages: HTMLImageElement[],
    callbacks: PodiumAnimatorCallbacks = {},
) => {
    let podiums: PodiumState[] = [];
    let animationFrameId: number | null = null;
    let pendingRedrawFrame: number | null = null;
    let startTime: number | null = null;

    let positions: Position[] = [];
    let positionAnimParams: AnimationParams[] = [];
    let positionOpacities: number[] = [];
    let positionsAnimationStarted = false;
    let positionsStartTime = 0;
    let iconsLoaded = false;

    let connectionsAnimationStarted = false;
    let connectionsStartTime = 0;

    let schemeLinesAnimationStarted = false;
    let schemeLinesStartTime = 0;
    let schemeLineParams: AnimationParams[] = [];
    let schemeLinesTotalDuration = 0;

    let activeLegend: LegendValue | null = null;
    let readyNotified = false;

    let reverseStarted = false;
    let reverseStartTime = 0;
    let onReverseCompleteCallback: (() => void) | null = null;
    let reverseOffscreen: HTMLCanvasElement | null = null;

    const view: ViewState = {scale: 1, x: 0, y: 0};

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const screenToWorld = (sx: number, sy: number) => ({
        x: (sx - view.x) / view.scale,
        y: (sy - view.y) / view.scale,
    });

    const buildSchemeLineParams = (): AnimationParams[] => {
        const lines = getActiveSchemeLines();
        return lines.map(() => {
            const randomDelay = Math.random() * SCHEME_LINES_ANIMATION_CONFIG.MAX_RANDOM_DELAY;
            return {
                delay: SCHEME_LINES_ANIMATION_CONFIG.BASE_DELAY + randomDelay,
                duration: SCHEME_LINES_ANIMATION_CONFIG.DURATION,
            };
        });
    };

    const calcSchemeLinesTotal = (params: AnimationParams[]) =>
        params.reduce((max, p) => Math.max(max, p.delay + p.duration), 0);

    const getStartY = (scaledHeight: number): number => {
        const dpr = getEffectiveDpr();
        const canvasHeight = canvas.height / dpr;
        return canvasHeight / 2 - scaledHeight / 2;
    };

    const resetCtxState = (c: CanvasRenderingContext2D) => {
        Object.assign(c, {
            globalAlpha: 1,
            filter: 'none',
            globalCompositeOperation: 'source-over',
            shadowBlur: 0,
            shadowColor: 'rgba(0, 0, 0, 0)',
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            lineCap: 'butt',
            lineJoin: 'miter',
            lineWidth: 1,
            miterLimit: 10,
        });
    };

    const resetContextState = () => resetCtxState(ctx);

    const updatePodiums = (elapsed: number): boolean => {
        let allFinished = true;
        const progress = Math.min(elapsed / ANIMATION_CONFIG.PLATFORM_DURATION, 1);
        const easedProgress = easeOutCubic(progress);

        if (progress < 1) {
            allFinished = false;
        }

        ctx.save();
        resetContextState();

        for (let i = podiums.length - 1; i >= 0; i--) {
            const p = podiums[i];
            const startY = getStartY(p.scaledHeight);
            p.currentY = startY + (p.targetY - startY) * easedProgress;

            const img = podiumImages[p.id];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, p.currentX, p.currentY, p.scaledWidth, p.scaledHeight);
            }
        }

        ctx.restore();
        return allFinished;
    };

    const ensurePositionsStarted = (timestamp: number, allPlatformsFinished: boolean) => {
        if (!allPlatformsFinished || positionsAnimationStarted) return;

        positionsAnimationStarted = true;
        positionsStartTime = timestamp;
        positions = calculatePositions(podiums, getActiveSchemeIndex());
        positionAnimParams = positions.map(() => {
            const randomDelay = Math.random() * POSITION_ANIMATION_CONFIG.MAX_RANDOM_DELAY;
            return {
                delay: POSITION_ANIMATION_CONFIG.BASE_DELAY + randomDelay,
                duration: POSITION_ANIMATION_CONFIG.DURATION,
            };
        });
        positionOpacities = new Array(positions.length).fill(0);
    };

    const updatePositionOpacities = (timestamp: number): boolean => {
        if (!positionsAnimationStarted) return false;

        const positionElapsed = timestamp - positionsStartTime;
        positionOpacities = positions.map((_, index) => {
            const {delay, duration} = positionAnimParams[index];
            const localElapsed = Math.max(0, positionElapsed - delay);
            const localProgress = Math.min(localElapsed / duration, 1);
            return easeOutCubic(localProgress);
        });

        return positionOpacities.every((op) => op >= 1);
    };

    const ensureConnectionsStarted = (
        timestamp: number,
        allPlatformsFinished: boolean,
        allPositionsFinished: boolean,
    ) => {
        if (
            !allPlatformsFinished ||
            !positionsAnimationStarted ||
            !allPositionsFinished ||
            connectionsAnimationStarted
        ) {
            return;
        }

        connectionsAnimationStarted = true;
        connectionsStartTime = timestamp;

        schemeLinesAnimationStarted = true;
        schemeLinesStartTime = timestamp;
        schemeLineParams = buildSchemeLineParams();
        schemeLinesTotalDuration = calcSchemeLinesTotal(schemeLineParams);
    };

    const drawAllConnections = (timestamp: number, width: number) => {
        if (connectionsAnimationStarted) {
            const connectionsElapsed = timestamp - connectionsStartTime;
            ctx.save();
            resetContextState();
            drawConnections(ctx, podiums, connectionsElapsed, width, activeLegend);
            ctx.restore();
        }

        if (schemeLinesAnimationStarted) {
            const schemeLinesElapsed = timestamp - schemeLinesStartTime;
            const progresses = schemeLineParams.map(({delay, duration}) => {
                const localElapsed = Math.max(0, schemeLinesElapsed - delay);
                const localProgress = Math.min(localElapsed / duration, 1);
                return easeOutCubic(localProgress);
            });
            ctx.save();
            resetContextState();
            drawSchemeLines(ctx, positions, progresses, width, activeLegend, podiums);
            ctx.restore();
        }
    };

    const areConnectionsFinished = (timestamp: number): boolean => {
        const allConnectionsFinished =
            connectionsAnimationStarted &&
            timestamp - connectionsStartTime >= getConnectionsTotalDuration();

        const allSchemeLinesFinished =
            schemeLinesAnimationStarted &&
            timestamp - schemeLinesStartTime >= schemeLinesTotalDuration;

        return allConnectionsFinished && allSchemeLinesFinished;
    };

    const renderReverseFrame = (timestamp: number): boolean => {
        const dpr = getEffectiveDpr();
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        resetContextState();
        ctx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, dpr * view.x, dpr * view.y);

        const elapsed = timestamp - reverseStartTime;
        const fadeDuration = REVERSE_FADE_DURATION_MS;
        const collapseDuration = ANIMATION_CONFIG.PLATFORM_DURATION;
        const totalDuration = fadeDuration + collapseDuration;

        const fadeProgress = Math.min(elapsed / fadeDuration, 1);
        const moveProgress = Math.min(Math.max(elapsed - fadeDuration, 0) / collapseDuration, 1);
        const fadeAlpha = 1 - easeOutCubic(fadeProgress);
        const moveEased = easeOutCubic(1 - moveProgress);

        ctx.save();
        resetContextState();
        for (let i = podiums.length - 1; i >= 0; i--) {
            const p = podiums[i];
            const startY = getStartY(p.scaledHeight);
            p.currentY = startY + (p.targetY - startY) * moveEased;

            const img = podiumImages[p.id];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, p.currentX, p.currentY, p.scaledWidth, p.scaledHeight);
            }
        }
        ctx.restore();

        if (fadeAlpha > 0) {
            if (!reverseOffscreen) {
                reverseOffscreen = document.createElement('canvas');
            }

            const pw = canvas.width;
            const ph = canvas.height;
            if (reverseOffscreen.width !== pw) reverseOffscreen.width = pw;
            if (reverseOffscreen.height !== ph) reverseOffscreen.height = ph;

            const offCtx = reverseOffscreen.getContext('2d');
            if (offCtx) {
                offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
                offCtx.clearRect(0, 0, width, height);
                offCtx.setTransform(
                    dpr * view.scale,
                    0,
                    0,
                    dpr * view.scale,
                    dpr * view.x,
                    dpr * view.y,
                );

                if (positions.length > 0 && positionOpacities.length === positions.length) {
                    offCtx.save();
                    resetCtxState(offCtx);
                    drawPositions(offCtx, positions, positionOpacities, width);
                    offCtx.restore();
                }

                if (connectionsAnimationStarted) {
                    const connectionsElapsed = timestamp - connectionsStartTime;
                    offCtx.save();
                    resetCtxState(offCtx);
                    drawConnections(offCtx, podiums, connectionsElapsed, width, activeLegend);
                    offCtx.restore();
                }

                if (schemeLinesAnimationStarted) {
                    const progresses = schemeLineParams.map(() => 1);
                    offCtx.save();
                    resetCtxState(offCtx);
                    drawSchemeLines(offCtx, positions, progresses, width, activeLegend, podiums);
                    offCtx.restore();
                }

                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.save();
                Object.assign(ctx, {globalAlpha: fadeAlpha});
                ctx.drawImage(reverseOffscreen, 0, 0);
                ctx.restore();
            }
        }

        if (elapsed >= totalDuration) {
            reverseStarted = false;
            animationFrameId = null;
            const onDone = onReverseCompleteCallback;
            onReverseCompleteCallback = null;
            onDone?.();
            return true;
        }

        return false;
    };

    const renderFrame = (timestamp: number): boolean => {
        if (reverseStarted) {
            return renderReverseFrame(timestamp);
        }

        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        const dpr = getEffectiveDpr();
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        resetContextState();
        ctx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, dpr * view.x, dpr * view.y);

        const allPlatformsFinished = updatePodiums(elapsed);
        ensurePositionsStarted(timestamp, allPlatformsFinished);

        const allPositionsFinished = updatePositionOpacities(timestamp);

        if (positions.length > 0 && positionOpacities.length === positions.length) {
            ctx.save();
            resetContextState();
            drawPositions(ctx, positions, positionOpacities, width);
            ctx.restore();
        }

        ensureConnectionsStarted(timestamp, allPlatformsFinished, allPositionsFinished);
        drawAllConnections(timestamp, width);

        return (
            allPlatformsFinished &&
            positionsAnimationStarted &&
            allPositionsFinished &&
            areConnectionsFinished(timestamp)
        );
    };

    const animate = (timestamp: number) => {
        const allFinished = renderFrame(timestamp);
        if (allFinished) {
            animationFrameId = null;
            if (!readyNotified) {
                readyNotified = true;
                callbacks.onReady?.();
            }
        } else {
            animationFrameId = requestAnimationFrame(animate);
        }
    };

    const cancelPendingRedraw = () => {
        if (pendingRedrawFrame !== null) {
            cancelAnimationFrame(pendingRedrawFrame);
            pendingRedrawFrame = null;
        }
    };

    const requestRedraw = () => {
        if (animationFrameId) return;
        if (pendingRedrawFrame !== null) return;

        pendingRedrawFrame = requestAnimationFrame((ts) => {
            pendingRedrawFrame = null;
            if (animationFrameId) return;
            renderFrame(ts);
        });
    };

    const setView = (next: Partial<ViewState>) => {
        if (typeof next.scale === 'number') view.scale = next.scale;
        if (typeof next.x === 'number') view.x = next.x;
        if (typeof next.y === 'number') view.y = next.y;
        requestRedraw();
    };

    const getView = (): ViewState => ({...view});

    const setActiveLegend = (legend: LegendValue | null) => {
        if (activeLegend === legend) return;
        activeLegend = legend;
        requestRedraw();
    };

    const redrawIfComplete = () => {
        if (!positionsAnimationStarted) return;
        const allPositionsFinished = positionOpacities.every((op) => op >= 1);
        if (allPositionsFinished && iconsLoaded) {
            requestRedraw();
        }
    };

    const initPodiums = (initOptions: InitPodiumsOptions = {}) => {
        const skipIntro = initOptions.skipIntro ?? false;

        if (podiumImages.length === 0) return;

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        cancelPendingRedraw();

        reverseStarted = false;
        reverseStartTime = 0;
        onReverseCompleteCallback = null;
        readyNotified = false;
        callbacks.onStart?.();

        const dpr = getEffectiveDpr();
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        const firstImage = podiumImages[0];
        const imgWidth = firstImage.naturalWidth || firstImage.width || 100;
        const imgHeight = firstImage.naturalHeight || firstImage.height || 100;

        const slotHeight = height / ANIMATION_CONFIG.PLATFORMS_COUNT;

        let scale = slotHeight / imgHeight;
        let scaledWidth = imgWidth * scale;
        let scaledHeight = slotHeight;

        if (scaledWidth > width * 0.9) {
            scale = (width * 0.9) / imgWidth;
            scaledWidth = imgWidth * scale;
            scaledHeight = imgHeight * scale;
        }

        const targetX = (width - scaledWidth) / 2;
        const centerY = height / 2;
        const verticalOffset = height * 0.025;

        podiums = [];
        for (let i = 0; i < ANIMATION_CONFIG.PLATFORMS_COUNT; i++) {
            const yInSlot = (slotHeight - scaledHeight) / 2;
            const baseY = i * slotHeight + yInSlot;
            const targetY = centerY + (baseY - centerY) * 0.8 - verticalOffset;

            podiums.push({
                id: i,
                targetY,
                currentY: skipIntro ? targetY : centerY - scaledHeight / 2,
                targetX,
                currentX: targetX,
                scaledWidth,
                scaledHeight,
            });
        }

        if (skipIntro) {
            positions = calculatePositions(podiums, getActiveSchemeIndex());
            positionAnimParams = positions.map(() => ({delay: 0, duration: 0}));
            positionOpacities = new Array(positions.length).fill(1);
            positionsAnimationStarted = true;
            positionsStartTime = performance.now() - 100000;

            connectionsAnimationStarted = true;
            connectionsStartTime = performance.now() - 100000;

            schemeLineParams = buildSchemeLineParams();
            schemeLinesTotalDuration = calcSchemeLinesTotal(schemeLineParams);
            schemeLinesAnimationStarted = true;
            schemeLinesStartTime = performance.now() - 100000;

            readyNotified = true;
            callbacks.onReady?.();
        } else {
            positionsAnimationStarted = false;
            positionsStartTime = 0;
            positions = [];
            positionAnimParams = [];
            positionOpacities = [];

            connectionsAnimationStarted = false;
            connectionsStartTime = 0;

            schemeLinesAnimationStarted = false;
            schemeLinesStartTime = 0;
            schemeLineParams = [];
            schemeLinesTotalDuration = 0;
        }

        startTime = skipIntro ? performance.now() - SKIP_INTRO_TIME_OFFSET : null;
        animationFrameId = requestAnimationFrame(animate);
    };

    const refreshScheme = () => {
        // КРИТИЧЕСКИ ВАЖНО: Если платформы ещё не инициализированы (первая загрузка,
        // картинки ещё грузятся), выходим. Иначе мы заблокируем состояние пустым массивом,
        // что и вызывает мерцание при первой загрузке.
        if (podiums.length === 0) return;

        positions = calculatePositions(podiums, getActiveSchemeIndex());

        positionAnimParams = positions.map(() => {
            const randomDelay = Math.random() * POSITION_ANIMATION_CONFIG.MAX_RANDOM_DELAY;
            return {
                delay: POSITION_ANIMATION_CONFIG.BASE_DELAY + randomDelay,
                duration: POSITION_ANIMATION_CONFIG.DURATION,
            };
        });

        // Делаем позиции сразу полностью видимыми, чтобы избежать мерцания (fade-in)
        positionOpacities = new Array(positions.length).fill(1);
        positionsAnimationStarted = true;
        positionsStartTime = performance.now() - 100000;

        connectionsAnimationStarted = true;
        connectionsStartTime = performance.now() - 100000;

        // Линии схемы анимируем заново для красивого эффекта переключения
        schemeLineParams = buildSchemeLineParams();
        schemeLinesTotalDuration = calcSchemeLinesTotal(schemeLineParams);
        schemeLinesAnimationStarted = true;
        schemeLinesStartTime = performance.now();

        readyNotified = false;

        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(animate);
        }
    };

    const startReverse = (callback?: () => void) => {
        if (reverseStarted) return;

        reverseStarted = true;
        reverseStartTime = performance.now();
        onReverseCompleteCallback = callback ?? null;
        readyNotified = true;

        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(animate);
        }
    };

    const checkHover = (mouseX: number, mouseY: number): boolean => {
        if (!positionsAnimationStarted || positions.length === 0) return false;

        const dpr = getEffectiveDpr();
        const canvasWidth = canvas.width / dpr;
        const baseWidth = 1920;
        const baseIconSize = 53 * 1.5;
        const iconSize = canvasWidth * (baseIconSize / baseWidth);
        const labelFontSize = canvasWidth * 0.00856;

        const world = screenToWorld(mouseX, mouseY);

        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            const opacity = positionOpacities[i] ?? 0;
            if (opacity <= 0) continue;

            const config = getPositionConfig(pos.positionNumber);
            if (!config || !config.label) continue;
            if (!getIconBackground(config.label)) continue;

            if (isPointOverPosition(world.x, world.y, pos, config, iconSize, labelFontSize)) {
                return true;
            }
        }

        return false;
    };

    const getClickedPosition = (mouseX: number, mouseY: number): Position | null => {
        if (!positionsAnimationStarted || positions.length === 0) return null;

        const dpr = getEffectiveDpr();
        const canvasWidth = canvas.width / dpr;
        const baseWidth = 1920;
        const baseIconSize = 53 * 1.5;
        const iconSize = canvasWidth * (baseIconSize / baseWidth);
        const labelFontSize = canvasWidth * 0.00856;

        const world = screenToWorld(mouseX, mouseY);

        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            const opacity = positionOpacities[i] ?? 0;
            if (opacity <= 0) continue;

            const config = getPositionConfig(pos.positionNumber);
            if (!config || !config.label) continue;
            if (!getIconBackground(config.label)) continue;

            if (isPointOverPosition(world.x, world.y, pos, config, iconSize, labelFontSize)) {
                return pos;
            }
        }

        return null;
    };

    const dispose = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        cancelPendingRedraw();

        reverseStarted = false;
        onReverseCompleteCallback = null;
        reverseOffscreen = null;
    };

    loadAllIcons().then(() => {
        iconsLoaded = true;
        redrawIfComplete();
    });

    return {
        initPodiums,
        getAnimationFrameId: () => animationFrameId,
        refreshScheme,
        checkHover,
        getClickedPosition,
        setView,
        getView,
        requestRedraw,
        setActiveLegend,
        startReverse,
        dispose,
    };
};
