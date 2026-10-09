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

import zoomHintSrc from '@/assets/icons/zoom-hint.png';

import './ScaleTabs.scss';

const b = block('scale-tabs');

type OnboardingStep = 'closed' | 'guide' | 'zoom';

export interface ScaleTabsLegendItem {
    value: LegendValue;
    icon: string;
    text: string;
    alt?: string;
}

export interface ScaleTabsTabData {
    value: string;
    actionLabel: string;
    title: string;
    architectRecommendations: string[];
}

export interface ScaleTabsOnboardingConfig {
    inactivityDelayMs: number;
    guide: {
        showDelayMs: number;
        title: string;
        blocks: Array<{
            cardTitle: string;
            items: string[];
            note?: string;
        }>;
    };
    zoomHint: {
        text: string;
        icon?: string;
        durationMs: number;
    };
}

export interface ScaleTabsData {
    header: {
        title: string;
        text: string;
    };
    tabsHeader: {
        title: string;
        commentsTabLabel: string;
    };
    network: {
        sectionTitle: string;
        legends: ScaleTabsLegendItem[];
    };
    tabs: ScaleTabsTabData[];
    onboarding: ScaleTabsOnboardingConfig;
}

interface ScaleTabsProps {
    activeIndex?: number;
    onActionClick?: (index: number) => void;
    data?: ScaleTabsData;
}

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
    'mousemove',
    'mousedown',
    'pointerdown',
    'keydown',
    'wheel',
    'touchstart',
];

const EMPTY_DATA: ScaleTabsData = {
    header: {title: '', text: ''},
    tabsHeader: {title: '', commentsTabLabel: ''},
    network: {sectionTitle: '', legends: []},
    tabs: [],
    onboarding: {
        inactivityDelayMs: 60000,
        guide: {showDelayMs: 1000, title: '', blocks: []},
        zoomHint: {text: '', durationMs: 30000},
    },
};

