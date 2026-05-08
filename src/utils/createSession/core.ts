import { createWebSocket } from "./websocket";
import type { InputAudioSessionConfig, OutputAudioSessionConfig } from "./bases/audio-session";
import { createInputAudioSession, createOutputAudioSession } from "./audio-session";
import { Conversation } from "./conversation";
import { ActionHandler } from "./action-handler";

export { createSession };

declare const uni: any;

interface SessionConfig {
    inputConfig?: Partial<InputAudioSessionConfig>,
    outputConfig?: Partial<OutputAudioSessionConfig>
}
function createSession(
    websocketURL: string | URL,
    {
        inputConfig = {},
        outputConfig = {},
    }: SessionConfig = {},
) {
    const resolvedInputConfig: InputAudioSessionConfig = {
        sampleRate: 16000,
        ...inputConfig,
    };
    const resolvedOutputConfig: OutputAudioSessionConfig = {
        sampleRate: 48000,
        ...outputConfig,
    };
    const conversation = new Conversation();
    const actionHandler = new ActionHandler();
    let websocket: ReturnType<typeof createWebSocket>;
    let inputAudioSession: ReturnType<typeof createInputAudioSession>;
    let outputAudioSession: ReturnType<typeof createOutputAudioSession>;
    let manualMuted = false;
    let playbackMuted = false;
    let accessToken: string | null = null;

    let inputAudioChunkCallback: ((pcmChunkInt16: ArrayBuffer, sampleRate: number) => void) = (_chunk, _sr) => { };
    let outputAudioChunkCallback: ((pcmChunkInt16: ArrayBuffer, sampleRate: number) => void) = (_chunk, _sr) => { };

    function resolveBaseURL(inputURL: string | URL): string {
        const rawURL = typeof inputURL === "string" ? inputURL : inputURL.toString();
        if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(rawURL)) {
            return rawURL;
        }
        if (typeof window !== "undefined" && window.location) {
            const origin = window.location.origin || `${window.location.protocol}//${window.location.host}`;
            if (rawURL.startsWith("/")) {
                return `${origin}${rawURL}`;
            }
            const basePath = window.location.pathname.replace(/[^/]*$/, "");
            return `${origin}${basePath}${rawURL}`;
        }
        return rawURL;
    }

    function resolveLoginURL(inputURL: string | URL): string {
        const baseURL = resolveBaseURL(inputURL)
            .replace(/^ws:/i, "http:")
            .replace(/^wss:/i, "https:");
        return baseURL.replace(/\/ws(?:\?.*)?$/i, "/api/auth/login");
    }

    function buildAuthenticatedWebSocketURL(inputURL: string | URL, token: string): string {
        const baseURL = resolveBaseURL(inputURL);
        const separator = baseURL.includes("?") ? "&" : "?";
        return `${baseURL}${separator}access_token=${encodeURIComponent(token)}`;
    }

    async function postJSON<T>(url: string): Promise<T> {
        if (typeof fetch === "function") {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            return await response.json() as T;
        }

        const uniApi = typeof uni !== "undefined" ? uni : undefined;
        if (!uniApi || typeof uniApi.request !== "function") {
            throw new Error("No HTTP client is available for login");
        }

        return await new Promise<T>((resolve, reject) => {
            uniApi.request({
                url,
                method: "POST",
                header: {
                    Accept: "application/json",
                },
                success: (response: any) => {
                    const statusCode = Number(response?.statusCode ?? 0);
                    if (statusCode < 200 || statusCode >= 300) {
                        reject(new Error(`Request failed with status ${statusCode}`));
                        return;
                    }
                    resolve(response.data as T);
                },
                fail: (error: unknown) => {
                    reject(error);
                },
            });
        });
    }

    async function ensureLoggedIn(): Promise<void> {
        if (accessToken) {
            return;
        }
        const payload = await postJSON<{ access_token?: string }>(resolveLoginURL(websocketURL));
        if (!payload?.access_token) {
            throw new Error("Login response did not include access_token");
        }
        accessToken = payload.access_token;
    }

    function applyInputMuteState() {
        inputAudioSession.muted = manualMuted || playbackMuted;
    }

    function initialize(authenticatedWebsocketURL: string | URL) {
        websocket = createWebSocket(authenticatedWebsocketURL);
        inputAudioSession = createInputAudioSession(resolvedInputConfig);
        outputAudioSession = createOutputAudioSession(resolvedOutputConfig);
        applyInputMuteState();

        let rejectAttached: ((reason?: unknown) => void) | null = null;
        const actionAttachedPromise = actionHandler.waitForAction("session_attached");
        const attachedPromise = new Promise<void>((resolve, reject) => {
            rejectAttached = reject;
            void actionAttachedPromise.then(resolve, reject);
        });
        const openPromise = new Promise<void>((resolve, reject) => {
            websocket.addEventListener("open", () => {
                resolve();
            });
            websocket.addEventListener("error", () => {
                reject(new Error("WebSocket connection failed"));
            });
        });

        // Subscribe actions and audio chunks
        websocket.addEventListener("message", async (event: { data: string | ArrayBuffer }) => {
            if (typeof event.data === "string") {
                const message: { action: string, data: any } = JSON.parse(event.data);
                try {
                    await actionHandler.handleAction(message.action, message.data, websocket, conversation, outputAudioSession);
                    if (message.action === "stop_tts" || message.action === "pause_tts" || message.action === "tts_finished") {
                        playbackMuted = false;
                        applyInputMuteState();
                    }
                } catch (error) {
                    //TODO: Handle unknown action error
                }
            } else if (event.data instanceof ArrayBuffer) {
                await outputAudioSession.pushAudioChunk(event.data);
            }
        });
        websocket.addEventListener("close", () => {
            rejectAttached?.(new Error("WebSocket closed before session attachment"));
        });

        // Bind audio input handling
        inputAudioSession.onFrame(async (audioChunk) => {
            inputAudioChunkCallback(audioChunk, resolvedInputConfig.sampleRate);
            if (websocket.ready()) {
                websocket.sendAudioChunk(audioChunk);
            }
        });
        inputAudioSession.onSpeechStart(async () => {
            if (websocket.ready()) {
                await actionHandler.handleAction("client_speech_start", null, websocket, conversation, outputAudioSession);
            }
        });
        inputAudioSession.onSpeechEnd(async () => {
            if (websocket.ready()) {
                await actionHandler.handleAction("client_speech_end", null, websocket, conversation, outputAudioSession);
            }
        });

        // Bind audio output handling
        outputAudioSession.onChunkStarted(async (audioChunk) => {
            outputAudioChunkCallback(audioChunk, resolvedOutputConfig.sampleRate);
            playbackMuted = true;
            applyInputMuteState();
            if (websocket.ready()) {
                await actionHandler.handleAction("client_audio_chunk_started", null, websocket, conversation, outputAudioSession);
            }
        });
        outputAudioSession.onChunkPlayed(async (_audioChunk) => {
            if (websocket.ready()) {
                await actionHandler.handleAction("client_audio_chunk_played", null, websocket, conversation, outputAudioSession);
            }
        });
        outputAudioSession.onAllChunksPlayed(async () => {
            playbackMuted = false;
            applyInputMuteState();
            if (websocket.ready()) {
                await actionHandler.handleAction("client_audio_playback_finished", null, websocket, conversation, outputAudioSession);
            }
        });

        return { openPromise, attachedPromise };
    }


    // Create API for external use
    const session = {
        open: async () => {
            await ensureLoggedIn();
            const authenticatedWebsocketURL = buildAuthenticatedWebSocketURL(websocketURL, accessToken!);
            const { openPromise, attachedPromise } = initialize(authenticatedWebsocketURL);
            await openPromise;
            websocket.sendJson({
                action: "attach_session",
                session_id: conversation.state.sessionId,
            });
            await attachedPromise;
            await outputAudioSession.open();
            await inputAudioSession.open();
        },
        close: async () => {
            await inputAudioSession.close();
            await outputAudioSession.close();
            websocket.close();
            playbackMuted = false;
            conversation.state.streamState = 'idle';
        },
        onStateChange: (callback: (state: Conversation["state"]) => void) => {
            conversation.onStateChange(callback);
        },
        get state() {
            return conversation.state;
        },
        onInputAudioChunk: (callback: (pcmChunkInt16: ArrayBuffer, sampleRate: number) => void) => {
            inputAudioChunkCallback = callback;
        },
        onOutputAudioChunk: (callback: (pcmChunkInt16: ArrayBuffer, sampleRate: number) => void) => {
            outputAudioChunkCallback = callback;
        },
        onFullAudioChunk: (callback: (pcmChunkInt16: ArrayBuffer, sampleRate: number) => void) => {
            conversation.onFullAudioChunk(callback);
        },
        get muted() {
            return manualMuted;
        },
        set muted(value: boolean) {
            manualMuted = value;
            applyInputMuteState();
        },
        async changeVoice(voiceName: string) {
            await actionHandler.handleAction("client_change_voice", { voiceName }, websocket, conversation, outputAudioSession)
        },
        async uploadFile(file: Blob, endpoint: string | URL = "./api/upload") {
            await actionHandler.handleAction("client_upload_file", { file, endpoint }, websocket, conversation, outputAudioSession);
        }
    }

    return session;
}
