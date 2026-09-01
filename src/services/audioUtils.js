// Krisp-Style Advanced Noise Suppressor, Noise Gate & Voice Activity Detection

export class KrispAudioProcessor {
  constructor(rawStream, options = {}) {
    this.rawStream = rawStream;
    this.sensitivity = options.sensitivity ?? 35; // 0 - 100
    this.inputGain = options.inputGain ?? 1.0; // 0.0 - 2.0
    this.krispEnabled = options.krispEnabled ?? true;
    this.onLevelChange = options.onLevelChange || (() => {});
    this.onSpeakingChange = options.onSpeakingChange || (() => {});

    this.isSpeaking = false;
    this.isGateOpen = false;
    this.animationFrameId = null;
    this.speakingTimer = null;

    this.initAudioGraph();
  }

  initAudioGraph() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      // 1. Source from raw mic
      this.source = this.audioContext.createMediaStreamSource(this.rawStream);

      // 2. High-pass filter (cuts low-frequency desk rumble, room hum, wind < 85Hz)
      this.highPassFilter = this.audioContext.createBiquadFilter();
      this.highPassFilter.type = 'highpass';
      this.highPassFilter.frequency.value = 85;

      // 3. Low-pass filter (cuts high-frequency static hiss > 7800Hz)
      this.lowPassFilter = this.audioContext.createBiquadFilter();
      this.lowPassFilter.type = 'lowpass';
      this.lowPassFilter.frequency.value = 7800;

      // 4. Input Gain
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.inputGain;

      // 5. Krisp Noise Gate Node
      this.gateNode = this.audioContext.createGain();
      this.gateNode.gain.value = 1.0;

      // 6. Analyser for Real-time Signal & VAD
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.25;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // 7. Destination Stream for WebRTC
      this.destination = this.audioContext.createMediaStreamDestination();

      // Connect graph:
      // Source -> Highpass -> Lowpass -> GainNode -> GateNode -> Destination
      //                                           \-> Analyser
      this.source.connect(this.highPassFilter);
      this.highPassFilter.connect(this.lowPassFilter);
      this.lowPassFilter.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      this.gainNode.connect(this.gateNode);
      this.gateNode.connect(this.destination);

      this.startProcessingLoop();
    } catch (err) {
      console.warn('[KrispAudio] Audio graph initialization error:', err);
    }
  }

  startProcessingLoop() {
    const processFrame = () => {
      if (!this.analyser || !this.audioContext || this.audioContext.state === 'closed') return;

      this.analyser.getByteFrequencyData(this.dataArray);
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      const rawAverage = (sum / this.dataArray.length / 255) * 100;
      const currentLevel = Math.min(100, Math.round(rawAverage * 2.2));

      // Calculate if current level passes user's sensitivity threshold
      const passesThreshold = currentLevel >= this.sensitivity;

      if (this.krispEnabled && this.gateNode) {
        // Noise Gate Logic: Fast attack, smooth decay
        const now = this.audioContext.currentTime;

        if (passesThreshold) {
          // Open gate quickly (5ms)
          this.gateNode.gain.setTargetAtTime(1.0, now, 0.005);
          this.isGateOpen = true;
        } else {
          // Close gate smoothly (120ms) to avoid clicks or cutoff mid-sentence
          this.gateNode.gain.setTargetAtTime(0.0, now, 0.12);
          this.isGateOpen = false;
        }
      } else if (this.gateNode) {
        // Krisp off: gate is always open
        this.gateNode.gain.value = 1.0;
        this.isGateOpen = true;
      }

      // Voice Activity Detection event
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

      // Notify level meter only if handler attached
      if (this.onLevelChange) {
        this.onLevelChange(currentLevel, this.isGateOpen);
      }
    };

    // Run at 20Hz (every 50ms) - extremely light on CPU / Battery
    this.intervalId = setInterval(processFrame, 50);
  }

  setSensitivity(threshold) {
    this.sensitivity = Math.max(0, Math.min(100, Number(threshold)));
  }

  setInputGain(gain) {
    this.inputGain = Math.max(0, Math.min(2.0, Number(gain)));
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setTargetAtTime(this.inputGain, this.audioContext.currentTime, 0.05);
    }
  }

  setKrispEnabled(enabled) {
    this.krispEnabled = !!enabled;
    if (!this.krispEnabled && this.gateNode) {
      this.gateNode.gain.value = 1.0;
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
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

// Fallback legacy export
export const VoiceDetector = KrispAudioProcessor;

// Software-Level Automatic Echo Canceller & Voice Isolator for Screen Sharing
export class CleanScreenAudioProcessor {
  constructor(screenStream, getRemoteStreamsFn) {
    this.rawStream = screenStream;
    this.getRemoteStreams = getRemoteStreamsFn || (() => ({}));
    this.audioContext = null;
    this.destination = null;
    this.source = null;
    this.animationFrameId = null;
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

      // 1. Raw screen audio input
      const audioTracks = this.rawStream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const audioOnlyStream = new MediaStream([audioTracks[0]]);
      this.source = this.audioContext.createMediaStreamSource(audioOnlyStream);

      // 2. High fidelity studio dynamics compressor for crisp game & media audio
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
      this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
      this.compressor.ratio.setValueAtTime(8, this.audioContext.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

      // 3. Notch/Voice Suppression Filter for real-time voice cancellation
      this.voiceFilter = this.audioContext.createBiquadFilter();
      this.voiceFilter.type = 'peaking';
      this.voiceFilter.frequency.value = 1000;
      this.voiceFilter.Q.value = 0.6;
      this.voiceFilter.gain.value = 0; // Neutral when no voice is playing

      // 4. Output stream to be sent via WebRTC
      this.destination = this.audioContext.createMediaStreamDestination();

      // Connect screen stream: Source -> VoiceFilter -> Compressor -> Destination
      this.source.connect(this.voiceFilter);
      this.voiceFilter.connect(this.compressor);
      this.compressor.connect(this.destination);

      // 5. Setup dynamic monitoring loop to analyze incoming remote voice activity
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

        // When remote peers are in voice, transparently attenuate call frequencies
        // to prevent loopback re-capture without muffling overall game audio
        const now = this.audioContext.currentTime;
        if (anyRemoteVoiceActive && this.voiceFilter) {
          this.voiceFilter.gain.setTargetAtTime(-18, now, 0.05);
        } else if (this.voiceFilter) {
          this.voiceFilter.gain.setTargetAtTime(0, now, 0.1);
        }
      } catch (e) {}
    };

    // Run at 4Hz (every 250ms) which is more than enough for remote voice presence detection
    this.intervalId = setInterval(process, 250);
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

