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

    const resizeCanvas = () => {
        const parentEl = canvas.parentElement;
        if (parentEl) {
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

            if (isLoaded) {
                animator.initPodiums();
            }
        }
    };

    // Обработчик движения мыши для изменения курсора
    const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const isOverElement = animator.checkHover(mouseX, mouseY);
        // eslint-disable-next-line no-param-reassign
        canvas.style.cursor = isOverElement ? 'pointer' : 'default';
    };

    // Скрытие контейнера с подложкой и попапом
    const hidePopup = () => {
        popupContainer.style.display = 'none';
    };

    // Кнопка закрытия — просто прячем попап, не всплываем до подложки
    const handleCloseClick = (e: MouseEvent) => {
        e.stopPropagation();
        hidePopup();
    };

    // Обработчик клика для показа попапа
    const handleClick = (e: MouseEvent) => {
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

        // Геометрия иконки в координатах канваса (CSS-пиксели)
        const dpr = window.devicePixelRatio || 1;
        const canvasWidth = canvas.width / dpr;
        const anchor = getPositionAnchor(clickedPosition, canvasWidth);

        // Переводим в координаты вьюпорта
        const iconCenterXViewport = rect.left + anchor.centerX;
        const iconTopViewport = rect.top + anchor.topY;

        // Измеряем попап и арку. getBoundingClientRect() принудительно
        // пересчитывает layout, поэтому размеры уже актуальны.
        const popupRect = popup.getBoundingClientRect();
        const archRect = archShape.getBoundingClientRect();

        // Смещение кончика арки относительно левого края попапа
        const archTipX = archRect.left - popupRect.left + archRect.width / 2;
        // Реальная высота арки от низа попапа до её кончика
        // (учитывает возможное «утопление» арки в попап через top: 99%)
        const archHeight = archRect.bottom - popupRect.bottom;

        // Хотим, чтобы:
        //  - кончик арки совпал по X с центром иконки;
        //  - кончик арки касался верхнего края иконки (плюс зазор) по Y.
        let popupLeft = iconCenterXViewport - archTipX;
        let popupTop = iconTopViewport - archHeight - popupRect.height - POPUP_ICON_GAP;

        // Ограничиваем по горизонтали в пределах вьюпорта
        const maxLeft = window.innerWidth - popupRect.width - POPUP_VIEWPORT_MARGIN;
        popupLeft = Math.max(POPUP_VIEWPORT_MARGIN, Math.min(popupLeft, maxLeft));

        // Если сверху не помещается — показываем попап под иконкой
        if (popupTop < POPUP_VIEWPORT_MARGIN) {
            const iconBottomViewport = rect.top + anchor.bottomY;
            popupTop = iconBottomViewport + archHeight + POPUP_ICON_GAP;
        }

        // Aside (QR + close) отрисован абсолютно справа от попапа и не влияет
        // на popupRect. Если после финального позиционирования он вылезает
        // за правый край вьюпорта — сдвигаем попап левее, чтобы aside поместился.
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

    // Клик по подложке — закрываем попап
    const handleBackdropClick = () => {
        hidePopup();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    backdrop.addEventListener('click', handleBackdropClick);
    popupClose.addEventListener('click', handleCloseClick);

    // Создаем функцию очистки и добавляем к ней метод refreshScheme
    const cleanup: CanvasAnimationCleanup = () => {
        window.removeEventListener('resize', resizeCanvas);
        canvas.removeEventListener('mousemove', handleMouseMove);
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
