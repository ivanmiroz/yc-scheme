// src/components/ScaleTabs/ScaleTabs.tsx
'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';
import block from 'bem-cn-lite';

import {NetworkSingularity} from '../NetworkSingularity/NetworkSingularity';
import {
    LegendValue,
    getAvailableLegendValues,
    setActiveScheme,
} from '../InfrastructureChoose/canvasAnimation/schemes';
import {GuidePopup} from './GuidePopup';
import {ZoomHintPopup} from './ZoomHintPopup';
import {InactivityTimer} from './InactivityTimer';

import legend1Src from '@/assets/icons/legend1.png';
import legend2Src from '@/assets/icons/legend2.png';
import legend3Src from '@/assets/icons/legend3.png';
import legend4Src from '@/assets/icons/legend4.png';
import legend5Src from '@/assets/icons/legend5.png';
import legend6Src from '@/assets/icons/legend6.png';

import './ScaleTabs.scss';

const b = block('scale-tabs');

const INACTIVITY_DELAY_MS = 15000;
const COUNTDOWN_FROM = 59;
const RESET_DELAY_MS = 800;

// Гайд показывается не раньше, чем через 1 с после завершения анимации
// линий (событие onReady из NetworkSingularity).
const GUIDE_POPUP_DELAY_MS = 1000;

const actions = [
    {value: 'scale', label: 'Масштабирование без ограничений'},
    {value: 'ai', label: 'Разработка ИИ-приложений'},
    {value: 'stability', label: 'Стабильная работа сервисов'},
    {value: 'ttm', label: 'Ускорение time-to-market'},
];

const infraTabs = [
    {value: 'scale', label: 'Масштабирование\nбез ограничений'},
    {value: 'ai', label: 'Инфраструктура\nдля ИИ'},
    {value: 'stability', label: 'Стабильная работа\nсервисов'},
    {value: 'ttm', label: 'Ускорение\ntime-to-market'},
];

interface LegendItem {
    value: LegendValue;
    icon: React.ReactNode;
    text: string;
}

const allLegendItems: LegendItem[] = [
    {
        value: 'network',
        icon: <img src={legend1Src.src} alt="Сетевая связность" />,
        text: 'Сетевая\nсвязность',
    },
    {
        value: 'vps-pe',
        icon: <img src={legend2Src.src} alt="VPC Private Endpoint" />,
        text: 'VPC Private Endpoint',
    },
    {
        value: 'cloud-interconnect',
        icon: <img src={legend3Src.src} alt="Cloud interconnect" />,
        text: 'Cloud\ninterconnect',
    },
    {
        value: 'vps',
        icon: <img src={legend4Src.src} alt="VPS" />,
        text: 'Virtual Private\n Cloud',
    },
    {
        value: 'cloud-router',
        icon: <img src={legend5Src.src} alt="Cloud Router" />,
        text: 'Cloud Router',
    },
    {
        value: 'data-transfer',
        icon: <img src={legend6Src.src} alt="Data Transfer" />,
        text: 'Data Transfer',
    },
];

type OnboardingStep = 'closed' | 'guide' | 'zoom';
type ArchitectTab = 'comments' | 'scenario';

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
    'mousemove',
    'mousedown',
    'pointerdown',
    'keydown',
    'wheel',
    'touchstart',
];

interface ScaleTabsProps {
    activeIndex?: number;
    onActionClick?: (index: number) => void;
}

