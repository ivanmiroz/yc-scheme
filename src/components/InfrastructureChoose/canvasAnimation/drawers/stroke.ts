import {CONNECTION_COLOR} from './config';

interface ApplyStrokeOptions {
    lineWidth: number;
    color?: string;
    lineCap?: CanvasLineCap;
    lineJoin?: CanvasLineJoin;
}

// Применяет стиль обводки и заливки к 2D-контексту.
// Вынесено отдельно, чтобы не дублировать один и тот же набор присвоений
// (strokeStyle / fillStyle / lineWidth / lineCap / lineJoin)
// в каждой функции отрисовки линий.
export const applyConnectionStroke = (
    ctx: CanvasRenderingContext2D,
    options: ApplyStrokeOptions,
) => {
    const color = options.color ?? CONNECTION_COLOR;

    /* eslint-disable no-param-reassign */
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = options.lineWidth;
    ctx.lineCap = options.lineCap ?? 'round';
    ctx.lineJoin = options.lineJoin ?? 'round';
    /* eslint-enable no-param-reassign */
};
