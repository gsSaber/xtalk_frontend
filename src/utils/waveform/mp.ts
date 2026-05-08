import type { ComponentPublicInstance } from 'vue';
import type { WaveformFrame, WaveformRenderer } from './core';

declare const uni: any;

interface CreateMpWaveformRendererOptions {
    canvasId: string;
    selector: string;
    componentInstance: ComponentPublicInstance | null | undefined;
}

export function createMpWaveformRenderer(options: CreateMpWaveformRendererOptions): WaveformRenderer & { width: number; height: number } {
    const context = uni.createCanvasContext(options.canvasId, options.componentInstance);

    return {
        width: 0,
        height: 0,
        resize() {
            return new Promise<void>((resolve) => {
                uni.createSelectorQuery()
                    .in(options.componentInstance)
                    .select(options.selector)
                    .boundingClientRect((rect: { width?: number; height?: number } | null) => {
                        this.width = Math.max(1, Math.floor(rect?.width || 0));
                        this.height = Math.max(1, Math.floor(rect?.height || 0));
                        resolve();
                    })
                    .exec();
            });
        },
        drawFrame(frame: WaveformFrame) {
            context.setFillStyle(frame.backgroundColor);
            context.fillRect(0, 0, frame.width, frame.height);

            context.setStrokeStyle(frame.baselineColor);
            context.setLineWidth(1);
            context.beginPath();
            context.moveTo(0, frame.baselineY);
            context.lineTo(frame.width, frame.baselineY);
            context.stroke();

            if (frame.points.length) {
                context.setStrokeStyle(frame.waveformColor);
                context.setLineWidth(2);
                context.beginPath();
                context.moveTo(frame.points[0].x, frame.points[0].y);
                for (let index = 1; index < frame.points.length; index++) {
                    context.lineTo(frame.points[index].x, frame.points[index].y);
                }
                context.stroke();
            }

            context.draw();
        },
    };
}