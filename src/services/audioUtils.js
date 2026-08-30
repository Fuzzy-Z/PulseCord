export class VoiceDetector {
  constructor(stream, onSpeakingChange, threshold = 0.04) {
    this.stream = stream;
    this.onSpeakingChange = onSpeakingChange;
    this.threshold = threshold;
    this.isSpeaking = false;
    this.speakingTimer = null;
    this.animationFrameId = null;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.3;

      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.startListening();
    } catch (err) {
      console.warn('AudioContext VAD initialization error:', err);
    }
  }

  startListening() {
    const checkAudioLevel = () => {
      if (!this.analyser) return;

      this.analyser.getByteFrequencyData(this.dataArray);
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      const average = sum / this.dataArray.length / 255;

      const currentlySpeaking = average > this.threshold;

      if (currentlySpeaking && !this.isSpeaking) {
        this.isSpeaking = true;
        this.onSpeakingChange(true);
      } else if (!currentlySpeaking && this.isSpeaking) {
        if (!this.speakingTimer) {
          this.speakingTimer = setTimeout(() => {
            this.isSpeaking = false;
            this.onSpeakingChange(false);
            this.speakingTimer = null;
          }, 350);
        }
      } else if (currentlySpeaking && this.speakingTimer) {
        clearTimeout(this.speakingTimer);
        this.speakingTimer = null;
      }

      this.animationFrameId = requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
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
