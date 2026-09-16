// src/components/InfrastructureChoose/canvasAnimation/schemes/index.ts
import {scheme1Lines, scheme1Platforms} from './scheme1';
import {scheme2Lines, scheme2Platforms} from './scheme2';
import {scheme3Lines, scheme3Platforms} from './scheme3';
import {scheme4Lines, scheme4Platforms} from './scheme4';
import {
    LEGEND_TO_LINE_KIND,
    LegendValue,
    LineKind,
    PositionConfig,
    STATIC_LEGEND_KINDS,
    Scheme,
    getLineKind,
} from './types';

// ==========================================
// Массив всех доступных схем
// ==========================================
export const schemes: Scheme[] = [
    {platforms: scheme1Platforms, lines: scheme1Lines},
    {platforms: scheme2Platforms, lines: scheme2Lines},
    {platforms: scheme3Platforms, lines: scheme3Lines},
    {platforms: scheme4Platforms, lines: scheme4Lines},
];

let activeSchemeIndex = 0;

export const setActiveScheme = (index: number) => {
    activeSchemeIndex = Math.max(0, Math.min(index, schemes.length - 1));
};

export const getActiveScheme = (): Scheme => schemes[activeSchemeIndex];

export const getActiveSchemeLines = (): Scheme['lines'] => schemes[activeSchemeIndex]?.lines ?? [];

export const getPositionConfig = (positionNumber: string): PositionConfig | null => {
    const platformNumber = parseInt(positionNumber.split('.')[0], 10);
    const platformId = 4 - platformNumber;

    const scheme = getActiveScheme();
    if (!scheme) return null;

    const platform = scheme.platforms.find((s) => s.platformId === platformId);
    if (!platform) return null;

    return platform.positions.find((p) => p.positionNumber === positionNumber) || null;
};

// ==========================================
//  Доступные значения легенды для схемы
//  (объявлено после `schemes`, чтобы не было use-before-define)
// ==========================================

// Список значений легенды, релевантных для схемы с указанным индексом.
// К базовым типам добавляются те, что встречаются в линиях самой схемы.
export const getAvailableLegendValues = (schemeIndex: number): LegendValue[] => {
    const scheme = schemes[schemeIndex];
    if (!scheme) return [];

    const availableKinds = new Set<LineKind>(STATIC_LEGEND_KINDS);
    scheme.lines.forEach((line) => availableKinds.add(getLineKind(line)));

    return (Object.keys(LEGEND_TO_LINE_KIND) as LegendValue[]).filter((value) =>
        availableKinds.has(LEGEND_TO_LINE_KIND[value]),
    );
};

// ==========================================
// Реэкспорт типов, констант, утилит и данных схем
// ==========================================
export * from './types';
export {scheme1Lines, scheme1Platforms} from './scheme1';
export {scheme2Lines, scheme2Platforms} from './scheme2';
export {scheme3Lines, scheme3Platforms} from './scheme3';
export {scheme4Lines, scheme4Platforms} from './scheme4';
