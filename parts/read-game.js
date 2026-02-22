const playReadText = async inputText => {
  audioRecorder.cmd('REC_STOP_AND_LOCK');
  const transcript = renderStr(inputText);
  ttsGame.transcript = transcript;
console.log('transcript: ', transcript);
  let command = getKeyByValue(transcript);

  if (getCurrentChunkTxt() && command)  // check if text chunk would result in the same command
    if (transcript === currentChunkReadableTxt())  command = '';
  
  switch(command) {
    case "SHADOW_READ": case 'TTS_READ': case 'TTS_DICTATE': prepTTSRead(command);
    break;

//    case "SHADOW_READ": prepShadowReading();
//    break;

    case "START": initReadText();
    break;

    case "HELP":
        const speakPhrase = "You can ask to repeat, go back or restart. To exit, say 'game over'.";
        speak(speakPhrase);
    break;

    case 'RESTART': restartReadText();
    break;

    case 'REPEAT': readCurrentChunk();
    break;

    case "GO_BACK": previousChunk();
    break;

    case 'USER_LEADS': 
      ttsGame.userLeads = 1;
      speak('OK. You read first.');
      selectChunk(getCurrentChunk());
    break;

    case 'USER_FOLLOWS': 
      ttsGame.userLeads = 0; 
      speak('OK.');
      selectChunk(getCurrentChunk());
      repeatOrNext();
    break;

    case "EXIT":
      markChunk(ttsGame.taskNumber);
      sayFinalThanks();

      playIsOn = false; playName = '';
      audioRecBoxShow(false);
    break;

    default:
      if (checkVoiceInput(transcript) < 1) { // no voice search
//console.log('Audio recorder state', audioRecorder.getState());
//console.log('PlayOnce()');
        await audioRecorder.playOnce(); 
// in the future, playOnce may be (also?) called after speech recognition has stopped?
      }
      repeatOrNext();
  }
  audioRecorder.cmd('REC_DISCARD');
} // end of playReadText game dispatcher

const initReadText = () => {
  playIsOn = true;
  recognition.allowed = false;
  gstore.autoStartVideo = 0;
//  setRecSwitch(false);
  restartReadText();
}

const collectChunks = () => {
  ttsGame.chunks = ta.getElementsByClassName('ta-line');
}

const restartReadText = () => {
  collectChunks();
  informReadResult('good');
  ttsGame.taskNumber = -1;
  nextChunkSelect();
  if (ttsGame.userLeads) speak('You read first.');
  else repeatOrNext();
}

const getCurrentChunk = () => ttsGame.taskNumber;

const setCurrentChunk = n => {
// Does not work in TTS_READ mode: ttsGame.chunkIndex is not set
  const max = ttsGame.chunks.length - 1;
  const k = n < 0 ? 0 : n > max ? max : n;
  ttsGame.taskNumber = k;
  ttsGame.replayCount = 0;
  ttsGame.readText = ttsGame.chunks[k].getAttribute('say');
  return k;
}

const getCurrentChunkTxt = () => ttsGame.readText;

const currentChunkReadableTxt = () => renderStr(getCurrentChunkTxt());

const markChunk = n => {
// unmark chunks first
  for (const chunk of ttsGame.chunks) {
	if (isPageHeader('dictate')) chunk.nextElementSibling.classList.remove('mark-read');
	else chunk.classList.remove('mark-read');
  }

  if (n >= 0 && n < ttsGame.chunks.length) 
	if (isPageHeader('dictate')) {
      toggleEl(ttsGame.chunks[n].nextElementSibling, 'mark-read');
      ttsGame.chunks[n].nextElementSibling.focus();
	}
    else toggleEl(ttsGame.chunks[n], 'mark-read');
}

const selectChunk = n => {
  setCurrentChunk(n);
  markChunk(getCurrentChunk());
}

