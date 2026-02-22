// This TTS code is partly based on https://codepen.io/matt-west/pen/DpmMgE
// see also https://stackoverflow.com/questions/21513706/getting-the-list-of-voices-in-speechsynthesis-web-speech-api

const tts = window.speechSynthesis;
tts.init = function(par) {
  tts.getVoices(); // initialize voices in advance to work on mobile
  this.langSelector = par.langSelector;
//console.log('langSelector', par.langSelector);
  this.langNames = par.langNames;
  this.langCodes = par.langCodes;
// more parameters could be added in the future
}

tts.getFullLangName = (lang, voices) => {
  if (!voices) voices = tts.getVoices();
  const fullLangNames = {hi: 'Hindi', ja: 'Japanese', ko: 'Korean', zh: 'Chinese'};
  return fullLangNames[lang]
	|| voices
	  .find(v => v.lang.startsWith(lang))
	  ?.name.match(/(?:-\s*|Google\s*)(\S+)/)?.[1] // for Microsoft and Google voices
	|| '';
/*
// this alternative code will not run while the above is tested  
//console.log('tts.getFullLangName lang: ', lang);
  const voice = voices.find(v => v.lang.startsWith(lang)) || ''; // for some reason, voices.find can sometimes give undefined
//console.log('voice: ', voice);
  const voiceName = voice.name || '';
//console.log('voiceName: ', voiceName);
  return fullLangNames[lang]
	|| voiceName.match(/(?:-\s*|Google\s*)(\S+)/)?.[1] // for Microsoft and Google voices
	|| '';
*/
}

tts.isBusy = () => tts.pending || tts.speaking;

tts.getTTSLangs = () => {
  const rawArr = tts.getVoices() .map(s => s.lang .split(/_|-/)[0]);
  const res = [...new Set(rawArr)].sort(); // remove duplicates via Set

  if (!tts?.langCodes?.length) tts.langCodes = res; // for words page, langCodes are predefined and different from res
  return res;
}

const setVoiceByName = (voiceName, n='') => {
// Assigns tts.spVoice or tts.spVoice2 with voice
// Is called by handleVoiceSelect fn in audiodrill-task.js when user selects a voice from the list
  for (const voice of tts.getVoices()) {
    if (voice.name === voiceName
	&& voice.lang.startsWith(getLangCode())) {  // checked b/c in Safari different voices can have the same name
//      tts.spVoice = voice; 
      tts['spVoice' + n] = voice; 
console.log('*** tts.spVoice', n, ' = ', voice);
      break; 
    }
  }
}

const setLanguage = (lang, isShortLang) => {
  if (!lang) return;
  const previous = tts.langSelector.value;
  if (isShortLang) {
	tts.langSelector.value = lang.split(/_|-/)[0] || 'en'; 
	tts.langSelector.title = tts.getFullLangName(lang) || ''; 
  }
  else tts.langSelector.value = getLangName(lang) || 'English'; 
  if (previous !== tts.langSelector.value) listLangVoices();
}

const getLangName = lang => { //used only in tts.js
// tts.langNames is loaded from words page, but in tasks it's undefined and not used
  if (!lang || !tts.langNames) return; // changed 2023-11-11, further tests needed

  let l = lang.toLowerCase().split(/_|-/)[0];
  if (l.length === 2) l = tts.langNames[tts.langCodes.indexOf(l)];
  return tts.langNames.includes(l) ? l : null;
}

const getLangNameOrCode = () => getLangName(tts.langCode) || tts.langCode; //used in embed

const getLangCode = () => {
  let res = null;
  if (tts.langSelector) {
    if (tts.langSelector.selectedIndex >=0) res = tts.langCodes[tts.langSelector.selectedIndex];
	else res = tts.langCode;
  }
  
  return res;
}

