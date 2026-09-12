import podiumSrc from '@/assets/images/podium.png';
import {CanvasAnimationCleanup} from './types';
import {createPodiumAnimator} from './animation';
import {getPositionConfig} from './schemes';
import {getDescription, getQr} from './descriptions';
import {getPositionAnchor} from './drawers';
import './popup.scss';

// Небольшой зазор между кончиком арки и верхом иконки
const POPUP_ICON_GAP = 4;
// Отступ от краёв вьюпорта при клэмпе
const POPUP_VIEWPORT_MARGIN = 8;

// Границы зума
const MIN_SCALE = 1;
const MAX_SCALE = 5;
// Порог движения (в px), после которого тап/клик считается перетаскиванием
const DRAG_THRESHOLD = 5;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export interface InitCanvasAnimationOptions {
    // Вызывается при каждом запуске/перезапуске анимации (первый запуск, ресайз).
    onStart?: () => void;
    // Вызывается при каждом завершении анимации — платформы отрисованы
    // и все иконки появились.
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
        return cleanup;
    }

    const podiumImage = new Image();
    let isLoaded = false;

    const animator = createPodiumAnimator(canvas, ctx, podiumImage, {
        onStart: options.onStart,
        onReady: options.onReady,
    });

    podiumImage.onload = () => {
        isLoaded = true;
        animator.initPodiums();
    };

    if (podiumImage.complete) {
        isLoaded = true;
        animator.initPodiums();
    }

    podiumImage.src = podiumSrc.src;

    // Отключаем нативные жесты (scroll, pinch-zoom) на canvas,
    // чтобы браузер не перехватывал жесты у нас.
    // eslint-disable-next-line no-param-reassign
    canvas.style.touchAction = 'none';

    // Контейнер для подложки и попапа.
    // Крепим к document.body, чтобы transform-предки (.scale-tabs__content)
    // не создавали containing block для position: fixed.
    const popupContainer = document.createElement('div');
    popupContainer.style.position = 'fixed';
    popupContainer.style.inset = '0';
    popupContainer.style.zIndex = '1000';
    popupContainer.style.display = 'none';
    popupContainer.style.pointerEvents = 'none';

    // Создание подложки (backdrop)
    const backdrop = document.createElement('div');
    backdrop.className = 'scheme-popup-backdrop';
    backdrop.style.pointerEvents = 'auto';

    // Создание попапа
    const popup = document.createElement('div');
    popup.className = 'scheme-popup';
    popup.style.pointerEvents = 'auto';
    // Скрываем до того, как вычислим позицию, чтобы не было «мигания»
    popup.style.visibility = 'hidden';

    const popupTitle = document.createElement('h4');
    popupTitle.className = 'scheme-popup__title';

    const popupDescription = document.createElement('p');
    popupDescription.className = 'scheme-popup__description';

    // Блок справа от попапа: QR + кнопка закрытия
    const popupAside = document.createElement('div');
    popupAside.className = 'scheme-popup__aside';

    // QR-код
    const popupQr = document.createElement('div');
    popupQr.className = 'scheme-popup__qr';
    const popupQrImage = document.createElement('img');
    popupQrImage.alt = 'QR-код';
    popupQr.appendChild(popupQrImage);

    // Кнопка закрытия
    const popupClose = document.createElement('button');
    popupClose.className = 'scheme-popup__close';
    popupClose.type = 'button';
    popupClose.setAttribute('aria-label', 'Закрыть');

    popupAside.appendChild(popupQr);
    popupAside.appendChild(popupClose);

    // Декоративная «арка» под попапом (хвостик-указатель)
    const archShape = document.createElement('div');
    archShape.className = 'arch-shape';

    popup.appendChild(popupTitle);
    popup.appendChild(popupDescription);
    popup.appendChild(popupAside);
    popup.appendChild(archShape);

    // Добавляем подложку и попап в один контейнер
    popupContainer.appendChild(backdrop);
    popupContainer.appendChild(popup);

    // Крепим контейнер к body
    document.body.appendChild(popupContainer);

    // Предотвращаем всплытие клика внутри попапа до подложки
    popup.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // ============================================================
    //  Зум и панорамирование
    // ============================================================

    let currentScale = 1;
    let currentOffsetX = 0;
    let currentOffsetY = 0;

    // Держим видимую часть в пределах содержимого.
    // Если scale <= 1 — контент меньше canvas, центрируем.
    const clampOffsets = () => {
        const dpr = window.devicePixelRatio || 1;
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

    // Активные указатели (мышь/тач/стилус)
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
            hasMoved = true; // жест точно не тап

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

            // Панорамирование имеет смысл только когда увели (scale > 1).
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
            // Перешли от pinch к drag — переинициализируем старт,
            // чтобы второй палец продолжил движение без «прыжка».
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

        // Мировая точка под курсором должна остаться под курсором.
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

        // При ресайзе схема перерисовывается заново — попап,
        // привязанный к старой геометрии иконки, прячем.
        hidePopup();

        const dpr = window.devicePixelRatio || 1;
        const rect = parentEl.getBoundingClientRect();

        // eslint-disable-next-line no-param-reassign
        canvas.width = rect.width * dpr;
        // eslint-disable-next-line no-param-reassign
        canvas.height = rect.height * dpr;
        // eslint-disable-next-line no-param-reassign
        canvas.style.width = `${rect.width}px`;
        // eslint-disable-next-line no-param-reassign
        canvas.style.height = `${rect.height}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        // После изменения размеров может понадобиться пересчитать offset.
        clampOffsets();
        applyView();

        if (isLoaded) {
            animator.initPodiums();
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
        // Если это был drag/pinch — не открываем попап.
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

        const cleanLabel = config.label.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        const description = getDescription(config.label);
        const qrSrc = getQr(config.label);

        popupTitle.textContent = cleanLabel;

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

        // ВАЖНО: сначала прячем попап (он может быть visible с прошлого открытия),
        // и только потом показываем контейнер. Иначе на один кадр попап мелькнёт
        // на старой позиции до того, как мы пересчитаем координаты.
        popup.style.visibility = 'hidden';
        popupContainer.style.display = 'block';

        // Геометрия иконки в МИРОВЫХ координатах канваса.
        const dpr = window.devicePixelRatio || 1;
        const canvasWidth = canvas.width / dpr;
        const anchor = getPositionAnchor(clickedPosition, canvasWidth);

        // Переводим в координаты вьюпорта с учётом зума/панорамирования.
        const view = animator.getView();
        const iconCenterXViewport = rect.left + view.x + anchor.centerX * view.scale;
        const iconCenterYViewport = rect.top + view.y + anchor.centerY * view.scale;
        const iconHalfScreen = (anchor.iconSize / 2) * view.scale;
        const iconTopViewport = iconCenterYViewport - iconHalfScreen;

        // Измеряем попап и арку. getBoundingClientRect() принудительно
        // пересчитывает layout, поэтому размеры уже актуальны.
        const popupRect = popup.getBoundingClientRect();
        const archRect = archShape.getBoundingClientRect();

        // Смещение кончика арки относительно левого края попапа
        const archTipX = archRect.left - popupRect.left + archRect.width / 2;
        // Реальная высота арки от низа попапа до её кончика
        const archHeight = archRect.bottom - popupRect.bottom;

        // Попап ВСЕГДА над иконкой: кончик арки касается её верхнего края.
        let popupLeft = iconCenterXViewport - archTipX;
        const popupTop = iconTopViewport - archHeight - popupRect.height - POPUP_ICON_GAP;

        // Клэмп только по горизонтали — по вертикали оставляем как есть,
        // чтобы попап не «перепрыгивал» под иконку у верхних рядов.
        const maxLeft = window.innerWidth - popupRect.width - POPUP_VIEWPORT_MARGIN;
        popupLeft = Math.max(POPUP_VIEWPORT_MARGIN, Math.min(popupLeft, maxLeft));

        // Aside (QR + close) отрисован абсолютно справа от попапа и не влияет
        // на popupRect. Если он вылезает за правый край — сдвигаем попап левее.
        popupAside.style.display = 'flex';
        const asideRect = popupAside.getBoundingClientRect();
        const asideOffsetFromPopupLeft = asideRect.left - popupRect.left;
        const asideTotalWidth = asideRect.width;

        const asideRight = popupLeft + asideOffsetFromPopupLeft + asideTotalWidth;
        const maxRight = window.innerWidth - POPUP_VIEWPORT_MARGIN;
        if (asideRight > maxRight) {
            popupLeft = Math.max(POPUP_VIEWPORT_MARGIN, popupLeft - (asideRight - maxRight));
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

    // Создаем функцию очистки и добавляем к ней метод refreshScheme
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

        const frameId = animator.getAnimationFrameId();
        if (frameId) {
            cancelAnimationFrame(frameId);
        }

        if (popupContainer.parentElement) {
            popupContainer.parentElement.removeChild(popupContainer);
        }
    };

    cleanup.refreshScheme = () => {
        animator.refreshScheme?.();
    };

    return cleanup;
};

export * from './types';
