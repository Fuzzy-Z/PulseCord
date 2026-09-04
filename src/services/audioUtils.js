// Studio-Grade Intelligent Voice Processor, Noise Gate, Gain & VAD Engine

export class StudioVoiceProcessor {
  constructor(rawStream, options = {}) {
    this.rawStream = rawStream;
    this.sensitivity = options.sensitivity ?? 20; // 0 - 100 threshold
    this.inputGain = options.inputGain ?? 1.0; // 0.0 - 2.5 multiplier
    this.krispEnabled = options.krispEnabled ?? true;
    this.onLevelChange = options.onLevelChange || (() => {});
    this.onSpeakingChange = options.onSpeakingChange || (() => {});

    this.isSpeaking = false;
    this.isGateOpen = true;
    this.intervalId = null;
    this.speakingTimer = null;
    this.holdTimer = null;

    this.initAudioGraph();
  }

  initAudioGraph() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx({ latencyHint: 'interactive' });
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      // 1. Raw Microphone Stream Source
      this.source = this.audioContext.createMediaStreamSource(this.rawStream);

      // 2. High-pass filter (Cuts only ultra-low sub-rumble < 45Hz, preserves full rich voice bass)
      this.highPassFilter = this.audioContext.createBiquadFilter();
      this.highPassFilter.type = 'highpass';
      this.highPassFilter.frequency.setValueAtTime(45, this.audioContext.currentTime);
      this.highPassFilter.Q.setValueAtTime(0.7, this.audioContext.currentTime);

      // 3. Intelligent Noise Gate / Expander Node
      this.gateNode = this.audioContext.createGain();
      this.gateNode.gain.setValueAtTime(1.0, this.audioContext.currentTime);

