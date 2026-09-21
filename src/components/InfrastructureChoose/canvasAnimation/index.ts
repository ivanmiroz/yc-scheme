// src/components/InfrastructureChoose/canvasAnimation/index.ts
import podium1Src from '@/assets/images/podium1.png';
import podium2Src from '@/assets/images/podium2.png';
import podium3Src from '@/assets/images/podium3.png';
import podium4Src from '@/assets/images/podium4.png';
import {CanvasAnimationCleanup} from './types';
import {getEffectiveDpr} from './constants';
import {createPodiumAnimator} from './animation';
import {LegendValue, getPositionConfig} from './schemes';
import {getDescription, getQr, getTitle} from './descriptions';
import {getPositionAnchor} from './drawers';
import './popup.scss';

const POPUP_ICON_GAP = 4;
const POPUP_VIEWPORT_MARGIN = 8;

// Попап открывается не раньше, чем через 1 секунду после того,
// как аниматор сообщил о завершении анимации линий (onReady).
// Это одинаково работает и для интро, и при переключении схем.
const POPUP_DELAY_AFTER_ANIMATION = 1000;

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DRAG_THRESHOLD = 5;

// Кэш изображений подиумов на уровне модуля.
// Живёт всё время жизни страницы — при пересоздании initCanvasAnimation
// (переключение схемы, ремаунт компонента) картинки берутся отсюда,
// поэтому нет «пустого кадра» и мерцания.
let podiumImagesCache: HTMLImageElement[] | null = null;
let podiumImagesPromise: Promise<HTMLImageElement[]> | null = null;

// Играл ли уже intro-эффект въезда платформ за жизнь страницы.
// При пересоздании аниматора (переключение схемы) intro пропускаем,
// чтобы платформы не «улетали» за верх canvas.
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
}

