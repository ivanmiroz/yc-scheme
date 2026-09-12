import {PodiumState, Position} from './types';
import {ANIMATION_CONFIG, POSITION_ANIMATION_CONFIG} from './constants';
import {calculatePositions} from './positions';
import {drawPositions, isPointOverPosition} from './drawers';
import {getPositionConfig} from './schemes';
import {loadAllIcons} from './icons';

interface PositionAnimationParams {
    delay: number;
    duration: number;
}

export interface ViewState {
    scale: number;
    x: number;
    y: number;
}

export interface PodiumAnimatorCallbacks {
    // Вызывается при каждом запуске/перезапуске анимации
    // (первый initPodiums, ресайз, смена изображения подиума и т.п.)
    onStart?: () => void;
    // Вызывается при каждом завершении анимации — платформы отрисованы
    // и все иконки появились.
    onReady?: () => void;
}

export const createPodiumAnimator = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    podiumImage: HTMLImageElement,
    callbacks: PodiumAnimatorCallbacks = {},
) => {
    let podiums: PodiumState[] = [];
    let animationFrameId: number | null = null;
    let startTime: number | null = null;

    let positions: Position[] = [];
    let positionAnimParams: PositionAnimationParams[] = [];
    let positionOpacities: number[] = [];
    let positionsAnimationStarted = false;
    let positionsStartTime = 0;
    let iconsLoaded = false;

    // Сбрасывается в initPodiums, чтобы onReady сработал после каждого цикла.
    let readyNotified = false;

    // Текущее состояние зума/панорамирования (мировые координаты относительно canvas).
    const view: ViewState = {scale: 1, x: 0, y: 0};

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    // Обратное преобразование экранных (CSS px внутри canvas) в мировые.
    const screenToWorld = (sx: number, sy: number) => ({
        x: (sx - view.x) / view.scale,
        y: (sy - view.y) / view.scale,
    });

    // Одна отрисовка кадра. Возвращает true, если все анимации завершены.
    const renderFrame = (timestamp: number): boolean => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        // Сначала сбрасываем трансформ на «чистый» DPR и очищаем весь canvas.
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        // Затем применяем зум/панорамирование.
        ctx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, dpr * view.x, dpr * view.y);

        let allPlatformsFinished = true;

        for (let i = podiums.length - 1; i >= 0; i--) {
            const p = podiums[i];
            const startY = -p.scaledHeight;

            const staggerDelay = i * ANIMATION_CONFIG.STAGGER_DELAY;
            const adjustedElapsed = Math.max(0, elapsed - staggerDelay);
            const progress = Math.min(adjustedElapsed / ANIMATION_CONFIG.PLATFORM_DURATION, 1);

            if (progress < 1) {
                allPlatformsFinished = false;
            }

            const easedProgress = easeOutCubic(progress);
            p.currentY = startY + (p.targetY - startY) * easedProgress;

            ctx.drawImage(podiumImage, p.currentX, p.currentY, p.scaledWidth, p.scaledHeight);
        }

        // Запускаем анимацию позиций сразу после завершения платформ
        if (allPlatformsFinished && !positionsAnimationStarted) {
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
        }

        if (positionsAnimationStarted) {
            const positionElapsed = timestamp - positionsStartTime;

            positionOpacities = positions.map((_, index) => {
                const {delay, duration} = positionAnimParams[index];
                const localElapsed = Math.max(0, positionElapsed - delay);
                const localProgress = Math.min(localElapsed / duration, 1);
                return easeOutCubic(localProgress);
            });
        }

        // Рисуем позиции с индивидуальной прозрачностью
        if (positions.length > 0 && positionOpacities.length === positions.length) {
            drawPositions(ctx, positions, positionOpacities, width);
        }

        const allPositionsFinished = positionOpacities.every((op) => op >= 1);
        return allPlatformsFinished && positionsAnimationStarted && allPositionsFinished;
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

    // Однократная перерисовка (например, после зума/панорамирования).
    // Если цикл анимации уже запущен — no-op, следующий кадр сам всё отрисует.
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
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        // Уведомляем о старте и сбрасываем флаг, чтобы onReady снова сработал,
        // когда анимация завершится.
        readyNotified = false;
        callbacks.onStart?.();

        positionsAnimationStarted = false;
        positionsStartTime = 0;
        positions = [];
        positionAnimParams = [];
        positionOpacities = [];

        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        const imgWidth = podiumImage.naturalWidth || podiumImage.width || 100;
        const imgHeight = podiumImage.naturalHeight || podiumImage.height || 100;

        const slotHeight = height / ANIMATION_CONFIG.PLATFORMS_COUNT;

        let scale = slotHeight / imgHeight;
        let scaledWidth = imgWidth * scale;
        let scaledHeight = slotHeight;

        // Ограничиваем максимальную ширину платформы 90% от ширины канваса для адаптивности
        if (scaledWidth > width * 0.9) {
            scale = (width * 0.9) / imgWidth;
            scaledWidth = imgWidth * scale;
            scaledHeight = imgHeight * scale;
        }

        // Идеальное центрирование по горизонтали
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

    // Обновление схемы без перезапуска анимации платформ
    const refreshScheme = () => {
        // Пересчитываем позиции на основе НОВОЙ активной схемы
        positions = calculatePositions(podiums);

        // Сбрасываем параметры анимации появления для новых позиций
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

        // ВАЖНО: перезапускаем цикл анимации, если он был остановлен после завершения
        // предыдущей отрисовки. Без этого новые иконки не появятся на канвасе.
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(animate);
        }
    };

    // Проверка, находится ли курсор над иконкой или текстом
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

            if (
                isPointOverPosition(
                    world.x,
                    world.y,
                    pos,
                    config,
                    iconSize,
                    labelFontSize,
                    canvasWidth,
                )
            ) {
                return true;
            }
        }

        return false;
    };

    // Получение позиции, на которую кликнули
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

            if (
                isPointOverPosition(
                    world.x,
                    world.y,
                    pos,
                    config,
                    iconSize,
                    labelFontSize,
                    canvasWidth,
                )
            ) {
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