      // 4. Subtle Studio Dynamics Compressor (Prevents microphone peaking / ear-rape while keeping voice natural)
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.audioContext.currentTime);
      this.compressor.knee.setValueAtTime(12, this.audioContext.currentTime);
      this.compressor.ratio.setValueAtTime(3, this.audioContext.currentTime);
      this.compressor.attack.setValueAtTime(0.005, this.audioContext.currentTime);
      this.compressor.release.setValueAtTime(0.1, this.audioContext.currentTime);

      // 5. Master Input Gain Node (Fully configurable from 0% = 0.0 mute to 200% = 2.0x boost)
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.setValueAtTime(this.inputGain, this.audioContext.currentTime);

      // 6. Analyser for Real-time RMS & Precision Voice Activity Detection
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.15;
      this.timeDataArray = new Uint8Array(this.analyser.fftSize);

      // 7. WebRTC Destination Stream
      this.destination = this.audioContext.createMediaStreamDestination();

      // Audio Graph Connection:
      // Source -> Highpass (45Hz) -> GateNode -> Compressor -> GainNode -> Destination
      //                                                                 \-> Analyser (for VAD calculation)
      this.source.connect(this.highPassFilter);
      this.highPassFilter.connect(this.gateNode);
      this.gateNode.connect(this.compressor);
      this.compressor.connect(this.gainNode);
      this.gainNode.connect(this.destination);

      // Connect source also to Analyser so level meter and VAD always see incoming mic signal
      this.highPassFilter.connect(this.analyser);

      this.startProcessingLoop();
    } catch (err) {
      console.warn('[StudioVoiceProcessor] Audio graph initialization error:', err);
    }
  }

  startProcessingLoop() {
    const processFrame = () => {
      if (!this.analyser || !this.audioContext || this.audioContext.state === 'closed') return;

      this.analyser.getByteTimeDomainData(this.timeDataArray);

      // 1. Calculate true RMS Signal Level in Decibels (dBFS)
      let sumSquares = 0;
      for (let i = 0; i < this.timeDataArray.length; i++) {
        const normalized = (this.timeDataArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / this.timeDataArray.length);
      const db = 20 * Math.log10(Math.max(rms, 0.0001)); // Range: -80dB to 0dB

      // Map dB to a responsive 0 - 100 display scale (-55dB silence -> 0, -10dB loud -> 100)
      const currentLevel = Math.max(0, Math.min(100, Math.round(((db + 55) / 45) * 100)));

      // 2. Check if signal level passes user's sensitivity threshold
      // When sensitivity is 0, gate is ALWAYS open.
      const passesThreshold = this.sensitivity === 0 || currentLevel >= this.sensitivity;

      const now = this.audioContext.currentTime;

      // 3. Noise Gate & Krisp Noise Filter Control
      if (this.krispEnabled && this.sensitivity > 0 && this.gateNode) {
        if (passesThreshold) {
          if (this.holdTimer) {
            clearTimeout(this.holdTimer);
            this.holdTimer = null;
          }
          // Open gate quickly and smoothly (6ms)
          this.gateNode.gain.setTargetAtTime(1.0, now, 0.006);
          this.isGateOpen = true;
        } else if (this.isGateOpen && !this.holdTimer) {
          // Hold gate open for 250ms so word endings and quiet syllables aren't chopped
          this.holdTimer = setTimeout(() => {
            if (!this.audioContext || this.audioContext.state === 'closed') return;
            const targetTime = this.audioContext.currentTime;
            // Smooth natural decay to near-silence (-60dB)
            this.gateNode.gain.setTargetAtTime(0.001, targetTime, 0.08);
            this.isGateOpen = false;
            this.holdTimer = null;
          }, 250);
        }
      } else if (this.gateNode) {
        // Suppressor / Gate disabled: keep gate fully open (1.0)
        this.gateNode.gain.setTargetAtTime(1.0, now, 0.02);
        this.isGateOpen = true;
      }

      // 4. Voice Activity Detection (Speaking state for UI indicator & socket)
      if (passesThreshold && !this.isSpeaking) {
        this.isSpeaking = true;
        this.onSpeakingChange(true);
      } else if (!passesThreshold && this.isSpeaking) {
        if (!this.speakingTimer) {
          this.speakingTimer = setTimeout(() => {
            this.isSpeaking = false;
            this.onSpeakingChange(false);
            this.speakingTimer = null;
          }, 300);
        }
      } else if (passesThreshold && this.speakingTimer) {
        clearTimeout(this.speakingTimer);
        this.speakingTimer = null;
      }

      if (this.onLevelChange) {
        this.onLevelChange(currentLevel, this.isGateOpen);
      }
    };

    // Run processing loop at 30Hz (~33ms)
    this.intervalId = setInterval(processFrame, 33);
  }

  setSensitivity(threshold) {
    this.sensitivity = Math.max(0, Math.min(100, Number(threshold)));
  }

  setInputGain(gain) {
    this.inputGain = Math.max(0, Math.min(2.5, Number(gain)));
    if (this.gainNode && this.audioContext && this.audioContext.state !== 'closed') {
      const now = this.audioContext.currentTime;
      // Immediate precision gain adjustment
      this.gainNode.gain.setValueAtTime(this.inputGain, now);
    }
  }

  setKrispEnabled(enabled) {
    this.krispEnabled = !!enabled;
    if (!this.krispEnabled && this.gateNode && this.audioContext) {
      this.gateNode.gain.setValueAtTime(1.0, this.audioContext.currentTime);
      this.isGateOpen = true;
    }
  }

  enableMonitoring(enabled) {
    if (!this.audioContext || !this.gainNode) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    try {
      if (enabled) {
        this.gainNode.connect(this.audioContext.destination);
      } else {
        this.gainNode.disconnect(this.audioContext.destination);
      }
    } catch (e) {}
  }

  setSinkId(sinkId) {
    if (this.audioContext && typeof this.audioContext.setSinkId === 'function') {
      this.audioContext.setSinkId(sinkId || '').catch(() => {});
    }
  }

  getProcessedStream() {
    return this.destination ? this.destination.stream : this.rawStream;
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.speakingTimer) {
      clearTimeout(this.speakingTimer);
      this.speakingTimer = null;
    }
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
  }
}

