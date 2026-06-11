export { Conversation };

type Message = {
    role: "user" | "assistant" | "info";
    content: string;
    turnId?: number;
}
function defaultConversation(): {
    streamState: "idle" | "listening" | "processing" | "speaking";
    sessionId: string | null;
    latency: {
        network?: number,
        asr?: number,
        llmFirstToken?: number,
        llmSentence?: number,
        ttsFirstChunk?: number
    };
    messages: Message[];
    thought: string;
    caption: string;
    retrieval: string;
} {
    return {
        streamState: "idle",
        sessionId: null,
        latency: {},
        messages: [],
        thought: "",
        caption: "",
        retrieval: "",
    };
}
type ConversationState = ReturnType<typeof defaultConversation>;
class Conversation {
    private _state: ConversationState = defaultConversation();
    private stateChangeCallback: (state: ConversationState) => void = () => { };
    private fullAudioChunkCallback: (pcmChunkInt16: ArrayBuffer, sampleRate: number) => void = (_chunk, _sr) => { };
    private sessionIdChangeCallback: (sessionId: string | null) => void = (_id) => { };
    onStateChange(callback: (state: ConversationState) => void): void {
        callback(this._state);
        this.stateChangeCallback = callback;
    }
    onFullAudioChunk(
        callback: (pcmChunkInt16: ArrayBuffer, sampleRate: number) => void
    ): void {
        this.fullAudioChunkCallback = callback;
    }
    onSessionIdChange(callback: (sessionId: string | null) => void): void {
        this.sessionIdChangeCallback = callback;
    }
    get state(): ConversationState {
        return new Proxy(this._state, {
            set: (target, key: keyof ConversationState, value) => {
                target[key] = value;
                if (key === "sessionId") {
                    this.sessionIdChangeCallback(value);
                }
                this.stateChangeCallback(target);
                return true;
            },
            get: (target, key: keyof ConversationState) => {
                return key in target ? target[key] : undefined;
            }
        });
    }
    appendMessage(message: Message): void {
        // If is an info, directly append
        // console.log("appendMessage", message);
        if (message.role === "info") {
            this.state.messages.push(message);
            this.stateChangeCallback(this._state);
            return;
        }
        // Find the latest message with same role and turnId to replace
        if(this.state.messages.length > 0){
            const lastMessage = this.state.messages[this.state.messages.length - 1];
            if(lastMessage.role === message.role && lastMessage.turnId === message.turnId){
                lastMessage.content = message.content;
                this.stateChangeCallback(this._state);
                return;
            }
        }
        // Otherwise, add as new message
        this.state.messages.push(message);
        this.stateChangeCallback(this._state);
    }
    updateLatency(latency: Conversation["state"]["latency"]) {
        this.state.latency = { ...latency };
    }
    emitFullAudioChunk(pcmChunkInt16: ArrayBuffer, sampleRate: number): void {
        this.fullAudioChunkCallback(pcmChunkInt16, sampleRate);
    }
    loadHistory(messages: { role: string; content: string }[]): void {
        this._state.messages = messages.map((m) => ({
            role: m.role as "user" | "assistant" | "info",
            content: m.content,
        }));
        this.stateChangeCallback(this._state);
    }
}
