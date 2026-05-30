
//  -------------------------
//   === Not used yet ===
/*
function makeDraggable(el) {
  let offsetX = 0, offsetY = 0, isDown = false;
  el.style.position = 'fixed';
  el.style.bottom = '';
// for xAudioBox, bottom = 0 should be commented out

  el.addEventListener('mousedown', (e) => {
    isDown = true;
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
    el.style.cursor = 'grabbing';
//	disableBodyScroll(document.body);
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    el.style.left = `${e.clientX - offsetX}px`;
    el.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener('mouseup', () => {
    isDown = false;
    el.style.cursor = 'default';
    document.body.style.userSelect = '';
  });
}
*/

// ***  Beep  ***
/* This fn may be needed later

const ctx = new AudioContext();

const playBeep = ({
  frequency = 880,
  duration = .4,
  attack = .1,
  release = .1,
  volume = .2,
  type = 'sine'
} = {}) => {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = frequency;

  const gain = ctx.createGain();
  osc.connect(gain); 
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  // Envelope
  gain.gain.setValueAtTime(0, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + attack);
  gain.gain.setValueAtTime(volume, now + duration - release);
  gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
  
  osc.start(now);
  osc.stop(now + duration);
}
*/
// ***   End Beep  ***
// --------------------------

/* ** test structures  **
const testfn = function() {
  let a = 0;
  return {
    add: v => a += v,
    ini: () => a = 0
  }
}();
*/
