import {PodiumState, Position} from './types';
import {ANIMATION_CONFIG, POSITION_ANIMATION_CONFIG, TEXT_DATA} from './constants';
import {calculatePositions} from './positions';
import {drawPositions, drawTextBlocks} from './drawers';
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
    let textOpacities: number[] = new Array(TEXT_DATA.length).fill(0);
    let textAnimationStarted = false;
    let textStartTime = 0;
    let positions: Position[] = [];
    let positionAnimParams: PositionAnimationParams[] = [];
    let positionOpacities: number[] = [];
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

        if (allPlatformsFinished && !textAnimationStarted) {
            textAnimationStarted = true;
            textStartTime = timestamp;

            // Инициализируем позиции и их случайные параметры появления
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

        if (textAnimationStarted) {
            const textElapsed = timestamp - textStartTime;

            // Расчёт прозрачности для каждого текста
            textOpacities = TEXT_DATA.map((_, index) => {
                const delay = index * ANIMATION_CONFIG.TEXT_STAGGER_DELAY;
                const localElapsed = Math.max(0, textElapsed - delay);
                const localProgress = Math.min(localElapsed / ANIMATION_CONFIG.TEXT_DURATION, 1);
                return easeOutCubic(localProgress);
            });

            // Расчёт прозрачности для каждой позиции
            positionOpacities = positions.map((_, index) => {
                const {delay, duration} = positionAnimParams[index];
                const localElapsed = Math.max(0, textElapsed - delay);
                const localProgress = Math.min(localElapsed / duration, 1);
                return easeOutCubic(localProgress);
            });
        }

        // Рисуем тексты с их индивидуальной прозрачностью
        if (textAnimationStarted) {
            drawTextBlocks(ctx, podiums, TEXT_DATA, textOpacities, width);
        }

        // Рисуем позиции с индивидуальной прозрачностью
        if (positions.length > 0 && positionOpacities.length === positions.length) {
            drawPositions(ctx, positions, positionOpacities, width);
        }

        // Проверяем, завершены ли все анимации
        const allTextsFinished = textOpacities.every((op) => op >= 1);
        const allPositionsFinished = positionOpacities.every((op) => op >= 1);
        const allAnimationsFinished =
            allPlatformsFinished &&
            textAnimationStarted &&
            allTextsFinished &&
            allPositionsFinished;

        if (allAnimationsFinished) {
            animationFrameId = null;
        } else {
            animationFrameId = requestAnimationFrame(animate);
        }
    };

    const redrawIfComplete = () => {
        const allTextsFinished = textOpacities.every((op) => op >= 1);
        const allPositionsFinished = positionOpacities.every((op) => op >= 1);
        if (textAnimationStarted && allTextsFinished && allPositionsFinished && iconsLoaded) {
            const dpr = window.devicePixelRatio || 1;
            const width = canvas.width / dpr;
            ctx.clearRect(0, 0, width, canvas.height / dpr);
            drawTextBlocks(ctx, podiums, TEXT_DATA, textOpacities, width);
            drawPositions(ctx, positions, positionOpacities, width);
        }
    };

    const initPodiums = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        textOpacities = new Array(TEXT_DATA.length).fill(0);
        textAnimationStarted = false;
        textStartTime = 0;
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

        if (scaledWidth > width * 0.9) {
            scale = (width * 0.9) / imgWidth;
            scaledWidth = imgWidth * scale;
            scaledHeight = imgHeight * scale;
        }

        const targetX = width * 0.6 - scaledWidth / 2;
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

    // Загружаем иконки параллельно с анимацией платформ
    loadAllIcons().then(() => {
        iconsLoaded = true;
        // Если анимация уже завершилась, перерисовываем с иконками
        redrawIfComplete();
    });

    return {
        initPodiums,
        getAnimationFrameId: () => animationFrameId,
    };
};
