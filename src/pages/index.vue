<template>
  <view class="page-header">
        <view class="container">
            <text class="page-title">Xtalk Dev</text>
            <view class="status">
                <view><text>State: <text id="stream-state" class="value-text">--</text></text></view>
                <view><text>Session: <text id="session-id" class="value-text">--</text></text></view>
            </view>
            <view class="controls">
                <button id="btn-start" @click="handleStart" :disabled="isStartDisabled">Start</button>
                <button id="btn-stop" @click="handleStop" :disabled="isStopDisabled">Stop</button>
                <button id="btn-mute" @click="toggleMute">{{ muteButtonText }}</button>
            </view>
            <view class="controls">
                <view class="voice-selector">
                    <text class="voice-label">Voice:</text><!-- 原<label for="voice-select">Voice:</label> -->
                    <!-- <select id="voice-select" disabled>
                        <option value="">Loading...</option>
                    </select> -->
                </view>
                <view class="upload-btn">
                    <button id="btn-upload-file">Upload Doc</button>
                    <input id="file-input" type="file" accept="text/*,.pdf,application/pdf" style="display:none;" />
                </view>
                <button id="btn-toggle-recent-audio" class="recent-audio-toggle">Recent 60s Audio</button>
            </view>
        </view>
    </view>
    <view class="container page-main">
        <view id="latency-bar" class="latency-bar">
            <text class="latency-item">Network: <text id="latency-network">--</text>ms</text>
            <text class="latency-item">ASR: <text id="latency-asr">--</text>ms</text>
            <text class="latency-item">LLM First Token: <text id="latency-llm-first">--</text>ms</text>
            <text class="latency-item">LLM Sentence: <text id="latency-llm-sentence">--</text>ms</text>
            <text class="latency-item">TTS First Chunk: <text id="latency-tts">--</text>ms</text>
            <text class="latency-item latency-e2e">E2E: <text id="latency-e2e">--</text>ms</text>
        </view>
        <view id="recent-audio-card" class="card recent-audio-card is-hidden" aria-hidden="true">
            <view class="recent-audio-header">
                <text id="recent-audio-status" class="recent-audio-status">Waiting for server full audio stream</text>
            </view>
            <view id="recent-audio-panel" class="recent-audio-panel">
                <view id="recent-audio-player" class="recent-audio-player">
                    <u-button
                        type="primary"
                        icon="play-circle"
                        :text="recentAudioButtonText"
                        @click="playVoice"
                    ></u-button>
                </view>
                <view class="recent-audio-hint">Shows a snapshot of the latest 60 seconds of server full audio.</view>
            </view>
        </view>
        <view class="card">
            <canvas id="waveform" canvas-id="waveform"></canvas>
        </view>
        <view class="card">
            <view id="messages"></view>
        </view>
        <view class="toggle-bar">
            <button id="btn-toggle-thought" class="toggle-btn active">Thought</button>
            <button id="btn-toggle-caption" class="toggle-btn active">Caption</button>
            <button id="btn-toggle-retrieval" class="toggle-btn active">Retrieval</button>
        </view>
        <view id="panel-thought" class="card panel">
            <view class="panel-label">Thought</view>
            <view id="thought-content" class="panel-content"></view>
        </view>
        <view id="panel-caption" class="card panel">
            <view class="panel-label">Caption</view>
            <view id="caption-content" class="panel-content"></view>
        </view>
        <view id="panel-retrieval" class="card panel">
            <view class="panel-label">Retrieval</view>
            <view id="retrieval-content" class="panel-content"></view>
        </view>
    </view>
    <view class="page-footer">
        <text>Xtalk Dev</text>
    </view>
</template>

<style>
@import '../assets/style/index.css';
</style>

<script setup lang="ts">
// @ts-nocheck
import { Base64 } from 'js-base64'
import { useRouter } from 'uni-use-router'
import { onMounted, ref } from 'vue'

definePage({
    layout: false,
    style: { navigationStyle: 'custom' },
})