const readCurrentChunk = () => {
  if (getCurrentChunkTxt()) {
    speak(getCurrentChunkTxt(), false, speedCtrl.calcSpeed(ttsGame.replayCount));
    ttsGame.replayCount ++;
  }
}

const previousChunk = () => {
  const n = getCurrentChunk() - 1;
  if (n < 0) { restartReadText(); }
  else {
    selectChunk(n);
    if (currentChunkReadableTxt()) readCurrentChunk();
    else previousChunk(); // recursion
  }
}

const nextChunkSelect = () => {
  if (!ttsGame.chunks.length) return 0; // added 2024-10-07; might not be really needed
  const n = getCurrentChunk() + 1;
  if (n >= ttsGame.chunks.length) {
    speak('OK. Now you can say RESTART or ENOUGH.'); 
    return 0;
  } else {
    selectChunk(n);
    if (!currentChunkReadableTxt()) if (!nextChunkSelect()) return 0; // recursion
  }
  return 1;
}

const nextChunk = () => {
  if (nextChunkSelect()) readCurrentChunk();
}

const repeatOrNext = async () => {
  if (ttsGame.replayCount < getReplayNumber()) { 
    readCurrentChunk(); 
    await ttsFinish();
    if (ttsGame.userLeads && ttsGame.replayCount >= getReplayNumber()) nextChunkSelect();
  }
  else nextChunk();
}

const getKeyByValue = value => {
  const commands = {
    'TTS_READ':["prep_tts_reader"],
    'TTS_DICTATE':["prep_tts_dictate"],
    'SHADOW_READ':["prep_shadow_reading"],
    'START':["let's read together"], 
    'RESTART':["restart", "please restart", "restart reading"], 
    'REPEAT':["repeat", "please repeat", "sorry", "can you repeat", "can you repeat it"], 
    'GO_BACK':["go back", "read the previous sentence", "read the previous chunk"], 
    'USER_LEADS':["you read after me", "i'll read first", "i will read first"], 
    'USER_FOLLOWS':["you read first", "i'll read after you", "i will read after you"], 
    'HELP':['help', 'help me', "help me please", "please help"], 
    'EXIT':['enough', 'exit', 'game over'] 
  };
  return Object.keys(commands).find(key => commands[key].includes(value));
}

const fetchReading = async url => {
  ttsGame.loadStatus = 'loading';
  gstore.dirInfo = '';
  ttsGame.url = '';
  try {
      showSpinner('ta');
//      let txt = await fetchText(getNewURL(url));
      let txt = await fetchText(url);
      ttsGame.loadStatus = 'loaded';
	  ttsGame.url = url;
	  if (!txt) {
        ttsGame.loadStatus = 'error';
	    txt = loadErrorText;
// For some reason, tts doesn't work here.
//          ttsSpeakLang("Sorry, the text for reading can't be loaded. Please check its address and internet connection.", 'en-US');		  
		console.log('File loading error');		  
	  }
	  else fetchDirInfo();
	  
      showReadText(txt);  
  } catch (e) { 
      console.log(e);
      ttsGame.loadStatus = e;
      displayAlarmMessage(e.message);
  }
}

const loadNotesInURL = () => {
  let txt = getUrlKey('notes-enc');
  if (txt) { 
    txt = txt.replace(/ /g, '+'); 
//    gstore.notes.innerText = decodedText(txt);
//    gstore.notes.innerHTML = highlightText(decodedText(txt));
    loadElementWithText(txt, gstore.notes.id);
  }
}

const loadTextFromURL = () => {
  let txt = getUrlKey('read-enc');
  if (txt) { 
    txt = txt.replace(/ /g, '+'); 
    txt = decodedText(txt);
  } else {
    txt = getUrlKey('read') || '';
	txt = txt.replace(/\\n|\|/g, '\n'); // added 2024-08-17: handling new lines in url read key
  }
  showReadText(txt);
}

const loadReadText = () => {
  const url = getUrlKey('url');
  if (url) fetchReading(url);
  else loadTextFromURL();
}

