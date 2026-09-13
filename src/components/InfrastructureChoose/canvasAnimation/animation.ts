import {PodiumState, Position} from './types';
import {
    ANIMATION_CONFIG,
    POSITION_ANIMATION_CONFIG,
    SCHEME_LINES_ANIMATION_CONFIG,
} from './constants';
import {calculatePositions} from './positions';
import {
    drawConnections,
    drawPositions,
    drawSchemeLines,
    getConnectionsTotalDuration,
    isPointOverPosition,
} from './drawers';
import {getActiveSchemeLines, getPositionConfig} from './schemes';
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

export const createPodiumAnimator = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    // Массив изображений подиумов. Индексируется по PodiumState.id.
    // Массив может быть пустым на момент создания аниматора —
    // картинки докидываются снаружи после загрузки.
    podiumImages: HTMLImageElement[],
    callbacks: PodiumAnimatorCallbacks = {},
) => {
    let podiums: PodiumState[] = [];
    let animationFrameId: number | null = null;
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

    // Рисует все подиумы в текущий момент времени.
    // Возвращает true, если анимация всех подиумов завершена.
    const updatePodiums = (elapsed: number): boolean => {
        let allFinished = true;

        for (let i = podiums.length - 1; i >= 0; i--) {
            const p = podiums[i];
            const startY = -p.scaledHeight;

            const staggerDelay = i * ANIMATION_CONFIG.STAGGER_DELAY;
            const adjustedElapsed = Math.max(0, elapsed - staggerDelay);
            const progress = Math.min(adjustedElapsed / ANIMATION_CONFIG.PLATFORM_DURATION, 1);

            if (progress < 1) {
                allFinished = false;
            }

            const easedProgress = easeOutCubic(progress);
            p.currentY = startY + (p.targetY - startY) * easedProgress;

            const img = podiumImages[p.id];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, p.currentX, p.currentY, p.scaledWidth, p.scaledHeight);
            }
        }

        return allFinished;
    };

    // Запускает анимацию появления иконок, если платформы уже встали.
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

    // Обновляет прозрачности иконок.
    // Возвращает true, если все иконки полностью проявились.
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

    // Запускает анимацию статичных соединений и линий активной схемы,
    // когда все иконки уже проявились.
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

    // Рисует статичные соединения и линии активной схемы
    // (каждую — со своим прогрессом).
    const drawAllConnections = (timestamp: number, width: number) => {
        if (connectionsAnimationStarted) {
            const connectionsElapsed = timestamp - connectionsStartTime;
            drawConnections(ctx, podiums, connectionsElapsed, width);
        }

        if (schemeLinesAnimationStarted) {
            const schemeLinesElapsed = timestamp - schemeLinesStartTime;
            const progresses = schemeLineParams.map(({delay, duration}) => {
                const localElapsed = Math.max(0, schemeLinesElapsed - delay);
                const localProgress = Math.min(localElapsed / duration, 1);
                return easeOutCubic(localProgress);
            });
            drawSchemeLines(ctx, positions, progresses, width);
        }
    };

    // Проверяет завершение соединений и линий схемы.
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

        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        ctx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, dpr * view.x, dpr * view.y);

        const allPlatformsFinished = updatePodiums(elapsed);
        ensurePositionsStarted(timestamp, allPlatformsFinished);

        const allPositionsFinished = updatePositionOpacities(timestamp);

        if (positions.length > 0 && positionOpacities.length === positions.length) {
            drawPositions(ctx, positions, positionOpacities, width);
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

    const requestRedraw = () => {
        if (animationFrameId) return;
        renderFrame(performance.now());
    };

    const setView = (next: Partial<ViewState>) => {
        if (typeof next.scale === 'number') view.scale = next.scale;
        if (typeof next.x === 'number') view.x = next.x;
        if (typeof next.y === 'number') view.y = next.y;
        requestRedraw();
    };

    const getView = (): ViewState => ({...view});

    const redrawIfComplete = () => {
        if (!positionsAnimationStarted) return;
        const allPositionsFinished = positionOpacities.every((op) => op >= 1);
        if (allPositionsFinished && iconsLoaded) {
            requestRedraw();
        }
    };

    const initPodiums = () => {
        if (podiumImages.length === 0) return;

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

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

        const dpr = window.devicePixelRatio || 1;
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
                currentY: -scaledHeight,
                targetX,
                currentX: targetX,
                scaledWidth,
                scaledHeight,
            });
        }

        startTime = null;
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

        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(animate);
        }
    };

    const checkHover = (mouseX: number, mouseY: number): boolean => {
        if (!positionsAnimationStarted || positions.length === 0) return false;

        const dpr = window.devicePixelRatio || 1;
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

        const dpr = window.devicePixelRatio || 1;
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
    };
};