let audioCtx = null;
let inputAnalyser = null;
let outputAnalyser = null;
let inputDataArray = null;
let outputDataArray = null;
let inputBufferLength = 0;
let outputBufferLength = 0;
let rafId = null;
let isActive = false;
let currentStreamState = 'idle';
let recentAudioObjectUrl = null;
let recentAudioCtx = null;
let recentAudioIsPlaying = false;
let recentAudioHasSource = false;

// let $voiceSelect = null;
let $btnUploadFile = null;
let $fileInput = null;
let $streamState = null;
let $sessionId = null;
let $waveform = null;
let $messages = null;
let $thoughtContent = null;
let $captionContent = null;
let $retrievalContent = null;
let $panelThought = null;
let $panelCaption = null;
let $panelRetrieval = null;
let $btnToggleThought = null;
let $btnToggleCaption = null;
let $btnToggleRetrieval = null;
let $latencyNetwork = null;
let $latencyAsr = null;
let $latencyLlmFirst = null;
let $latencyLlmSentence = null;
let $latencyTts = null;
let $latencyE2e = null;
let $btnToggleRecentAudio = null;
let $recentAudioCard = null;
let $recentAudioStatus = null;
let canvasCtx = null;

const FULL_AUDIO_CHANNELS = 2;
const FULL_AUDIO_BYTES_PER_SAMPLE = 2;
const FULL_AUDIO_FRAME_BYTES = FULL_AUDIO_CHANNELS * FULL_AUDIO_BYTES_PER_SAMPLE;
const MAX_RECENT_AUDIO_SECONDS = 60;
const STATE_COLORS = {
    idle: '#6b7280',
    listening: '#34d399',
    processing: '#fbbf24',
    speaking: '#93c5fd'
};
let recentFullAudioSampleRate = 48000;
let recentFullAudioChunks = [];
let recentFullAudioTotalBytes = 0;
let recentAudioSnapshotDirty = false;
let availableAudios = [];

// 仿vue-router
const router = useRouter()
const recentAudioButtonText = ref('播放回复语音')
const muteButtonText = ref('Mute')
const isStartDisabled = ref(false)
const isStopDisabled = ref(true)
let session = null

function getWebSocketURL() {
    const loc = window.location;
    const proto = loc?.protocol === 'https:' ? 'wss:' : 'ws:';
    const origin = loc?.origin || 'http://127.0.0.1:7635';
    const wsPath = new URL('/ws', origin);
    wsPath.protocol = proto;
    return wsPath;
}

function ensureAudioContext() {
    if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AC();
    }
    return audioCtx;
}

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const { clientWidth, clientHeight } = $waveform;
    const width = Math.max(1, Math.floor(clientWidth * dpr));
    const height = Math.max(1, Math.floor(clientHeight * dpr));
    if ($waveform.width !== width || $waveform.height !== height) {
        $waveform.width = width;
        $waveform.height = height;
    }
}

function drawWaveform() {
    if (!isActive) return;
    rafId = requestAnimationFrame(drawWaveform);

    const w = $waveform.width;
    const h = $waveform.height;

    canvasCtx.fillStyle = '#0f172a';
    canvasCtx.fillRect(0, 0, w, h);

    canvasCtx.strokeStyle = '#1f2937';
    canvasCtx.lineWidth = 1;
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, h / 2);
    canvasCtx.lineTo(w, h / 2);
    canvasCtx.stroke();

    const color = STATE_COLORS[currentStreamState] || '#6b7280';
    let dataArray = null;
    let bufferLength = 0;

    if (currentStreamState === 'speaking' && outputAnalyser && outputDataArray) {
        outputAnalyser.getByteTimeDomainData(outputDataArray);
        dataArray = outputDataArray;
        bufferLength = outputBufferLength;
    } else if (inputAnalyser && inputDataArray) {
        inputAnalyser.getByteTimeDomainData(inputDataArray);
        dataArray = inputDataArray;
        bufferLength = inputBufferLength;
    }

    if (dataArray && bufferLength) {
        const sliceWidth = w / bufferLength;
        canvasCtx.strokeStyle = color;
        canvasCtx.lineWidth = 2;
        canvasCtx.beginPath();
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * h) / 2;
            if (i === 0) canvasCtx.moveTo(x, y);
            else canvasCtx.lineTo(x, y);
            x += sliceWidth;
        }
        canvasCtx.lineTo(w, h / 2);
        canvasCtx.stroke();
    }
}