// Backward compatibility alias
export const KrispAudioProcessor = StudioVoiceProcessor;
export const VoiceDetector = StudioVoiceProcessor;

// Screen Sharing Audio Processor (Echo cancellation and voice isolation for desktop/game audio)
export class CleanScreenAudioProcessor {
  constructor(screenStream, getRemoteStreamsFn) {
    this.rawStream = screenStream;
    this.getRemoteStreams = getRemoteStreamsFn || (() => ({}));
    this.audioContext = null;
    this.destination = null;
    this.source = null;
    this.voiceFilter = null;
    this.compressor = null;

    this.initAudioGraph();
  }

  initAudioGraph() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      const audioTracks = this.rawStream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const audioOnlyStream = new MediaStream([audioTracks[0]]);
      this.source = this.audioContext.createMediaStreamSource(audioOnlyStream);

      // Studio dynamics compressor for punchy, clean game audio
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-20, this.audioContext.currentTime);
      this.compressor.knee.setValueAtTime(25, this.audioContext.currentTime);
      this.compressor.ratio.setValueAtTime(6, this.audioContext.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
      this.compressor.release.setValueAtTime(0.2, this.audioContext.currentTime);

      this.voiceFilter = this.audioContext.createBiquadFilter();
      this.voiceFilter.type = 'peaking';
      this.voiceFilter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
      this.voiceFilter.Q.setValueAtTime(0.6, this.audioContext.currentTime);
      this.voiceFilter.gain.setValueAtTime(0, this.audioContext.currentTime);

      this.destination = this.audioContext.createMediaStreamDestination();

      this.source.connect(this.voiceFilter);
      this.voiceFilter.connect(this.compressor);
      this.compressor.connect(this.destination);

      this.startCancellationLoop();
    } catch (err) {
      console.warn('[CleanScreenAudio] Init error:', err);
    }
  }

  startCancellationLoop() {
    const process = () => {
      if (!this.audioContext || this.audioContext.state === 'closed') return;

      try {
        const remoteStreams = this.getRemoteStreams();
        let anyRemoteVoiceActive = false;

        if (remoteStreams && typeof remoteStreams === 'object') {
          for (const key of Object.keys(remoteStreams)) {
            const entry = remoteStreams[key];
            if (entry && entry.audioStream && entry.audioStream.active) {
              const tracks = entry.audioStream.getAudioTracks();
              if (tracks.some((t) => t.enabled && t.readyState === 'live')) {
                anyRemoteVoiceActive = true;
                break;
              }
            }
          }
        }

        const now = this.audioContext.currentTime;
        if (anyRemoteVoiceActive && this.voiceFilter) {
          this.voiceFilter.gain.setTargetAtTime(-15, now, 0.05);
        } else if (this.voiceFilter) {
          this.voiceFilter.gain.setTargetAtTime(0, now, 0.1);
        }
      } catch (e) {}
    };

    this.intervalId = setInterval(process, 200);
  }

  getCleanStream() {
    if (this.destination && this.destination.stream) {
      const cleanAudioTrack = this.destination.stream.getAudioTracks()[0];
      if (cleanAudioTrack) {
        const videoTracks = this.rawStream.getVideoTracks();
        return new MediaStream([...videoTracks, cleanAudioTrack]);
      }
    }
    return this.rawStream;
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
  }
}

// Native Hardware-Level Windows WASAPI Process-Filtered Screen Audio Engine
export class NativeLoopbackAudioProcessor {
  constructor(options = {}) {
    this.audioContext = null;
    this.destination = null;
    this.scriptNode = null;
    this.compressor = null;
    this.gainNode = null;
    this.unsubAudioChunks = null;
    
    // Sample Queue / Ring Buffer for 48kHz stereo float audio
    this.sampleQueue = [];
    this.maxQueueSamples = 48000 * 2; // 1 second buffer ceiling
    this.isStarted = false;

    this.initAudioGraph();
  }

