import { BaseInputAudioSession, BaseOutputAudioSession } from "../bases/audio-session";
import type { InputAudioSessionConfig, OutputAudioSessionConfig } from "../bases/audio-session";

console.log('wx.ts');


declare const uni: any;
declare const wx: any;

export { WxInputAudioSession, WxOutputAudioSession };
export type { WxInputAudioSessionConfig, WxOutputAudioSessionConfig };

interface WxInputAudioSessionConfig extends InputAudioSessionConfig {
    enableVAD?: boolean;
    enableEnhancer?: boolean;
    vadAmplitudeThreshold?: number;
    vadModelUrl?: string;
    vadModelCachePath?: string;
    enhancerModelUrl?: string;
    enhancerModelCachePath?: string;
}

interface WxOutputAudioSessionConfig extends OutputAudioSessionConfig {
}

class WxInputAudioSession extends BaseInputAudioSession {
    readonly MODEL_VAD_PARAMS = {
        modelUrl: 'https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.27/dist/silero_vad_v5.onnx',
        modelCacheFileName: 'silero_vad_v5.onnx',
        positiveSpeechThreshold: 0.8,
        positiveFramesBeforeStart: 2,
        negativeSpeechThreshold: 0.2,
        negativeFramesBeforeEnd: 50,
    }
    readonly ENHANCER_PARAMS = {
        modelUrl: 'https://xtalk.sjtuxlance.com/static/models/fastenhancer_s.onnx',
        modelCacheFileName: 'fastenhancer_s.onnx',
        hopSize: 256,
        nFFT: 512,
    }
    readonly ENERGY_VAD_PARAMS = {
        positiveFramesBeforeStart: 2,
        negativeFramesBeforeEnd: 20,
    }
    private config: WxInputAudioSessionConfig;
    private _muted = false;
    private recorder: any = null;
    private started = false;
    private speaking = false;
    private targetFrameSize = 512;
    private nativeSampleRate: number;
    private inputBuffer: number[] = [];
    private outputBuffer: number[] = [];
    private vadSession: any = null;
    private vadState: any = null;
    private vadSampleRateTensor: any = null;
    private vadNegativeFrameCount = 0;
    private vadPositiveFrameCount = 0;
    private vadFrameQueue: ArrayBuffer[] = [];
    private isProcessingVadFrames = false;
    private useNativeModelVad = false;
    private enhancerSession: any = null;
    private enhancerCaches: Record<string, any> | null = null;
    private enhancerInputBuffer: number[] = [];
    private enhancerOutputBuffer: number[] = [];
    private enhancerFirstFrame = true;
    private frameQueue: ArrayBuffer[] = [];
    private isProcessingFrames = false;

    constructor(config: WxInputAudioSessionConfig) {
        super();
        this.config = { ...config };
        this.nativeSampleRate = this.config.sampleRate;
        if (this.config.enableVAD === undefined) {
            this.config.enableVAD = true;
        }
        if (this.config.enableEnhancer === undefined) {
            this.config.enableEnhancer = true;
        }
        if (this.config.vadAmplitudeThreshold === undefined) {
            this.config.vadAmplitudeThreshold = 0.012;
        }
        if (!this.config.vadModelUrl) {
            this.config.vadModelUrl = this.MODEL_VAD_PARAMS.modelUrl;
        }
        if (!this.config.vadModelCachePath) {
            this.config.vadModelCachePath = `${this.getUserDataPath()}/${this.MODEL_VAD_PARAMS.modelCacheFileName}`;
        }
        if (!this.config.enhancerModelUrl) {
            this.config.enhancerModelUrl = this.ENHANCER_PARAMS.modelUrl;
        }
        if (!this.config.enhancerModelCachePath) {
            this.config.enhancerModelCachePath = `${this.getUserDataPath()}/${this.ENHANCER_PARAMS.modelCacheFileName}`;
        }
    }

