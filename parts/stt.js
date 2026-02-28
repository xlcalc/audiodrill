// STT code is based on https://codepen.io/GeorgePark/pen/jpovrm

var recognition;

const loadSTT = (cmd) => {
//  window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if ('SpeechRecognition' in window) {recognition = new SpeechRecognition(); }
  else if ('webkitSpeechRecognition' in window) {recognition = new webkitSpeechRecognition(); }
  else {
console.log ('speech recognition API not supported');
//    recognition = 'STT not supported';
	recognition.supported = false;
    return 0;
  }
  recognition.supported = true;
  recognition.allowed = true;
  recognition.useAudioRecorder = cmd !== 'NO_AUDIO_RECORDER';
  recognition.onresult = e => handleSttResult(e.results[0][0].transcript);
  recognition.onend = e => {
console.log('ðŸ STT ended'); 
    recognition.isOn = false; 
    if (recognition.useAudioRecorder) audioRecorder.cmd('REC_STOP');

    startSTT(); // start new STT cycle
  }
  recognition.onstart = e => {recognition.isOn = true; console.log('ðŸš€ STT started');}
  return 1;
}

const mic = elid('mic') || document.createElement('div');
mic.isOff = true;
mic.init = () => {
//const initMic = () => {
  const micIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" viewBox="0 -2 24 24" onclick="toggleMic()">
  <path stroke="currentColor" fill="transparent" d="M6 12A6 6 0 0 0 18 12M12 18V21.5M15 6V12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12V6C9 4.34315 10.3431 3 12 3C13.6569 3 15 4.34315 15 6Z" />
  </svg>
`;
  mic.innerHTML = micIcon;
//  mic.isOff = true;
//  mic.setAttribute('onclick', 'toggleMic()');
}

mic.turnOn = () => {
  if (mic.isOff) toggleMic();
}

mic.turnOff = () => {
  if (!mic.isOff) toggleMic();
}

const toggleMic = async () => { // used in words/index and embed
  if (!recognition.supported) {
    sttCallback('STT_NOT_SUPPORTED');
    return;
  }
  if (mic.isOff) if (! await testMic()) return;

//  toggleEl(mic, 'mic-on'); // toggling can result in dissync between mic appearance and state
  setElClass(mic, 'mic-on', mic.isOff); // now mic appearance is defined by mic.isOff state
  mic.isOff = !mic.isOff;
  if (mic.isOff) {
    mic.title = 'Dictate words or phrases (Chrome or Edge only)';
    recognition.allowed = false;
    sttCallback('MIC_TURNED_OFF');
  } else {
    mic.title = 'Stop dictation';
    sttCallback('MIC_TURNED_ON');
  }
}

const sttAllowed = () => {
  if (!recognition.allowed) return false;
  if (recognition.useAudioRecorder && audioRecorder.startBanned()) {
console.log('audioRecorder startBanned');
	return false;
  }

  if (mic.isOff) console.log('mic.isOff');
  if (tts.pending) console.log('tts.pending');
  if (tts.speaking) console.log('tts.speaking');

  return !(mic.isOff || tts.pending || tts.speaking);
}

const restartSTT = () => { // used in audiodrill.js for words and embed page only
  recognition.allowed = true;
  if (!sttAllowed()) return; 
console.log('** Restart STT'); 

  if (recognition.isOn) { abortSTT() } //startSTT() will follow automatically via recognition.onend
  else { startSTT(); }
}

const abortSTT = async () => {
console.log('abortSTT started');  
  recognition.allowed = false; // a flag checked by handleSttResult fn
  mic.isOff = true; // added 2026-01-10
  
// Wait for the 'end' event instead of polling
  await new Promise(resolve => {
    const handleEnd = () => {
      recognition.removeEventListener('end', handleEnd);
      resolve();
    };
    recognition.addEventListener('end', handleEnd);
  });
  
  recognition.abort();
//  while (recognition.isOn) await sleep (100); // This busy-wait loop is inefficient. Consider using an event listener instead or Promise-based approach.
console.log('abortSTT complete');  
}

const startSTT = () => {
console.log('StartSTT entered'); 
  recognition.allowed = true;
  if (!sttAllowed()) {
console.log('StartSTT quits: STT not allowed'); 
    return;
  }

//  recognition.lang = tts.spVoice ? tts.spVoice.lang.replace('_', '-') : 'en-UK';
//  recognition.lang = getLangCode(); // introduced 2026-02-09
  recognition.lang = gstore.getContextLangCode(); // changed 2026-02-28
//  recognition.interimResults = true; // doesn't work well: it can stop after recognizing just a part of a word
console.log('Recognition of', recognition.lang, 'starts...'); 
//  setSTTLang(tts.spVoice);
  try { 
    recognition.start(); 
//    if (typeof audioRecorder !== 'undefined') audioRecorder.cmd('REC_START');
    if (recognition.useAudioRecorder) audioRecorder.cmd('REC_START');
  }
  catch (err){
console.log('StartSTT FAILED:', err); 
  }
}

const setSTTLang = ttsVoice => {
// Is this fn needed? It is only used in words\index.html, while task.html can do without it.
// recognition.lang is set in StartSTT anyway
  recognition.lang = (ttsVoice && ttsVoice.lang) ? ttsVoice.lang : 'en-UK';
console.log('Recognition of', recognition.lang); 
}

// experimental: 2026-01-10
const getNavigatorMicPermission = async () => {
  if (!navigator.permissions) return "Permissions API not supported in this browser.";

  try {
    const permission = await navigator.permissions.query({ name: "microphone" });
	return permission.state;
  } catch (err) {
    console.error(err);
    return "Unable to check microphone permission.";
  }
}
  