function startVisualization() {
    if (isActive) return;
    ensureAudioContext();
    resizeCanvas();
    isActive = true;
    drawWaveform();
}

function stopVisualization() {
    if (!isActive) return;
    isActive = false;
    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
    const w = $waveform.width;
    const h = $waveform.height;
    canvasCtx.fillStyle = '#0f172a';
    canvasCtx.fillRect(0, 0, w, h);
}

function updateRecentAudioStatus(text) {
    $recentAudioStatus.textContent = text;
}

function setRecentAudioButtonPlaying(isPlaying) {
    recentAudioButtonText.value = isPlaying ? '暂停回复语音' : '播放回复语音';
}

function ensureRecentAudioContext() {
    if (!recentAudioCtx) {
        recentAudioCtx = uni.createInnerAudioContext();
        recentAudioCtx.autoplay = false;
        recentAudioCtx.obeyMuteSwitch = false;
        recentAudioCtx.onPlay(() => {
            recentAudioIsPlaying = true;
            setRecentAudioButtonPlaying(true);
        });
        recentAudioCtx.onPause(() => {
            recentAudioIsPlaying = false;
            setRecentAudioButtonPlaying(false);
        });
        recentAudioCtx.onStop(() => {
            recentAudioIsPlaying = false;
            setRecentAudioButtonPlaying(false);
        });
        recentAudioCtx.onEnded(() => {
            recentAudioIsPlaying = false;
            setRecentAudioButtonPlaying(false);
        });
        recentAudioCtx.onError((err) => {
            recentAudioIsPlaying = false;
            setRecentAudioButtonPlaying(false);
            console.error('Recent audio playback error:', err);
        });
    }
    return recentAudioCtx;
}

function setRecentAudioVisible(visible) {
    $recentAudioCard.classList.toggle('is-hidden', !visible);
    $recentAudioCard.setAttribute('aria-hidden', visible ? 'false' : 'true');
    $btnToggleRecentAudio.textContent = visible ? 'Hide Recent Audio' : 'Recent 60s Audio';
}

function revokeRecentAudioUrl() {
    if (recentAudioObjectUrl) {
        URL.revokeObjectURL(recentAudioObjectUrl);
        recentAudioObjectUrl = null;
    }
}

function clearRecentAudioSource() {
    const ctx = ensureRecentAudioContext();
    try {
        ctx.stop();
    } catch { }
    ctx.src = '';
    recentAudioHasSource = false;
    recentAudioIsPlaying = false;
    setRecentAudioButtonPlaying(false);
}

function destroyRecentAudioContext() {
    if (recentAudioCtx) {
        try {
            recentAudioCtx.stop();
        } catch { }
        try {
            recentAudioCtx.destroy();
        } catch { }
        recentAudioCtx = null;
    }
    recentAudioHasSource = false;
    recentAudioIsPlaying = false;
    setRecentAudioButtonPlaying(false);
}

function resetRecentAudioBuffer() {
    recentFullAudioSampleRate = 48000;
    recentFullAudioChunks = [];
    recentFullAudioTotalBytes = 0;
    recentAudioSnapshotDirty = false;
    revokeRecentAudioUrl();
    clearRecentAudioSource();
    updateRecentAudioStatus('Waiting for server full audio stream');
}