    async open(): Promise<void> {
        if (this.started) {
            throw new Error("Session already started");
        }
        const uniApi = typeof uni !== "undefined" ? uni : undefined;
        if (!uniApi || typeof uniApi.getRecorderManager !== "function") {
            throw new Error("uni.getRecorderManager is not available in current environment");
        }

        this.recorder = uniApi.getRecorderManager();
        if (!this.recorder || typeof this.recorder.start !== "function") {
            throw new Error("RecorderManager is not available");
        }

        if (this.config.enableEnhancer) {
            try {
                await this.ensureEnhancerSession();
            } catch (error) {
                this.enhancerSession = null;
                this.enhancerCaches = null;
                console.warn("Falling back to raw input on mp-weixin enhancer:", error);
            }
        }

        if (this.config.enableVAD) {
            try {
                await this.ensureModelVadSession();
                this.useNativeModelVad = true;
            } catch (error) {
                this.useNativeModelVad = false;
                console.warn("Falling back to energy-based VAD on mp-weixin:", error);
            }
        } else {
            this.useNativeModelVad = false;
        }

        this.recorder.onFrameRecorded((res: any) => {
            const frameBuffer = res?.frameBuffer;
            if (!(frameBuffer instanceof ArrayBuffer) || frameBuffer.byteLength === 0) {
                return;
            }
            if (this._muted) {
                return;
            }
            const nativeSampleRate = typeof res?.sampleRate === "number" && Number.isFinite(res.sampleRate) && res.sampleRate > 0
                ? res.sampleRate
                : this.config.sampleRate;
            const frames = this.processToFixedFrames(frameBuffer, nativeSampleRate);
            for (let i = 0; i < frames.length; i++) {
                this.enqueueFrame(frames[i]!);
            }

        });

        this.recorder.onStop(() => {
            this.endSpeechIfNeeded();
            console.log("onStop回调函数执行,录音停止");
        });

        this.recorder.start({
            duration: 600000,
            sampleRate: this.config.sampleRate,
            numberOfChannels: 1,
            encodeBitRate: 96000,
            format: "PCM",
            frameSize: 1,
        });//录音开始

        this.started = true;
        console.log("open函数调用成功，config:", this.config);
    }

    async close(): Promise<void> {
        if (!this.started || !this.recorder) {
            throw new Error("Session not started");
        }
        this.recorder.stop();
        this.endSpeechIfNeeded();
        this.started = false;
        this.recorder = null;
        this.inputBuffer = [];
        this.outputBuffer = [];
        this.frameQueue = [];
        this.isProcessingFrames = false;
        this.vadFrameQueue = [];
        this.isProcessingVadFrames = false;
        this.useNativeModelVad = false;
        if (this.enhancerSession && typeof this.enhancerSession.destroy === "function") {
            try {
                this.enhancerSession.destroy();
            } catch {
            }
        }
        this.enhancerSession = null;
        this.enhancerCaches = null;
        this.enhancerInputBuffer = [];
        this.enhancerOutputBuffer = [];
        this.enhancerFirstFrame = true;
        if (this.vadSession && typeof this.vadSession.destroy === "function") {
            try {
                this.vadSession.destroy();
            } catch {
            }
        }
        this.vadSession = null;
        this.vadState = null;
        this.vadSampleRateTensor = null;
        this.vadNegativeFrameCount = 0;
        console.log("close函数调用成功");
    }

    get muted(): boolean {
        return this._muted;
    }

    set muted(value: boolean) {
        if (value) {
            this.endSpeechIfNeeded();
        }
        this._muted = value;
    }