function listLangVoices() {
//console.log('** listLangVoices called by', listLangVoices.caller);
  let langVoices = tts.getVoices();

  if (tts.langSelector) {
    const filterLangVoices = voice => {
      const langCode = voice.lang.split(/_|-/)[0]; // ...lang.substr(0, 2) doesn't work for 'fil' (Filipino) lang
      if (langCode === currentLang) return voice;
    }

    let currentLang = tts.langSelector.value;
    // Most lang codes have 2 chars as per ISO 639-1, like 'en'. 
    // But some lang codes are as per ISO 639-2, like 'fil' for Filipino. 
    // Hope, no lang code is longer than 3 letters.
    if (tts.langSelector.value.length > 3) currentLang = getLangCode(); // Get full lang name for words and phrases page. 

    if (currentLang) langVoices = langVoices
	   .filter(filterLangVoices) // filter by lang
     // now sort by lang and name
       .sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name));
  }
  
  ttsCallBack('TTS_GOT_LANG_VOICES', langVoices);
}

async function loadVoices() {
  await sleep(500); // things don't load immediately
  if (!tts.spVoice || !tts.spVoice.lang) listLangVoices();
}

tts.onvoiceschanged = e => {
// Chrome loads voices asynchronously.
// Edge fires this event after each tts.speak
  ttsCallBack('VOICES_CHANGED_EVENT');
  if (!tts.spVoice || !tts.spVoice.lang) loadVoices();
};

tts.voiceMatchesLang = (voice, lang) => (voice && lang)
  ? voice.lang.replace('_', '-') .startsWith(lang.replace('_', '-')) //lang can be with or w/o locale: e.g., en or en-US
  : null;

const getVoice = lang => {
  if (lang) {
	if (tts.voiceMatchesLang(tts.spVoice, lang)) return tts.spVoice;

    for (const voice of tts.getVoices())
      if (tts.voiceMatchesLang(voice, lang)) return voice;
  }
  return null;
}

const ttsSpeak = (voice, text, cmd, speed) => {
  if (!text) return;
  if (cmd === 'IGNORE_IF_BUSY' && tts.isBusy()) return;
// cancel any previous speechSynthesis to unfreeze it if stuck
  if (!cmd || cmd === 'DONT_WAIT') { tts.cancel(); 
console.log('TTS canceled in ttsSpeak');
  }
  const utterance = new SpeechSynthesisUtterance();
  utterance.text = text;
//  speed = speed || 1;
// speed can arrive as ''
  utterance.rate = (speed || 1) * speedCtrl.calcSpeed();
//console.log('TTS SPEED', speed);
  utterance.voice = voice || tts.spVoice || getVoice('en-US');
//  if (voice && voice.lang) utterance.lang = voice.lang.replace('_', '-'); // needed for Android, see https://talkrapp.com/speechSynthesis.html
//  if (voice && voice.lang) utterance.lang = voice.lang.split(/_|-/)[0]; // needed for MS Edge
  if (voice && voice.lang) utterance.lang = voice.lang; // added 2024-11-17 to work with mobile Chrome
  if (voice && voice.voiceURI) utterance.voiceURI = voice.voiceURI;  // added 2024-11-17 to work with mobile Chrome
//  utterance.default = false; // maybe it will help to fix changing voices?
// try reloading voices to fix spontaneous changing voices?
//  loadVoices();
//
console.log('TTS to say:', text);
//console.log('voice:', voice, 'tts.spVoice: ', tts.spVoice);

//console.log('Time to prepare TTS...', Date.now() - testTimeStart);
  if (utterance.text.toLowerCase() === 'tts debug')
    ttsCallBack('TTS_DEBUG', {
	  'voice.name': utterance.voice.name, 
	  'voice.lang': utterance.voice.lang, 
	  lang: utterance.lang,
	  voiceURI: utterance.voiceURI
	})
  else {
    tts.latestText = text;
	tts.latestLang = utterance.voice.lang;
  }
  
  if (utterance.voice) tts.speak(utterance);
  else ttsCallBack('NO_VOICE');

  
  utterance.onstart = (event) => {
//console.log(`TTS started after ${event.elapsedTime}ms`);
    ttsCallBack('TTS_STARTED');
  }

  utterance.onend = (event) => {
//console.log(`TTS ended after ${event.elapsedTime}ms`);
//    if (windows.afterTTSEnded) 
//		afterTTSEnded();
    ttsCallBack('TTS_ENDED');
  }

/*
utterance.onboundary = (event) => {
  console.log(`${event.name} boundary reached after ${event.elapsedTime}ms`);
}

  utterance.onpause = (event) => {
console.log(`TTS paused after ${event.elapsedTime}ms`);
  }

  utterance.onresume = (event) => {
console.log(`TTS resumed after ${event.elapsedTime}ms`);
  }

  utterance.onerror = (event) => {
console.log(`TTS ERROR ${event.error}`);
  }
*/
}

