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
        icon: <img src={legend2Src.src} alt="VPS PE" />,
        text: 'VPS PE',
    },
    {
        value: 'cloud-interconnect',
        icon: <img src={legend3Src.src} alt="Cloud interconnect" />,
        text: 'Cloud\ninterconnect',
    },
    {
        value: 'vps',
        icon: <img src={legend4Src.src} alt="VPS" />,
        text: 'VPS',
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

    const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('closed');
    const [isOnboardingDone, setIsOnboardingDone] = useState(false);

    const [timerSeconds, setTimerSeconds] = useState<number | null>(null);

    const hasShownOnboardingRef = useRef(false);

    const inactivityTimeoutRef = useRef<number | null>(null);
    const countdownIntervalRef = useRef<number | null>(null);
    const reloadTimeoutRef = useRef<number | null>(null);

    const availableLegendValues = getAvailableLegendValues(localActiveIndex);
    const visibleLegendItems = allLegendItems.filter((item) =>
        availableLegendValues.includes(item.value),
    );

    const handleCanvasStart = useCallback(() => {
        setIsCanvasReady(false);
    }, []);

    const handleCanvasReady = useCallback(() => {
        setIsCanvasReady(true);
        if (hasShownOnboardingRef.current) return;
        hasShownOnboardingRef.current = true;
        setOnboardingStep('guide');
    }, []);

    const handleGuideClose = useCallback(() => {
        setOnboardingStep('zoom');
    }, []);

    const handleZoomHintClose = useCallback(() => {
        setOnboardingStep('closed');
        setIsOnboardingDone(true);
    }, []);

    const handleInfraTabClick = (index: number) => {
        setLocalActiveIndex(index);
        setActiveScheme(index);
    };

    const handleButtonClick = (actionValue: string) => {
        const tabIndex = infraTabs.findIndex((tab) => tab.value === actionValue);
        if (tabIndex === -1) return;
        onActionClick?.(tabIndex);
        setLocalActiveIndex(tabIndex);
        setActiveScheme(tabIndex);
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

        if (!isOnboardingDone) return;

        inactivityTimeoutRef.current = window.setTimeout(() => {
            startCountdown();
        }, INACTIVITY_DELAY_MS);
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

    const isSidebarActive = activeIndex !== -1;
    const activeTabValue = infraTabs[activeIndex]?.value;

    return (
        <div className={b()}>
            <div className={b('content')}>
                <div className={b('panel')}>
                    <NetworkSingularity
                        activeSchemeIndex={localActiveIndex}
                        isScattering={isSidebarActive}
                        activeLegend={activeLegend}
                        onStart={handleCanvasStart}
                        onReady={handleCanvasReady}
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
                                    active: activeTabValue === action.value,
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

                    <button className="infrastructure-choose__architect-button" type="button">
                        <span className="infrastructure-choose__architect-button-text">
                            Комментарии архитектора
                        </span>
                        <svg
                            className="infrastructure-choose__architect-button-arrow"
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
                                fill="white"
                                fillOpacity="0.7"
                            />
                        </svg>
                    </button>

                    <h3 className="infrastructure-choose__section-title">Легенда</h3>

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
