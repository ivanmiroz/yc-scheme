import {PodiumState} from './types';
import {ANIMATION_CONFIG, TEXT_DATA} from './constants';
import {calculatePositions} from './positions';
import {drawPositions, drawTextBlocks} from './drawers';
import {loadAllIcons} from './icons';

export const createPodiumAnimator = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    podiumImage: HTMLImageElement,
) => {
    let podiums: PodiumState[] = [];
    let animationFrameId: number | null = null;
    let startTime: number | null = null;
    let textOpacity = 0;
    let textAnimationStarted = false;
    let textStartTime = 0;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        ctx.clearRect(0, 0, width, height);

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

            ctx.drawImage(podiumImage, p.currentX, p.currentY, p.scaledWidth, p.scaledHeight);
        }

        if (allFinished && !textAnimationStarted) {
            textAnimationStarted = true;
            textStartTime = timestamp;
        }

        if (textAnimationStarted) {
            const textElapsed = timestamp - textStartTime;
            const textProgress = Math.min(textElapsed / ANIMATION_CONFIG.TEXT_DURATION, 1);
            textOpacity = easeOutCubic(textProgress);
        }

        if (textOpacity > 0) {
            drawTextBlocks(ctx, podiums, TEXT_DATA, textOpacity, width);

            const positions = calculatePositions(podiums);
            drawPositions(ctx, positions, textOpacity, width);
        }

        if (!allFinished || textOpacity < 1) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            animationFrameId = null;
        }
    };

    const initPodiums = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        textOpacity = 0;
        textAnimationStarted = false;
        textStartTime = 0;

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
        // Если анимация уже завершилась, перерисовываем с иконками
        if (textOpacity >= 1 && !animationFrameId) {
            const dpr = window.devicePixelRatio || 1;
            const width = canvas.width / dpr;
            const positions = calculatePositions(podiums);
            drawPositions(ctx, positions, textOpacity, width);
        }
    });

    return {
        initPodiums,
        getAnimationFrameId: () => animationFrameId,
    };
};
