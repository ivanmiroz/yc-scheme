import podium1Src from '@/assets/images/podium1.png';
import podium2Src from '@/assets/images/podium2.png';
import podium3Src from '@/assets/images/podium3.png';
import podium4Src from '@/assets/images/podium4.png';
import {CanvasAnimationCleanup} from './types';
import {getEffectiveDpr} from './constants';
import {createPodiumAnimator} from './animation';
import {LegendValue, getActiveSchemeIndex, getPositionConfig} from './schemes';
import {getDescription, getLink, getTitle} from './descriptions';
import {getPositionAnchor} from './drawers';
import './popup.scss';

const sendYmGoal = (goal: string) => {
    if (
        typeof window !== 'undefined' &&
        typeof (window as unknown as {ym?: (id: number, action: string, goal: string) => void})
            .ym === 'function'
    ) {
        (window as unknown as {ym: (id: number, action: string, goal: string) => void}).ym(
            50027884,
            'reachGoal',
            goal,
        );
    }
};

const POPUP_ICON_GAP = 4;
const POPUP_VIEWPORT_MARGIN = 8;
const POPUP_DELAY_AFTER_ANIMATION = 1000;

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DRAG_THRESHOLD = 5;

let podiumImagesCache: HTMLImageElement[] | null = null;
let podiumImagesPromise: Promise<HTMLImageElement[]> | null = null;
let hasPlayedIntro = false;

const PODIUM_SOURCES = [podium4Src.src, podium3Src.src, podium2Src.src, podium1Src.src];

