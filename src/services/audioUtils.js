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

      if (this.krispEnabled) {
        // Noise Gate Logic: Fast attack, smooth decay
        const targetGateGain = passesThreshold ? 1.0 : 0.0;
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
      } else {
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

      // Notify level meter
      this.onLevelChange(currentLevel, this.isGateOpen);

      this.animationFrameId = requestAnimationFrame(processFrame);
    };

    processFrame();
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
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
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
