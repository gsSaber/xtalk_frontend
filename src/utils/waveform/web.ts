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

            if (!frame.dataArray || !frame.bufferLength) {
                return;
            }

            const sliceWidth = frame.width / frame.bufferLength;
            context.strokeStyle = frame.waveformColor;
            context.lineWidth = 2;
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
        },
    };
}