const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Не удалось загрузить ${src}`));
        img.src = src;
    });

const loadPodiumImages = (): Promise<HTMLImageElement[]> => {
    if (podiumImagesCache) return Promise.resolve(podiumImagesCache);
    if (podiumImagesPromise) return podiumImagesPromise;

    podiumImagesPromise = Promise.all(PODIUM_SOURCES.map(loadImage)).then((images) => {
        podiumImagesCache = images;
        return images;
    });

    return podiumImagesPromise;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export interface InitCanvasAnimationOptions {
    onStart?: () => void;
    onReady?: () => void;
    initialActiveLegend?: LegendValue | null;
}

export const initCanvasAnimation = (
    canvas: HTMLCanvasElement,
    options: InitCanvasAnimationOptions = {},
): CanvasAnimationCleanup => {
    const ctx = canvas.getContext('2d', {alpha: false});
    if (!ctx) {
        // eslint-disable-next-line no-console
        console.warn('Не удалось получить 2D контекст для canvas');
        const cleanup = () => {};
        cleanup.refreshScheme = () => {};
        cleanup.setActiveLegend = () => {};
        cleanup.startReverse = (onDone?: () => void) => onDone?.();
        return cleanup;
    }

    const podiumImages: HTMLImageElement[] = [];
    let isLoaded = false;

    let interactionEnabled = false;
    let interactionTimer: ReturnType<typeof setTimeout> | null = null;

    const disableInteraction = () => {
        interactionEnabled = false;
        if (interactionTimer !== null) {
            clearTimeout(interactionTimer);
            interactionTimer = null;
        }
    };

    const enableInteractionAfter = (delayMs: number) => {
        disableInteraction();
        interactionTimer = setTimeout(() => {
            interactionTimer = null;
            interactionEnabled = true;
        }, delayMs);
    };

    const animator = createPodiumAnimator(canvas, ctx, podiumImages, {
        onStart: () => {
            disableInteraction();
            options.onStart?.();
        },
        onReady: () => {
            enableInteractionAfter(POPUP_DELAY_AFTER_ANIMATION);
            options.onReady?.();
        },
    });

    loadPodiumImages().catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Ошибка предварительной загрузки подиумов', err);
    });

    if (podiumImagesCache) {
        podiumImages.push(...podiumImagesCache);
        isLoaded = true;
        animator.initPodiums({skipIntro: hasPlayedIntro});
        hasPlayedIntro = true;
    } else {
        loadPodiumImages()
            .then((images) => {
                podiumImages.length = 0;
                podiumImages.push(...images);
                isLoaded = true;
                animator.initPodiums({skipIntro: hasPlayedIntro});
                hasPlayedIntro = true;
            })
            .catch((err) => {
                // eslint-disable-next-line no-console
                console.error('Ошибка загрузки подиумов', err);
            });
    }

    // eslint-disable-next-line no-param-reassign
    canvas.style.touchAction = 'none';

    const popupContainer = document.createElement('div');
    popupContainer.style.position = 'fixed';
    popupContainer.style.inset = '0';
    popupContainer.style.zIndex = '1000';
    popupContainer.style.display = 'none';
    popupContainer.style.pointerEvents = 'none';

    const backdrop = document.createElement('div');
    backdrop.className = 'scheme-popup-backdrop';
    backdrop.style.pointerEvents = 'auto';

    const popup = document.createElement('div');
    popup.className = 'scheme-popup';
    popup.style.pointerEvents = 'auto';
    popup.style.visibility = 'hidden';

    const popupTitle = document.createElement('h4');
    popupTitle.className = 'scheme-popup__title';

    const popupDescription = document.createElement('p');
    popupDescription.className = 'scheme-popup__description';

    const popupLink = document.createElement('a');
    popupLink.className = 'scheme-popup__link';
    popupLink.textContent = 'Подробнее о сервисе';
    popupLink.target = '_blank';
    popupLink.style.display = 'none';

    const popupClose = document.createElement('button');
    popupClose.className = 'scheme-popup__close';
    popupClose.type = 'button';
    popupClose.setAttribute('aria-label', 'Закрыть');

    const archShape = document.createElement('div');
    archShape.className = 'arch-shape';

    popup.appendChild(popupTitle);
    popup.appendChild(popupDescription);
    popup.appendChild(popupLink);
    popup.appendChild(popupClose);
    popup.appendChild(archShape);

    popupContainer.appendChild(backdrop);
    popupContainer.appendChild(popup);

    document.body.appendChild(popupContainer);

    popup.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    let currentScale = 1;
    let currentOffsetX = 0;
    let currentOffsetY = 0;

    const clampOffsets = () => {
        const dpr = getEffectiveDpr();
        const cssW = canvas.width / dpr;
        const cssH = canvas.height / dpr;
        const scaledW = cssW * currentScale;
        const scaledH = cssH * currentScale;

        if (scaledW <= cssW) {
            currentOffsetX = (cssW - scaledW) / 2;
        } else {
            const minX = cssW - scaledW;
            currentOffsetX = Math.max(minX, Math.min(0, currentOffsetX));
        }

        if (scaledH <= cssH) {
            currentOffsetY = (cssH - scaledH) / 2;
        } else {
            const minY = cssH - scaledH;
            currentOffsetY = Math.max(minY, Math.min(0, currentOffsetY));
        }
    };

    const applyView = () => {
        animator.setView({
            scale: currentScale,
            x: currentOffsetX,
            y: currentOffsetY,
        });
    };

    const isPopupOpen = () => popupContainer.style.display === 'block';

    const activePointers = new Map<number, {x: number; y: number}>();

    let isDragging = false;
    let hasMoved = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartOffsetX = 0;
    let dragStartOffsetY = 0;

    const handlePointerDown = (e: PointerEvent) => {
        if (isPopupOpen()) return;
        canvas.setPointerCapture(e.pointerId);
        activePointers.set(e.pointerId, {x: e.clientX, y: e.clientY});

        if (activePointers.size === 1) {
            isDragging = true;
            hasMoved = false;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragStartOffsetX = currentOffsetX;
            dragStartOffsetY = currentOffsetY;
        }
    };

    const handlePointerMove = (e: PointerEvent) => {
        if (!activePointers.has(e.pointerId)) return;
        activePointers.set(e.pointerId, {x: e.clientX, y: e.clientY});

        if (isDragging) {
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;

            if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) {
                hasMoved = true;
            }

            if (currentScale > 1) {
                currentOffsetX = dragStartOffsetX + dx;
                currentOffsetY = dragStartOffsetY + dy;
                clampOffsets();
                applyView();
            }
        }
    };

    const handlePointerUp = (e: PointerEvent) => {
        activePointers.delete(e.pointerId);
        if (activePointers.size === 0) {
            isDragging = false;
        }
    };

    const handlePointerCancel = (e: PointerEvent) => {
        activePointers.delete(e.pointerId);
        if (activePointers.size === 0) {
            isDragging = false;
        }
    };

    const handleWheel = (e: WheelEvent) => {
        if (isPopupOpen()) return;
        e.preventDefault();

        const rect = canvas.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;

        const factor = Math.exp(-e.deltaY * 0.0015);
        const nextScale = clamp(currentScale * factor, MIN_SCALE, MAX_SCALE);

        const worldX = (localX - currentOffsetX) / currentScale;
        const worldY = (localY - currentOffsetY) / currentScale;

        currentScale = nextScale;
        currentOffsetX = localX - nextScale * worldX;
        currentOffsetY = localY - nextScale * worldY;
        clampOffsets();
        applyView();
    };

    const hidePopup = () => {
        popupContainer.style.display = 'none';
    };

    const resizeCanvas = () => {
        const parentEl = canvas.parentElement;
        if (!parentEl) return;

        hidePopup();

        const dpr = getEffectiveDpr();
        const rect = parentEl.getBoundingClientRect();
        const nextWidth = Math.round(rect.width * dpr);
        const nextHeight = Math.round(rect.height * dpr);

        if (canvas.width === nextWidth && canvas.height === nextHeight) {
            return;
        }

        // eslint-disable-next-line no-param-reassign
        canvas.width = nextWidth;
        // eslint-disable-next-line no-param-reassign
        canvas.height = nextHeight;
        // eslint-disable-next-line no-param-reassign
        canvas.style.width = `${rect.width}px`;
        // eslint-disable-next-line no-param-reassign
        canvas.style.height = `${rect.height}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        clampOffsets();
        applyView();

        if (isLoaded) {
            animator.initPodiums({skipIntro: hasPlayedIntro});
            hasPlayedIntro = true;
        }
    };

    const handleCloseClick = (e: MouseEvent) => {
        e.stopPropagation();
        hidePopup();
    };

    const handleClick = (e: MouseEvent) => {
        if (!interactionEnabled) return;

        if (hasMoved) {
            hasMoved = false;
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const clickedPosition = animator.getClickedPosition(mouseX, mouseY);
        if (!clickedPosition) return;

        const config = getPositionConfig(clickedPosition.positionNumber);
        if (!config || !config.label) return;

        const schemeIndex = getActiveSchemeIndex();
        const title = getTitle(config.label, schemeIndex, clickedPosition.positionNumber);
        const description = getDescription(
            config.label,
            schemeIndex,
            clickedPosition.positionNumber,
        );

        const serviceUrl = getLink(config.label, schemeIndex, clickedPosition.positionNumber);

        popupTitle.textContent = title;

        if (description) {
            popupDescription.textContent = description;
            popupDescription.style.display = 'block';
        } else {
            popupDescription.textContent = '';
            popupDescription.style.display = 'none';
        }

        if (serviceUrl) {
            popupLink.href = serviceUrl;
            popupLink.style.display = 'block';
        } else {
            popupLink.removeAttribute('href');
            popupLink.style.display = 'none';
        }

        popup.classList.remove('scheme-popup_flipped');
        popup.style.visibility = 'hidden';
        popupContainer.style.display = 'block';

        const dpr = getEffectiveDpr();
        const canvasWidth = canvas.width / dpr;
        const anchor = getPositionAnchor(clickedPosition, canvasWidth);

        const view = animator.getView();
        const iconCenterXViewport = rect.left + view.x + anchor.centerX * view.scale;
        const iconCenterYViewport = rect.top + view.y + anchor.centerY * view.scale;
        const iconHalfScreen = (anchor.iconSize / 2) * view.scale;
        const iconTopViewport = iconCenterYViewport - iconHalfScreen;
        const iconBottomViewport = iconCenterYViewport + iconHalfScreen;

        const labelFontSize = canvasWidth * 0.00856;
        const lineHeight = labelFontSize * 1.4;
        const labelLines = config.label.split('\n').length;
        const labelHeight = labelFontSize + (labelLines - 1) * lineHeight;
        const labelBottomViewport = iconBottomViewport + labelHeight * view.scale;

        const popupRectBase = popup.getBoundingClientRect();
        const archRectBase = archShape.getBoundingClientRect();

        const archHeightFromPopupBottom = archRectBase.bottom - popupRectBase.bottom;
        const archTipX = archRectBase.left - popupRectBase.left + archRectBase.width / 2;

        const popupTopAbove =
            iconTopViewport - archHeightFromPopupBottom - popupRectBase.height - POPUP_ICON_GAP;
        const fitsAbove = popupTopAbove >= POPUP_VIEWPORT_MARGIN;

        let popupTop: number;
        let popupLeft = iconCenterXViewport - archTipX;

        if (fitsAbove) {
            popupTop = popupTopAbove;
        } else {
            popup.classList.add('scheme-popup_flipped');

            const popupRectFlipped = popup.getBoundingClientRect();
            const archRectFlipped = archShape.getBoundingClientRect();
            const archHeightFromPopupTop = popupRectFlipped.top - archRectFlipped.top;

            popupTop = labelBottomViewport + archHeightFromPopupTop + POPUP_ICON_GAP;
        }

        const maxLeft = window.innerWidth - popupRectBase.width - POPUP_VIEWPORT_MARGIN;
        popupLeft = Math.max(POPUP_VIEWPORT_MARGIN, Math.min(popupLeft, maxLeft));

        const closeRect = popupClose.getBoundingClientRect();
        const closeOffsetFromPopupRight =
            popupRectBase.right - popupLeft - popupRectBase.width + closeRect.width;
        const closeRight = popupLeft + popupRectBase.width + closeOffsetFromPopupRight;
        const maxRight = window.innerWidth - POPUP_VIEWPORT_MARGIN;
        if (closeRight > maxRight) {
            popupLeft -= closeRight - maxRight;
        }

        popup.style.left = `${popupLeft}px`;
        popup.style.top = `${popupTop}px`;
        sendYmGoal('HYBRIDINFRA_INTERACT-BLOCK_CLICK');
        popup.style.visibility = 'visible';

        e.stopPropagation();
    };

    const handleBackdropClick = () => {
        hidePopup();
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver((entries) => {
        window.requestAnimationFrame(() => {
            if (!entries[0]?.contentRect) return;
            resizeCanvas();
        });
    });

    if (canvas.parentElement) {
        resizeObserver.observe(canvas.parentElement);
    }

    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerCancel);
    canvas.addEventListener('wheel', handleWheel, {passive: false});
    canvas.addEventListener('click', handleClick);
    backdrop.addEventListener('click', handleBackdropClick);
    popupClose.addEventListener('click', handleCloseClick);

    const cleanup: CanvasAnimationCleanup = () => {
        window.removeEventListener('resize', resizeCanvas);
        resizeObserver.disconnect();

        canvas.removeEventListener('pointerdown', handlePointerDown);
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('pointerup', handlePointerUp);
        canvas.removeEventListener('pointercancel', handlePointerCancel);
        canvas.removeEventListener('wheel', handleWheel);
        canvas.removeEventListener('click', handleClick);
        backdrop.removeEventListener('click', handleBackdropClick);
        popupClose.removeEventListener('click', handleCloseClick);

        if (interactionTimer !== null) {
            clearTimeout(interactionTimer);
            interactionTimer = null;
        }

        animator.dispose();

        if (popupContainer.parentElement) {
            popupContainer.parentElement.removeChild(popupContainer);
        }
    };

    cleanup.refreshScheme = () => {
        disableInteraction();
        animator.refreshScheme?.();
    };

    cleanup.setActiveLegend = (legend: LegendValue | null) => {
        animator.setActiveLegend(legend);
    };

    cleanup.startReverse = (onDone?: () => void) => {
        hidePopup();
        disableInteraction();
        animator.startReverse(() => {
            onDone?.();
        });
    };

    if (options.initialActiveLegend !== undefined) {
        animator.setActiveLegend(options.initialActiveLegend);
    }

    return cleanup;
};

export * from './types';
