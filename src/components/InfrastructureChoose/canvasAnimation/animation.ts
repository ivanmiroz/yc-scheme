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
import {LegendValue, getActiveSchemeLines, getPositionConfig} from './schemes';
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

export const createPodiumAnimator = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    podiumImages: HTMLImageElement[],
    callbacks: PodiumAnimatorCallbacks = {},
) => {
    let podiums: PodiumState[] = [];
    let animationFrameId: number | null = null;
    // Отдельно от animationFrameId — это запланированная перерисовка
    // вне основного цикла (после панорамирования/зума, когда цикл уже стоит).
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

    // Точка старта платформы по вертикали — центр canvas.
    // Все платформы одновременно «выезжают» из середины и расходятся:
    // верхние — вверх, нижние — вниз.
    const getStartY = (scaledHeight: number): number => {
        const dpr = getEffectiveDpr();
        const canvasHeight = canvas.height / dpr;
        return canvasHeight / 2 - scaledHeight / 2;
    };

    // Сброс всех «липких» состояний 2D-контекста к дефолтным.
    // Используем Object.assign вместо последовательных ctx.<prop> = …,
    // чтобы не триггерить ESLint no-param-reassign (props) — правило
    // ругается на запись в свойства параметра функции.
    const resetContextState = () => {
        Object.assign(ctx, {
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

    const updatePodiums = (elapsed: number): boolean => {
        let allFinished = true;

        // Прогресс одинаковый для всех платформ — они движутся синхронно.
        const progress = Math.min(elapsed / ANIMATION_CONFIG.PLATFORM_DURATION, 1);
        const easedProgress = easeOutCubic(progress);

        if (progress < 1) {
            allFinished = false;
        }

        // Платформы рисуем на чистом состоянии, чтобы «хвосты» от
        // предыдущих слоёв не делали их полупрозрачными.
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
        positions = calculatePositions(podiums);
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
        // Каждый слой — в своём save/restore, чтобы drawers.ts не мог
        // оставить после себя грязное состояние (globalAlpha, filter,
        // composite, shadow, lineWidth) для следующих слоёв этого же кадра.
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
            drawSchemeLines(ctx, positions, progresses, width, activeLegend);
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

    const renderFrame = (timestamp: number): boolean => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        const dpr = getEffectiveDpr();
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        // Чистим состояние после предыдущего кадра. Даже если что-то
        // протекло из drawers.ts и не восстановилось внутри save/restore,
        // на новом кадре мы всё равно начинаем с дефолта.
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

    // Перерисовка одного кадра вне основного цикла (панорамирование/зум).
    // Батчится через RAF: сколько бы pointermove ни приходило в кадре,
    // renderFrame вызовется один раз.
    const requestRedraw = () => {
        if (animationFrameId) return;
        if (pendingRedrawFrame !== null) return;

        pendingRedrawFrame = requestAnimationFrame((ts) => {
            pendingRedrawFrame = null;
            // За время между RAF основной цикл мог запуститься — не дублируем.
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

        readyNotified = false;
        callbacks.onStart?.();

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
                // skipIntro — платформы сразу на своих местах.
                // Иначе все стартуют из центра canvas (совпадает с getStartY),
                // чтобы одновременно разойтись: верхние вверх, нижние вниз.
                currentY: skipIntro ? targetY : centerY - scaledHeight / 2,
                targetX,
                currentX: targetX,
                scaledWidth,
                scaledHeight,
            });
        }

        startTime = skipIntro ? performance.now() - SKIP_INTRO_TIME_OFFSET : null;
        animationFrameId = requestAnimationFrame(animate);
    };

    const refreshScheme = () => {
        positions = calculatePositions(podiums);

        positionAnimParams = positions.map(() => {
            const randomDelay = Math.random() * POSITION_ANIMATION_CONFIG.MAX_RANDOM_DELAY;
            return {
                delay: POSITION_ANIMATION_CONFIG.BASE_DELAY + randomDelay,
                duration: POSITION_ANIMATION_CONFIG.DURATION,
            };
        });
        positionOpacities = new Array(positions.length).fill(0);
        positionsAnimationStarted = true;
        positionsStartTime = performance.now();

        connectionsAnimationStarted = true;
        connectionsStartTime = performance.now() - getConnectionsTotalDuration();

        schemeLineParams = buildSchemeLineParams();
        schemeLinesTotalDuration = calcSchemeLinesTotal(schemeLineParams);
        schemeLinesAnimationStarted = true;
        schemeLinesStartTime = performance.now();

        // Сбрасываем флаг, чтобы по завершении новой анимации снова
        // сработал onReady — тогда index.ts откроет попап ровно
        // через POPUP_DELAY_AFTER_ANIMATION после реального окончания линий.
        readyNotified = false;

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
        const labelFontSize = canvasWidth * 0.007;

        const world = screenToWorld(mouseX, mouseY);

        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            const opacity = positionOpacities[i] ?? 0;
            if (opacity <= 0) continue;

            const config = getPositionConfig(pos.positionNumber);
            if (!config || !config.label) continue;

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
        const labelFontSize = canvasWidth * 0.007;

        const world = screenToWorld(mouseX, mouseY);

        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            const opacity = positionOpacities[i] ?? 0;
            if (opacity <= 0) continue;

            const config = getPositionConfig(pos.positionNumber);
            if (!config || !config.label) continue;

            if (isPointOverPosition(world.x, world.y, pos, config, iconSize, labelFontSize)) {
                return pos;
            }
        }

        return null;
    };

    // Отменяет и основной цикл, и отложенную перерисовку.
    const dispose = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        cancelPendingRedraw();
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
        dispose,
    };
};