    private processToFixedFrames(frameBuffer: ArrayBuffer, nativeSampleRate: number): ArrayBuffer[] {
        this.nativeSampleRate = nativeSampleRate;
        const pcm = new Int16Array(frameBuffer);
        for (let i = 0; i < pcm.length; i++) {
            this.inputBuffer.push((pcm[i] ?? 0) / 32768);
        }

        const frames: ArrayBuffer[] = [];
        const minInputSamples = Math.ceil(this.targetFrameSize * this.nativeSampleRate / this.config.sampleRate);

        while (this.inputBuffer.length >= minInputSamples) {
            const chunk = this.inputBuffer.splice(0, minInputSamples);
            const resampled = this.resample(chunk);

            for (let i = 0; i < resampled.length; i++) {
                this.outputBuffer.push(resampled[i] ?? 0);
            }

            while (this.outputBuffer.length >= this.targetFrameSize) {
                const frame = this.outputBuffer.splice(0, this.targetFrameSize);
                frames.push(this.float32ToInt16Buffer(frame));
            }
        }

        return frames;
    }

    private resample(inputData: number[]): Float32Array {
        if (this.nativeSampleRate === this.config.sampleRate) {
            return new Float32Array(inputData);
        }

        const ratio = this.nativeSampleRate / this.config.sampleRate;
        const outputLength = Math.floor(inputData.length / ratio);
        const output = new Float32Array(outputLength);

        for (let i = 0; i < outputLength; i++) {
            const pos = i * ratio;
            const index = Math.floor(pos);
            const frac = pos - index;

            const sample1 = inputData[index] ?? 0;
            const sample2 = inputData[Math.min(index + 1, inputData.length - 1)] ?? sample1;
            output[i] = sample1 + (sample2 - sample1) * frac;
        }

        return output;
    }

