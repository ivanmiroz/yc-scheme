'use client';

import React, {useEffect} from 'react';
import block from 'bem-cn-lite';

import './GuidePopup.scss';

const b = block('guide-popup');

export interface GuidePopupBlock {
    cardTitle: string;
    items: string[];
    note?: string;
}

interface GuidePopupProps {
    open: boolean;
    onClose: () => void;
    /** Заголовок гайда. */
    title: string;
    /** Блоки с карточками. */
    blocks: GuidePopupBlock[];
}

export const GuidePopup: React.FC<GuidePopupProps> = ({open, onClose, title, blocks}) => {
    // Закрытие по Escape
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

            <div className={b('body')}>
                <div className={b('panel')}>
                    {/* Блок 1: заголовок */}
                    <div className={b('block', {kind: 'title'})}>
                        <h1 className={b('title')}>{title}</h1>
                    </div>

                    {/* Блоки 2..N: карточки с пунктами и заметкой */}
                    {blocks.map((guideBlock, index) => (
                        <div key={index} className={b('block', {kind: 'card'})}>
                            <h6 className={b('card-title')}>{guideBlock.cardTitle}</h6>
                            <ul className={b('list')}>
                                {guideBlock.items.map((item, itemIndex) => (
                                    <li key={itemIndex} className={b('list-item')}>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            {guideBlock.note && <p className={b('note')}>{guideBlock.note}</p>}
                        </div>
                    ))}
                </div>

                {/* Кнопка закрытия — вне панели, справа сверху, с отступом 8px. */}
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
