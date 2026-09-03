// Studio-Grade Intelligent Voice Processor, Multi-band Noise Suppressor, Voice Leveler & VAD

export class StudioVoiceProcessor {
  constructor(rawStream, options = {}) {
    this.rawStream = rawStream;
    this.sensitivity = options.sensitivity ?? 25; // 0 - 100
    this.inputGain = options.inputGain ?? 1.2; // 0.0 - 2.5 (1.2 = 120% default voice boost)
    this.krispEnabled = options.krispEnabled ?? true;
    this.onLevelChange = options.onLevelChange || (() => {});
    this.onSpeakingChange = options.onSpeakingChange || (() => {});

    this.isSpeaking = false;
    this.isGateOpen = false;
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

      // 1. Raw Microphone Media Stream Source
      this.source = this.audioContext.createMediaStreamSource(this.rawStream);

      // 2. High-pass filter (Cuts desk bumps, room rumble, air conditioning sub-bass < 85Hz)
      this.highPassFilter = this.audioContext.createBiquadFilter();
      this.highPassFilter.type = 'highpass';
      this.highPassFilter.frequency.setValueAtTime(85, this.audioContext.currentTime);
      this.highPassFilter.Q.setValueAtTime(0.7, this.audioContext.currentTime);

      // 3. Notch Filter at 60Hz / 120Hz power hum
      this.notchFilter = this.audioContext.createBiquadFilter();
      this.notchFilter.type = 'notch';
      this.notchFilter.frequency.setValueAtTime(60, this.audioContext.currentTime);
      this.notchFilter.Q.setValueAtTime(4.0, this.audioContext.currentTime);

      // 4. Low-pass filter (Cuts harsh high-frequency static hiss > 8500Hz)
      this.lowPassFilter = this.audioContext.createBiquadFilter();
      this.lowPassFilter.type = 'lowpass';
      this.lowPassFilter.frequency.setValueAtTime(8500, this.audioContext.currentTime);

      // 5. Intelligent Noise Gate Node
      this.gateNode = this.audioContext.createGain();
      this.gateNode.gain.setValueAtTime(1.0, this.audioContext.currentTime);

      // 6. Studio Dynamic Voice Leveler & Compressor (Elevates whispers & prevents clipping)
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-28, this.audioContext.currentTime); // Catches quiet voices
      this.compressor.knee.setValueAtTime(20, this.audioContext.currentTime);
      this.compressor.ratio.setValueAtTime(5, this.audioContext.currentTime); // Smooth compression
      this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime); // 3ms attack
      this.compressor.release.setValueAtTime(0.15, this.audioContext.currentTime); // 150ms release

      // 7. Master Input Gain Node (Configurable by user from 0% to 200%)
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.setValueAtTime(this.inputGain, this.audioContext.currentTime);

      // 8. Analyser for Real-time Signal, RMS & Speech Frequency Detection
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.2;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // 9. WebRTC Destination Stream
      this.destination = this.audioContext.createMediaStreamDestination();

      // Connect graph:
      // Source -> Highpass -> Notch -> Lowpass -> GateNode -> Compressor -> GainNode -> Destination
      //                                       \-> Analyser (for VAD calculation)
      this.source.connect(this.highPassFilter);
      this.highPassFilter.connect(this.notchFilter);
      this.notchFilter.connect(this.lowPassFilter);
      this.lowPassFilter.connect(this.analyser);
      this.lowPassFilter.connect(this.gateNode);
      this.gateNode.connect(this.compressor);
      this.compressor.connect(this.gainNode);
      this.gainNode.connect(this.destination);

      this.startProcessingLoop();
    } catch (err) {
      console.warn('[StudioVoiceProcessor] Audio graph initialization error:', err);
    }
  }

  startProcessingLoop() {
    const processFrame = () => {
      if (!this.analyser || !this.audioContext || this.audioContext.state === 'closed') return;

      this.analyser.getByteFrequencyData(this.dataArray);

      // Analyze energy specifically in human voice formant range (200Hz - 3500Hz)
      // Bin count = 128 (sampleRate 48kHz / 256 = ~187.5Hz per bin)
      const binCount = this.dataArray.length;
      let speechEnergySum = 0;
      let speechBins = 0;

      for (let i = 1; i < Math.min(24, binCount); i++) {
        speechEnergySum += this.dataArray[i];
        speechBins++;
      }

      const averageEnergy = speechBins > 0 ? (speechEnergySum / speechBins / 255) * 100 : 0;
      const currentLevel = Math.min(100, Math.round(averageEnergy * 2.4));

      // Calculate if current level passes user's sensitivity threshold
      const passesThreshold = currentLevel >= this.sensitivity;

      if (this.krispEnabled && this.gateNode && this.audioContext) {
        const now = this.audioContext.currentTime;

        if (passesThreshold) {
          if (this.holdTimer) {
            clearTimeout(this.holdTimer);
            this.holdTimer = null;
          }
          // Open gate quickly (3ms)
          this.gateNode.gain.setTargetAtTime(1.0, now, 0.003);
          this.isGateOpen = true;
        } else if (this.isGateOpen && !this.holdTimer) {
          // Hold open for 80ms before starting decay so word ends are never clipped
          this.holdTimer = setTimeout(() => {
            if (!this.audioContext || this.audioContext.state === 'closed') return;
            const targetTime = this.audioContext.currentTime;
            this.gateNode.gain.setTargetAtTime(0.0001, targetTime, 0.12);
            this.isGateOpen = false;
            this.holdTimer = null;
          }, 80);
        }
      } else if (this.gateNode && this.audioContext) {
        // Suppressor disabled: gate permanently open
        this.gateNode.gain.setTargetAtTime(1.0, this.audioContext.currentTime, 0.05);
        this.isGateOpen = true;
      }

      // Voice Activity Detection (VAD)
      if (passesThreshold && !this.isSpeaking) {
        this.isSpeaking = true;
        this.onSpeakingChange(true);
      } else if (!passesThreshold && this.isSpeaking) {
        if (!this.speakingTimer) {
          this.speakingTimer = setTimeout(() => {
            this.isSpeaking = false;
            this.onSpeakingChange(false);
            this.speakingTimer = null;
          }, 250);
        }
      } else if (passesThreshold && this.speakingTimer) {
        clearTimeout(this.speakingTimer);
        this.speakingTimer = null;
      }

      if (this.onLevelChange) {
        this.onLevelChange(currentLevel, this.isGateOpen);
      }
    };

    // Run processing loop at 25Hz (every 40ms)
    this.intervalId = setInterval(processFrame, 40);
  }

  setSensitivity(threshold) {
    this.sensitivity = Math.max(0, Math.min(100, Number(threshold)));
  }

  setInputGain(gain) {
    this.inputGain = Math.max(0, Math.min(2.5, Number(gain)));
    if (this.gainNode && this.audioContext && this.audioContext.state !== 'closed') {
      this.gainNode.gain.setTargetAtTime(this.inputGain, this.audioContext.currentTime, 0.05);
    }
  }

  setKrispEnabled(enabled) {
    this.krispEnabled = !!enabled;
    if (!this.krispEnabled && this.gateNode && this.audioContext) {
      this.gateNode.gain.setTargetAtTime(1.0, this.audioContext.currentTime, 0.02);
      this.isGateOpen = true;
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
