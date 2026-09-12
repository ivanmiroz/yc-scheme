import {PodiumState, Position} from './types';
import {ANIMATION_CONFIG, POSITION_ANIMATION_CONFIG} from './constants';
import {calculatePositions} from './positions';
import {drawPositions} from './drawers';
import {loadAllIcons} from './icons';

interface PositionAnimationParams {
    delay: number;
    duration: number;
}

export const createPodiumAnimator = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    podiumImage: HTMLImageElement,
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

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        ctx.clearRect(0, 0, width, height);

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

        // Проверяем, завершены ли все анимации
        const allPositionsFinished = positionOpacities.every((op) => op >= 1);
        const allAnimationsFinished =
            allPlatformsFinished && positionsAnimationStarted && allPositionsFinished;

        if (allAnimationsFinished) {
            animationFrameId = null;
        } else {
            animationFrameId = requestAnimationFrame(animate);
        }
    };

    const redrawIfComplete = () => {
        const allPositionsFinished = positionOpacities.every((op) => op >= 1);
        if (positionsAnimationStarted && allPositionsFinished && iconsLoaded) {
            const dpr = window.devicePixelRatio || 1;
            const width = canvas.width / dpr;
            ctx.clearRect(0, 0, width, canvas.height / dpr);
            drawPositions(ctx, positions, positionOpacities, width);
        }
    };

    const initPodiums = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

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

    loadAllIcons().then(() => {
        iconsLoaded = true;
        redrawIfComplete();
    });

    return {
        initPodiums,
        getAnimationFrameId: () => animationFrameId,
        refreshScheme,
    };
};
