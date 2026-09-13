'use client';

import React, {useEffect} from 'react';
import block from 'bem-cn-lite';

// Иконка с жестом зума и стрелками.
import zoomHintSrc from '@/assets/icons/zoom-hint.png';

import './ZoomHintPopup.scss';

const b = block('zoom-hint-popup');

interface ZoomHintPopupProps {
    open: boolean;
    onClose: () => void;
}

export const ZoomHintPopup: React.FC<ZoomHintPopupProps> = ({open, onClose}) => {
    useEffect(() => {
        if (!open) return undefined;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className={b()}>
            <div className={b('backdrop')} onClick={onClose} />

            <div className={b('row')}>
                <div className={b('text-card')}>
                    <p className={b('text')}>Увеличивайте, чтобы рассмотреть</p>
                </div>

                <div className={b('icon-card')}>
                    <img src={zoomHintSrc.src} alt="" />
                </div>

                <button
                    type="button"
                    className={b('close')}
                    aria-label="Закрыть"
                    onClick={onClose}
                />
            </div>
        </div>
    );
};