    private float32ToInt16Buffer(frame: number[]): ArrayBuffer {
        const int16 = new Int16Array(frame.length);
        for (let i = 0; i < frame.length; i++) {
            const s = Math.max(-1, Math.min(1, frame[i] ?? 0));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return int16.buffer;
    }

    private startSpeechIfNeeded(): void {
        if (this.speaking) {
            return;
        }
        this.speaking = true;
        this.vadNegativeFrameCount = 0;
        this.vadPositiveFrameCount = 0;
        this.speechStartCallback();
    }

    private endSpeechIfNeeded(): void {
        if (!this.speaking) {
            this.vadNegativeFrameCount = 0;
            this.vadPositiveFrameCount = 0;
            if (this.config.enableVAD && this.useNativeModelVad) {
                this.resetModelVadState();
            }
            return;
        }
        this.speaking = false;
        this.vadNegativeFrameCount = 0;
        this.vadPositiveFrameCount = 0;
        if (this.config.enableVAD && this.useNativeModelVad) {
            this.resetModelVadState();
        }
        this.speechEndCallback();
    }

    private enqueueVadFrame(frameBuffer: ArrayBuffer): void {
        this.vadFrameQueue.push(frameBuffer.slice(0));
        if (this.isProcessingVadFrames) {
            return;
        }
        this.isProcessingVadFrames = true;
        void this.drainVadFrameQueue();
    }

    private async drainVadFrameQueue(): Promise<void> {
        try {
            while (this.vadFrameQueue.length > 0) {
                const frameBuffer = this.vadFrameQueue.shift();
                if (!frameBuffer) {
                    continue;
                }
                await this.processVadFrame(frameBuffer);
            }
        } finally {
            this.isProcessingVadFrames = false;
            if (this.vadFrameQueue.length > 0) {
                this.isProcessingVadFrames = true;
                void this.drainVadFrameQueue();
            }
        }
    }

    private enqueueFrame(frameBuffer: ArrayBuffer): void {
        this.frameQueue.push(frameBuffer.slice(0));
        if (this.isProcessingFrames) {
            return;
        }
        this.isProcessingFrames = true;
        void this.drainFrameQueue();
    }

    private async drainFrameQueue(): Promise<void> {
        try {
            while (this.frameQueue.length > 0) {
                const frameBuffer = this.frameQueue.shift();
                if (!frameBuffer) {
                    continue;
                }
                const nextFrame = await this.enhanceFrame(frameBuffer);
                if (!this.config.enableVAD) {
                    this.startSpeechIfNeeded();
                    this.frameCallback(nextFrame);
                    continue;
                }

                if (this.useNativeModelVad) {
                    this.enqueueVadFrame(nextFrame);
                } else {
                    this.frameCallback(nextFrame);
                    this.handleVad(nextFrame);
                }
            }
        } finally {
            this.isProcessingFrames = false;
            if (this.frameQueue.length > 0) {
                this.isProcessingFrames = true;
                void this.drainFrameQueue();
            }
        }
    }

    private async processVadFrame(frameBuffer: ArrayBuffer): Promise<void> {
        if (!this.vadSession) {
            this.frameCallback(frameBuffer);
            return;
        }

        const frameFloat32 = this.int16BufferToFloat32(frameBuffer);
        const inputs = {
            input: this.createInferenceTensor("float32", frameFloat32, [1, frameFloat32.length]),
            state: this.vadState,
            sr: this.vadSampleRateTensor,
        };
        const outputs = await this.runModelSession(inputs);
        const outputTensor = outputs?.output ?? outputs?.prob ?? outputs?.probs;
        const stateTensor = outputs?.stateN ?? outputs?.state ?? outputs?.hn;

        if (stateTensor) {
            this.vadState = stateTensor;
        }

        const speechScore = Number(this.getTensorValue(outputTensor, 0));
        const notSpeechScore = 1 - speechScore;
        const notSpeechHigh = notSpeechScore > (1 - this.MODEL_VAD_PARAMS.negativeSpeechThreshold);
        const isSpeechFrame = speechScore >= this.MODEL_VAD_PARAMS.positiveSpeechThreshold;

        if (isSpeechFrame) {
            this.vadPositiveFrameCount += 1;
            this.vadNegativeFrameCount = 0;
            if (!this.speaking && this.vadPositiveFrameCount >= this.MODEL_VAD_PARAMS.positiveFramesBeforeStart) {
                this.startSpeechIfNeeded();
            }
        } else if (!this.speaking) {
            this.vadPositiveFrameCount = 0;
        }

        if (this.speaking) {
            this.vadNegativeFrameCount = notSpeechHigh ? (this.vadNegativeFrameCount + 1) : 0;
            if (this.vadNegativeFrameCount > this.MODEL_VAD_PARAMS.negativeFramesBeforeEnd) {
                this.endSpeechIfNeeded();
            }
        }

        this.frameCallback(frameBuffer);
    }

    private async ensureModelVadSession(): Promise<void> {
        const wxApi = this.getWxApi();
        if (typeof wxApi.createInferenceSession !== "function") {
            throw new Error("wx.createInferenceSession is not available in current environment");
        }

        const modelPath = await this.ensureVadModelCached();
        this.vadSession = await this.createModelSession(wxApi, modelPath);
        this.resetModelVadState();
    }

    private async ensureEnhancerSession(): Promise<void> {
        const wxApi = this.getWxApi();
        if (typeof wxApi.createInferenceSession !== "function") {
            throw new Error("wx.createInferenceSession is not available in current environment");
        }

        const modelPath = await this.ensureModelCached(
            this.config.enhancerModelUrl,
            this.config.enhancerModelCachePath,
            "Enhancer"
        );
        this.enhancerSession = await this.createModelSession(wxApi, modelPath);
        this.resetEnhancerState();
    }

    private getWxApi(): any {
        if (typeof wx !== "undefined") {
            return wx;
        }
        throw new Error("wx runtime is not available in current environment");
    }

    private async ensureVadModelCached(): Promise<string> {
        return this.ensureModelCached(this.config.vadModelUrl, this.config.vadModelCachePath, "VAD");
    }

    private async downloadVadModelToCache(): Promise<string> {
        return this.downloadModelToCache(this.config.vadModelUrl, this.config.vadModelCachePath, "VAD");
    }

    private async ensureModelCached(modelUrl?: string, cachePath?: string, modelName = "Model"): Promise<string> {
        const fsManager = this.getWxApi().getFileSystemManager?.();
        if (!fsManager || typeof fsManager.access !== "function") {
            throw new Error("wx.getFileSystemManager.access is not available in current environment");
        }
        if (!cachePath) {
            throw new Error(`${modelName} model cache path is not configured`);
        }

        try {
            await new Promise<void>((resolve, reject) => {
                fsManager.access({
                    path: cachePath,
                    success: () => resolve(),
                    fail: (error: any) => reject(error),
                });
            });
            return cachePath;
        } catch {
            return this.downloadModelToCache(modelUrl, cachePath, modelName);
        }
    }

    private async downloadModelToCache(modelUrl?: string, cachePath?: string, modelName = "Model"): Promise<string> {
        const wxApi = this.getWxApi();
        if (!modelUrl || !cachePath) {
            throw new Error(`${modelName} model url or cache path is not configured`);
        }

        const tempFilePath = await new Promise<string>((resolve, reject) => {
            wxApi.downloadFile({
                url: modelUrl,
                success: (result: any) => {
                    if (result?.statusCode >= 200 && result?.statusCode < 300 && result?.tempFilePath) {
                        resolve(result.tempFilePath);
                        return;
                    }
                    reject(new Error(`Failed to download ${modelName} model, status code: ${result?.statusCode ?? "unknown"}`));
                },
                fail: (error: any) => reject(error),
            });
        });

        await this.copyFile(tempFilePath, cachePath);
        return cachePath;
    }

    private async copyFile(srcPath: string, destPath: string): Promise<void> {
        const fsManager = this.getWxApi().getFileSystemManager?.();
        if (!fsManager || typeof fsManager.copyFile !== "function") {
            throw new Error("wx.getFileSystemManager.copyFile is not available in current environment");
        }
        await new Promise<void>((resolve, reject) => {
            fsManager.copyFile({
                srcPath,
                destPath,
                success: () => resolve(),
                fail: (error: any) => reject(error),
            });
        });
    }

    private getUserDataPath(): string {
        const wxApi = this.getWxApi();
        return wxApi.env?.USER_DATA_PATH ?? "";
    }

    private async createModelSession(wxApi: any, modelPath: string): Promise<any> {
        const session = wxApi.createInferenceSession({//创建vadsession
            model: modelPath,
            precisionLevel: 4,
        });
        if (!session) {
            throw new Error("Failed to create wx inference session for VAD model");
        }

        await new Promise<void>((resolve, reject) => {
            const handleLoad = () => {
                if (typeof session.offLoad === "function") {
                    session.offLoad(handleLoad);
                }
                if (typeof session.offError === "function") {
                    session.offError(handleError);
                }
                resolve();
            };
            const handleError = (error: any) => {
                if (typeof session.offLoad === "function") {
                    session.offLoad(handleLoad);
                }
                if (typeof session.offError === "function") {
                    session.offError(handleError);
                }
                reject(error);
            };

            if (typeof session.onLoad === "function") {
                session.onLoad(handleLoad);
            }
            if (typeof session.onError === "function") {
                session.onError(handleError);
            }
        });

        return session;
    }

    private resetModelVadState(): void {
        if (!this.vadSession) {
            return;
        }
        this.vadState = this.createInferenceTensor(
            "float32",
            new Float32Array(2 * 128).fill(0),
            [2, 1, 128]
        );
        this.vadSampleRateTensor = this.createInferenceTensor(
            "int64",
            [BigInt(this.config.sampleRate)],
            [1]
        );
        this.vadNegativeFrameCount = 0;
        this.vadPositiveFrameCount = 0;
    }

    private resetEnhancerState(): void {
        if (!this.enhancerSession) {
            return;
        }
        this.enhancerCaches = {
            cache_in_0: this.createInferenceTensor("float32", new Float32Array(1 * 256).fill(0), [1, 256]),
            cache_in_1: this.createInferenceTensor("float32", new Float32Array(1 * 256).fill(0), [1, 256]),
            cache_in_2: this.createInferenceTensor("float32", new Float32Array(1 * 36 * 48).fill(0), [1, 36, 48]),
            cache_in_3: this.createInferenceTensor("float32", new Float32Array(1 * 36 * 48).fill(0), [1, 36, 48]),
            cache_in_4: this.createInferenceTensor("float32", new Float32Array(1 * 36 * 48).fill(0), [1, 36, 48]),
        };
        this.enhancerInputBuffer = [];
        this.enhancerOutputBuffer = [];
        this.enhancerFirstFrame = true;
    }

    private createInferenceTensor(type: string, data: any, shape: number[]): any {
        const wxApi = this.getWxApi();
        const candidates = [
            () => wxApi.createInferenceTensor({ type, data, shape }),
            () => wxApi.createInferenceTensor(type, data, shape),
            () => new wxApi.InferenceTensor(type, data, shape),
            () => new wxApi.InferenceTensor({ type, data, shape }),
        ];

        for (const candidate of candidates) {
            try {
                return candidate();
            } catch {
            }
        }

        return { type, data, shape };
    }

    private async runModelSession(inputs: Record<string, any>): Promise<any> {
        if (!this.vadSession || typeof this.vadSession.run !== "function") {
            throw new Error("wx inference session is not ready");
        }
        return this.vadSession.run(inputs);
    }

    private async runEnhancerSession(inputs: Record<string, any>): Promise<any> {
        if (!this.enhancerSession || typeof this.enhancerSession.run !== "function") {
            throw new Error("wx enhancer session is not ready");
        }
        return this.enhancerSession.run(inputs);
    }

    private getTensorValue(tensor: any, index: number): number {
        if (!tensor) {
            return 0;
        }
        const data: any = tensor.data ?? tensor.value ?? tensor;
        if (ArrayBuffer.isView(data)) {
            const view = data as any;
            return Number(view[index] ?? 0);
        }
        if (Array.isArray(data)) {
            return Number(data[index] ?? 0);
        }
        return Number(data?.[index] ?? 0);
    }

    private int16BufferToFloat32(frameBuffer: ArrayBuffer): Float32Array {
        const pcm = new Int16Array(frameBuffer);
        const float32 = new Float32Array(pcm.length);
        for (let i = 0; i < pcm.length; i++) {
            float32[i] = (pcm[i] ?? 0) / 32768;
        }
        return float32;
    }

    private async enhanceFrame(frameBuffer: ArrayBuffer): Promise<ArrayBuffer> {
        if (!this.config.enableEnhancer || !this.enhancerSession || !this.enhancerCaches) {
            return frameBuffer;
        }

        const frame = this.int16BufferToFloat32(frameBuffer);
        for (let i = 0; i < frame.length; i++) {
            this.enhancerInputBuffer.push(frame[i] ?? 0);
        }

        while (this.enhancerInputBuffer.length >= this.ENHANCER_PARAMS.hopSize) {
            const chunk = this.enhancerInputBuffer.splice(0, this.ENHANCER_PARAMS.hopSize);
            const wavIn = this.createInferenceTensor(
                "float32",
                new Float32Array(chunk),
                [1, this.ENHANCER_PARAMS.hopSize]
            );
            const inputs: Record<string, any> = { wav_in: wavIn };
            for (const cacheName of Object.keys(this.enhancerCaches)) {
                inputs[cacheName] = this.enhancerCaches[cacheName];
            }

            const outputs = await this.runEnhancerSession(inputs);
            const outputNames: string[] = this.enhancerSession.outputNames || Object.keys(outputs);
            const enhancedChunk = this.getTensorData(outputs[outputNames[0]]);

            for (let i = 1; i < outputNames.length; i++) {
                const cacheName = `cache_in_${i - 1}`;
                this.enhancerCaches[cacheName] = outputs[outputNames[i]];
            }

            for (let i = 0; i < enhancedChunk.length; i++) {
                this.enhancerOutputBuffer.push(Number(enhancedChunk[i] ?? 0));
            }

            if (this.enhancerFirstFrame && this.enhancerOutputBuffer.length >= (this.ENHANCER_PARAMS.nFFT - this.ENHANCER_PARAMS.hopSize)) {
                this.enhancerOutputBuffer.splice(0, this.ENHANCER_PARAMS.nFFT - this.ENHANCER_PARAMS.hopSize);
                this.enhancerFirstFrame = false;
            }
        }

        if (this.enhancerOutputBuffer.length >= frame.length) {
            const output = this.enhancerOutputBuffer.splice(0, frame.length);
            return this.float32ToInt16Buffer(output);
        }

        return frameBuffer;
    }

    private getTensorData(tensor: any): ArrayLike<number> {
        return tensor?.data ?? tensor?.value ?? tensor ?? [];
    }

    private handleVad(frameBuffer: ArrayBuffer): void {
        const pcm = new Int16Array(frameBuffer);
        if (pcm.length === 0) {
            return;
        }
        let sum = 0;
        for (let i = 0; i < pcm.length; i++) {
            const v = pcm[i]! / 32768;
            sum += v * v;
        }
        const rms = Math.sqrt(sum / pcm.length);
        const threshold = this.config.vadAmplitudeThreshold ?? 0.012;
        const isSpeech = rms >= threshold;
        if (isSpeech) {
            this.vadPositiveFrameCount += 1;
            this.vadNegativeFrameCount = 0;
            if (!this.speaking && this.vadPositiveFrameCount >= this.ENERGY_VAD_PARAMS.positiveFramesBeforeStart) {
                this.startSpeechIfNeeded();
            }
            return;
        }

        this.vadPositiveFrameCount = 0;
        if (!this.speaking) {
            return;
        }

        this.vadNegativeFrameCount += 1;
        if (this.vadNegativeFrameCount >= this.ENERGY_VAD_PARAMS.negativeFramesBeforeEnd) {
            this.endSpeechIfNeeded();
        }
    }
}

function createPausableTimeout(
    callback: () => void,
    delay: number
): {
    pause: () => void;
    resume: () => void;
    cancel: () => void;
} {
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let startTime = 0;
    let remaining = delay;
    let running = false;
    let cancelled = false;

    function start(ms: number): void {
        startTime = Date.now();
        running = true;
        timerId = setTimeout(() => {
            running = false;
            timerId = null;
            remaining = 0;
            if (!cancelled) {
                callback();
            }
        }, ms);
    }

    function pause(): void {
        if (!running || timerId === null) {
            return;
        }
        clearTimeout(timerId);
        timerId = null;
        remaining -= Date.now() - startTime;
        running = false;
    }

    function resume(): void {
        if (running || cancelled || remaining <= 0) {
            return;
        }
        start(remaining);
    }

    function cancel(): void {
        if (timerId !== null) {
            clearTimeout(timerId);
            timerId = null;
        }
        running = false;
        cancelled = true;
        remaining = 0;
    }

    start(delay);

    return {
        pause,
        resume,
        cancel,
    };
}

class WxOutputAudioSession extends BaseOutputAudioSession {
    private audioContext: any = null;
    private audioBufferSources: any[] = [];
    private audioTimeToPlay = 0;
    private audioChunkStartedTimeouts: ReturnType<typeof createPausableTimeout>[] = [];
    private audioChunksPaused: ArrayBuffer[] = [];
    readonly PRESTART_LEAD_MS = 40;
    private opened = false;

