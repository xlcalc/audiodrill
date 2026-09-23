class SilenceDetector extends AudioWorkletProcessor {
  constructor() {
    super();

    this.threshold = 0.015;
    this.minSilence = 700;

    this.silenceFrames = 0;
    this.isSilent = false;

    this.port.onmessage = ({ data }) => {
      if (data.type === "configure") {
        this.threshold = data.threshold;
        this.minSilence = data.minSilence;
      }

      if (data.type === "reset") {
        this.silenceFrames = 0;
        this.isSilent = false;
      }
    }
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input?.[0]) {
      return true;
    }

    // Pass audio through.
    for (let channel = 0; channel < output.length; channel++) {
      const source = input[channel] || input[0];
      output[channel].set(source);
    }

    // Analyze first channel.
    const samples = input[0];

    let sum = 0;

    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }

    const rms = Math.sqrt(sum / samples.length);
    const silent = rms < this.threshold;

    if (silent) {
      this.silenceFrames += samples.length;

      const duration =
        this.silenceFrames / sampleRate * 1000;

      if (
        !this.isSilent &&
        duration >= this.minSilence
      ) {
        this.isSilent = true;

        this.port.postMessage({
          type: "silence",
          duration
        });
      }
    } else {
      if (this.isSilent || this.silenceFrames > 0) {
        this.port.postMessage({
          type: "sound"
        });
      }

      this.silenceFrames = 0;
      this.isSilent = false;
    }

    return true;
  }
}

registerProcessor("silence-detector", SilenceDetector);
