'use client';

import React from 'react';
import block from 'bem-cn-lite';

import clockSrc from '@/assets/icons/clock.png';

import './InactivityTimer.scss';

const b = block('inactivity-timer');

interface InactivityTimerProps {
    // Общее число секунд (например, 59).
    seconds: number;
}

export const InactivityTimer: React.FC<InactivityTimerProps> = ({seconds}) => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');

    return (
        <div className={b()} role="timer" aria-live="polite">
            <img className={b('icon')} src={clockSrc.src} alt="" />
            <span className={b('value')}>
                {mm}:{ss}
            </span>
        </div>
    );
};