export const initCanvasAnimation = (
    canvas: HTMLCanvasElement,
    options: InitCanvasAnimationOptions = {},
): CanvasAnimationCleanup => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        // eslint-disable-next-line no-console
        console.warn('Не удалось получить 2D контекст для canvas');
        const cleanup = () => {};
        cleanup.refreshScheme = () => {};
        cleanup.setActiveLegend = () => {};
        // Имя параметра onDone (не cb/callback/next), чтобы не триггерить
        // ESLint callback-return при его вызове.
        cleanup.startReverse = (onDone?: () => void) => onDone?.();
        return cleanup;
    }

    const podiumImages: HTMLImageElement[] = [];
    let isLoaded = false;

    // Флаг: можно ли открывать попап. Пока анимация линий не завершилась
    // (+ POPUP_DELAY_AFTER_ANIMATION), клики по позициям игнорируются.
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
            // Анимация началась — блокируем открытие попапа до onReady.
            disableInteraction();
            options.onStart?.();
        },
        onReady: () => {
            // Аниматор сообщил, что все линии дорисованы.
            // Открываем попап через POPUP_DELAY_AFTER_ANIMATION.
            enableInteractionAfter(POPUP_DELAY_AFTER_ANIMATION);
            options.onReady?.();
        },
    });

    if (podiumImagesCache) {
        // Кэш есть — наполняем массив синхронно и сразу запускаем аниматор.
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

    // Блок QR слева от попапа.
    const popupAside = document.createElement('div');
    popupAside.className = 'scheme-popup__aside';

    const popupQr = document.createElement('div');
    popupQr.className = 'scheme-popup__qr';

    const popupQrImage = document.createElement('img');
    popupQrImage.alt = 'QR-код';
    popupQr.appendChild(popupQrImage);

    const popupQrCaption = document.createElement('p');
    popupQrCaption.className = 'scheme-popup__qr-caption';
    // <br> через innerHTML — чтобы перенос был частью разметки.
    popupQrCaption.innerHTML = 'Подробнее<br> о сервисе';
    popupQr.appendChild(popupQrCaption);

    popupAside.appendChild(popupQr);

    // Кнопка закрытия — справа от попапа, отдельным абсолютным элементом.
    const popupClose = document.createElement('button');
    popupClose.className = 'scheme-popup__close';
    popupClose.type = 'button';
    popupClose.setAttribute('aria-label', 'Закрыть');

    const archShape = document.createElement('div');
    archShape.className = 'arch-shape';

    popup.appendChild(popupTitle);
    popup.appendChild(popupDescription);
    popup.appendChild(popupAside);
    popup.appendChild(popupClose);
    popup.appendChild(archShape);

    popupContainer.appendChild(backdrop);
    popupContainer.appendChild(popup);

    document.body.appendChild(popupContainer);

    popup.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // ============================================================
    //  Зум и панорамирование
    // ============================================================

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
    let isPinching = false;
    let hasMoved = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartOffsetX = 0;
    let dragStartOffsetY = 0;

    let pinchStartDistance = 0;
    let pinchStartScale = 1;
    let pinchWorldX = 0;
    let pinchWorldY = 0;

    const handlePointerDown = (e: PointerEvent) => {
        if (isPopupOpen()) return;

        // eslint-disable-next-line no-param-reassign
        canvas.setPointerCapture(e.pointerId);
        activePointers.set(e.pointerId, {x: e.clientX, y: e.clientY});

        if (activePointers.size === 1) {
            isDragging = true;
            isPinching = false;
            hasMoved = false;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragStartOffsetX = currentOffsetX;
            dragStartOffsetY = currentOffsetY;
        } else if (activePointers.size === 2) {
            isDragging = false;
            isPinching = true;
            hasMoved = true;

            const [p1, p2] = Array.from(activePointers.values());
            pinchStartDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            pinchStartScale = currentScale;

            const rect = canvas.getBoundingClientRect();
            const localMidX = (p1.x + p2.x) / 2 - rect.left;
            const localMidY = (p1.y + p2.y) / 2 - rect.top;
            pinchWorldX = (localMidX - currentOffsetX) / currentScale;
            pinchWorldY = (localMidY - currentOffsetY) / currentScale;
        }
    };

    const handlePointerMove = (e: PointerEvent) => {
        if (!activePointers.has(e.pointerId)) return;

        activePointers.set(e.pointerId, {x: e.clientX, y: e.clientY});

        if (isPinching && activePointers.size >= 2) {
            const [p1, p2] = Array.from(activePointers.values());
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const rect = canvas.getBoundingClientRect();
            const localMidX = (p1.x + p2.x) / 2 - rect.left;
            const localMidY = (p1.y + p2.y) / 2 - rect.top;

            const ratio = pinchStartDistance > 0 ? dist / pinchStartDistance : 1;
            const nextScale = clamp(pinchStartScale * ratio, MIN_SCALE, MAX_SCALE);

            currentScale = nextScale;
            currentOffsetX = localMidX - nextScale * pinchWorldX;
            currentOffsetY = localMidY - nextScale * pinchWorldY;
            clampOffsets();
            applyView();
            return;
        }

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

        if (activePointers.size === 1) {
            isPinching = false;
            isDragging = true;
            const [p] = Array.from(activePointers.values());
            dragStartX = p.x;
            dragStartY = p.y;
            dragStartOffsetX = currentOffsetX;
            dragStartOffsetY = currentOffsetY;
        } else if (activePointers.size === 0) {
            isDragging = false;
            isPinching = false;
        }
    };

    const handlePointerCancel = (e: PointerEvent) => {
        activePointers.delete(e.pointerId);
        if (activePointers.size < 2) isPinching = false;
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

    // ============================================================
    //  Скрытие попапа
    // ============================================================

    const hidePopup = () => {
        popupContainer.style.display = 'none';
    };

    // ============================================================
    //  Ресайз
    // ============================================================

    const resizeCanvas = () => {
        const parentEl = canvas.parentElement;
        if (!parentEl) return;

        hidePopup();

        const dpr = getEffectiveDpr();
        const rect = parentEl.getBoundingClientRect();
        const nextWidth = Math.round(rect.width * dpr);
        const nextHeight = Math.round(rect.height * dpr);

        // Присваивание canvas.width/height очищает canvas — если размеры
        // не изменились физически, ничего не трогаем, иначе на 1 кадр
        // canvas окажется пустым (мигание).
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

    // ============================================================
    //  Открытие/закрытие попапа
    // ============================================================

    const handleCloseClick = (e: MouseEvent) => {
        e.stopPropagation();
        hidePopup();
    };

    const handleClick = (e: MouseEvent) => {
        // Пока линии не дорисованы (+ POPUP_DELAY_AFTER_ANIMATION), попап не открываем.
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

        // Заголовок попапа берём из словаря — там для сервисов записаны
        // полные названия. Если для позиции своего title нет — используется
        // нормализованный label.
        const title = getTitle(config.label);
        const description = getDescription(config.label);
        const qrSrc = getQr(config.label);

        popupTitle.textContent = title;

        if (description) {
            popupDescription.textContent = description;
            popupDescription.style.display = 'block';
        } else {
            popupDescription.textContent = '';
            popupDescription.style.display = 'none';
        }

        if (qrSrc) {
            popupQrImage.src = qrSrc;
            popupQr.style.display = 'block';
        } else {
            popupQrImage.removeAttribute('src');
            popupQr.style.display = 'none';
        }

        // Показываем контейнер и сам popup (невидимо), чтобы можно было
        // измерить его размеры. Флаг «перевёрнут» сбрасываем — все замеры
        // делаем от базового состояния (стрелка снизу).
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

        // Нижняя граница лейбла объекта в координатах вьюпорта. Лейбл
        // всегда рисуется ПОД иконкой (см. drawPositions), поэтому
        // его низ = низ иконки + высота текста.
        const labelFontSize = canvasWidth * 0.007;
        const lineHeight = labelFontSize * 1.4;
        const labelLines = config.label.split('\n').length;
        const labelHeight = labelFontSize + (labelLines - 1) * lineHeight;
        const labelBottomViewport = iconBottomViewport + labelHeight * view.scale;

        const popupRectBase = popup.getBoundingClientRect();
        const archRectBase = archShape.getBoundingClientRect();

        // Расстояние от низа popup до кончика стрелки снизу.
        const archHeightFromPopupBottom = archRectBase.bottom - popupRectBase.bottom;
        // X кончика стрелки относительно левого края popup.
        const archTipX = archRectBase.left - popupRectBase.left + archRectBase.width / 2;

        // Пробуем поставить popup над иконкой.
        const popupTopAbove =
            iconTopViewport - archHeightFromPopupBottom - popupRectBase.height - POPUP_ICON_GAP;
        const fitsAbove = popupTopAbove >= POPUP_VIEWPORT_MARGIN;

        let popupTop: number;
        let popupLeft = iconCenterXViewport - archTipX;

        if (fitsAbove) {
            popupTop = popupTopAbove;
        } else {
            // Сверху не хватает места — переворачиваем popup: стрелка
            // уходит наверх, popup встаёт под лейблом объекта.
            popup.classList.add('scheme-popup_flipped');

            // Пересчитываем геометрию после смены модификатора.
            const popupRectFlipped = popup.getBoundingClientRect();
            const archRectFlipped = archShape.getBoundingClientRect();
            const archHeightFromPopupTop = popupRectFlipped.top - archRectFlipped.top;

            popupTop = labelBottomViewport + archHeightFromPopupTop + POPUP_ICON_GAP;
        }

        const maxLeft = window.innerWidth - popupRectBase.width - POPUP_VIEWPORT_MARGIN;
        popupLeft = Math.max(POPUP_VIEWPORT_MARGIN, Math.min(popupLeft, maxLeft));

        // QR-блок слева от popup: следим, чтобы его левый край не выходил
        // за вьюпорт. Если выходит — сдвигаем popup вправо.
        popupAside.style.display = 'flex';
        const asideRect = popupAside.getBoundingClientRect();
        const asideOffsetFromPopupLeft = asideRect.left - popupRectBase.left;
        const asideLeft = popupLeft + asideOffsetFromPopupLeft;
        if (asideLeft < POPUP_VIEWPORT_MARGIN) {
            popupLeft += POPUP_VIEWPORT_MARGIN - asideLeft;
        }

        // Кнопка закрытия справа от popup: аналогичная проверка правого
        // края. Кнопка позиционируется абсолютно (left: 100%), поэтому
        // её правый край = popupLeft + popupWidth + gap + closeWidth.
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
        popup.style.visibility = 'visible';

        e.stopPropagation();
    };

    const handleBackdropClick = () => {
        hidePopup();
    };

    // ============================================================
    //  Регистрация слушателей
    // ============================================================

    resizeCanvas();
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

        // Отменяет и основной RAF-цикл, и отложенную перерисовку.
        animator.dispose();

        if (popupContainer.parentElement) {
            popupContainer.parentElement.removeChild(popupContainer);
        }
    };

    cleanup.refreshScheme = () => {
        // Блокируем попап до тех пор, пока аниматор не закончит
        // рисовать линии новой схемы. Момент завершения придёт через
        // onReady (см. animator.refreshScheme, там сбрасывается readyNotified),
        // и тогда interaction включится через POPUP_DELAY_AFTER_ANIMATION.
        disableInteraction();
        animator.refreshScheme?.();
    };

    cleanup.setActiveLegend = (legend: LegendValue | null) => {
        animator.setActiveLegend(legend);
    };

    // Обратная анимация: фейдаут линий/объектов, затем «схлопывание»
    // платформ в центр. Попап скрываем, интеракцию выключаем — пока
    // идёт reverse, клики по позициям не должны ничего открывать.
    //
    // Параметр назван onDone (не cb/callback/next), чтобы не триггерить
    // ESLint callback-return при его вызове.
    cleanup.startReverse = (onDone?: () => void) => {
        hidePopup();
        disableInteraction();
        animator.startReverse(() => {
            onDone?.();
        });
    };

    return cleanup;
};

export * from './types';