    constructor(config: WxOutputAudioSessionConfig) {
        super();
        this.config = { ...config };
    }

    async open(): Promise<void> {
        if (this.opened) {
            throw new Error("Session already started");
        }
        const wxApi = typeof wx !== "undefined" ? wx : undefined;
        if (!wxApi || typeof wxApi.createWebAudioContext !== "function") {
            throw new Error("wx.createWebAudioContext is not available in current environment");
        }
        this.audioContext = wxApi.createWebAudioContext();
        await this.audioContext.resume();
        this.opened = true;
    }

    async close(): Promise<void> {
        if (!this.audioContext || !this.opened) {
            throw new Error("Session not started");
        }
        await this.stop();
        await this.audioContext.close();
        this.audioContext = null;
        this.audioTimeToPlay = 0;
        this.opened = false;
    }

    async pause(): Promise<void> {
        if (!this.audioContext || !this.opened) {
            throw new Error("Session not started");
        }
        if (this.audioContext.state === "suspended") {
            throw new Error("Session already paused");
        }
        this.audioChunkStartedTimeouts.forEach((timeout) => timeout.pause());
        await this.audioContext.suspend();
    }

    async resume(): Promise<void> {
        if (!this.audioContext || !this.opened) {
            throw new Error("Session not started");
        }
        if (this.audioContext.state === "running") {
            throw new Error("Session not paused");
        }
        this.audioChunkStartedTimeouts.forEach((timeout) => timeout.resume());
        await this.audioContext.resume();
        for (const chunk of this.audioChunksPaused) {
            await this.pushAudioChunk(chunk);
        }
        this.audioChunksPaused.length = 0;
    }