const extractNotes = (s) => {
  if (!s) return '';
  const prefix = ':notes:';
  const search = new RegExp(prefix + '[\\s\\S]+', '');
  return s.replace(search, s => {
//    gstore.notes.innerText = s.slice(prefix.length);
//    gstore.notes.innerHTML = highlightText(s.slice(prefix.length));
    const prefixExt = new RegExp(prefix + '\\s+', '');
	const txt = s.replace(prefixExt, '');
    loadElementWithText(txt, gstore.notes.id);
	return '';
  });
}	

function showReadText(txt) {
  txt = extractNotes(txt);
  ta.text = txt || defaultReadTexts[getPageHeader()];
  addTranslationToHowto();
  renderTA(ta.text);
}

const prepTTSRead = cmd => {
  if (cmd === 'SHADOW_READ') {
	audioRecBoxShow(true);
//    hideElid('auto-video-div');
    ttsGame.userLeads = getUrlKey('user-leads') || 0;
	audioRecorder.cmd('KEEP_RECORDER');
  } else {
    audioRecBoxShow(false);
//    hideElid('mic', 'auto-video-div', 'rep-num-div', 'advanced-speed-box');
    hideElid('mic', 'rep-num-div', 'advanced-speed-box');
    showElid('tts-select2', 'split-div');
  }
  
  if (cmd === 'TTS_READ') {
    gstore.lastAction = 'PREP_TTS_READ';
    showElid('vocab-settings-box');
  }
  
  gstore.autoStartVideo = 0;
//  hideWidget();
  adjustSpeeds('1');

  const headers = {
	'SHADOW_READ': 'shadowRead',
	'TTS_READ': 'ttsRead',
	'TTS_DICTATE': 'dictate'
  }; 
  showHeaderAndHowTo(headers[cmd]);

  loadNotesInURL();
  loadReadText();
  collectChunks();
  
  if (cmd !== 'SHADOW_READ') {
    prepNavBox();
    prepTTSReadBtns(cmd);
    afterEditTTS(); // prepare to read
  }
}

const defaultReadTexts = {
  shadowRead: `[[*A text sample for shadow reading*]]
<<Once => O___>> <<upon => u___>> a time 
three little pigs lived with <<their>> mother 
in a small house.
The three little pigs <<grew => g___>> so big 
that the mother <<said => s___>> to them, 
'You are too big to <<live => l___>> here any longer. You must go and build houses for your<<selves>>. But <<take => t___>> care that the wolf does not catch you.'
`,
  ttsRead: `*A sample text to listen*
- So, how can I use this text-to-speech feature?
- If you paste and play a text here, you can teach or learn how to say it.
Another possible use is doing a voice-over for a video. Plus, you can explore any word by clicking on it, and it will be highlighted and added to the vocabulary. Or you can select a text chunk and work with it in the same way.
- How about its meaning? 
- You can type the meaning into the input field at the top of the info about the word/chunk. 
By the way, two words have already been added to the vocabulary, and students can learn them in different vocab modes they will find in the settings.
- Thanks. Is reading by chunks the only way to listen?
- If you want to read more than one chunk at a time, you can set the *Read* switch in the settings to read by sentences, paragraphs or to the end of the text.
- I see. How about dialogues? Can they be read using two different voices?
- Yeah, if the browser offers several voices for one language, you just need to set *Dialogue voice #2* in Advanced settings.
- Great, thanks.
:vocab:
chunk=a group of words
voice-over=words spoken by someone we cannot see in a film or video
`,
  dictate: `Dictation will help you develop your listening skill. 
It can also improve your memory and writing.
Just catch every word you hear and type in {pause} the whole sentence.
Isn't it fun?
`
};

