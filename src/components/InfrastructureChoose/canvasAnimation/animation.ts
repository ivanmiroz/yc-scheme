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

// Фон буфера канваса. Должен совпадать с CSS-фоном .network-singularity__canvas,
// чтобы при alpha: false заливка не давала чёрных кадров.
const CANVAS_BG_COLOR = '#e9ecf5';

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

    // --- Двойная буферизация --------------------------------------------
    // Все слои рисуются в offscreen-буфер, а в видимый канвас в конце
    // каждого кадра идёт один атомарный drawImage. Chrome не может
    // показать промежуточный (пустой/частичный) кадр.
    const bufferCanvas = document.createElement('canvas');
    let bufferCtx: CanvasRenderingContext2D | null = null;

    const ensureBuffer = (): CanvasRenderingContext2D | null => {
        if (bufferCanvas.width !== canvas.width) bufferCanvas.width = canvas.width;
        if (bufferCanvas.height !== canvas.height) bufferCanvas.height = canvas.height;
        if (!bufferCtx) {
            bufferCtx = bufferCanvas.getContext('2d', {alpha: false});
        }
        return bufferCtx;
    };
    // --------------------------------------------------------------------

    // Offscreen для fading-слоя в обратной анимации (позиции + линии).
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

    const updatePodiums = (drawCtx: CanvasRenderingContext2D, elapsed: number): boolean => {
        let allFinished = true;
        const progress = Math.min(elapsed / ANIMATION_CONFIG.PLATFORM_DURATION, 1);
        const easedProgress = easeOutCubic(progress);

        if (progress < 1) {
            allFinished = false;
        }

        drawCtx.save();
        resetCtxState(drawCtx);

        for (let i = podiums.length - 1; i >= 0; i--) {
            const p = podiums[i];
            const startY = getStartY(p.scaledHeight);
            p.currentY = startY + (p.targetY - startY) * easedProgress;

            const img = podiumImages[p.id];
            if (img && img.complete && img.naturalWidth > 0) {
                drawCtx.drawImage(img, p.currentX, p.currentY, p.scaledWidth, p.scaledHeight);
            }
        }

        drawCtx.restore();
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

    const drawAllConnections = (
        drawCtx: CanvasRenderingContext2D,
        timestamp: number,
        width: number,
    ) => {
        if (connectionsAnimationStarted) {
            const connectionsElapsed = timestamp - connectionsStartTime;
            drawCtx.save();
            resetCtxState(drawCtx);
            drawConnections(drawCtx, podiums, connectionsElapsed, width, activeLegend);
            drawCtx.restore();
        }

        if (schemeLinesAnimationStarted) {
            const schemeLinesElapsed = timestamp - schemeLinesStartTime;
            const progresses = schemeLineParams.map(({delay, duration}) => {
                const localElapsed = Math.max(0, schemeLinesElapsed - delay);
                const localProgress = Math.min(localElapsed / duration, 1);
                return easeOutCubic(localProgress);
            });
            drawCtx.save();
            resetCtxState(drawCtx);
            drawSchemeLines(drawCtx, positions, progresses, width, activeLegend, podiums);
            drawCtx.restore();
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
        const bufCtx = ensureBuffer();
        if (!bufCtx) return true;

        const dpr = getEffectiveDpr();
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        // 1. Фон в буфере.
        bufCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        bufCtx.fillStyle = CANVAS_BG_COLOR;
        bufCtx.fillRect(0, 0, width, height);
        resetCtxState(bufCtx);
        bufCtx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, dpr * view.x, dpr * view.y);

        const elapsed = timestamp - reverseStartTime;
        const fadeDuration = REVERSE_FADE_DURATION_MS;
        const collapseDuration = ANIMATION_CONFIG.PLATFORM_DURATION;
        const totalDuration = fadeDuration + collapseDuration;

        const fadeProgress = Math.min(elapsed / fadeDuration, 1);
        const moveProgress = Math.min(Math.max(elapsed - fadeDuration, 0) / collapseDuration, 1);
        const fadeAlpha = 1 - easeOutCubic(fadeProgress);
        const moveEased = easeOutCubic(1 - moveProgress);

        // 2. Подиумы — в буфер.
        bufCtx.save();
        resetCtxState(bufCtx);
        for (let i = podiums.length - 1; i >= 0; i--) {
            const p = podiums[i];
            const startY = getStartY(p.scaledHeight);
            p.currentY = startY + (p.targetY - startY) * moveEased;

            const img = podiumImages[p.id];
            if (img && img.complete && img.naturalWidth > 0) {
                bufCtx.drawImage(img, p.currentX, p.currentY, p.scaledWidth, p.scaledHeight);
            }
        }
        bufCtx.restore();

        // 3. Fading-слой (позиции + линии) — в отдельный offscreen,
        //    затем накладываем его на буфер с прозрачностью fadeAlpha.
        if (fadeAlpha > 0) {
            if (!reverseOffscreen) {
                reverseOffscreen = document.createElement('canvas');
            }

            const pw = canvas.width;
            const ph = canvas.height;
            if (reverseOffscreen.width !== pw) reverseOffscreen.width = pw;
            if (reverseOffscreen.height !== ph) reverseOffscreen.height = ph;

            const offCtx = reverseOffscreen.getContext('2d', {alpha: false});
            if (offCtx) {
                offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
                offCtx.fillStyle = CANVAS_BG_COLOR;
                offCtx.fillRect(0, 0, width, height);
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

                bufCtx.setTransform(1, 0, 0, 1, 0, 0);
                bufCtx.save();
                Object.assign(bufCtx, {globalAlpha: fadeAlpha});
                bufCtx.drawImage(reverseOffscreen, 0, 0);
                bufCtx.restore();
            }
        }

        // 4. Атомарный вывод буфера в видимый канвас.
        // eslint-disable-next-line no-param-reassign
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // eslint-disable-next-line no-param-reassign
        ctx.globalAlpha = 1;
        ctx.drawImage(bufferCanvas, 0, 0);

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

        const bufCtx = ensureBuffer();
        if (!bufCtx) return true;

        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        const dpr = getEffectiveDpr();
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        // 1. Фон.
        bufCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        bufCtx.fillStyle = CANVAS_BG_COLOR;
        bufCtx.fillRect(0, 0, width, height);
        resetCtxState(bufCtx);
        bufCtx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, dpr * view.x, dpr * view.y);

        // 2. Все слои — в буфер.
        const allPlatformsFinished = updatePodiums(bufCtx, elapsed);
        ensurePositionsStarted(timestamp, allPlatformsFinished);

        const allPositionsFinished = updatePositionOpacities(timestamp);

        if (positions.length > 0 && positionOpacities.length === positions.length) {
            bufCtx.save();
            resetCtxState(bufCtx);
            drawPositions(bufCtx, positions, positionOpacities, width);
            bufCtx.restore();
        }

        ensureConnectionsStarted(timestamp, allPlatformsFinished, allPositionsFinished);
        drawAllConnections(bufCtx, timestamp, width);

        // 3. Атомарный вывод буфера в видимый канвас.
        // eslint-disable-next-line no-param-reassign
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // eslint-disable-next-line no-param-reassign
        ctx.globalAlpha = 1;
        ctx.drawImage(bufferCanvas, 0, 0);

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
        // Если платформы ещё не инициализированы (первая загрузка,
        // картинки ещё грузятся), выходим. Иначе мы заблокируем состояние
        // пустым массивом, что и вызывает мерцание при первой загрузке.
        if (podiums.length === 0) return;

        positions = calculatePositions(podiums, getActiveSchemeIndex());

        // Случайные задержки — чтобы иконки проявлялись волной, а не все разом.
        positionAnimParams = positions.map(() => {
            const randomDelay = Math.random() * POSITION_ANIMATION_CONFIG.MAX_RANDOM_DELAY;
            return {
                delay: POSITION_ANIMATION_CONFIG.BASE_DELAY + randomDelay,
                duration: POSITION_ANIMATION_CONFIG.DURATION,
            };
        });

        // Иконки появляются заново через fade-in, как при первом показе.
        positionOpacities = new Array(positions.length).fill(0);
        positionsAnimationStarted = true;
        positionsStartTime = performance.now();

        // Соединения и линии схемы стартуют после того, как проявятся
        // позиции — поэтому их пока не запускаем: ensureConnectionsStarted
        // в renderFrame сделает это сам.
        connectionsAnimationStarted = false;
        connectionsStartTime = 0;

        schemeLinesAnimationStarted = false;
        schemeLinesStartTime = 0;
        schemeLineParams = buildSchemeLineParams();
        schemeLinesTotalDuration = calcSchemeLinesTotal(schemeLineParams);

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
        bufferCtx = null;
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
