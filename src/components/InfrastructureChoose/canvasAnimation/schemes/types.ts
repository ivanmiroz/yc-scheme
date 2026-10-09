// src/components/InfrastructureChoose/canvasAnimation/schemes/types.ts
export interface PositionConfig {
    positionNumber: string;
    iconKey?: string;
    iconKeys?: string[];
    label?: string;
    // Горизонтальный отступ между иконками в группе (для 2+ иконок),
    // в дизайнерских пикселях при ширине canvas 1920.
    // Если не задан — используется DEFAULT_ICON_GROUP_GAP_PX = 5.
    iconGapPx?: number;
}

export interface PlatformScheme {
    platformId: number;
    positions: PositionConfig[];
}

// Точка крепления линии на объекте.
// left/right/top/bottom/center — по иконке (или её цветной подложке).
// text-top/text-bottom — по текстовому блоку под иконкой.
export type LineAnchor =
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'center'
    | 'text-top'
    | 'text-bottom';

// Точка крепления линии на платформе.
// 'left' | 'right' | 'top' | 'bottom' | 'center' — по границе/центру прямоугольника платформы.
export type PlatformAnchor = 'left' | 'right' | 'top' | 'bottom' | 'center';

// Линия между двумя объектами схемы.
// Концы могут крепиться либо к иконке позиции (from/to — positionNumber),
// либо к краю платформы (fromPlatform/toPlatform — её номер 1..4).
export interface SchemeLine {
    // Крепление к иконке позиции. Если указано fromPlatform —
    // это поле игнорируется (аналогично для to).
    from?: string; // positionNumber, например '2.4'
    to?: string; // positionNumber, например '2.6'
    fromAnchor?: LineAnchor; // по умолчанию 'center'
    toAnchor?: LineAnchor; // по умолчанию 'center'
    // Крепление к краю платформы. Номер платформы — как в positionNumber:
    // '1.x' → 1 (нижняя), '4.x' → 4 (верхняя).
    fromPlatform?: number;
    fromPlatformAnchor?: PlatformAnchor; // по умолчанию 'center'
    toPlatform?: number;
    toPlatformAnchor?: PlatformAnchor; // по умолчанию 'center'
    // Дополнительный горизонтальный сдвиг платформенных якорей,
    // в долях ширины платформы. Отрицательное — влево.
    // Применяется к fromPlatformAnchor и toPlatformAnchor одновременно.
    platformAnchorShiftXRatio?: number;
    // Дополнительный вертикальный сдвиг платформенных якорей,
    // в долях высоты платформы. Отрицательное — вверх.
    // Применяется к fromPlatformAnchor и toPlatformAnchor одновременно.
    platformAnchorShiftYRatio?: number;
    dashed?: boolean; // пунктир (по умолчанию — сплошная)
    // Если true — середина линии рисуется змейкой
    serpentine?: boolean;
    // Если true — углы змейки остаются прямыми (без скругления).
    sharpCorners?: boolean;
    // Переопределяет SCHEME_SERPENTINE.STRAIGHT_FRACTION для этой линии.
    serpentineStraightFraction?: number;
    // Если true — линия рисуется по круговой дуге.
    arc?: boolean;
    // Отражает выпуклость дуги на противоположную сторону.
    arcFlip?: boolean;
}

// Схема целиком: платформы + линии между объектами этой схемы.
export interface Scheme {
    platforms: PlatformScheme[];
    lines: SchemeLine[];
}

// ==========================================
//  Тип линии и связь с легендой
// ==========================================

// Ключи кнопок легенды. Совпадают с value в listItems в ScaleTabs.
export type LegendValue =
    | 'network'
    | 'vps-pe'
    | 'cloud-interconnect'
    | 'vps'
    | 'cloud-router'
    | 'data-transfer';

// Визуальный тип линии.
export type LineKind =
    | 'sharp-serpentine'
    | 'rounded-serpentine'
    | 'sharp-dashed-serpentine'
    | 'straight'
    | 'dashed'
    | 'arc';

// Какая легенда какому типу линии соответствует.
export const LEGEND_TO_LINE_KIND: Record<LegendValue, LineKind> = {
    network: 'sharp-serpentine',
    'vps-pe': 'rounded-serpentine',
    'cloud-interconnect': 'straight',
    vps: 'dashed',
    'cloud-router': 'arc',
    'data-transfer': 'sharp-dashed-serpentine',
};

// Тип линии по её описанию.
// Приоритет: sharp-dashed-serpentine > dashed > serpentine > arc > straight.
export const getLineKind = (line: SchemeLine): LineKind => {
    if (line.dashed && line.serpentine && line.sharpCorners) {
        return 'sharp-dashed-serpentine';
    }
    if (line.dashed && !line.serpentine) return 'dashed';
    if (line.serpentine) {
        return line.sharpCorners ? 'sharp-serpentine' : 'rounded-serpentine';
    }
    if (line.arc) return 'arc';
    return 'straight';
};

// Типы линий, которые статически присутствуют на канвасе на каждой схеме.
// Это ровно то, что рисует staticConnections.ts:
//   • sharp-serpentine — змейки между платформами;
//   • straight         — горизонтальные маркеры на платформах;
//   • dashed           — вертикальные пунктирные между платформами.
// Типы rounded-serpentine и arc сюда НЕ входят: они появляются в списке
// доступных легенд только если реально встречаются в линиях активной схемы.
export const STATIC_LEGEND_KINDS: LineKind[] = ['sharp-serpentine', 'straight', 'dashed'];