export const ScaleTabs: React.FC<ScaleTabsProps> = ({activeIndex = -1, onActionClick, data}) => {
    const safeData = data ?? EMPTY_DATA;

    const [localActiveIndex, setLocalActiveIndex] = useState(0);
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    const [activeLegend, setActiveLegend] = useState<LegendValue | null>(null);
    const [pendingTabIndex, setPendingTabIndex] = useState<number | null>(null);
    const [isCollapsing, setIsCollapsing] = useState(false);
    const [isReversing, setIsReversing] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('closed');
    const [isOnboardingDone, setIsOnboardingDone] = useState(false);

    const hasShownOnboardingRef = useRef(false);
    const guideShowTimerRef = useRef<number | null>(null);
    const zoomHintTimerRef = useRef<number | null>(null);
    const inactivityTimeoutRef = useRef<number | null>(null);

    const availableLegendValues = getAvailableLegendValues(localActiveIndex);
    const visibleLegendItems = safeData.network.legends.filter((item) =>
        availableLegendValues.includes(item.value),
    );

    const isSidebarActive = activeIndex >= 0;
    const isScattering = isCollapsing || isSidebarActive;
    const activeTabValue = safeData.tabs[activeIndex]?.value;

    const pendingTabValue =
        pendingTabIndex === null ? undefined : safeData.tabs[pendingTabIndex]?.value;
    const activeButtonValue = pendingTabValue ?? activeTabValue;

    const cancelGuideShowTimer = useCallback(() => {
        if (guideShowTimerRef.current !== null) {
            window.clearTimeout(guideShowTimerRef.current);
            guideShowTimerRef.current = null;
        }
    }, []);

    const cancelZoomHintTimer = useCallback(() => {
        if (zoomHintTimerRef.current !== null) {
            window.clearTimeout(zoomHintTimerRef.current);
            zoomHintTimerRef.current = null;
        }
    }, []);

    const handleCanvasStart = useCallback(() => {
        setIsCanvasReady(false);
        cancelGuideShowTimer();
    }, [cancelGuideShowTimer]);

    const handleCanvasReady = useCallback(() => {
        setIsCanvasReady(true);
        if (hasShownOnboardingRef.current) return;
        hasShownOnboardingRef.current = true;

        cancelGuideShowTimer();
        guideShowTimerRef.current = window.setTimeout(() => {
            guideShowTimerRef.current = null;
            setOnboardingStep('guide');
        }, safeData.onboarding.guide.showDelayMs);
    }, [cancelGuideShowTimer, safeData.onboarding.guide.showDelayMs]);

    const handleGuideClose = useCallback(() => {
        setOnboardingStep('zoom');
        cancelZoomHintTimer();
        zoomHintTimerRef.current = window.setTimeout(() => {
            zoomHintTimerRef.current = null;
            setOnboardingStep('closed');
            setIsOnboardingDone(true);
        }, safeData.onboarding.zoomHint.durationMs);
    }, [cancelZoomHintTimer, safeData.onboarding.zoomHint.durationMs]);

    const handleScatterComplete = useCallback(() => {
        if (pendingTabIndex !== null) {
            onActionClick?.(pendingTabIndex);
            setLocalActiveIndex(pendingTabIndex);
            setActiveScheme(pendingTabIndex);
            setPendingTabIndex(null);
        }
        setIsCollapsing(false);
    }, [pendingTabIndex, onActionClick]);

    const handleReverseComplete = useCallback(() => {
        cancelGuideShowTimer();
        cancelZoomHintTimer();

        setIsReversing(false);
        setIsOnboardingDone(false);
        setOnboardingStep('closed');
        hasShownOnboardingRef.current = false;

        setActiveLegend(null);
        setPendingTabIndex(null);
        setIsCollapsing(false);

        onActionClick?.(-1);
        setLocalActiveIndex(0);
        setActiveScheme(0);
    }, [onActionClick, cancelGuideShowTimer, cancelZoomHintTimer]);

    const handleInfraTabClick = (index: number) => {
        if (isReversing) return;
        setLocalActiveIndex(index);
        setActiveScheme(index);
    };

    const handleButtonClick = (actionValue: string) => {
        const tabIndex = safeData.tabs.findIndex((tab) => tab.value === actionValue);
        if (tabIndex === -1) return;

        if (isCollapsing) return;
        if (isSidebarActive) return;
        if (isReversing) return;

        setPendingTabIndex(tabIndex);
        setIsCollapsing(true);
    };

    const handleLegendClick = (value: LegendValue) => {
        if (isReversing) return;
        setActiveLegend((prev) => (prev === value ? null : value));
    };

    const clearInactivityTimer = useCallback(() => {
        if (inactivityTimeoutRef.current !== null) {
            window.clearTimeout(inactivityTimeoutRef.current);
            inactivityTimeoutRef.current = null;
        }
    }, []);

    const resetInactivity = useCallback(() => {
        clearInactivityTimer();

        if (isOnboardingDone && !isReversing) {
            inactivityTimeoutRef.current = window.setTimeout(() => {
                inactivityTimeoutRef.current = null;
                setIsReversing(true);
            }, safeData.onboarding.inactivityDelayMs);
        }
    }, [
        clearInactivityTimer,
        isOnboardingDone,
        isReversing,
        safeData.onboarding.inactivityDelayMs,
    ]);

    useEffect(() => {
        if (!isOnboardingDone) return undefined;

        const handler = () => resetInactivity();

        ACTIVITY_EVENTS.forEach((eventName) =>
            window.addEventListener(eventName, handler, {passive: true}),
        );

        resetInactivity();

        return () => {
            ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, handler));
            clearInactivityTimer();
        };
    }, [isOnboardingDone, resetInactivity, clearInactivityTimer]);

    useEffect(
        () => () => {
            cancelGuideShowTimer();
            cancelZoomHintTimer();
        },
        [cancelGuideShowTimer, cancelZoomHintTimer],
    );

    const activeTab = safeData.tabs[localActiveIndex];
    const zoomHintIcon = safeData.onboarding.zoomHint.icon ?? zoomHintSrc.src;

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
                        isReversing={isReversing}
                        onReverseComplete={handleReverseComplete}
                    />
                </div>

                <div className="chooser">
                    <h2 className="infrastructure-choose__title">{safeData.tabsHeader.title}</h2>

                    <div className="infrastructure-choose__tabs">
                        {safeData.tabs.map((tab, index) => (
                            <button
                                key={tab.value}
                                type="button"
                                disabled={!isCanvasReady}
                                className={`infrastructure-choose__tab ${localActiveIndex === index ? 'infrastructure-choose__tab_active' : ''}`}
                                onClick={() => handleInfraTabClick(index)}
                            >
                                <span
                                    className="infrastructure-choose__tab-text"
                                    dangerouslySetInnerHTML={{__html: tab.title}}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className={b('sidebar', {frozen: isSidebarActive})}>
                <div className={b('sidebar-scale')}>
                    <div className={b('header')}>
                        <h2 className={b('title')}>{safeData.header.title}</h2>
                        <p className={b('description')}>{safeData.header.text}</p>
                    </div>

                    <div className={b('actions')}>
                        {safeData.tabs.map((tab) => (
                            <button
                                key={tab.value}
                                className={b('button', {
                                    active: activeButtonValue === tab.value,
                                })}
                                type="button"
                                onClick={() => handleButtonClick(tab.value)}
                            >
                                <span className={b('button-text')}>{tab.actionLabel}</span>
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
                    <div className="infrastructure-choose__architect-tabs">
                        <div className="infrastructure-choose__architect-tabpanel" role="tabpanel">
                            <h3 className="infrastructure-choose__section-title">
                                Рекомендации архитекторов
                            </h3>

                            <ul className="infrastructure-choose__architect-recommendation">
                                {activeTab?.architectRecommendations?.map((paragraph, index) => (
                                    <li
                                        key={index}
                                        className="infrastructure-choose__architect-recommendation-text"
                                    >
                                        {paragraph}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <h3 className="infrastructure-choose__section-title">
                        {safeData.network.sectionTitle}
                    </h3>

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
                                    <img src={item.icon} alt={item.alt ?? item.text} />
                                </div>
                                <span className="infrastructure-choose__button-text">
                                    {item.text}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {onboardingStep === 'zoom' && (
                <div className={b('zoom-hint')}>
                    <div className={b('zoom-hint-icon')}>
                        <img src={zoomHintIcon} alt="" />
                    </div>
                    <p className={b('zoom-hint-text')}>{safeData.onboarding.zoomHint.text}</p>
                </div>
            )}

            <GuidePopup
                open={onboardingStep === 'guide'}
                onClose={handleGuideClose}
                title={safeData.onboarding.guide.title}
                blocks={safeData.onboarding.guide.blocks}
            />
        </div>
    );
};