function trimRecentAudioBuffer(maxBytes) {
    while (recentFullAudioTotalBytes > maxBytes && recentFullAudioChunks.length > 0) {
        const overflowBytes = recentFullAudioTotalBytes - maxBytes;
        const firstChunk = recentFullAudioChunks[0];
        if (!firstChunk) {
            break;
        }
        if (overflowBytes >= firstChunk.length) {
            recentFullAudioChunks.shift();
            recentFullAudioTotalBytes -= firstChunk.length;
            continue;
        }
        const bytesToDrop = overflowBytes - (overflowBytes % FULL_AUDIO_FRAME_BYTES);
        if (bytesToDrop <= 0) {
            break;
        }
        recentFullAudioChunks[0] = firstChunk.slice(bytesToDrop);
        recentFullAudioTotalBytes -= bytesToDrop;
        break;
    }
}

function appendRecentFullAudioChunk(pcmChunkInt16, sampleRate) {
    if (!(pcmChunkInt16 instanceof ArrayBuffer) || pcmChunkInt16.byteLength === 0) {
        return;
    }
    if (recentFullAudioTotalBytes > 0 && sampleRate !== recentFullAudioSampleRate) {
        resetRecentAudioBuffer();
    }
    recentFullAudioSampleRate = sampleRate;
    const chunk = new Uint8Array(pcmChunkInt16.slice(0));
    recentFullAudioChunks.push(chunk);
    recentFullAudioTotalBytes += chunk.byteLength;
    const maxBytes = sampleRate * MAX_RECENT_AUDIO_SECONDS * FULL_AUDIO_FRAME_BYTES;
    trimRecentAudioBuffer(maxBytes);
    recentAudioSnapshotDirty = true;
    const bufferedSeconds = recentFullAudioTotalBytes / (sampleRate * FULL_AUDIO_FRAME_BYTES);
    updateRecentAudioStatus(`Buffered ${Math.min(MAX_RECENT_AUDIO_SECONDS, bufferedSeconds).toFixed(1)}s of server full audio`);
}

function flattenRecentAudioBuffer() {
    if (recentFullAudioTotalBytes <= 0) {
        return new Uint8Array(0);
    }
    const merged = new Uint8Array(recentFullAudioTotalBytes);
    let offset = 0;
    for (const chunk of recentFullAudioChunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
    }
    return merged;
}

function buildWavBlobFromPcm(pcmBytes, sampleRate, channels) {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    const byteRate = sampleRate * channels * FULL_AUDIO_BYTES_PER_SAMPLE;
    const blockAlign = channels * FULL_AUDIO_BYTES_PER_SAMPLE;

    view.setUint32(0, 0x52494646, false);
    view.setUint32(4, 36 + pcmBytes.length, true);
    view.setUint32(8, 0x57415645, false);
    view.setUint32(12, 0x666d7420, false);
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false);
    view.setUint32(40, pcmBytes.length, true);

    return new Blob([header, pcmBytes], { type: 'audio/wav' });
}

function refreshRecentAudioSnapshot(force = false) {
    if (!force && !recentAudioSnapshotDirty) {
        return;
    }
    if (recentFullAudioTotalBytes <= 0) {
        updateRecentAudioStatus('Waiting for server full audio stream');
        return;
    }
    const pcmBytes = flattenRecentAudioBuffer();
    const wavBlob = buildWavBlobFromPcm(
        pcmBytes,
        recentFullAudioSampleRate,
        FULL_AUDIO_CHANNELS
    );
    const nextObjectUrl = URL.createObjectURL(wavBlob);
    const wasPlaying = recentAudioIsPlaying;
    const ctx = ensureRecentAudioContext();
    revokeRecentAudioUrl();
    recentAudioObjectUrl = nextObjectUrl;
    ctx.src = recentAudioObjectUrl;
    recentAudioHasSource = true;
    recentAudioSnapshotDirty = false;
    if (wasPlaying) {
        try {
            ctx.play();
        } catch { }
    }
}