    async stop(): Promise<void> {
        this.audioChunkStartedTimeouts.forEach((timeout) => timeout.cancel());
        this.audioChunkStartedTimeouts.length = 0;
        this.audioBufferSources.forEach((source) => {
            source.onended = null;
            if (typeof source.stop === "function") {
                source.stop(0);
            }
            if (typeof source.disconnect === "function") {
                source.disconnect();
            }
        });
        this.audioBufferSources.length = 0;
        this.audioTimeToPlay = 0;
        this.audioChunksPaused.length = 0;
    }

    async pushAudioChunk(pcmChunkInt16: ArrayBuffer): Promise<void> {
        if (!this.audioContext || !this.opened) {
            throw new Error("Session not started");
        }
        if (!(pcmChunkInt16 instanceof ArrayBuffer) || pcmChunkInt16.byteLength === 0) {
            return;
        }
        if (this.audioContext.state === "suspended") {
            this.audioChunksPaused.push(pcmChunkInt16.slice(0));
            return;
        }
        const int16 = new Int16Array(pcmChunkInt16);
        if (int16.length === 0) {
            return;
        }
        const float32 = new Float32Array(int16.length);
        int16.forEach((value, index) => {
            float32[index] = value / 32768;
        });

        const buffer = this.audioContext.createBuffer(1, float32.length, this.config.sampleRate);
        buffer.getChannelData(0).set(float32);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);

