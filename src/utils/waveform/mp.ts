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

            if (frame.dataArray && frame.bufferLength) {
                const sliceWidth = frame.width / frame.bufferLength;
                context.setStrokeStyle(frame.waveformColor);
                context.setLineWidth(2);
                context.beginPath();
                let x = 0;
                for (let index = 0; index < frame.bufferLength; index++) {
                    const v = frame.dataArray[index] / 128.0;
                    const y = (v * frame.height) / 2;
                    if (index === 0) {
                        context.moveTo(x, y);
                    } else {
                        context.lineTo(x, y);
                    }
                    x += sliceWidth;
                }
                context.lineTo(frame.width, frame.height / 2);
                context.stroke();
            }

            context.draw();
        },
    };
}