function toggleRecentAudioPlayback() {
    try {
        if (recentFullAudioTotalBytes <= 0) {
            updateRecentAudioStatus('Waiting for server full audio stream');
            return;
        }
        refreshRecentAudioSnapshot(true);
        const ctx = ensureRecentAudioContext();
        if (!recentAudioHasSource || !ctx.src) {
            updateRecentAudioStatus('Waiting for server full audio stream');
            return;
        }
        if (recentAudioIsPlaying) {
            ctx.pause();
            return;
        }
        ctx.play();
    } catch (e) {
        console.error('Failed to play recent audio:', e);
    }
}

function setupToggle(btn, panel) {
    btn.addEventListener('click', () => {
        const active = btn.classList.toggle('active');
        panel.style.display = active ? '' : 'none';
    });
}

// function syncVoiceSelectValue(targetName) {
//     if (!$voiceSelect) return;
//     const desired = targetName || session.state.currentVoiceName || '';
//     if (!desired) return;
//     if ($voiceSelect.value === desired) return;
//     const hasOption = Array.from($voiceSelect.options).some(opt => opt.value === desired);
//     if (hasOption) {
//         $voiceSelect.value = desired;
//     }
// }

// async function loadReferenceAudios() {
//     try {
//         const response = await fetch('/api/voices');
//         const data = await response.json();
//         availableAudios = data.audios || [];
//
//         $voiceSelect.innerHTML = '<option value="" selected disabled hidden></option>';
//         availableAudios.forEach((audio, index) => {
//             const voiceName = audio.name || audio.path || `voice_${index}`;
//             const option = document.createElement('option');
//             option.value = voiceName;
//             option.textContent = voiceName;
//             option.dataset.path = audio.path || '';
//             $voiceSelect.appendChild(option);
//         });
//
//         $voiceSelect.disabled = false;
//     } catch (error) {
//         console.error('Failed to load reference audios:', error);
//         $voiceSelect.innerHTML = '<option value="">Load failed</option>';
//     }
// }

async function handleStart() {
    if (!session) {
        alert('Session is not initialized yet.')
        return
    }
    try {
        resetRecentAudioBuffer()
        await session.open()
        startVisualization()
        isStartDisabled.value = true
        isStopDisabled.value = false
    } catch (e) {
        alert('Failed to start: ' + (e?.message || e))
    }
}

async function handleStop() {
    if (!session) {
        alert('Session is not initialized yet.')
        return
    }
    try {
        await session.close()
        stopVisualization()
        isStartDisabled.value = false
        isStopDisabled.value = true
    } catch (e) {
        alert('Failed to stop: ' + (e?.message || e))
    }
}

function toggleMute() {
    if (!session) {
        alert('Session is not initialized yet.')
        return
    }
    try {
        session.muted = !session.muted
        muteButtonText.value = session.muted ? 'Unmute' : 'Mute'
    } catch (e) {
        alert('Failed to toggle mute: ' + (e?.message || e))
    }
}

function playVoice() {
    toggleRecentAudioPlayback()
}

function jump() {
    const url = 'https://uni-helper.js.org/vitesse-uni-app/getting-started/introduction'
    const encodedUrl = Base64.encode(url)
    router.push({
        url: '/pages/WebView',
        query: {
            url: encodedUrl,
        },
    })
}

async function loadXtalk() {
    try {
        return await import("https://unpkg.com/xtalk-client@latest/dist/index.js");
    } catch (e) {
        console.log("Failed to load local xtalk-client, falling back to CDN:", e)
        return await import("../js/index.js");
    }
}

// async function loadXtalk() {
//     try {
//         // Prefer CDN bundle because it resolves worklet/model asset URLs correctly in H5 runtime.
//         return await import("https://unpkg.com/xtalk-client@latest/dist/index.js");
//     } catch (e) {
//         console.log("Failed to load CDN xtalk-client, falling back to local bundle:", e)
//         return await import("../js/index.js");
//     }
// }