const checkVoiceInput = transcript => {
  const getTTSText = () => {
    const n = ttsGame.taskNumber;
    return ttsGame.chunks[n].getAttribute('say');
  }
  
  const ref = renderStr(getTTSText());
  let res = -1;
  if (transcript === ref) {
console.log('Correct 😺');
    informReadResult('good');
    res = 0;
  } 
  else {
    if (voiceSearch(transcript)) { res = 1; }
    else {
console.log('Incorrect 😼');
      getTextError (transcript, [ref]);
      informReadResult('bad', ttsGame.errorHintNote);
    }
  }
console.log('reference', ref);
  return res;
}

const voiceSearch = transcript => {
  let n = ttsGame.taskNumber;
  if (n < 0) n = 0;
  if (voiceSearchChunk(transcript, n)) {
    selectChunk(n);
    return 1;
  } else {
    for (let i=0; i<ttsGame.chunks.length; i++) {
      if (voiceSearchChunk(transcript, i)) {
        selectChunk(i);
        return 2;
      }
    }
  }
  return 0;
}

const voiceSearchChunk = (transcript, n) => {
  const ref = renderStr(ttsGame.chunks[n].getAttribute('say'));
  return ref.includes(transcript);
}

const informReadResult = (result, note = '') => {
  const info = {'good': '😺', bad: '😼'};
  const controls = `<div style='clear:left; font-size:50%;line-height:1.3em;margin-top:-0.5em;'><br>
Use voice commands to control your practice:<br>
&#8226; help<br>
&#8226; restart<br>
&#8226; repeat<br>
&#8226; go back<br>
&#8226; game over<br><br>
To jump to another chunk, read a part of it. 
To change the reading order, say "I will read first" or "I will read after you". 
You can say "What does ... mean?" or click on a word to look it up. 
</div>
`

  const reaction = "<div style='float:left'>" + info[result] + '</div>';
  const addNote = `<div style='font-size:50%;line-height:1.2em;'>${note}</div>`;
//  displayInfo(reaction + addNote + controls, 300);
  const msg = '<div style="font-size: 200%; margin-top: 0; line-height:1.3em">' 
    + reaction + addNote + controls + '</div>';

  gstore.notes.innerHTML = msg;
  showNotes();
}

//const speakShadowReadBtn = () => '<span onclick="clickChunk(this)">' + speakBtn() + '</span>'
//const speakShadowReadBtn = () => '<span onclick="clickChunk(this)" style="color: gray; padding: 0 0.2em; cursor:pointer;font-size:50%; vertical-align: middle;">&#9655;</span>'
//const speakShadowReadBtn = () => '<span><span pos="before" onclick="clickShadowReadChunk(this)" class="tts-speak-alt btn-lighgray rnd small-playbtn-padding">&#9655;</span></span>'
//const speakShadowReadBtn = () => '<div class="inblock"><div class="inblock" pos="before" onclick="clickShadowReadChunk(this)" class="tts-speak-alt btn-lighgray rnd small-playbtn-padding">&#9655;</div></div>'
const speakShadowReadBtn = () => '<button class="cue-button font-75pc" ontouchstart="playTouchStart(this.firstChild)" onclick="clickShadowReadChunk(this.firstChild)"><span pos="before"  class="tts-speak-alt play-triangle"></span></button>'
/*
const  playTouchEnd = el => {
	handleReference('touched');
    el.classList.add('play-touch-end');
//	console.log('Added class play-touch-end');
}
*/
const  playTouchStart = el => {
  blinkElClass(el, 'play-touch-end', 0, 300);
//  el.classList.remove('play-touch-end');
//  await sleep(300);
//  el.classList.add('play-touch-end');
/*
  el.ontouchend = el => {
	handleReference('touched');
    el.classList.add('play-touch-end');
	console.log('Added class play-touch-end');
  }
*/
}