        source.onended = () => {
            this.chunkPlayedCallback(int16.buffer);
            const idx = this.audioBufferSources.indexOf(source);
            if (idx !== -1) {
                this.audioBufferSources.splice(idx, 1);
            }
            if (typeof source.disconnect === "function") {
                source.disconnect();
            }
            if (this.audioBufferSources.length === 0) {
                this.allChunksPlayedCallback();
            }
        };

        this.audioBufferSources.push(source);

        const currentTime = this.audioContext.currentTime;
        if (this.audioTimeToPlay < currentTime) {
            this.audioTimeToPlay = currentTime;
        }
        source.start(this.audioTimeToPlay);

        const msForChunkStart = Math.max(0, (this.audioTimeToPlay - currentTime) * 1000 - this.PRESTART_LEAD_MS);
        if (msForChunkStart <= 0) {
            this.chunkStartedCallback(int16.buffer);
        } else {
            const timeout = createPausableTimeout(() => {
                this.chunkStartedCallback(int16.buffer);
                const idx = this.audioChunkStartedTimeouts.indexOf(timeout);
                if (idx !== -1) {
                    this.audioChunkStartedTimeouts.splice(idx, 1);
                }
            }, msForChunkStart);
            this.audioChunkStartedTimeouts.push(timeout);
        }

        const playbackRate = typeof source.playbackRate?.value === "number" ? source.playbackRate.value : 1;
        this.audioTimeToPlay += buffer.duration / playbackRate;
    }

    private config: WxOutputAudioSessionConfig;
}