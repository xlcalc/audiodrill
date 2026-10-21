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

		if (data.par.threshold) this.par.squaredThreshold = data.par.threshold * data.par.threshold;
      }

      if (["playing", "skipAnalysis", "canReportNoSignal"].includes(data.type))
        this[data.type] = data.par;

      if (data.type === "reset") this.reset();
      if (data.type === "consoleLog") this.consoleLog();
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
console.log(Date().split(' ')[4], 'soundDetected:', flag);
//console.log('PBR', this.par.pbr);
  }

/*
  reportNoSignalOld(samples) {
    if (!this.canReportNoSignal || this.hasSignal(samples)) return;
    this.canReportNoSignal = false;
console.warn('No signal');
    this.port.postMessage({ noSignal: true });
  }

  hasSignal(samples) {
    for (let i = 0; i < samples.length; i++) 
      if (samples[i]) return true;

    return false;
  }

  reportNoSignalOld2(sum) {
    if (sum) this.canReportNoSignal = true;
    if (!this.canReportNoSignal || sum) return false;

    this.port.postMessage({ noSignal: true });
    this.canReportNoSignal = false;
console.warn(Date().split(' ')[4], 'No signal');
    return true;
  }
*/

  reportNoSignal(sum) {
    if (this.canReportNoSignal && !sum) {
      this.canReportNoSignal = false;
      this.port.postMessage({ noSignal: true });
console.warn(Date().split(' ')[4], 'No signal');
      return true;
    }

    if (sum) this.canReportNoSignal = true;
    return false;
  }

  consoleLog() {
    console.log('canReportNoSignal', this.canReportNoSignal);
    console.log('skipAnalysis', this.skipAnalysis);
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

//    this.reportNoSignal(input[0]);
//    if (this.par.skipAnalysis) return true;
    if (!this.playing) return true;

    // Analyze first channel
    const samples = input[0];
    let sum = 0;

    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }

    if (this.reportNoSignal(sum) || this.skipAnalysis) return true;

    const highLevel = sum > this.par.squaredThreshold * samples.length;
    if (highLevel) {
      this.silenceFrames = 0;
      if (this.canReportHigh) this.reportSound(true);
    } 
    else {
      // silence detected
      this.silenceFrames += samples.length;
      const duration = this.silenceFrames / sampleRate * this.par.pbr;

      if (
        duration > this.par.minSilence &&
        this.canReportLow
      ) this.reportSound(false);
    }

    return true;
  }
}

registerProcessor("silence-detector", SilenceDetector);