const clickShadowReadChunk = btn => {
//  playTouchStart(btn);
  const chunk = btn.parentElement.nextSibling;
  
  if (isPageHeader('shadowRead')) {
    const i = Array.prototype.indexOf.call(ttsGame.chunks, chunk);
    selectChunk(i);
    readCurrentChunk();
  } else clickTTSReading(btn); //read chunk without shadowing
  
  if (isPageHeader('dictate')) {
	const editField = chunk.nextElementSibling; // focus on editing field
    chunk.nextElementSibling.focus(); // focus on editing field
  }
}
//
//  === TTS Reading ===
//

const repeatTTSChunk = () => {
  if (ttsGame.chunkIndex > -1) ttsGame.chunkIndex --;
  readTTSChunks();
}

const clickTTSReading = btn => {
  ttsGame.chunkIndex = Math.max(0, getChunkIndex(btn)) - 1;
  readTTSChunks();
}

//var testTimeStart;
const readTTSChunks = async () => {
  restoreFocus();
  afterReadingStarted();
  let playedAtLeastOnce = 0;
//  if (tts.speaking) {
  if (tts.paused2) {
    tts.resume();
    tts.paused2 = false;
    playedAtLeastOnce = 1;
    await ttsFinish();
  }
  ttsGame.interruptTTSRead = 0;
  
// tts can be paused again above, so we need to check it again
    while (!tts.paused2) {
// checks BEFORE readNextChunkNoShadow()
      if (ttsGame.interruptTTSRead) { ttsGame.interruptTTSRead = 0; break; } // this flag is set by showRef()
      if (ttsGame.escPressed) { ttsGame.escPressed = 0; break; }
//      if (ta.splitBy === 'chunks' && playedAtLeastOnce) break;
      if (['chunks', 'sentences'].includes(ta.splitBy) && playedAtLeastOnce) break;
//testTimeStart = Date.now();
      await readNextChunkNoShadow();
      playedAtLeastOnce = 1;
	  gstore.lastAction = 'READ_TTS_CHUNK';

// checks AFTER readNextChunkNoShadow()
      if (ta.splitBy === 'para' && isEndOfParaOrText()) break;
      if (ttsGame.chunkIndex >= ttsGame.chunks.length - 1) break;
    } 
  afterReadingEnded();
}

const getChunkIndex = btn => {
  const chunk = getChunkNoShadow(btn);
  return [...ttsGame.chunks].indexOf(chunk);
}

const readNextChunkNoShadow = async () => {
// move to next chunk
  const chunk = ttsGame.chunks[toNextChunkIndex()];

// scroll ta if needed
  while (chunk.getBoundingClientRect().bottom > ta.getBoundingClientRect().bottom) {
    ta.scrollTop ++;
  }
  while (ta.scrollTop >= 1 && chunk.getBoundingClientRect().top - 50 < ta.getBoundingClientRect().top) { 
  // -50 is needed for dictation when ta-line is empty
		ta.scrollTop --;
  }

  markChunk(ttsGame.chunkIndex);
  const btn = getChunkBtn(chunk);
  btn.parentElement.focus(); // focus button tag
  speakLangText(btn); // read the chunk

// to speed up, buffer next chunk?
  await ttsFinish();
}

const toNextChunkIndex = () => {
  ttsGame.chunkIndex = (ttsGame.chunkIndex + 1) % ttsGame.chunks.length;
  return ttsGame.chunkIndex;
}

const getChunkBtn = chunk => chunk.previousSibling.firstChild;

const getChunkNoShadow = btn => btn.parentElement.nextSibling;

const isEndOfParaOrText = () => {
  const i= ttsGame.chunkIndex;
  if (i < 0) return 0;
  if (i >= ttsGame.chunks.length - 1) return 2;
  const chunk = ttsGame.chunks[i];
  if (chunk.innerHTML.endsWith('<hr>')) return 1;
  const nextEl = chunk.parentElement.nextSibling;
//console.log(nextEl);
  if (['X-BR', 'X-BR-L', 'BR'].includes(nextEl.tagName)) return 1;
  return 0;
}