onMounted(async () => {
if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('Xtalk page currently runs in H5 runtime only.');
    return;
}
try {
const { createSession } = await loadXtalk();

session = createSession(getWebSocketURL());

// const $btnStart = document.getElementById('btn-start');
// const $btnStop = document.getElementById('btn-stop');
// const $btnMute = document.getElementById('btn-mute');
 // $voiceSelect = document.getElementById('voice-select');
 $btnUploadFile = document.getElementById('btn-upload-file');
 $fileInput = document.getElementById('file-input');
 $streamState = document.getElementById('stream-state');
 $sessionId = document.getElementById('session-id');
const $waveformNode = document.getElementById('waveform');
 $waveform = $waveformNode instanceof HTMLCanvasElement
    ? $waveformNode
    : $waveformNode?.querySelector?.('canvas');
 $messages = document.getElementById('messages');
 $thoughtContent = document.getElementById('thought-content');
 $captionContent = document.getElementById('caption-content');
 $retrievalContent = document.getElementById('retrieval-content');
 $panelThought = document.getElementById('panel-thought');
 $panelCaption = document.getElementById('panel-caption');
 $panelRetrieval = document.getElementById('panel-retrieval');
 $btnToggleThought = document.getElementById('btn-toggle-thought');
 $btnToggleCaption = document.getElementById('btn-toggle-caption');
 $btnToggleRetrieval = document.getElementById('btn-toggle-retrieval');
 $latencyNetwork = document.getElementById('latency-network');
 $latencyAsr = document.getElementById('latency-asr');
 $latencyLlmFirst = document.getElementById('latency-llm-first');
 $latencyLlmSentence = document.getElementById('latency-llm-sentence');
 $latencyTts = document.getElementById('latency-tts');
 $latencyE2e = document.getElementById('latency-e2e');
 $btnToggleRecentAudio = document.getElementById('btn-toggle-recent-audio');
 $recentAudioCard = document.getElementById('recent-audio-card');
 $recentAudioStatus = document.getElementById('recent-audio-status');

const requiredElements = [
    $btnUploadFile, $fileInput,
    $streamState, $sessionId, $waveform, $messages, $thoughtContent, $captionContent,
    $retrievalContent, $panelThought, $panelCaption, $panelRetrieval, $btnToggleThought,
    $btnToggleCaption, $btnToggleRetrieval, $latencyNetwork, $latencyAsr,
    $latencyLlmFirst, $latencyLlmSentence, $latencyTts, $latencyE2e,
    $btnToggleRecentAudio, $recentAudioCard, $recentAudioStatus,
];

if (requiredElements.some((el) => !el)) {
    console.error('Xtalk page initialization failed: missing required DOM elements.');
    return;
}

canvasCtx = $waveform.getContext('2d');
if (!canvasCtx) {
    console.error('Xtalk page initialization failed: unable to get 2d canvas context.');
    return;
}

session.onStateChange((state) => {
    $streamState.textContent = state.streamState;
    $sessionId.textContent = state.sessionId || '--';
    currentStreamState = state.streamState;

    $messages.innerHTML = '';
    for (const msg of state.messages) {
        const el = document.createElement('div');
        el.className = 'message message-' + msg.role;
        el.textContent = msg.content;
        $messages.appendChild(el);
    }
    $messages.scrollTop = $messages.scrollHeight;

    $thoughtContent.textContent = state.thought || '';
    $captionContent.textContent = state.caption || '';
    $retrievalContent.textContent = state.retrieval || '';

    const l = state.latency || {};
    $latencyNetwork.textContent = l.network ?? '--';
    $latencyAsr.textContent = l.asr ?? '--';
    $latencyLlmFirst.textContent = l.llmFirstToken ?? '--';
    $latencyLlmSentence.textContent = l.llmSentence ?? '--';
    $latencyTts.textContent = l.ttsFirstChunk ?? '--';
    const e2eParts = [l.network, l.asr, l.llmSentence, l.ttsFirstChunk];
    $latencyE2e.textContent = e2eParts.every(v => v != null) ? e2eParts.reduce((a, b) => a + b, 0) : '--';
});

session.onInputAudioChunk((pcmChunkInt16, sampleRate) => {
    try {
        ensureAudioContext();
        if (!inputAnalyser) {
            inputAnalyser = audioCtx.createAnalyser();
            inputAnalyser.fftSize = 1024;
            inputAnalyser.smoothingTimeConstant = 0.7;
            inputBufferLength = inputAnalyser.fftSize;
            inputDataArray = new Uint8Array(inputBufferLength);
        }

        const int16 = new Int16Array(pcmChunkInt16);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 32768;
        }

        const buffer = audioCtx.createBuffer(1, float32.length, sampleRate);
        buffer.getChannelData(0).set(float32);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(inputAnalyser);
        const gain = audioCtx.createGain();
        gain.gain.value = 0;
        inputAnalyser.connect(gain);
        gain.connect(audioCtx.destination);
        source.start();
        source.addEventListener('ended', () => {
            try { source.disconnect(); } catch { }
        });
    } catch (e) {
        console.error('Input audio chunk error:', e);
    }
});

session.onOutputAudioChunk((pcmChunkInt16, sampleRate) => {
    try {
        ensureAudioContext();
        if (!outputAnalyser) {
            outputAnalyser = audioCtx.createAnalyser();
            outputAnalyser.fftSize = 1024;
            outputAnalyser.smoothingTimeConstant = 0.7;
            outputBufferLength = outputAnalyser.fftSize;
            outputDataArray = new Uint8Array(outputBufferLength);
        }

        const int16 = new Int16Array(pcmChunkInt16);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 32768;
        }

        const buffer = audioCtx.createBuffer(1, float32.length, sampleRate);
        buffer.getChannelData(0).set(float32);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(outputAnalyser);
        const gain = audioCtx.createGain();
        gain.gain.value = 0;
        outputAnalyser.connect(gain);
        gain.connect(audioCtx.destination);
        source.start();
        source.addEventListener('ended', () => {
            try { source.disconnect(); } catch { }
        });
    } catch (e) {
        console.error('Output audio chunk error:', e);
    }
});

