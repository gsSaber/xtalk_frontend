var e,
  t = {};
/*
function n() {
  if ("undefined" != typeof window && "undefined" != typeof document)
    return e.Web;
  throw new Error("Unknown platform");
}
*/
((t.d = (e, n) => {
  for (var a in n)
    t.o(n, a) &&
      !t.o(e, a) &&
      Object.defineProperty(e, a, { enumerable: !0, get: n[a] });
}),
  (t.o = (e, t) => Object.prototype.hasOwnProperty.call(e, t)),
  (t.p = ""),
  (function (e) {
    e[(e.Web = 0)] = "Web";
  })(e || (e = {})));
class a {
  sendJson(e) {
    this.send(JSON.stringify(e));
  }
  sendAudioChunk(e) {
    this.send(e);
  }
}
class s {
  onFrame(e) {
    this.frameCallback = e;
  }
  onSpeechStart(e) {
    this.speechStartCallback = e;
  }
  onSpeechEnd(e) {
    this.speechEndCallback = e;
  }
  frameCallback(e) {}
  speechStartCallback() {}
  speechEndCallback() {}
}
class o {
  onChunkStarted(e) {
    this.chunkStartedCallback = e;
  }
  onChunkPlayed(e) {
    this.chunkPlayedCallback = e;
  }
  onAllChunksPlayed(e) {
    this.allChunksPlayedCallback = e;
  }
  chunkStartedCallback(e) {}
  chunkPlayedCallback(e) {}
  allChunksPlayedCallback() {}
}
const i = t.p + "worklets/vad-processor.worklet.389b5dac3c577d80c88d.js",
  r = t.p + "models/fastenhancer_s.0a43b8234398af92ea20.onnx";