export const ScaleTabs: React.FC<ScaleTabsProps> = ({activeIndex = -1, onActionClick}) => {
    const [localActiveIndex, setLocalActiveIndex] = useState(0);
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    const [activeLegend, setActiveLegend] = useState<LegendValue | null>(null);

    // Пока идёт анимация схлопывания — помним, какой таб нужно применить после.
    const [pendingTabIndex, setPendingTabIndex] = useState<number | null>(null);
    // Флаг: анимация схлопывания запущена; блокирует повторные клики и
    // позволяет менять .scale-tabs__sidebar только после её завершения.
    const [isCollapsing, setIsCollapsing] = useState(false);

    const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('closed');
    const [isOnboardingDone, setIsOnboardingDone] = useState(false);

    const [architectTab, setArchitectTab] = useState<ArchitectTab>('comments');

    const [timerSeconds, setTimerSeconds] = useState<number | null>(null);

    const hasShownOnboardingRef = useRef(false);

    // Таймер отложенного показа GuidePopup (1 с после onReady).
    const guideShowTimerRef = useRef<number | null>(null);

    const inactivityTimeoutRef = useRef<number | null>(null);
    const countdownIntervalRef = useRef<number | null>(null);
    const reloadTimeoutRef = useRef<number | null>(null);

    const availableLegendValues = getAvailableLegendValues(localActiveIndex);
    const visibleLegendItems = allLegendItems.filter((item) =>
        availableLegendValues.includes(item.value),
    );

    // Показываем infra sidebar сразу, как только применился таб. Во время
    // схлопывания .scale-tabs__sidebar остаётся в исходном (scale) состоянии.
    const isSidebarActive = activeIndex >= 0;

    // isScattering для NetworkSingularity: либо идёт схлопывание, либо
    // уже показан infra sidebar (тогда canvas занят infrastructure-анимацией).
    const isScattering = isCollapsing || isSidebarActive;

    const activeTabValue = infraTabs[activeIndex]?.value;

    // Активная кнопка = уже применённый таб ИЛИ таб, который сейчас
    // «в полёте» (клик уже сделан, но анимация схлопывания ещё идёт).
    // Благодаря этому .scale-tabs__button_active появляется сразу при клике,
    // а не после завершения анимации.
    const pendingTabValue =
        pendingTabIndex === null ? undefined : infraTabs[pendingTabIndex]?.value;
    const activeButtonValue = pendingTabValue ?? activeTabValue;

    const cancelGuideShowTimer = useCallback(() => {
        if (guideShowTimerRef.current !== null) {
            window.clearTimeout(guideShowTimerRef.current);
            guideShowTimerRef.current = null;
        }
    }, []);

    const handleCanvasStart = useCallback(() => {
        setIsCanvasReady(false);
        // Перезапуск анимации (переключение схемы, ресайз и т. п.) —
        // запланированный показ гайда больше не актуален.
        cancelGuideShowTimer();
    }, [cancelGuideShowTimer]);

    const handleCanvasReady = useCallback(() => {
        setIsCanvasReady(true);
        if (hasShownOnboardingRef.current) return;
        hasShownOnboardingRef.current = true;

        // Линии дорисованы — показываем GuidePopup через 1 с.
        cancelGuideShowTimer();
        guideShowTimerRef.current = window.setTimeout(() => {
            guideShowTimerRef.current = null;
            setOnboardingStep('guide');
        }, GUIDE_POPUP_DELAY_MS);
    }, [cancelGuideShowTimer]);

    const handleGuideClose = useCallback(() => {
        setOnboardingStep('zoom');
    }, []);

    const handleZoomHintClose = useCallback(() => {
        setOnboardingStep('closed');
        setIsOnboardingDone(true);
    }, []);

    // Вызывается из NetworkSingularity после завершения ВСЕХ фаз анимации
    // (ускорение → сматывание линий → полёт иконок к центру).
    // Только здесь применяем отложенный таб — и, соответственно, только теперь
    // меняется .scale-tabs__sidebar-scale (через модификатор frozen у .scale-tabs__sidebar).
    const handleScatterComplete = useCallback(() => {
        if (pendingTabIndex !== null) {
            onActionClick?.(pendingTabIndex);
            setLocalActiveIndex(pendingTabIndex);
            setActiveScheme(pendingTabIndex);
            setPendingTabIndex(null);
        }
        setIsCollapsing(false);
    }, [pendingTabIndex, onActionClick]);

    const handleInfraTabClick = (index: number) => {
        setLocalActiveIndex(index);
        setActiveScheme(index);
    };

    const handleButtonClick = (actionValue: string) => {
        const tabIndex = infraTabs.findIndex((tab) => tab.value === actionValue);
        if (tabIndex === -1) return;

        // Защита: не запускаем новую схлопывающую анимацию поверх текущей
        // и не переключаем таб, если infra sidebar уже показан.
        if (isCollapsing) return;
        if (isSidebarActive) return;

        // Запоминаем намерение — благодаря activeButtonValue кнопка сразу
        // станет активной, хотя сам таб применится только в handleScatterComplete.
        setPendingTabIndex(tabIndex);
        setIsCollapsing(true);
    };

    const handleLegendClick = (value: LegendValue) => {
        setActiveLegend((prev) => (prev === value ? null : value));
    };

    // ------------------------------------------------------------
    //  Таймер без активности
    // ------------------------------------------------------------

    const clearTimers = useCallback(() => {
        if (inactivityTimeoutRef.current !== null) {
            window.clearTimeout(inactivityTimeoutRef.current);
            inactivityTimeoutRef.current = null;
        }
        if (countdownIntervalRef.current !== null) {
            window.clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        if (reloadTimeoutRef.current !== null) {
            window.clearTimeout(reloadTimeoutRef.current);
            reloadTimeoutRef.current = null;
        }
    }, []);

    const startCountdown = useCallback(() => {
        setTimerSeconds(COUNTDOWN_FROM);
        let remaining = COUNTDOWN_FROM;

        countdownIntervalRef.current = window.setInterval(() => {
            remaining -= 1;

            if (remaining <= 0) {
                setTimerSeconds(0);
                if (countdownIntervalRef.current !== null) {
                    window.clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                }
                // Небольшая пауза, чтобы пользователь увидел 00:00,
                // затем перезагружаем страницу — она вернётся в исходное состояние.
                reloadTimeoutRef.current = window.setTimeout(() => {
                    reloadTimeoutRef.current = null;
                    window.location.reload();
                }, RESET_DELAY_MS);
                return;
            }
            setTimerSeconds(remaining);
        }, 1000);
    }, []);

    const resetInactivity = useCallback(() => {
        clearTimers();
        setTimerSeconds(null);

        if (isOnboardingDone) {
            inactivityTimeoutRef.current = window.setTimeout(() => {
                startCountdown();
            }, INACTIVITY_DELAY_MS);
        }
    }, [clearTimers, isOnboardingDone, startCountdown]);

    useEffect(() => {
        if (!isOnboardingDone) return undefined;

        const handler = () => resetInactivity();

        ACTIVITY_EVENTS.forEach((eventName) =>
            window.addEventListener(eventName, handler, {passive: true}),
        );

        resetInactivity();

        return () => {
            ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, handler));
            clearTimers();
            setTimerSeconds(null);
        };
    }, [isOnboardingDone, resetInactivity, clearTimers]);

    // Отмена запланированного показа гайда при размонтировании.
    useEffect(
        () => () => {
            cancelGuideShowTimer();
        },
        [cancelGuideShowTimer],
    );

    return (
        <div className={b()}>
            <div className={b('content')}>
                <div className={b('panel')}>
                    <NetworkSingularity
                        activeSchemeIndex={localActiveIndex}
                        isScattering={isScattering}
                        activeLegend={activeLegend}
                        onStart={handleCanvasStart}
                        onReady={handleCanvasReady}
                        onScatterComplete={handleScatterComplete}
                    />
                </div>
            </div>

            <div className={b('sidebar', {frozen: isSidebarActive})}>
                <div className={b('sidebar-scale')}>
                    <div className={b('header')}>
                        <h2 className={b('title')}>Платформа для гибридных решений</h2>
                        <p className={b('description')}>
                            Выберите сценарий и готовую архитектуру для локального и облачного
                            контура. Адаптируйте решение под свои требования с помощью архитектора.
                        </p>
                    </div>

                    <div className={b('actions')}>
                        {actions.map((action) => (
                            <button
                                key={action.value}
                                className={b('button', {
                                    active: activeButtonValue === action.value,
                                })}
                                type="button"
                                onClick={() => handleButtonClick(action.value)}
                            >
                                <span className={b('button-text')}>{action.label}</span>
                                <span className={b('button-arrow')}>
                                    <svg
                                        width="9"
                                        height="16"
                                        viewBox="0 0 9 16"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M0.329505 15.4205C-0.109835 14.9812 -0.109835 14.2688 0.329505 13.8295L6.28401 7.875L0.329504 1.9205C-0.109836 1.48116 -0.109836 0.768849 0.329504 0.32951C0.768844 -0.10983 1.48115 -0.10983 1.92049 0.32951L8.67049 7.07951C9.10983 7.51885 9.10983 8.23116 8.67049 8.6705L1.92049 15.4205C1.48115 15.8598 0.768844 15.8598 0.329505 15.4205Z"
                                            fill="currentColor"
                                            fillOpacity="0.7"
                                        />
                                    </svg>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`${b('sidebar-infra')} infrastructure-choose__sidebar`}>
                    <h2 className="infrastructure-choose__title">Выбери инфраструктуру:</h2>

                    <div className="infrastructure-choose__tabs">
                        {infraTabs.map((tab, index) => (
                            <button
                                key={tab.value}
                                type="button"
                                disabled={!isCanvasReady}
                                className={`infrastructure-choose__tab ${localActiveIndex === index ? 'infrastructure-choose__tab_active' : ''}`}
                                onClick={() => handleInfraTabClick(index)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="infrastructure-choose__architect-tabs">
                        <div className="infrastructure-choose__architect-tablist" role="tablist">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={architectTab === 'comments'}
                                className={`infrastructure-choose__architect-tab ${
                                    architectTab === 'comments'
                                        ? 'infrastructure-choose__architect-tab_active'
                                        : ''
                                }`}
                                onClick={() => setArchitectTab('comments')}
                            >
                                Комментарии архитектора
                            </button>

                            <button
                                type="button"
                                role="tab"
                                aria-selected={architectTab === 'scenario'}
                                className={`infrastructure-choose__architect-tab ${
                                    architectTab === 'scenario'
                                        ? 'infrastructure-choose__architect-tab_active'
                                        : ''
                                }`}
                                onClick={() => setArchitectTab('scenario')}
                            >
                                Описание сценария
                            </button>
                        </div>

                        <div className="infrastructure-choose__architect-tabpanel" role="tabpanel">
                            {architectTab === 'comments' && (
                                <p className="infrastructure-choose__architect-text">
                                    Здесь будет комментарий архитектора по выбранному сценарию.
                                </p>
                            )}
                            {architectTab === 'scenario' && (
                                <p className="infrastructure-choose__architect-text">
                                    Здесь будет описание выбранного сценария.
                                </p>
                            )}
                        </div>
                    </div>

                    <h3 className="infrastructure-choose__section-title">Network</h3>

                    <div className="infrastructure-choose__buttons">
                        {visibleLegendItems.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                className={`infrastructure-choose__button ${
                                    activeLegend === item.value
                                        ? 'infrastructure-choose__button_active'
                                        : ''
                                }`}
                                onClick={() => handleLegendClick(item.value)}
                            >
                                <div className="infrastructure-choose__button-icon">
                                    {item.icon}
                                </div>
                                <span className="infrastructure-choose__button-text">
                                    {item.text}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <GuidePopup open={onboardingStep === 'guide'} onClose={handleGuideClose} />
            <ZoomHintPopup open={onboardingStep === 'zoom'} onClose={handleZoomHintClose} />

            {timerSeconds !== null && <InactivityTimer seconds={timerSeconds} />}
        </div>
    );
};
