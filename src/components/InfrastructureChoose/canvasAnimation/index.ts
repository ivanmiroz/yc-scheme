/* eslint-disable no-param-reassign */
import podiumSrc from '@/assets/images/podium.png';
import {CanvasAnimationCleanup} from './types';
import {createPodiumAnimator} from './animation';

export const initCanvasAnimation = (canvas: HTMLCanvasElement): CanvasAnimationCleanup => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        // eslint-disable-next-line no-console
        console.warn('Не удалось получить 2D контекст для canvas');
        const cleanup = () => {};
        cleanup.refreshScheme = () => {};
        return cleanup;
    }

    const podiumImage = new Image();
    let isLoaded = false;

    const animator = createPodiumAnimator(canvas, ctx, podiumImage);

    podiumImage.onload = () => {
        isLoaded = true;
        animator.initPodiums();
    };

    if (podiumImage.complete) {
        isLoaded = true;
        animator.initPodiums();
    }

    podiumImage.src = podiumSrc.src;

    const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if (parent) {
            const dpr = window.devicePixelRatio || 1;
            const rect = parent.getBoundingClientRect();

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);

            if (isLoaded) {
                animator.initPodiums();
            }
        }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Создаем функцию очистки и добавляем к ней метод refreshScheme
    const cleanup: CanvasAnimationCleanup = () => {
        window.removeEventListener('resize', resizeCanvas);
        const frameId = animator.getAnimationFrameId();
        if (frameId) {
            cancelAnimationFrame(frameId);
        }
    };

    cleanup.refreshScheme = () => {
        animator.refreshScheme?.();
    };

    return cleanup;
};

export * from './types';
