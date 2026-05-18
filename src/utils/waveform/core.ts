export type WaveformStreamState = 'idle' | 'listening' | 'processing' | 'speaking' | string;

export interface WaveformFrame {
    width: number;
    height: number;
    baselineY: number;
    backgroundColor: string;
    baselineColor: string;
    waveformColor: string;
    dataArray: Uint8Array | null;
    bufferLength: number;
}

export interface WaveformRenderer {
    resize: () => Promise<void> | void;
    drawFrame: (frame: WaveformFrame) => Promise<void> | void;
    destroy?: () => Promise<void> | void;
}

interface CreateWaveformControllerOptions {
    renderer: WaveformRenderer;
    idleColor?: string;
    listeningColor?: string;
    processingColor?: string;
    speakingColor?: string;
    backgroundColor?: string;
    baselineColor?: string;
    maxPoints?: number;
    frameIntervalMs?: number;
    freshWindowMs?: number;
}

interface ChannelSamples {
    values: Uint8Array | null;
    updatedAt: number;
}

const DEFAULT_MAX_POINTS = 1024;
const DEFAULT_FRAME_INTERVAL_MS = 33;
const DEFAULT_FRESH_WINDOW_MS = 180;
const PCM_MAX_VALUE = 32768;

function clampByteValue(value: number) {
    return Math.max(0, Math.min(255, value));
}

export function createWaveformController(options: CreateWaveformControllerOptions) {
    const colors = {
        idle: options.idleColor || '#6b7280',
        listening: options.listeningColor || '#34d399',
        processing: options.processingColor || '#fbbf24',
        speaking: options.speakingColor || '#93c5fd',
        background: options.backgroundColor || '#0f172a',
        baseline: options.baselineColor || '#1f2937',
    };

    const maxPoints = options.maxPoints || DEFAULT_MAX_POINTS;
    const frameIntervalMs = options.frameIntervalMs || DEFAULT_FRAME_INTERVAL_MS;
    const freshWindowMs = options.freshWindowMs || DEFAULT_FRESH_WINDOW_MS;

    let streamState: WaveformStreamState = 'idle';
    let timerId: ReturnType<typeof setInterval> | null = null;
    let isRunning = false;

    const input: ChannelSamples = { values: null, updatedAt: 0 };
    const output: ChannelSamples = { values: null, updatedAt: 0 };

    function extractWaveformSamples(pcmChunkInt16: ArrayBuffer) {
        const int16 = new Int16Array(pcmChunkInt16);
        if (!int16.length) {
            return null;
        }

        const sampleCount = Math.min(maxPoints, int16.length);
        const stride = Math.max(1, Math.floor(int16.length / sampleCount));
        const bytes = new Uint8Array(sampleCount);

        for (let index = 0; index < sampleCount; index++) {
            const sourceIndex = Math.min(int16.length - 1, index * stride);
            const normalized = int16[sourceIndex] / PCM_MAX_VALUE;
            bytes[index] = clampByteValue(Math.round(normalized * 128 + 128));
        }

        return bytes;
    }

    function getActiveSamples(now: number) {
        if (streamState === 'speaking') {
            if (now - output.updatedAt <= freshWindowMs) {
                return output.values;
            }
            return null;
        }

        if (streamState === 'listening' || streamState === 'processing') {
            if (now - input.updatedAt <= freshWindowMs) {
                return input.values;
            }
        }

        return null;
    }

    async function renderFrame() {
        await options.renderer.resize();

        const width = (options.renderer as any).width || 0;
        const height = (options.renderer as any).height || 0;

        if (!width || !height) {
            return;
        }

        const now = Date.now();
        const activeSamples = getActiveSamples(now);
        const waveformColor = colors[streamState as keyof typeof colors] || colors.idle;

        await options.renderer.drawFrame({
            width,
            height,
            baselineY: height / 2,
            backgroundColor: colors.background,
            baselineColor: colors.baseline,
            waveformColor,
            dataArray: activeSamples,
            bufferLength: activeSamples?.length || 0,
        });
    }

    return {
        setState(nextState: WaveformStreamState) {
            streamState = nextState || 'idle';
        },
        pushInputChunk(pcmChunkInt16: ArrayBuffer) {
            input.values = extractWaveformSamples(pcmChunkInt16);
            input.updatedAt = Date.now();
        },
        pushOutputChunk(pcmChunkInt16: ArrayBuffer) {
            output.values = extractWaveformSamples(pcmChunkInt16);
            output.updatedAt = Date.now();
        },
        async renderNow() {
            await renderFrame();
        },
        async start() {
            if (isRunning) {
                return;
            }
            isRunning = true;
            await renderFrame();
            timerId = setInterval(() => {
                renderFrame().catch(() => {});
            }, frameIntervalMs);
        },
        async stop() {
            isRunning = false;
            if (timerId) {
                clearInterval(timerId);
                timerId = null;
            }
            await renderFrame();
        },
        async resize() {
            await renderFrame();
        },
        async destroy() {
            await this.stop();
            await options.renderer.destroy?.();
        },
    };
}