class c extends a {
  constructor(e, t) {
    (super(),
      (this.instance = new WebSocket(e, t)),
      (this.instance.binaryType = "arraybuffer"));
  }
  ready() {
    return this.instance.readyState === WebSocket.OPEN;
  }
  send(e) {
    this.instance.send(e);
  }
  close() {
    this.instance.close();
  }
  addEventListener(e, t) {
    this.instance.addEventListener(e, t);
  }
}
class u extends s {
  constructor(e) {
    (super(),
      (this.VAD_PARAMS = {
        vadFrameSamples: 512,
        vadNegativeFramesBeforeEnd: 50,
        vadConfig: {
          positiveSpeechThreshold: 0.8,
          negativeSpeechThreshold: 0.2,
          preSpeechPadMs: 30,
          redemptionMs: 500,
          minSpeechMs: 250,
          submitUserSpeechOnPause: !1,
        },
      }),
      (this.ENHANCER_PARAMS = { hopSize: 256, nFFT: 512 }),
      (this._muted = !1),
      (this.audioContext = null),
      void 0 === (e = { ...e }).enableVAD && (e.enableVAD = !0),
      void 0 === e.enableEnhancer && (e.enableEnhancer = !0),
      "number" == typeof e.vadRedemptionMs &&
        Number.isFinite(e.vadRedemptionMs) &&
        e.vadRedemptionMs >= 0 &&
        (this.VAD_PARAMS.vadConfig.redemptionMs = e.vadRedemptionMs),
      (this.config = e));
  }
  async open() {
    if (null !== this.audioContext) throw new Error("Session already started");
    await this.ensureModelsEnv();
    const { enhanceFrame: e, resetEnhancer: t } = await this.setupEnhancer(),
      { audioContext: n, frameProcessNode: a } =
        await this.setupAudioPipeline();
    (this.config.enableVAD
      ? await this.setupVAD(a, e, t)
      : this.setupDirectProcessing(a, e),
      (this.audioContext = n));
  }
  async close() {
    if (!this.audioContext) throw new Error("Session not started");
    (this.audioContext.close(), (this.audioContext = null));
  }
  get muted() {
    return this._muted;
  }
  set muted(e) {
    this._muted = e;
  }
  setupDirectProcessing(e, t) {
    e.port.onmessage = async (e) => {
      if ("audioFrame" === e.data.type) {
        if (this.muted) return;
        const n = e.data.frame,
          a = await t(n);
        this.frameCallback(this.float32ToInt16(a));
      }
    };
  }
  async setupVAD(e, t, n) {
    const a = await fetch(
        "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.27/dist/silero_vad_v5.onnx",
      ).then((e) => e.arrayBuffer()),
      s = await window.ort.InferenceSession.create(a),
      o = Array(256).fill(0);
    let i = new window.ort.Tensor("float32", o, [2, 1, 128]);
    const r = new window.ort.Tensor("int64", [BigInt(this.config.sampleRate)]),
      c = { negEndCounterEnabled: !1, negEndCounter: 0 },
      u = new window.vad.FrameProcessor(
        async (e) => {
          const n = await t(e),
            a = {
              input: new window.ort.Tensor("float32", n, [1, n.length]),
              state: i,
              sr: r,
            },
            o = await s.run(a);
          i = o.stateN;
          const c = o.output.data[0];
          return { isSpeech: c, notSpeech: 1 - c };
        },
        () => {
          ((i = new window.ort.Tensor("float32", o, [2, 1, 128])), n());
        },
        this.VAD_PARAMS.vadConfig,
        (this.VAD_PARAMS.vadFrameSamples / this.config.sampleRate) * 1e3,
      ),
      d = (e) => {
        switch (e.msg) {
          case window.vad.Message.FrameProcessed:
            const t = e.frame;
            if (c.negEndCounterEnabled) {
              const t =
                Number(e?.probs?.notSpeech ?? 0) >
                1 - this.VAD_PARAMS.vadConfig.negativeSpeechThreshold;
              ((c.negEndCounter = t ? c.negEndCounter + 1 : 0),
                c.negEndCounter > this.VAD_PARAMS.vadNegativeFramesBeforeEnd &&
                  (this.speechEndCallback(),
                  (c.negEndCounterEnabled = !1),
                  (c.negEndCounter = 0)));
            }
            this.muted || this.frameCallback(this.float32ToInt16(t));
            break;
          case window.vad.Message.SpeechStart:
            (this.speechStartCallback(),
              (c.negEndCounterEnabled = !0),
              (c.negEndCounter = 0));
            break;
          case window.vad.Message.SpeechEnd:
            (this.speechEndCallback(),
              (c.negEndCounterEnabled = !1),
              (c.negEndCounter = 0));
        }
      },
      l = [];
    let h = !1;
    ((e.port.onmessage = async (e) => {
      if ("audioFrame" === e.data.type) {
        if (this.muted) return;
        if ((l.push(e.data.frame), h)) return;
        for (h = !0; l.length > 0; ) {
          const e = l.shift();
          await u.process(e, d);
        }
        h = !1;
      }
    }),
      u.resume());
  }
  async setupAudioPipeline() {
    const e = new window.AudioContext({ sampleRate: this.config.sampleRate }),
      t = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: !0,
          autoGainControl: !0,
          noiseSuppression: !1,
        },
      }),
      n = e.createMediaStreamSource(t);
    await e.audioWorklet.addModule(i);
    const a = new AudioWorkletNode(e, "vad-processor", {
        processorOptions: {
          targetSampleRate: this.config.sampleRate,
          targetFrameSize: this.VAD_PARAMS.vadFrameSamples,
        },
      }),
      s = e.createGain();
    return (
      (s.gain.value = 0),
      n.connect(a),
      a.connect(s),
      s.connect(e.destination),
      { audioContext: e, frameProcessNode: a }
    );
  }
  async setupEnhancer() {
    const e = async (e) => e;
    if (!this.config.enableEnhancer)
      return { enhanceFrame: e, resetEnhancer: () => {} };
    try {
      const e = await fetch(r).then((e) => e.arrayBuffer()),
        t = await window.ort.InferenceSession.create(e),
        n = {
          cache_in_0: new window.ort.Tensor(
            "float32",
            new Float32Array(256).fill(0),
            [1, 256],
          ),
          cache_in_1: new window.ort.Tensor(
            "float32",
            new Float32Array(256).fill(0),
            [1, 256],
          ),
          cache_in_2: new window.ort.Tensor(
            "float32",
            new Float32Array(1728).fill(0),
            [1, 36, 48],
          ),
          cache_in_3: new window.ort.Tensor(
            "float32",
            new Float32Array(1728).fill(0),
            [1, 36, 48],
          ),
          cache_in_4: new window.ort.Tensor(
            "float32",
            new Float32Array(1728).fill(0),
            [1, 36, 48],
          ),
        };
      let a = [],
        s = [],
        o = !0;
      const i = async (e) => {
        for (let t = 0; t < e.length; t++) a.push(e[t]);
        for (; a.length >= this.ENHANCER_PARAMS.hopSize; ) {
          const e = a.splice(0, this.ENHANCER_PARAMS.hopSize),
            i = new Float32Array(e),
            r = {
              wav_in: new window.ort.Tensor("float32", i, [
                1,
                this.ENHANCER_PARAMS.hopSize,
              ]),
            };
          for (const e of Object.keys(n)) r[e] = n[e];
          const c = await t.run(r),
            u = t.outputNames,
            d = c[u[0]].data;
          for (let e = 1; e < u.length; e++) n["cache_in_" + (e - 1)] = c[u[e]];
          for (let e = 0; e < d.length; e++) s.push(d[e]);
          o &&
            s.length >=
              this.ENHANCER_PARAMS.nFFT - this.ENHANCER_PARAMS.hopSize &&
            (s.splice(
              0,
              this.ENHANCER_PARAMS.nFFT - this.ENHANCER_PARAMS.hopSize,
            ),
            (o = !1));
        }
        if (s.length >= e.length) {
          const t = s.splice(0, e.length);
          return new Float32Array(t);
        }
        return e;
      };
      return {
        enhanceFrame: i,
        resetEnhancer: () => {
          ((a = []), (s = []), (o = !0));
          for (const e of Object.keys(n)) {
            const t = n[e].dims,
              a = new Float32Array(t.reduce((e, t) => e * t, 1)).fill(0);
            n[e] = new window.ort.Tensor("float32", a, t);
          }
        },
      };
    } catch {
      return { enhanceFrame: e, resetEnhancer: () => {} };
    }
  }
  float32ToInt16(e) {
    const t = new Int16Array(e.length);
    for (let n = 0; n < e.length; n++) {
      const a = Math.max(-1, Math.min(1, e[n]));
      t[n] = a < 0 ? 32768 * a : 32767 * a;
    }
    return t.buffer;
  }
  async ensureModelsEnv() {
    if (!this.config.enableEnhancer && !this.config.enableVAD) return;
    const e = (e) =>
      new Promise((t, n) => {
        const a = document.createElement("script");
        ((a.src = e),
          (a.onload = () => t()),
          (a.onerror = (e) => n(e)),
          document.head.appendChild(a));
      });
    if (!window.ort) {
      const t = /iPhone|iPad|iPod/i.test(navigator.userAgent)
        ? "1.17.0"
        : "1.22.0";
      (await e(`https://cdn.jsdelivr.net/npm/onnxruntime-web@${t}/dist/ort.js`),
        (window.ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${t}/dist/`));
    }
    this.config.enableVAD &&
      !window.vad &&
      (await e(
        "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.27/dist/bundle.min.js",
      ));
  }
}
class d extends o {
  constructor(e) {
    (super(),
      (this.config = e),
      (this.audioContext = null),
      (this.audioBufferSources = []),
      (this.audioTimeToPlay = 0),
      (this.audioChunkStartedTimeouts = []),
      (this.audioChunksPaused = []));
  }
  async open() {
    if (null !== this.audioContext) throw new Error("Session already started");
    ((this.audioContext = new window.AudioContext({
      sampleRate: this.config.sampleRate,
    })),
      await this.audioContext.resume());
  }
  async close() {
    if (!this.audioContext) throw new Error("Session not started");
    (await this.stop(),
      this.audioContext.close(),
      (this.audioContext = null),
      (this.audioTimeToPlay = 0));
  }
  async pause() {
    if (!this.audioContext) throw new Error("Session not started");
    if ("suspended" == this.audioContext.state)
      throw new Error("Session already paused");
    (this.audioChunkStartedTimeouts.forEach((e) => {
      e.pause();
    }),
      await this.audioContext.suspend());
  }
  async resume() {
    if (!this.audioContext) throw new Error("Session not started");
    if ("running" == this.audioContext.state)
      throw new Error("Session not paused");
    (this.audioChunkStartedTimeouts.forEach((e) => {
      e.resume();
    }),
      await this.audioContext.resume());
    for (const e of this.audioChunksPaused) await this.pushAudioChunk(e);
    this.audioChunksPaused.length = 0;
  }
  async stop() {
    (this.audioChunkStartedTimeouts.forEach((e) => {
      e.cancel();
    }),
      (this.audioChunkStartedTimeouts.length = 0),
      this.audioBufferSources.forEach((e) => {
        ((e.onended = null), e.disconnect());
      }),
      (this.audioBufferSources.length = 0),
      (this.audioTimeToPlay = 0),
      (this.audioChunksPaused.length = 0));
  }
  async pushAudioChunk(e) {
    if (!this.audioContext) throw new Error("Session not started");
    if ("suspended" === this.audioContext.state)
      return void this.audioChunksPaused.push(e);
    const t = new Int16Array(e);
    if (0 === t.length) return;
    const n = new Float32Array(t.length);
    t.forEach((e, t) => {
      n[t] = e / 32768;
    });
    const a = this.audioContext.createBuffer(
      1,
      n.length,
      this.config.sampleRate,
    );
    a.getChannelData(0).set(n);
    const s = this.audioContext.createBufferSource();
    ((s.buffer = a),
      s.connect(this.audioContext.destination),
      (s.onended = () => {
        this.chunkPlayedCallback(t.buffer);
        const e = this.audioBufferSources.indexOf(s);
        (-1 !== e && this.audioBufferSources.splice(e, 1),
          0 === this.audioBufferSources.length &&
            this.allChunksPlayedCallback());
      }),
      this.audioBufferSources.push(s));
    const o = this.audioContext.currentTime;
    (this.audioTimeToPlay < o && (this.audioTimeToPlay = o),
      s.start(this.audioTimeToPlay));
    const i = 1e3 * (this.audioTimeToPlay - o);
    if (i <= 0) this.chunkStartedCallback(t.buffer);
    else {
      const e = (function (e, t) {
        let n = null,
          a = 0,
          s = t,
          o = !1,
          i = !1;
        function r(t) {
          ((a = Date.now()),
            (o = !0),
            (n = setTimeout(() => {
              ((o = !1), (n = null), (s = 0), i || e());
            }, t)));
        }
        return (
          r(t),
          {
            pause: function () {
              o &&
                null !== n &&
                (clearTimeout(n), (n = null), (s -= Date.now() - a), (o = !1));
            },
            resume: function () {
              o || i || s <= 0 || r(s);
            },
            cancel: function () {
              (null !== n && (clearTimeout(n), (n = null)),
                (o = !1),
                (i = !0),
                (s = 0));
            },
          }
        );
      })(() => {
        this.chunkStartedCallback(t.buffer);
        const n = this.audioChunkStartedTimeouts.indexOf(e);
        -1 !== n && this.audioChunkStartedTimeouts.splice(n, 1);
      }, i);
      this.audioChunkStartedTimeouts.push(e);
    }
    this.audioTimeToPlay += a.duration / s.playbackRate.value;
  }
}
class l {
  constructor() {
    ((this._state = {
      streamState: "idle",
      sessionId: null,
      latency: {},
      messages: [],
      thought: "",
      caption: "",
      retrieval: "",
    }),
      (this.stateChangeCallback = () => {}),
      (this.fullAudioChunkCallback = (e, t) => {}));
  }
  onStateChange(e) {
    (e(this._state), (this.stateChangeCallback = e));
  }
  onFullAudioChunk(e) {
    this.fullAudioChunkCallback = e;
  }
  get state() {
    return new Proxy(this._state, {
      set: (e, t, n) => ((e[t] = n), this.stateChangeCallback(e), !0),
      get: (e, t) => (t in e ? e[t] : void 0),
    });
  }
  appendMessage(e) {
    if ("info" === e.role)
      return (
        this.state.messages.push(e),
        void this.stateChangeCallback(this._state)
      );
    for (let t = this.state.messages.length - 1; t >= 0; t--) {
      const n = this.state.messages[t];
      if (n.role === e.role && n.turnId === e.turnId) {
        n.content = e.content;
        const a = this.state.messages[this.state.messages.length - 1];
        return (
          "info" === a.role &&
            (this.state.messages.splice(this.state.messages.length - 1, 1),
            this.state.messages.splice(t, 0, a)),
          void this.stateChangeCallback(this._state)
        );
      }
    }
    (this.state.messages.push(e), this.stateChangeCallback(this._state));
  }
  updateLatency(e) {
    this.state.latency = { ...e };
  }
  emitFullAudioChunk(e, t) {
    this.fullAudioChunkCallback(e, t);
  }
}
const h = async (e, t, n, a) => {
    n.state.streamState = "listening";
  },
  p = async (e, t, n, a) => {
    n.state.streamState = "processing";
  },
  f = {
    client_change_voice: async (e, t, n, a) => {
      t.sendJson({ action: "change_voice", voice_name: e.voiceName });
    },
    client_upload_file: async (e, t, n, a) => {
      n.state.streamState = "processing";
      const s = e.file,
        o = e.endpoint,
        i = new FormData();
      (i.append("session_id", n.state.sessionId),
        i.append("file", s),
        (await fetch(o, { method: "POST", body: i })).ok ||
          (n.state.streamState = "idle"));
    },
  },
  w = {
    latency_metrics: async (e, t, n, a) => {
      n.updateLatency({
        network: Number(e.network_latency_ms) || 0,
        asr: Number(e.asr_latency_ms) || 0,
        llmFirstToken: Number(e.llm_first_token_ms) || 0,
        llmSentence: Number(e.llm_sentence_ms) || 0,
        ttsFirstChunk: Number(e.tts_first_chunk_ms) || 0,
      });
    },
  },
  m = {
    vad_speech_start: async (e, t, n, a) => {
      h(0, 0, n);
    },
    vad_speech_end: async (e, t, n, a) => {
      p(0, 0, n);
    },
    full_audio_frame: async (e, t, n, a) => {
      const s = "string" == typeof e?.audio_base64 ? e.audio_base64 : "";
      if (!s) return;
      const o = "number" == typeof e?.sample_rate ? e.sample_rate : 48e3,
        i = (function (e) {
          const t = atob(e),
            n = new Uint8Array(t.length);
          for (let e = 0; e < t.length; e++) n[e] = t.charCodeAt(e);
          return n.buffer;
        })(s);
      n.emitFullAudioChunk(i, o);
    },
  },
  C = {};
function y(e) {
  for (const t in e) e[t] && (C[t] = e[t]);
}
(y({
  client_speech_start: async (e, t, n, a) => {
    (h(0, 0, n), t.sendJson({ action: "vad_speech_start" }));
  },
  client_speech_end: async (e, t, n, a) => {
    (p(0, 0, n), t.sendJson({ action: "vad_speech_end" }));
  },
  client_audio_chunk_started: async (e, t, n, a) => {
    n.state.streamState = "speaking";
  },
  client_audio_playback_finished: async (e, t, n, a) => {
    ((n.state.streamState = "idle"),
      t.sendJson({ action: "tts_playback_finished" }));
  },
  client_audio_chunk_played: async (e, t, n, a) => {
    t.sendJson({ action: "tts_chunk_played" });
  },
}),
  y({
    update_asr: async (e, t, n, a) => {
      n.appendMessage({ role: "user", content: e.text, turnId: e.turn_id });
    },
    finish_asr: async (e, t, n, a) => {
      n.appendMessage({ role: "user", content: e.text, turnId: e.turn_id });
    },
    update_resp: async (e, t, n, a) => {
      n.appendMessage({
        role: "assistant",
        content: e.text,
        turnId: e.turn_id,
      });
    },
    finish_resp: async (e, t, n, a) => {
      n.appendMessage({
        role: "assistant",
        content: e.text,
        turnId: e.turn_id,
      });
    },
  }),
  y({
    start_tts: async (e, t, n, a) => {},
    pause_tts: async (e, t, n, a) => {
      await a.pause();
    },
    stop_tts: async (e, t, n, a) => {
      await a.stop();
    },
    resume_tts: async (e, t, n, a) => {
      await a.resume();
    },
  }),
  y({
    session_info: async (e, t, n, a) => {
      const s = e.session_id || null;
      n.state.sessionId = s;
    },
  }),
  y(f),
  y({
    thought_updated: async (e, t, n, a) => {
      n.state.thought = e.text;
    },
    caption_updated: async (e, t, n, a) => {
      n.state.caption = e.text;
    },
    retrieval_updated: async (e, t, n, a) => {
      n.state.retrieval = e.text;
    },
  }),
  y(w),
  y(m));
class _ {
  constructor() {
    this.ACTION_TO_FUNCTION = C;
  }
  async handleAction(e, t, n, a, s) {
    const o = this.ACTION_TO_FUNCTION[e];
    if (!o) throw new Error(`No handler found for action: ${e}`);
    await o(t, n, a, s);
  }
}
function g(t, { inputConfig: a = {}, outputConfig: s = {} } = {}) {
  const o = { sampleRate: 16e3, ...a },
    i = { sampleRate: 48e3, ...s },
    r = new l(),
    h = new _();
  let p,
    f,
    w,
    m = (e, t) => {},
    C = (e, t) => {};
  return {
    open: async () => {
      ((p = (function (t) {
        // if (n() === e.Web) return new c(t, void 0);
        // throw new Error("Unknown platform");
        return new c(t, void 0);
      })(t)),
        (f = (function (t) {
          // if (n() === e.Web) return new u(t);
          // throw new Error("Unknown platform");
          return new u(t);
        })(o)),
        (w = (function (t) {
          // if (n() === e.Web) return new d(t);
          // throw new Error("Unknown platform");
          return new d(t);
        })(i)),
        p.addEventListener("message", async (e) => {
          if ("string" == typeof e.data) {
            const t = JSON.parse(e.data);
            try {
              await h.handleAction(t.action, t.data, p, r, w);
            } catch (e) {}
          } else
            e.data instanceof ArrayBuffer && (await w.pushAudioChunk(e.data));
        }),
        f.onFrame(async (e) => {
          (m(e, o.sampleRate), p.sendAudioChunk(e));
        }),
        f.onSpeechStart(async () => {
          await h.handleAction("client_speech_start", null, p, r, w);
        }),
        f.onSpeechEnd(async () => {
          await h.handleAction("client_speech_end", null, p, r, w);
        }),
        w.onChunkStarted(async (e) => {
          (C(e, i.sampleRate),
            await h.handleAction("client_audio_chunk_started", null, p, r, w));
        }),
        w.onChunkPlayed(async (e) => {
          await h.handleAction("client_audio_chunk_played", null, p, r, w);
        }),
        w.onAllChunksPlayed(async () => {
          await h.handleAction("client_audio_playback_finished", null, p, r, w);
        }),
        await f.open(),
        await w.open());
    },
    close: async () => {
      (await f.close(), await w.close(), p.close());
    },
    onStateChange: (e) => {
      r.onStateChange(e);
    },
    get state() {
      return r.state;
    },
    onInputAudioChunk: (e) => {
      m = e;
    },
    onOutputAudioChunk: (e) => {
      C = e;
    },
    onFullAudioChunk: (e) => {
      r.onFullAudioChunk(e);
    },
    get muted() {
      return f.muted;
    },
    set muted(e) {
      f.muted = e;
    },
    async changeVoice(e) {
      await h.handleAction("client_change_voice", { voiceName: e }, p, r, w);
    },
    async uploadFile(e, t = "./api/upload") {
      await h.handleAction(
        "client_upload_file",
        { file: e, endpoint: t },
        p,
        r,
        w,
      );
    },
  };
}
export { g as createSession };
