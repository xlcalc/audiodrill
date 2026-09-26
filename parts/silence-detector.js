class SilenceDetector extends AudioWorkletProcessor {
  constructor() {
    super();

    this.par = {
//      threshold: 0.015,
      squaredThreshold: 0.000225,
      minSilence: 700,
      disabled: false
    }

    this.reset();

    this.port.onmessage = ({ data }) => {
      if (data.type === "configure") {
        this.par = {...this.par, ...data.par};
		if (data.par.threshold) this.par.squaredThreshold = data.par.threshold * data.par.threshold;
        if (this.par.disabled) this.reset();
      }

      if (data.type === "reset") this.reset();
    }
  }
  
  reset() {
    this.silenceFrames = 0;
    this.canReportLow = true;
    this.canReportHigh = true;
  }

  reportSound(flag) {
    this.port.postMessage({ soundDetected: flag });

    this.canReportLow = flag;
    this.canReportHigh = !flag;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input?.[0]) return true;

    // Always pass audio through
    for (let channel = 0; channel < output.length; channel++) {
      const source = input[channel] || input[0];
      output[channel].set(source);
    }

    if (this.par.disabled) return true;

    // Analyze first channel
    const samples = input[0];
    let sum = 0;

    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }

    const isHigh = sum > this.par.squaredThreshold * samples.length;
    if (isHigh) {
      this.silenceFrames = 0;
      if (this.canReportHigh) this.reportSound(true);
    } else {
    // silence detected
      this.silenceFrames += samples.length;
      const duration = this.silenceFrames / sampleRate * 1000;

      if (
        duration >= this.par.minSilence &&
        this.canReportLow
      ) this.reportSound(false);
    }

    return true;
  }
}

registerProcessor("silence-detector", SilenceDetector);