function speak(text = gstore.currentQuery || '', cmd, speed) {
  if (tts.spVoice) ttsSpeak(tts.spVoice, text, cmd, speed);
}

const ttsSpeakLang = (txt, lang, cmd = true) => {
  const voice = lang? getVoice(lang) : tts.spVoice;
  if (txt && voice) ttsSpeak(voice, txt, cmd);
}

const speakEl = (el, par) => {
  if (!par) par = '';
  let txt = par.txt;
  if (el) txt = txt || el.getAttribute('say') || el.textContent.replace(/\(.*?\)/g, ''); //previously el.innerText;
//  const spVoice = (el.getAttribute("dlg-speaker") === '2') ? tts.spVoice2 : tts.spVoice;
//  const voice = par.voice || spVoice; // this logic may be not perfect
  const voice = par.voice || tts.spVoice;
  ttsSpeak(voice, txt, 0, par.speed);
}

const speakLangText = (btn, pbr) => {
  const parent = btn.parentElement;
  let el = btn;
  if (!btn.getAttribute('say'))
     el = (btn.getAttribute('pos') === 'before')? parent.nextSibling : parent.previousSibling;
  const lang = btn.getAttribute('lang');
  const dlgSpeaker = el.getAttribute('dlg-speaker');
  const spVoice = (dlgSpeaker === '2') ? tts.spVoice2 : tts.spVoice;
  const obj = {};

  if (tts.manuallyPickedVoice) obj.voice = spVoice; // override cue settings in task page
  else obj.voice = getVoice(lang) || spVoice,
  
  obj.txt = btn.getAttribute('say');
  obj.speed = pbr || btn.getAttribute('speed');

  speakEl(el, obj);
}

const speakCurrent = lang => {
  ttsSpeakLang(gstore.currentQuery, lang, false);
}

const speakerHtml = (language, countries) => {
  let lang, str = '';
  for (const country of countries) {
    lang = language + '-' + country;
    if (getVoice(lang)) str += `<span class="tts-speak" title="${lang}" 
          onclick="speakCurrent('${lang}')">${country}&#x1f509&#xfe0e;</span>`;
  }
  return str;
}

const speakerButton = () => {
  const lang = getLangCode();
  const countries = {en:['GB','US','CA','AU','IE','IN'], es:['ES','US','AR','MX'],
          fr:['FR','CA'], pt:['PT','BR'], zh:['CN','TW','HK']};

  return countries[lang]? speakerHtml(lang, countries[lang])
      : '<span class="tts-speak" title="' + lang + '" onclick="speak()">&#x1f509&#xfe0e;</span>';
}

const ttsFinish = async () => {
  while ((tts.pending || tts.speaking) && !tts.paused2) {await sleep (100); console.log('playing TTS')}
}

/*
Flow:
listLangVoices is called by onvoiceschanged (via loadVoices), setLanguage, handleLangSelect (in index and task)
loadVoices is called by onvoiceschanged - just delayed listLangVoices 
setLanguage is called in index and task

  ** BUGS **
If tts is stuck while playing a very long line, tts.cancel() is needed to "revive" it.
It's used in ttsSpeak fn, but it still doesn't work if you click on 
the master play/pause btn to stop playing the stuck line. Is cmd flag on in this case?

*/