session.onFullAudioChunk((pcmChunkInt16, sampleRate) => {
    appendRecentFullAudioChunk(pcmChunkInt16, sampleRate);
    const canRefreshSnapshot = !recentAudioIsPlaying;
    if (canRefreshSnapshot) {
        refreshRecentAudioSnapshot();
    }
});

setupToggle($btnToggleThought, $panelThought);
setupToggle($btnToggleCaption, $panelCaption);
setupToggle($btnToggleRetrieval, $panelRetrieval);

$btnToggleRecentAudio.addEventListener('click', () => {
    const willOpen = $recentAudioCard.classList.contains('is-hidden');
    setRecentAudioVisible(willOpen);
    if (willOpen) {
        refreshRecentAudioSnapshot(true);
    }
});

window.addEventListener('resize', () => {
    resizeCanvas();
});

window.addEventListener('beforeunload', () => {
    revokeRecentAudioUrl();
    destroyRecentAudioContext();
});

setRecentAudioVisible(false);

// $voiceSelect.addEventListener('change', (e) => {
//     const selectedName = e.target.value;
//     const selectedAudio = availableAudios.find(a => (a.name || a.path) === selectedName);
//     if (selectedAudio) {
//         const voiceName = selectedAudio.name || selectedName;
//         session.changeVoice(voiceName);
//         session.state.currentVoiceName = voiceName;
//         session.state.currentVoicePath = selectedAudio.path || null;
//         syncVoiceSelectValue(voiceName);
//     }
// });

$btnUploadFile.addEventListener('click', () => {
    $fileInput.click();
});

$fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        await session.uploadFile(file);
    } catch (err) {
        alert('Failed to upload file: ' + (err?.message || err));
    }
    $fileInput.value = '';
});

// loadReferenceAudios();
} catch (e) {
    console.error('Xtalk page init failed:', e);
}
});
</script>