const onSpecKeyClick = (event, el) => { // event is so far used in tasks to prevent blurring the input field
// this doesn't work in ta editing mode b/c selection is for the node inside ta, not the whole ta
  const targetEl = restoreFocus();
//console.log(targetEl.innerHTML);
  if (!targetEl) return;
  
  const sel = gstore.elOnblurSel;
//  const txt = sel.focusNode.data || '';
  const txt = sel.anchorNode.data || '';
  const offset1 = Math.min(sel.anchorOffset, sel.focusOffset);
  const offset2 = Math.max(sel.anchorOffset, sel.focusOffset);
  let specKey = el.textContent;
  if (gstore.shiftKey ^ gstore.capsLock) specKey = specKey.toUpperCase();
  const resText = txt.slice(0,offset1) + specKey + txt.slice(offset2)
  sel.anchorNode.textContent = resText;
// console.log('Source', txt, '  Res', resText);
  if (ta.contentEditable === 'true') {
    document.getSelection().collapse(sel.anchorNode, offset1 + 1); // set caret in editing mode	  
  }
  else {
//    targetEl.innerHTML = resText;
    dictUpdate(targetEl);
    targetEl.focus();
    document.getSelection().collapse(targetEl.firstChild, offset1 + 1); // set caret
  }
}

const prepTTSReadBtns = cmd => {
//  const divBoxPrefix = '<div id="tts-btn-box" style="border:0px dotted; width:90%; height:1.1em" class="inline-flex">';
  const divBoxPrefix = '<div id="tts-btn-box" style="border:0px dotted; width:90%" class="inline-flex justify-right">';
  const playPauseProps = 'class="inline-flex btn-darker" style="width:20%; height:100%; border-left:1px solid #ccc; border-right:1px solid #ccc"';

  const recBtn = (cmd === 'TTS_DICTATE')? uiblox.specKeys.boxHtml : `<div id="tts-rec-btn" class="inline-flex justify-left font-75pc" 
  style="width:75%; height:100%; border:0px solid gray;">
  <div id="tts-rec-start-stop" class="inline-flex btn-darker" 
  style="align-items: start; font-variant-caps: all-small-caps;"
  title="Start recording"  onclick="clickRecord()">
	[<div id="tts-rec-dot" style=" margin-top:-0.05em;">&#11044;
	</div>Rec]
  </div>
  <audio id="tts-rec-replay-audio" 
  class="hidden" style="height: 1.6em; border-radius: 1em;" controls controlslist="playback-rate" autoplay></audio>
</div>`;

  const leftBtn = (cmd === 'TTS_DICTATE')? uiblox.specKeys.boxHtml : recBtn;

  const playBtn = `<div id="tts-play-btn" title="Listen to the computer
Hot keys:
P - play next
R - repeat" onclick="clickPlay()" ${playPauseProps}>
<div class="btn-box flex flex-center" style="margin-left:0.2em">&#9654;</div>
</div>`;

  const pauseBtn = `<div id="tts-pause-btn" title="Pause" onclick="clickPause()" ${playPauseProps}>
<div class="btn-box flex flex-center"><div class="borders-vert"></div></div>
</div>`;

  const micBox = '<div id="mic-box" class="mic-box hidden"></div>';
  const btns = divBoxPrefix + leftBtn + playBtn + pauseBtn + micBox + '</div>';
//  elAddHTML(taBottom, btns);
  setElHTML('ta-bottom', btns);
  
  uiblox.specKeys.set('onclick');

  elid('mic-box').appendChild(mic);
  showEl(mic);

//  ta.classList.add('height-shrink');
}

const beforeEditTTS = () => {
//  hideElid('tts-play-btn', 'tts-pause-btn', 'tts-rec-btn', 'spec-keys');
  hideElid('tts-play-btn', 'tts-pause-btn', 'tts-rec-btn');
//  if (isPageHeader('ttsRead')) hideElid('tts-rec-btn');
  showElid('mic-box');
// audio recording is banned, only speech recognition can be used for editing
//  audioRecBoxShow(false);
//  elid('rec-switch').checked = false;
  setRecSwitch(0);
}

