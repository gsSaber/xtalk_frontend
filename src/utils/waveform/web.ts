import type { WaveformFrame, WaveformRenderer } from './core';

export function createWebWaveformRenderer(canvas: HTMLCanvasElement): WaveformRenderer & { width: number; height: number } {
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Unable to get 2d canvas context for web waveform renderer.');
    }

    return {
        width: 0,
        height: 0,
        resize() {
            const dpr = window.devicePixelRatio || 1;
            const width = Math.max(1, Math.floor(canvas.clientWidth));
            const height = Math.max(1, Math.floor(canvas.clientHeight));
            const actualWidth = Math.max(1, Math.floor(width * dpr));
            const actualHeight = Math.max(1, Math.floor(height * dpr));

            if (canvas.width !== actualWidth || canvas.height !== actualHeight) {
                canvas.width = actualWidth;
                canvas.height = actualHeight;
            }

            context.setTransform(dpr, 0, 0, dpr, 0, 0);
            this.width = width;
            this.height = height;
        },
        drawFrame(frame: WaveformFrame) {
            context.fillStyle = frame.backgroundColor;
            context.fillRect(0, 0, frame.width, frame.height);

            context.strokeStyle = frame.baselineColor;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(0, frame.baselineY);
            context.lineTo(frame.width, frame.baselineY);
            context.stroke();

            if (!frame.points.length) {
                return;
            }

            context.strokeStyle = frame.waveformColor;
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(frame.points[0].x, frame.points[0].y);
            for (let index = 1; index < frame.points.length; index++) {
                context.lineTo(frame.points[index].x, frame.points[index].y);
            }
            context.stroke();
        },
    };
}