  initAudioGraph() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx({ sampleRate: 48000, latencyHint: 'interactive' });
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      // Script processor with 4096 frames (85ms buffer at 48kHz)
      // 0 input channels, 2 output channels (Stereo)
      this.scriptNode = this.audioContext.createScriptProcessor(4096, 0, 2);

      this.scriptNode.onaudioprocess = (event) => {
        const outL = event.outputBuffer.getChannelData(0);
        const outR = event.outputBuffer.getChannelData(1);
        const frameCount = event.outputBuffer.length;

        for (let i = 0; i < frameCount; i++) {
          if (this.sampleQueue.length >= 2) {
            outL[i] = this.sampleQueue.shift();
            outR[i] = this.sampleQueue.shift();
          } else {
            outL[i] = 0;
            outR[i] = 0;
          }
        }
      };

      // Studio Compressor for broadcast quality audio
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.audioContext.currentTime);
      this.compressor.knee.setValueAtTime(20, this.audioContext.currentTime);
      this.compressor.ratio.setValueAtTime(4, this.audioContext.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.audioContext.currentTime);

      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.setValueAtTime(1.0, this.audioContext.currentTime);

      this.destination = this.audioContext.createMediaStreamDestination();

      this.scriptNode.connect(this.compressor);
      this.compressor.connect(this.gainNode);
      this.gainNode.connect(this.destination);

      // Listen for raw PCM 32-bit float audio chunks from native named pipe
      if (window.electronAPI?.onNativeAudioChunk) {
        this.unsubAudioChunks = window.electronAPI.onNativeAudioChunk((rawChunk) => {
          this.handleIncomingChunk(rawChunk);
        });
      }

      this.isStarted = true;
      console.log('[NativeLoopbackAudioProcessor] Native WASAPI clean audio pipeline online.');
    } catch (err) {
      console.error('[NativeLoopbackAudioProcessor] Initialization failed:', err);
    }
  }

  handleIncomingChunk(rawChunk) {
    if (!rawChunk) return;
    try {
      let floatArray;
      if (rawChunk instanceof ArrayBuffer) {
        floatArray = new Float32Array(rawChunk);
      } else if (rawChunk.buffer instanceof ArrayBuffer) {
        floatArray = new Float32Array(rawChunk.buffer, rawChunk.byteOffset, rawChunk.byteLength / 4);
      } else if (Array.isArray(rawChunk)) {
        floatArray = new Float32Array(rawChunk);
      }

      if (!floatArray || floatArray.length === 0) return;

      // Prevent buffer bloat if tab gets throttled or delayed
      if (this.sampleQueue.length > this.maxQueueSamples) {
        this.sampleQueue.splice(0, this.sampleQueue.length - 24000);
      }

      for (let i = 0; i < floatArray.length; i++) {
        this.sampleQueue.push(floatArray[i]);
      }
    } catch (e) {
      console.warn('[NativeLoopbackAudioProcessor] Chunk push error:', e);
    }
  }

  getAudioTrack() {
    if (this.destination && this.destination.stream) {
      return this.destination.stream.getAudioTracks()[0] || null;
    }
    return null;
  }

  stop() {
    this.isStarted = false;
    if (this.unsubAudioChunks) {
      this.unsubAudioChunks();
      this.unsubAudioChunks = null;
    }
    if (this.scriptNode) {
      try {
        this.scriptNode.disconnect();
      } catch (e) {}
      this.scriptNode = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close().catch(() => {});
      } catch (e) {}
    }
    this.sampleQueue = [];
    console.log('[NativeLoopbackAudioProcessor] Disposed.');
  }
}