const afterEditTTS = () => {
  hideElid('mic-box', 'tts-pause-btn');
  showElid('tts-play-btn');
  if (isPageHeader('ttsRead')) showElid('tts-rec-btn');
  if (isPageHeader('dictate')) showElid('spec-keys');
  ttsGame.chunkIndex = -1;
  tts.paused2 = false;

// audio recording is allowed again
//  audioRecBoxShow(true);
//  elid('rec-switch').checked = true;
//  setRecSwitch(1);
  setRecSwitch('NO_CLICK_REC_SWITCH');
// old record (if any) is not discarded. May be changed in the future
}

const afterReadingStarted = () => {
  hideElid('tts-play-btn');
  if (!isEditMode()) showElid('tts-pause-btn');
}

const afterReadingEnded = () => {
  hideElid('tts-pause-btn');
  if (!isEditMode()) showElid('tts-play-btn');
}

const clickRecord = async () => { 
  el = elid('tts-rec-dot');

  if (audioRecorder.getState() === 'started') { // stop recording
    el.classList.remove('lightcoral');
    el.title = 'Start recording';
	audioRecorder.cmd('REC_STOP');
	const startTime = Date.now();
//	await audioRecorder.playOnce(); // add player to play several times?
    let recState;
    do { 
      await sleep(500);
      recState = audioRecorder.getState();
	
console.log('clickRecord recState:', recState);
    } while ((Date.now - startTime) < 6000 || recState !== 'recorded');
    if (recState === 'recorded') {
	  const a = elid('tts-rec-replay-audio');
	  a.src = audioRecorder.getRecSrc();
//	  a.title = 'Rec_' + new Date().toJSON().slice(0,19).replace(/:/g,'_').replace('T','__');
	  a.title = 'Rec_' + getDateTimeString();
//console.log('PBR support', a.controlsList.supports('playbackrate'));
      showEl(a);
	} else displayAlarmMessage('Recording has failed');
	
  } else { // start recording
      await testMic();
	await audioRecorder.cmd('REC_START_MIC_SCREEN');
    const res = audioRecorder.getState();
console.log('Recording status:', res);
    if (res === 'started') {
      el.classList.add('lightcoral'); 
	  hideElid('tts-rec-replay-audio');	
	  el.title = 'Stop recording';
	} else displayAlarmMessage('No audio tracks to record');
  }
}

const clickPlay = () => { 
  readTTSChunks() 
}

const clickPause = () => {
  tts.pause();
  tts.paused2 = true; // b/c tts.paused doesn't work in Chrome
  restoreFocus();
//  afterReadingEnded();
}

//
// === RECORDING ===
//
// see also https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API

const audioRecBoxShow = v => { 
  elid('rec-checkbox-div').style.display = v ? 'block' : 'none'; 
}


//
// === End of Recording ===
//

/*
  ** Bugs **
- reading the last chunk MAY trigger voice search 
(if it's first clicked by mouse), and this chunk is looped

- in dictation, clicking play btn at a line may resume paused speech for another line.
- ibid, hints on mouse hover don't work on mobile devices.

  ** Future plans **
- add congrats/cat reactions to dictation

- visualize audio: https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/

+- merge shadowing and tts-reading (done for prepTTSRead and prepShadowReading)

- Delays in reading chunk after chunk may be due to slow connection to the TTS server.
Bufferizing utterances for tts.speak(utterance) to make the pauses between 
chunks shorter doesn't make sence: The time from starting to pick the line till 
tts.speak(utterance)
is about 10ms. 

- Reading several chunks in a row could be done via utterance.onend fn that 
triggers fetching the next chunk from a chunk buffer - instead of polling flags
through await ttsFinish();

- add keyboard shortcuts to repeat repeat current (r) and read next (n) tts chunk

*/