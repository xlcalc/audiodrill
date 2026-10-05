class SilenceDetector extends AudioWorkletProcessor {
  constructor() {
    super();

    this.par = {
      squaredThreshold: 0.000225,
      minSilence: 0.7,
      pbr: 1,
    }

    this.reset();

    this.port.onmessage = ({ data }) => {
      if (data.type === "configure") {
        this.par = {...this.par, ...data.par};

        this.par.skipAnalysis = this.par.skipAnalysis || this.par.infiniteLoop;
		if (data.par.threshold) this.par.squaredThreshold = data.par.threshold * data.par.threshold;
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
//console.log('Reported playing?', flag);
//console.log('PBR', this.par.pbr);
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input?.[0]) return true;

    // Always pass audio through
    for (let channel = 0; channel < output.length; channel++) {
      const source = input[channel] || input[0];
      output[channel].set(source);
    }

    if (this.par.skipAnalysis) return true;

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
      const duration = this.silenceFrames / sampleRate * this.par.pbr;

      if (
        duration >= this.par.minSilence &&
        this.canReportLow
      ) this.reportSound(false);
    }

    return true;
  }
}

registerProcessor("silence-detector", SilenceDetector);
