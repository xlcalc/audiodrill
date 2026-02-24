const players = {}, gstore = {notes:''};

const vbreakDiv = (h=0.5) => `<div style="height:${h}em;"></div>`;

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

const elid = id => document.getElementById(id);
const elids = (...ids) => ids.map(id => elid(id));

const qsel = s => document.querySelector(s);

const setElHTML = (id, txt) => elid(id).innerHTML = txt;

const elAddHTML = (e, txt, pos = "beforeend") => e.insertAdjacentHTML(pos, highlightText(txt));

const tasksPageActive = () => gstore.webPageName === 'TASKS';
const wordsPageActive = () => gstore.webPageName === 'WORDS';
const embedPageActive = () => gstore.webPageName === 'EMBED';

const trimToLower = txt => txt.trim() .toLowerCase();

//backslash added 2022-10-30. What about ()and []?
// trimming apostrophes added 2024-07-18
const removePunctuation = txt => txt.replace(/[.!?,"“”,。,？,！,，,、:\\]/g, '').replace(/^'|'$/g,'');
const removePunctuation2 = txt => txt.replace(/[\(\);.!?,"“”,。,？,！,，,、:\\]/g, '') //(); added 2024-06-29. What about ()and []?
//const renderStr = txt => trimToLower(removePunctuation(txt)).replace(/\s|-/g,' ').replace(/’/g,"'"); // hyphen moved here from removePunctuation
const renderStr = txt => trimToLower(removePunctuation(txt)).replace(/\s+|-/g,' ').replace(/’/g,"'"); // hyphen moved here from removePunctuation
const normalizeStr = txt => trimToLower(txt.replace(/\s+/g, ' ') .replace(/_+/g,''));
//const capitalizeFirstLetter = s => s.charAt(0).toUpperCase() + s.slice(1);

const getUrlKey = key => {
  const urlKeys = new URLSearchParams(location.search);
  return urlKeys.get(key);
}

const urlHasKey = key => (getUrlKey(key) !== null);

const encode64 = s => btoa(unescape(encodeURIComponent(s)));
const decode64 = s => decodeURIComponent(escape(atob(s)));
const decodedText = s => {
// see also https://stackoverflow.com/questions/7860392/determine-if-string-is-in-base64-using-javascript
  if (/[\s\,\|]/.test(s)) return s;
  try {return decode64(s);}
  catch(e) {return s;}
}

const linkCopiedMsg = 'Link copied to clipboard';

const loadingDone = () => hideElid('screen-cover');

const displayOverlayClose = () => {
  if (tasksPageActive()) hitStopButton();
  else displayOverlay();
}

async function displayOverlay(par = '', msec, cmd) {
  const overlay = qsel('.overlay');
  const closeBtn = '<div class="close-x rnd gray2 gray-onhover gray-bg-onhover" onclick="displayOverlayClose()">&times;</div>';

  let msg = (typeof par === 'object') ? par.msg : par;
  
  if (par.style) overlay.style = par.style;
  else overlay.style = '';

//  overlay.style.display = msg ? "inline-block" : "none";
//  if (cmd === 'progress') overlay.style.display = 'block';
//  else overlay.style.display = msg ? "flex" : "none";
  overlay.style.display = msg ? "flex" : "none";
//console.log('Par style', par.style);
 
  switch (cmd) {
    case 'CLEAR_AFTER':
      overlay.innerHTML = msg;
      await sleep(msec);
	  overlay.classList.remove('alarm-bgr');
      displayOverlay('');
      break;

    case 'progress':
	  displayProgress(overlay, msg, msec);
      break;

    case 'ALARM':
	  overlay.classList.add('alarm-bgr');
      displayOverlay(msg, msec, 'CLEAR_AFTER');
      break;

    default:
	  overlay.classList.remove('alarm-bgr');
      overlay.innerHTML = msg;
  }
  if (msg && !par.noCloseBtn) overlay.innerHTML += closeBtn;

}

const displayMessage = async (txt, msec = 2700) => {
  await displayOverlay(txt, msec, 'CLEAR_AFTER');
}

const displayAlarmMessage = (txt, msec = 2700) => {
  displayOverlay(txt, msec, 'ALARM');
}

const displayProgress = (el, txt, msec) => {
  const recSign = (audioRecorder.getState() === 'started') ? 
    '<div class="rec-circle1"><div class="rec-circle2"></div></div> '
	: '';

  el.innerHTML = '<div>' + recSign + txt + 
        '<svg id="recTimeIndicator"><circle r="5" cx="50%" cy="17" /></svg></div>';

  elid('recTimeIndicator').style.animation = "countdown2 " + msec/1000 + "s linear forwards";
}

const copyToClipboard = (txt, msg, msec) => {
  navigator.clipboard.writeText(txt).then(
    () => { displayMessage(msg, msec) },
    () => { displayAlarmMessage('Clipboard write failed') }
  );
}

async function loadElementFromURL(eID, url, altUrl) {
  if (!url || !eID) return 0;
  try {
    const txt = await fetchText(url);
	if (txt) loadElementWithText(txt, eID);
	else if (altUrl) { // try again with alternative url
	  loadElementFromURL(eID, altUrl, '');
	  return;
	}
    else { 
      loadingDone();
      displayAlarmMessage('Page not found');
    }
  } catch(e) { 
      console.log(e);
      displayAlarmMessage(e.message);
  }
}

function uploadTaskFile(evt) {
  uploadTextFile(evt, 'loadElementWithText', 'transcriptText');
}

function uploadWordFile(evt) {
  uploadTextFile(evt, 'showReadText');  // how about games?
}

function uploadGameScript(evt) {
  uploadTextFile(evt, 'parseGrammarGame', 'uploaded-game'); 
}

function uploadTextFile(evt, fnName, param) {
  let file;
  if (evt.target.files) file = evt.target.files[0];
  if (evt.dataTransfer && evt.dataTransfer.files) file = evt.dataTransfer.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = () => {
    try {
	  let text = reader.result;
	  if (text.startsWith('original-url=')) { // this could be a separate fn
		console.log(text.split('\n')[0]);
		gstore.keptUrl = text.split('\n')[0]. split('original-url=')[1];
//		const url = location.origin + '?t=' + gstore.keptUrl; // ! works only for tasks!
//		history.pushState({'pushed': url}, "", url);
		
		text = text.replace(/^.*\n/, ''); // remove the first line
	  }
	  window[fnName](text, param); 
	} 
    catch(ex) { alert('ex when trying to load file = ' + ex); }
  };
  reader.readAsText(file);
}

function loadElementWithText(sourceText, eID, cmd) {
  displayOverlayClose();
  const parseWlist = txt => {
// issues tbc:
// commas and hypens in flashcards

    let s = txt.replace(/’/g, "'")
      .replace(/-{2}/g, '{hyphen}');
    if (!pubchem.checked) { 
      s = s.replace(/\\-/g, '\\{hyphen}'); 
    }// replace hyphens with spaces

    if (!getUrlKey('url')) { // 
	  const separator = (s.includes('|'))? /\|\s*/g : /,\s*/g; // either | or ,
      s = s.replace(/-/g, ' ')
      .replace(/[_]/g, ' ') // replace hyphens and undercores with spaces
      .replace(/\\,/g, '{comma}') 
      .replace(separator, '\n') // replace separator with new lines
      .replace(/{comma}/g, '\\,'); 
    }

    s = s.replace(/{hyphen}/g, '-');
//      .replace(/[<>&]/g,''); //sanitize
//console.log(s);
    return s;
  }

  let text = (cmd === 'NO_DECODE')? sourceText : decodedText(sourceText);
  text = text.replace(/<script|<style|\r/g, '') //sanitize and remove \r

  if (eID === 'transcriptText') {
//	text = text.replace(/\r/g, '');
	players.currentTask = text;

// x-vars could be extracted here and removed from the text. Perhaps in taskTextHandler fn?
// This allows links within x-vars, e.g., for player-title
	text = taskTextHandler(text);
  }

  text = highlightText(text);

  if (eID === 'transcriptText') { text = parseTaskText(text, true); }
  if (eID ==='latest-news') { text = parseTaskText(text); }
  if (eID === gstore.notes.id || eID === 'main-container') { 
    text = parseTextFile(text); 
    if (eID === gstore.notes.id) text = '<x-br></x-br>' + text.replaceAll('<br>', '<x-br></x-br>');
//	console.log(text);
  }
  if (eID === 'infopage-content') { text = parseInfoPage(text); }
  
// Convert text to element
  if (eID === 'ta') { 
    ta.text = parseWlist(text); 
    renderTA(ta.text); 
    return; 
  }
//  else { setElHTML(eID, text); }
  else { writeHtmlIntoEl(text, eID); }

  gstore.tips.initAll(); //experimental 2025-10-12
  
  if (eID === 'infopage-content') 
    if (text.length > 100) activateAccordion(); 


  if (eID === 'transcriptText') processTaskEl();
  else parseTTSTag(elid(eID));

  parseMarkTag(elid(eID));
}

const writeHtmlIntoEl = (html, id) => {
// adjusts img sources
// in the future, more adjustments may be added

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.querySelectorAll('img').forEach(img => {
    img.src = getNewURL(img.getAttribute('src'));
  });
  setElHTML(id, doc.body.innerHTML);
}

const parseMarkTag = (el = document) => {
//  const markedEls = el.querySelectorAll('mark');
//  console.log('tag mark', markedEls);
  const markHue = gstore.xVarsMarkHue || 265;
  
  const markStyle = 'border-radius: 5px; ' 
//    + (gstore.xVarsMark || getDirInfoKey('mark:') || 'background-color: #f3eaf7');
    + (gstore.xVarsMark || getDirInfoKey('mark:') || `background-color: hsla(${markHue}, 85%, 94%, 0.6`);

//  for (const markedEl of markedEls) markedEl.style.cssText = markStyle; 
  el.querySelectorAll('mark') .forEach(el => el.style.cssText = markStyle);
}

const parseInfoPage = txt => txt.replace(/\s*<Q/g, '</div><div class="accordion"')
     .replace(/<\/Q>\s*/g, '</div><div class="panel hidden">')
     + '</div>';

const parseNewLines = s => s
  .replace(/\r/g, '')
  .replace(/\n\n\n?/g, '<x-br-l></x-br-l>')
  .replace(/\n/g, '<br>')
  ;

const parseTextFile = (txt, cmd) => {
  const colorPrefix = '<span style=color';
  const bcolorPrefix = '<span class="rounded" style=background-color';
  const tipPrefix = '<span class="task-tip" tip=';

  let s = txt.replace(/<\/h[1-6]>\s?/g, s => s.trim()) // remove a new line after </h...>
  .replace(/<color/g, colorPrefix)
  .replace(/<bcolor/g, bcolorPrefix)
  .replace(/<\/b?color/g, '</span')

  .replace(/<tip/g, tipPrefix)
  .replace(/<\/tip/g, '</span')

  .replace(/<script/g, '') // try to protect page
  .replace(/<style/g, '')

  .replace(/<tts\/>/g, '<tts></tts>') // this reads text before the tag.
  
// tts key <)) reads to the end of a paragraph 
// b/c reading by sentences is problematic with words like i.e.
//  .replace(/<\)\).*?(?=\r|<br>|$|<\)\)|<x-br)/g, s=>'<tts pos="before">' + s.replace(/<\)\)/, '') + '</tts>'); // this reads text before the tag.
// for some reason, the above lookahead for <br> doesn't work when a task is fethched from url
// therefore, \r was added to lookahead keys 18 Feb 2023

  if (!cmd) s = parseNewLines(s);
  s = parseAccentTag(s);
  return s;
}

const parseXswitch = s => {
  const xswitchPrefix = "<label class='switch show-focus font-75pc'><input class='hidden' type='checkbox' onchange=";
  const xswitchSuffix = "><div class='slider round'></div></label>";

  return s
    .replace(/<x-switch>/g, xswitchPrefix)
    .replace(/<\/x-switch>/g, xswitchSuffix)
}

function parseTaskText(sourceText, saveTask) {

  const taskPrefix = "<a class='vlink' onclick=loadHtmlTaskByRef(this)";
  const cuePrefix = "<a class='cue' onclick=replayFragment(this)";
  const pcuePrefix = "<p class='cue' onclick=replayFragment(this)";
//  const viewGaps = '<span style="cursor:default; margin-right:-0.65em; color:#aaa;">👁</span><b>/</b>' 
//    + '&nbsp;&nbsp;<x-switch>viewTestAnswers(this.checked)</x-switch> 👁';
  //const viewGaps2 = '<div title="Toggle gaps" class="view-gap" onclick="toggleGaps(this)"><x-switch></x-switch></div>';
//  const viewGaps2 = '<button title="Toggle gaps" class="view-gap" onclick="toggleGaps(this)"><x-switch></x-switch></button>';
  const viewGaps2 = '<span title="Toggle gaps"><x-switch>"toggleGaps(this)" title="Toggle gaps"</x-switch></span>';

//  let s = decodedText(sourceText);
  let s = sourceText;

  s = processYTtranscript(s); // there're bugs related to timestamps in cues, see with voa115 task
  s = applyDirInfo(s);
  
  s = s
    .replace(/<</g, '{{DBL_ANG_BRACKET}}') // protect <<
    .replace(/<startmedia/, '<div id="startmedia"')
    .replace(/<\/startmedia>\s*[\r\n]*/, '</div>')
    .replace(/<task/g, taskPrefix)
    .replace(/<\/task/g, '</a')

    .replace(/<cue/g, cuePrefix)
    .replace(/<\/cue/g, '</a')
    .replace(/<pcue/g, pcuePrefix)
    .replace(/<\/pcue/g, '</p')
    .replace(/<x-audio>/g, '<x-audio></x-audio>')
    .replace(/<x-video>/g, '<x-video></x-video>')
    .replace(/{x-vocab}/g, '<x-vocab></x-vocab>')
    .replace(/<x-view-gaps>|{x-view-gaps}/g, viewGaps2)
    .replace(/{x-speed-ctrl}/g, '<x-cmd id="pbr-box" cmd="SHOW_PBR"></x-cmd>')
    .replace(/{x-rec-ctrl}/g, '<x-switch>setRecSwitch(this.checked)</x-switch>')
    .replace(/{x-transl}/, '<x-translate></x-translate>')
    .replace(/{x-tts-read}/i, '<button class="cue-button grayish play-triangle" title="TTS read" onclick="readTTSChunks(this)"></button>')
//    .replace(/<x-switch>/g, xswitchPrefix)
//    .replace(/<\/x-switch>/g, xswitchSuffix)
//    .replace(/\<x-vars\s.*?\>/g, s => s + '</x-vars>') // add closing </x-vars>
//    .replace(/<\/x-vars>\s*(<br>)?/g, '</x-vars>') // remove trailing \s, <br>
	.replace(/\n.{0,14}:\s/g, s => s[0]+'<i>' + s.slice(1) + '</i>') // italicize speakers in dialogues
	;
  s = parseXswitch(s);
//previously parseTextFile fn preceeded tags replacement above. This change needs more testing
  s = parseTextFile(s);

//  s = s.replace(/<x-br>\r?(<br>)?/g, '<x-br></x-br>')
//    .replace(/<\/h\d><br>/g, s => s.slice(0, 5) + '<x-br></x-br>') 
  s = s // try to change the order of two first replacements
//    .replace(/<\/h\d><br>/g, s => s.slice(0, 5) + '<x-br>')
    .replace(/<\/h\d>\s*?<br>/g, s => s.slice(0, 5))
    .replace(/<x-br>(<br>)?/g, '<x-br></x-br>')
    .replace(/<\/div>\n?<br>/g, '</div><x-br-l></x-br-l>')
    .replace(/<br><br>/g, '<x-br-l></x-br-l>')
	.replace(/<br>.{0,14}:\s/g, s => '<br><i>' + s.slice(4) + '</i>') // italicize speakers in dialogues
	.replace(/{{DBL_ANG_BRACKET}}/g, '<<') // restore <<
	;
  s = makeTestForm(s);
  s = parseXTag(s);

  return s;
}

const applyDirInfo = s => {
  if (!gstore.dirInfo) return s;
  const xvars = getDirInfoKey('x-vars:');
//  if (xvars && !isIndexFile(gstore.taskUrl)) s = s.replace('<x-vars ', '<x-vars ' + xvars + ' '); // adding xvars in the end of the tag may be preferred
  if (xvars && !isIndexFile(gstore.taskUrl)) addXvars(xvars); // changed 2024-11-06
// if this is a dir index, applying xvars may not be needed?
  
// other common lines may be added
  const getTextVar = s => {
    const res = getDirInfoKey(s.slice(1, -1) + ':');
    return res? highlightText(res) : s;
  }
//  const txt1 = getDirInfoKey('txt1:');
//  if (txt1) s = s.replace(':txt1:', highlightText(txt1)); // adding several txt vars via replace regexp \${txt\d} may be preferred
  s = s.replace(/{txt\d?\d}/g, s => getTextVar(s)); 

  return s;
}

gstore.chevronIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" 
  style="fill:transparent; stroke-width:8; stroke: currentColor">
  <polyline points="10,66 50,33 90,66" />
</svg>
`;

gstore.xpPrefix = (title, cmd = 'X-P') => {
  if (!title) title = '';
//  const elid = (cmd && cmd !== 'X-P')? `id="${cmd}"` : '';
  return `<button ${title} class="chevron-btn chevron-down inherit" onclick="clickChevron(this, '${cmd}')">`
//    + gstore.chevronIcon + `</button><br><div ${elid} class="hidden rel">`;
    + gstore.chevronIcon + `</button><br><div class="hidden rel">`;
}
  
gstore.freeChevron = (id, title, style, cmd = "clickChevron(this,'X-P')") => {
  if (!title) title = '';
//  return `<button ${title} class="chevron-btn chevron-down" onclick="clickChevron(this, '${cmd}')">`
  return `<button id="${id}-btn" ${title} class="chevron-btn chevron-down inherit" style="${style}" onclick="${cmd}">`
    + gstore.chevronIcon + `</button>`;
}
  
const parseXTag = txt => {
//  return txt.replace(/<x-p(.*?)>/g, (s, p1) => prefix(p1)) .replace(/<\/x-p>/g, '</span>'); // to add atributes to <x-p>, highlighting <h*> should be fixed as well.
//  txt = txt.replace(/<x-p>(<br>)?/g, prefix) .replace(/<\/x-p>(<br>)?/g, '</span>');
  txt = txt.replace(/<x-p\s*(title="[^"]*")?\s*>(\s*<br>)?/g, (match, title) => gstore.xpPrefix(title))
    .replace(/<\/x-p>(<br>)?/g, '</div>');
  return txt;
//  return txt.replace(/<x-p>|\[\+\]\{/g, prefix) .replace(/<\/x-p>/g, '</span>');
}

const parseAccentTag = txt => {
  const accentReplace = (txt, mark, before='<b>', after='</b>') => {
// for acute accent, use before='', after=&#769;
// see https://www.w3schools.com/charsets/ref_utf_diacritical.asp
    const searchValue = new RegExp("[" + mark + "].", "g");
    const newValue = s => before + s[1] + after; //s contains found string
    return txt.replace(searchValue, newValue);
  }

  const el = document.createElement("div");  
  el.innerHTML = txt;  
  const accent = el.getElementsByTagName("accent")[0];
  if (!accent) return txt;
  const mark = accent.getAttribute("mark");
  mark.before = accent.getAttribute("before");
  mark.after = accent.getAttribute("after");
  
  el.innerHTML = txt.replace(/<accent[^>]+>/ig,'');  //remove the tag

  return accentReplace(el.innerHTML, mark, mark.before, mark.after);
}

const runTaskCmd = (el, cmd) => {
  if (!el) return 0;
//  if (cmd === 'PAIRED-LINES') {
//console.log(el);  
//  }
  if (cmd === 'SHOW_PBR' && !qsel('#setpbr2')) {
    elAddHTML(el, getPbrHtml(2));
    setPBR();
    return 1;
  }
}

const getPbrHtml = (s='') => {
  const masterPBR = localStorage.getItem('masterPBR') || 1;
  return `
  <div  class="inblock gray font-90pc">
    <input id="setpbr${s}" title="Player speed" class="gray" 
    type="range" list="pbr-tickmarks" value="${masterPBR}" min="0.1" max="2" step="0.05" 
    oninput="setPBR(this)" style="width:90px; vertical-align: -35%">
    <span id="current-pbr${s}" class="font-90pc"></span>x
  </div>
`
  + uiblox.getSliderMarksHtml('pbr-tickmarks', 0, 2, 0.25)
}

const getFsizeHtml = (s='') => {
  const fontSize = localStorage.getItem('fontSize') || 16;
  return `
Font size
<input id="input-fsize${s}"  type="range" list="font-size-tickmarks" style="width: 160px;" class="v-align-middle" 
oninput="setFontSize(this)" step="0.5" min="8" max="40" value="${fontSize}" />
<span id="show-fsize${s}"></span>
`
  + uiblox.getSliderMarksHtml('font-size-tickmarks', 8, 40, 4);
}

const parseCmdTag = eID => {
  const tags = elid(eID).getElementsByTagName("x-cmd");
  for (const tag of tags) {
	const el = tag.id ? elid(tag.id) : tag;
    const cmd = tag.getAttribute('cmd');
    runTaskCmd(el, cmd);
  }
}

/*
// chevron is used for hop buttons instead of curved arrow
gstore.hopIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="0.8em"  
  fill="none" stroke-width="16" stroke="currentColor" viewBox="0 0 220 160">
  <path d="M 10,100 A 90,90 0 0,1 190,100 L 157,73 L 192,103 L 208,62"/>
  </svg>`;
*/

//const speakerIcon = '&#x1f509&#xfe0e;'
// speakerIcon svg from https://fontawesomeicons.com/svg/icons/volume-down-fill
gstore.speakerIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="1em"  
  fill="currentColor" style="vertical-align:-0.2em" viewBox="1 1 14 14">
  <path d="M9 4a.5.5 0 0 0-.812-.39L5.825 5.5H3.5A.5.5 0 0 0 3 6v4a.5.5 0 0 0 .5.5h2.325l2.363 
  1.89A.5.5 0 0 0 9 12V4zm3.025 4a4.486 4.486 0 0 1-1.318 3.182L10 10.475A3.489 3.489 0 0 0 11.025 
  8 3.49 3.49 0 0 0 10 5.525l.707-.707A4.486 4.486 0 0 1 12.025 8z"/>
  </svg>`;
  
// printIcon svg from https://fontawesomeicons.com/svg/icons/printer-line
gstore.printIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <g transform="translate(-.6, -.6) scale(1.1)">
  <path fill=currentColor d="M6 19H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h3V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-3v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2zm0-2v-1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1h2V9H4v8h2zM8 4v3h8V4H8zm0 13v3h8v-3H8zm-3-7h3v2H5v-2z"/>
  </g></svg>`;

// settingIcon from https://www.svgrepo.com/vectors/settings/
gstore.settingsIcon = `<svg style="vertical-align: -0.2em" width="0.9em" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">`
  + `<path fill=none stroke=currentColor stroke-width=3 d="M39.23,26a16.52,16.52,0,0,0,.14-2,16.52,16.52,0,0,0-.14-2l4.33-3.39a1,1,0,0,0,.25-1.31l-4.1-7.11a1,1,0,0,0-1.25-.44l-5.11,2.06a15.68,15.68,0,0,0-3.46-2l-.77-5.43a1,1,0,0,0-1-.86H19.9a1,1,0,0,0-1,.86l-.77,5.43a15.36,15.36,0,0,0-3.46,2L9.54,9.75a1,1,0,0,0-1.25.44L4.19,17.3a1,1,0,0,0,.25,1.31L8.76,22a16.66,16.66,0,0,0-.14,2,16.52,16.52,0,0,0,.14,2L4.44,29.39a1,1,0,0,0-.25,1.31l4.1,7.11a1,1,0,0,0,1.25.44l5.11-2.06a15.68,15.68,0,0,0,3.46,2l.77,5.43a1,1,0,0,0,1,.86h8.2a1,1,0,0,0,1-.86l.77-5.43a15.36,15.36,0,0,0,3.46-2l5.11,2.06a1,1,0,0,0,1.25-.44l4.1-7.11a1,1,0,0,0-.25-1.31ZM24,31.18A7.18,7.18,0,1,1,31.17,24,7.17,7.17,0,0,1,24,31.18Z"/></svg>`;


gstore.translateIcon = '<div class="inline font-75pc" style="vertical-align:15%">文</div>'
    +'<div class="inline font-85pc font-monospace" style="vertical-align:-10%; margin-left: -.2em;">A</div>';

const parseTTSTag = (el, lightBtn = '') => {
  const tags = el.getElementsByTagName('tts');
  while (tags.length) {
    const tag = tags[0],
      pos = tag.getAttribute('pos') || '',
      speed = tag.getAttribute('speed') || '',
      langs = (tag.getAttribute('lang') || players.ttsLang || '').split(',');
    let say = tag.getAttribute('say') || ''; //remove tags.
    say = say.replace(/<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g, '') //remove tags.
    let spHtml = '';
    for (let lang of langs) {
      lang = lang.trim();
	  const title = tag.getAttribute('title') || lang || 'Listen';
      const country = (langs.length > 1)? lang.split(/_|-/)[1] : '';
// button supports accessability with keyboard tab
// onmousedown="event.preventDefault();" was added so that focus on parent div isn't lost, 
// which is important for vocab-entries div in tasks page
      spHtml += `<button class="tts-speak-task btn-lighgray ${lightBtn}" title="${title}"
 pos="${pos}" say="${say}" speed="${speed}" lang="${lang}" onmousedown="event.preventDefault();" onclick="ttsCueClick(this)">
 <span class="small-padding">${country}${gstore.speakerIcon}</span></button>`;
    }

//	spHtml = '<span>' + spHtml + '</span>';
	spHtml = '<div class="inline">' + spHtml + '</div>';
//    const tts = tag.innerHTML ? `<span>${tag.innerHTML}</span>` : '';
    let tts = '';
	if (tag.innerHTML) {
// check text direction, see more at https://stackoverflow.com/questions/12006095/javascript-how-to-check-if-character-is-rtl
// testing logic changed 20 Apr 2024
//	  const direction = /[\u0590-\u06FF]/.test(tag.innerHTML) ? 'dir="rtl"' : '';
//	  tts = `<span ${direction}>${tag.innerHTML}</span>`;
	  tts = `<span>${tag.innerHTML}</span>`;
	}
	spHtml = (pos === 'before') ? spHtml + tts : tts + spHtml;
    tag.insertAdjacentHTML('afterend', spHtml);
    tag.remove();
  }
}

const speakBtn = (lang = '', say = '', speed = '', country = '', pos = 'before') => `<span class="tts-speak-alt" title="${lang}" say="${say}" lang="${lang}" 
          speed="${speed}" pos="${pos}" onclick="speakLangText(this)">${country}${gstore.speakerIcon}</span>`;

const getRelatedURL = (url, newURL) => {
//console.log('URL', url, 'newURL', newURL);
  if (!url || newURL.includes('//')) return newURL // detect http(s)://

  const oldHost = url.includes('//') ? 
    url.substring(url.indexOf('//')+2, 0) + // protocol + ://
    url.split('/')[2] // hostname
    : '';

  return (newURL[0] === '/') ? oldHost + newURL
//         : getPathFromUrl(url) + newURL; //this logic doesn't work well if e.g. url = tasklist/voa/voa-index.txt
//         : getPathFromUrl(url) + getFnameFromUrl(newURL);
         : getPathFromUrl(url) + getPathFromUrl(newURL) + getFnameFromUrl(newURL);
}

const getPathFromUrl = url => url.substring(url.lastIndexOf('/')+1, 0);
const getFnameFromUrl = url => url.substring(url.lastIndexOf('/')+1);

function getNewURL(url, keep = 0) {
//  if (!this.url) this.url = ''; //saved url
//  const newURL = getRelatedURL(this.url, adjustUrl(url));
  const newURL = getRelatedURL(adjustUrl(gstore.keptUrl), adjustUrl(url));
//  if (keep) this.url = newURL;
  if (keep) gstore.keptUrl = newURL;
  return newURL;
}

//const urlBase = 'https://drmedia.netlify.app/';
//const adjustUrl = url => (url && url.startsWith("//")) ? url.replace("//", urlBase) : url;
//const squeezedUrl = (url, keep = 1) => getNewURL(url, keep).replace(urlBase, '//');

const squeezedUrl = (url, keep = 1) => getNewURL(url, keep)
  .replace('https://drmedia.netlify.app/', '//')
  .replace('https://raw.githubusercontent.com/xlcalc/blog/main/', 's2://');

const adjustUrl = (path = '') => {
  if (!path) return '';
  if (path.startsWith('s2://')) return path.replace('s2://', 'https://raw.githubusercontent.com/xlcalc/blog/main/');
  if (path.startsWith('//')) return path.replace('//', 'https://drmedia.netlify.app/');
  return path;
}

const loadHtmlTaskByRef = ref => {
  const key = ref.getAttribute("game") ? '/?game=1&url=' : '/?t=';
  const url = ref.getAttribute("url");
  location.assign(key + squeezedUrl(url));
}


const toggleEl = (e, className = 'hidden') => { if (e) e.classList.toggle(className); }
const toggleElid = (...ids) => 
  ids.forEach(id => toggleEl(elid(id)));

const toggleElements = (elArray, className) => { 
  elArray.forEach(el => toggleEl(el, className));
}

const addElementsClass = (elArray, className) => { 
  elArray.forEach(el => {if (el) el.classList.add(className)});
}

const removeElementsClass = (elArray, className) => { 
  elArray.forEach(el => {if (el) el.classList.remove(className)});
}

const setElementsClass = (elArray, className, cmd) => {
  if (cmd) addElementsClass(elArray, className);
  else removeElementsClass(elArray, className);
}

const setElClass = (el, className, cmd) => { setElementsClass([el], className, cmd) };

const blinkElClass = async (el, className, cmd, t1, t2) => { 
  setElementsClass([el], className, cmd);
  await sleep(t1);
  setElementsClass([el], className, !cmd);
  if (t2) await blinkElClass(el, className, !cmd, t2);
};

const hideEl = e => { if (e) e.classList.add('hidden'); }
const hideElid = (...ids) => 
  ids.forEach(id => hideEl(elid(id)));

const showEl = (e, display) => { 
  if (e) {
    e.classList.remove('hidden'); 
    if (display) e.style.display = display;
  }
}

const showOrHideEl = (e, show) => { 
  if (show) showEl(e);
  else hideEl(e);
}

const showElid = (...ids) => 
  ids.forEach(id => showEl(elid(id)));

const isElHidden = el => el.classList.contains('hidden');

const clickChevron = (el, cmd) => {
  if (cmd === 'SHOW' && !isElHidden(el.nextElementSibling)) return;
  
  toggleEl(el, 'chevron-down');
  if (cmd === 'AFTER_PARENT') toggleEl(el.parentElement.nextElementSibling);
  else if (cmd === 'X-P') toggleEl(el.nextElementSibling.nextElementSibling);
  else if (cmd) toggleEl(elid(cmd));
  else toggleEl(el.nextElementSibling);
}

function hideOnClickOutside() { 
// close window on click outside it
  const idArray = ['infopage', 'topMenu']; 

  const outsideClickListener = event => {
	idArray.forEach(id => {
	  const el = elid(id);
      if (el && !el.contains(event.target) && isVisible(el)) { // or use: event.target.closest(selector) === null
	    if (el.init) el.init = false;
        else hideEl(el);
      }
	})
  }

  if (!window.onclick) window.onclick = e => outsideClickListener(e);
}

const isVisible = el => !!el && !!( el.offsetWidth || el.offsetHeight || el.getClientRects().length );

const setInfoPageSizePos = (d={}) => {
  const style = elid('infopage').style;
  elid('infopage-content').style.marginTop = d.marginTop || '';

    style.height = d.height || '75vh';
//console.log('Height=', height);
  
    const defaultWidth = (innerWidth > 800) ? '45vw' : '85vw';
    style.width = d.width || defaultWidth;
    style.maxWidth = d.maxWidth || '';
//console.log('Width=', style.width);
  
  if (d.nearEl) {
    const coords = getCoords(elid(d.nearEl));
    style.left = coords.left +30 + "px";
    style.top = coords.bottom -20 + "px";
	style.transform = '';
  }
  else {
    style.left = '50%';
    style.top = '50%';
    style.transform = 'translate(-50%, -50%)';
  }

  style.lineHeight = d.lineHeight || '1.3';
}

async function displayInfopage(task, sizePos) {
//console.log('Infopage task: ', task);
  if (['copyright','contribute','help'].includes(task)) setElHTML('infopage-content', '');

  setInfoPageSizePos(sizePos);
  infopageSaveBox('HIDE');
  const iContent = elid('infopage-content');
//save innerText as it may be altered if display set to 'none'
  const latestText = iContent.innerText;
  const latestHTML = iContent.innerHTML;

  iContent.contentEditable = "false";
  const iPage = elid('infopage');
//  if (['hide', 'SAVE_AND_EXIT'].includes(task)) hideEl(iPage);
  if (['hide'].includes(task)) hideEl(iPage);
  else {
//    hideOnClickOutside(iPage);
    showEl(iPage, 'inline-block');
	iPage.init = true;
  }

  switch (task) {
    case 'SHOW_DEBUG_INFO':
      loadElementWithText(gstore.debugInfo, 'infopage-content');
	  break;
	  
/*    case 'settings':
	  setInfoPageSizePos({width: '440px', height: '180px', marginTop: '0em'}); // auto size should be implemented
	  const txt = '<div style="white-space: normal"><small><b>Settings</b></small><x-br></x-br>' 
	    + speedCtrlEl('-set') 
	    + '<x-br></x-br>' 
//		+ '<div class="inblock">'
//		+ uiblox.vocabSettings
//		+ '</div>'
//	    + '<x-br></x-br>' 
        + getVocabCtrl()
		+ getFsizeHtml('-set') 
		+ '</div>';
      loadElementWithText(txt, 'infopage-content');
	  setPBR();
// set vocab mode too	  
	  setFontSize();
	  break;
*/
    case 'copyright': case 'contribute': case 'help':
      const url = location.origin + '/info/' + task + '.txt'; 
	  // location.origin is needed b/c the path can be interpreted as relative from the current one
      loadElementFromURL('infopage-content', url);
      break;

    case 'EDIT_TASK':
      infopageSaveBox('SHOW');
      iContent.contentEditable = "true";
      iContent.focus();
      iContent.innerText = players.currentTask || '';
// line breaks characters may be changed compared to players.currentTask
      iContent.initialText = iContent.innerText;
      iContent.initialHTML = iContent.innerHTML;
      break;

    case 'EDIT_YT_STYLE':
      infopageSaveBox('SHOW');
      iContent.contentEditable = "true";
      const YTtranscriptPrompt = 
`<input type="url" id="media-url-input2" 
  class="input" style="width:93%;" 
placeholder="Enter video/audio URL here">
<b><i>Paste YouTube transcript lines below</i></b>

`;

      iContent.innerHTML = YTtranscriptPrompt;
      iContent.initialHTML = YTtranscriptPrompt;
      elid('media-url-input2').focus();
      break;

    case 'SAVE_AND_EXIT':
//      if (iContent.lastTask === 'EDIT_TASK' && iContent.initialText !== latestText) {
      if (iContent.lastTask === 'EDIT_TASK' && iContent.initialHTML !== latestHTML) {
// tips should be removed from DOM - but it has 'stable' tips, e.g., for Master speed rate
// therefore, either parent's child should be also removed or the logic changed:
// calling createTip every time you need to show them and removing them instead of hiding

		iContent.innerHTML = latestHTML.replace(/<b>|<\/b>/g, '*')
		  .replace(/<i>|<\/i>/g, '~'); //  keep formatting changes made with Ctrl+B, Ctrl+I
		
        loadElementWithText(iContent.innerText, 'transcriptText');
//        loadElementWithText(latestText, 'transcriptText');
//        loadElementWithText(latestHTML, 'transcriptText');
      }
      if (iContent.lastTask === 'EDIT_YT_STYLE' && iContent.initialHTML !== latestHTML) {
        handleYTstyleInput(latestText);
      }
      loadElementWithText('', 'infopage-content');
	  hideEl(iPage);
      break;

    case 'hide':
      loadElementWithText('', 'infopage-content');
      break;

    default:
      loadElementWithText(task, 'infopage-content');
  }
  iContent.lastTask = task;
}

const isInfopageEditable = () => (elid('infopage-content').contentEditable === 'true');

const infopageSaveBox = cmd => {
  const el = elid('infopage-save-box');
  if (cmd === 'SHOW') {
    showEl(el);
// adjust height of infopage-content
    elid('infopage-content').style.height = '88%';
  }
  else {
    hideEl(el);
    elid('infopage-content').style.height = '';
  }
}

const activateAccordion = () => {
  const acc = document.getElementsByClassName("accordion");
  for (const el of acc) {
    el.onclick = function() {
      toggleEl(this, "active");
      toggleEl(this.nextElementSibling);
    }
  }
}

const showHelpQ = eID => {
  const e = elid(eID);
  e.classList.add("active");
  showEl(e.nextElementSibling);
  e.scrollIntoView();
}

const showHelpItem = async eID => {
  displayInfopage('help');
  for (let i = 0; i<20; i++) { //awkward idea to wait, but easy to implement 
    if (elid(eID)) break;
    await sleep(200); 
  }
  showHelpQ(eID);
}	

Object.defineProperty(players, 'speedCtrlLeft', { 
  get: () => players['#speedCtrlLeft'],
  set(v) {
    players['#speedCtrlLeft'] = v;
    adjustPBR();
  }
});

const infopageActive = () => {
  const e = elid('infopage');
  return !(e.style.display === 'none' || isElHidden(e));
}

const topMenuActive = () => !isElHidden(elid('topMenu'));

const escToCloseWindow = () => {
  if (infopageActive()) {
    displayInfopage('hide');
    return true;
  }

  if (wordsPageActive() && !isElHidden(elid('play-controls'))) {
	hideSettings();
	return true;
  }

  if (topMenuActive()) {
    hideTopMenu();
    return true;
  }
  return false;
}

const relayKey = e => {
  if (e.code === 'Escape' && escToCloseWindow()) return;
  handleKeyEvent(e);
}

const keyShiftCapsCheck = e => {
//  if (!e.shiftKey) console.log('Shift key up');
// console.log('CapsLock', e.getModifierState('CapsLock'));
  if (wordsPageActive() || tasksPageActive())
    if (gstore.shiftKey !== e.shiftKey || gstore.capsLock !== e.getModifierState('CapsLock')) {
      gstore.shiftKey = e.shiftKey;
      gstore.capsLock = e.getModifierState('CapsLock');
	  gstore.upperCase = gstore.shiftKey ^ gstore.capsLock;
	  shiftCapsCallback(gstore.upperCase);
	}
}

document.onkeydown = e => {
  gstore.shiftKeyDown = e.shiftKey;
  gstore.ctrlKey = e.ctrlKey;
  gstore.altKey = e.altKey;
  gstore.metaKey = e.metaKey;
//console.log('Alt:', e.altKey);
//console.log('Meta:', e.metaKey);
  if (embedPageActive()) return;
  if (e.code === 'ControlLeft') players.speedCtrlLeft = true; 
  const whiteList = ['Escape', 'ControlRight', 'MetaRight'];
  if (whiteList.includes(e.code)) relayKey(e);
  keyShiftCapsCheck(e);
}

document.onkeyup = e => {
  gstore.shiftKeyDown = e.shiftKey;
  gstore.ctrlKey = e.ctrlKey;
  gstore.altKey = e.altKey;
  gstore.metaKey = e.metaKey;

  if (embedPageActive()) return;
  const stopList = ['Escape', 'ControlRight', 'MetaRight'];
  if (e.code === 'ControlLeft') { players.speedCtrlLeft = false; }
  if (!stopList.includes(e.code)) relayKey(e);
  keyShiftCapsCheck(e);
}

const setRepNum = () => {
  players.ReplayNumber = parseInt(elid('rep-num').value);
}

const setReplayNumber = n => {
  elid('rep-num').value = n;
  setRepNum();
}

const getReplayNumber = () => players.ReplayNumber; 

//if Ctrl+T is pressed, put down speedCtrlLeft
window.onblur = () => {
  if (players.speedCtrlLeft) { players.speedCtrlLeft = false; }
}

//const showTopMenuOld = () => { elid("menuCloseBtn").focus(); }

const showTopMenu = () => { 
  showElid('topMenu');
  elid('topMenu').init = true;
}

const hideTopMenu = cmd => { 
  hideElid('topMenu');
  
  if (cmd === 'HELP') displayInfopage('help');

  if (['SHOW_SETTINGS', 'TTS_READ_LINES'].includes(cmd)) gCallback(cmd);
}

// adapted from https://javascript.info/coordinates
const getCoords = el => {
  const box = el.getBoundingClientRect();
  return {
    top: box.top + window.pageYOffset,
    right: box.right + window.pageXOffset,
    bottom: box.bottom + scrollY,
    left: box.left + scrollX
  };
}

/* == Tips == */

const tapOnTip = async el => {
  const txt = el.getAttribute('tip');
console.log('Tip', txt);
//  displayInfopage(txt, {width: '80vw', height: '200px'});
  showTip(el);
  await sleep(2500);
  hideEl(el.child);
}

const hoverTipChild = el => el.hovered = 1; // no need to call showTip fn?

const leaveTipChild = async el => { // changed 2025-10-22, to be tested
  el.hovered = 0;
//  if (el.parent.hovered) return;
  
  await sleep (200);
//console.log('leaveTipChild parent.hovered', el.parent.hovered);

  if (!el.hovered && !el.parent.hovered) hideAllTips();
}


const leaveTipParent = async el => { // changed 2025-10-22, to be tested
  el.hovered = 0;
//  if (el.child && el.child.hovered) return;
  
  await sleep (200);
//console.log('leaveTipChild child.hovered', el.child.hovered);

  if (el.hovered || el.child?.hovered) return;

  hideAllTips(); 
}


const hideAllTips = () => {
  const tips = document.querySelectorAll('.flashcard, .tooltip-text, .tooltip-link, .arrow');
//  tips.forEach(el => {if (!el.protectedFromHiding) hideEl(el)});
  tips.forEach(el => {
//	if (el.parent != gstore.activeTipParent) 

//console.log('Hiding tip', el, '? - hovered', el.hovered);
    if (!el.hovered && !el.parent.hovered) hideEl(el);
  });
}

/*
const hideTip = async () => {
  const el = window.event.srcElement;
  leaveTipParent(el);
}
*/
gstore.tips = {
  init(el) {
      el.setAttribute('onmouseenter', "showTip(this)");
      el.setAttribute('onmouseleave', "leaveTipParent(this)");
//	  el.classList.add('task-tip');
    },

  initAll() {
    const tips = document.querySelectorAll('[tip]');
    tips.forEach(el => { this.init(el) });
  }

}

const showTip = async el => {
//  await sleep(200);
  gstore.activeTipParent = el;
  el.hovered = 1;
//console.log('Show tip', el);
  if (el.child) {
//	setTipPosition(el.child, el);
// what if tip content has changed, like in dictation?
//    el.child.innerHTML = el.getAttribute('tip'); // this will break tipStore.get() pathway
    if (!el.child.classList.contains('arrow') && !setTipContent(el, el.child)) {
		hideEl(el.child);
		return;
	}

	showEl(el.child); 
  }
  else {
	await createTip(el);
  }
//  el.child.protectedFromHiding = true;
//  await sleep(500);
//  el.child.protectedFromHiding = false;

//if (el.child.classList.contains('arrow')) el.child.parentElement.scrollIntoView(); - scrolls the right column as well
// if it's an element in the settings, it can be scrolled into view 
// via checking el.getBoundingClientRect.top or bottom 
// and comparing it with the same param of 'manual-controls-box'
// and then elid('manual-controls-box').scrollBy(delta between the two)

//  gstore.activeTipParent.onclick = () => { hideEl(el.child) }
}

const createTip = el => {
// are tip elements ever removed?
  const tip = document.createElement('div');

  tip.setAttribute('onmouseenter', "hoverTipChild(this)"); // is it needed for arrows?
  tip.setAttribute('onmouseleave', "leaveTipChild(this)"); // is it needed for arrows?

  const refEl = el.getAttribute('ref');
  let coords;
  if (refEl) {
    if (el.getAttribute('cmd') === 'SHOW_ADV_CTRL') {
      clickChevron(elid('loop-chevron'), 'SHOW');
    }    
    coords = getCoords(elid(refEl));
//console.log('left=', coords.left, ', right=', coords.right);
    tip.className = 'arrow';
    const xShift = el.getAttribute('x-shift') || 0;
//console.log('X-shift', xShift);
//    tip.style.left = (coords.left + coords.right)/2 -2 + parseInt(xShift) + 'px';
    const tipX = (coords.right - coords.left)/2 - 10 + parseInt(xShift);
    tip.style.marginLeft = tipX + 'px';

	setElClass(tip, 'arrow-flip-x', coords.right + 80 > innerWidth);
//	if (coords.right + 80 > innerWidth) tip.classList.add(coords.right + 80 > innerWidth);
//	else tip.classList.remove('arrow-flip-x');
	
//console.log('Left', tip.style.left);
    const yShift = el.getAttribute('y-shift') || 0;
//    tip.style.top = coords.bottom - parseInt(yShift) + 'px';
    tip.style.marginTop = (coords.bottom - coords.top)/2 +10 - parseInt(yShift) + 'px';
    elid(refEl).append(tip);
  } else {
/*
    const tipClass = el.getAttribute('tip-class');
    tip.className = tipClass ? tipClass : 'tooltip-text';
//console.log('tip-class', tip.className);
    if (el.id) tip.innerHTML = tipStore.get(el.id);
    if (!tip.innerHTML) tip.innerHTML = el.getAttribute('tip');
	if (!tip.innerHTML) return;
    if (tip.innerHTML.includes('<a ')) tip.className = 'tooltip-link';
*/
    if (!setTipContent(el, tip)) return;

//    el.append(tip); // appending to el would change the logic, like position
    document.body.append(tip); // scrolling page on top setting tips will cause them scroll too
  }
  
  tip.classList.add('tooltip');
//  document.body.append(tip); 
// appending to parent chunks causes problems with tip position b/c the tip 
// would  be limited to the parent's window.

//console.log('tip', tip);
//  parseTTSTag(tip, 'light-color');

// link parent and child;
  el.child = tip;
  tip.parent = el;
  return tip;
//  await sleep (300);
//  tip.style.visibility = "visible";
}

const setTipContent = (parent, tip) => {
//  const tipClass = parent.getAttribute('tip-class');
//  tip.className = tipClass ? tipClass : 'tooltip-text';
  tip.className = parent.getAttribute('tip-class') || 'tooltip-text';
  
  tip.style = parent.getAttribute('tip-style') || '';
//console.log('tip-class', tip.className);
  let res = '';
  if (parent.id) res = tipStore.get(parent.id);
  if (!res) res = parent.getAttribute('tip');

  res = highlightText(res); // added 2025-10-11
  tip.innerHTML = res;
  if (!res) return 0;
  if (res.includes('<a ')) tip.className = 'tooltip-link';

  setTipPosition(tip, parent);
  setTipImageWidth(tip);
//  parseTTSTag(tip, 'light-color');// is light-color needed?
  parseTTSTag(tip);

  return 1;
}

const setTipImageWidth = tip => {
//  let width = getTipWidth(); // doesn't work until a tip has been shown;
//  if (!width) return;
//  width = width.slice(0, -2); // remove 'px'
  width = '200';
  if (tip.firstChild.nodeName === 'IMG')
    tip.firstChild.width = width;
	  
  if (tip.firstChild.firstChild && tip.firstChild.firstChild.nodeName === 'IMG')
// what if image isn't first child? use .childNodes or .children
    tip.firstChild.firstChild.width = width;
}

const setTipPosition = (tip, parent) => {
// For now, ignore arrows. But adjustment for arrows can be added later.
  if (tip.classList.contains('arrow')) return;
  
  const coords = getCoords(parent);
  let left = coords.left;
  let top = coords.bottom;
  let bottom = -1;
  let bottomIsSet = false;
  let right = -1;
  const pos = parent.getAttribute('pos');
  if (pos === 'right') {
    left = coords.right;
    top = coords.top;
  }

  if (pos && pos.includes('bottom:')) {
    top = coords.bottom + parseFloat(pos.split('bottom:')[1]);
  }
  
  const isTypicalTooltip = el => ['task-tip', 'tooltip-text', 'tooltip-link', 'flashcard'].some(s => el.classList.contains(s));

//  if ((tip.classList.contains('tooltip-text') || tip.classList.contains('tooltip-link') || tip.classList.contains('flashcard')) && top > (scrollY + innerHeight - 170)) {
  if ((isTypicalTooltip(tip)) 
	&& top > (scrollY + innerHeight - 170)) {
//      const body = qsel('body');
//	  bottom = body.offsetHeight - coords.top;
	  bottom = innerHeight - coords.top;
	  bottomIsSet = true;
  }

//  if (bottom >= 0) {
  if (bottomIsSet) {
	  tip.style.top = '';
	  tip.style.bottom = bottom + 'px';
  } else {
	  tip.style.top = top + 'px';
	  tip.style.bottom = '';
  }
	  
//  if ((tip.classList.contains('tooltip-text') || tip.classList.contains('tooltip-link') || tip.classList.contains('flashcard')) && left > (innerWidth - 220))
  if ((isTypicalTooltip(tip))
    && left > (innerWidth - 220))
    right = 0;

  if (right >= 0) {
	tip.style.left = '';
	tip.style.right = '5px';
  } else {
	tip.style.left = left + 'px';
	tip.style.right = '';
  }
}

//  ** RECORDING **
// combine screen and mic audio - see https://javascript.plainenglish.io/build-audio-video-and-screen-recorder-for-web-with-javascript-583584dd3c75
// https://stackoverflow.com/questions/55165335/how-do-you-combine-many-audio-tracks-into-one-for-mediarecorder-api

//const openMic = async () => await navigator.mediaDevices.getUserMedia({ audio: {groupID: {exact: 'da85b3457b7493b4f8ed7009d473ae421db3c0bd29742d1089fec3b8ea1c4871'}, echoCancellation: false} });
const openMic = async (v = { audio: {echoCancellation: true, noiseSuppression: true} }) => await navigator.mediaDevices.getUserMedia(v);
const openDisplayStream = async () => await navigator.mediaDevices.getDisplayMedia({video: true, audio: true});

const stopTracks = stream => {
  if (stream) stream.getTracks() .forEach(track => {
    if (track.readyState === 'live' && ['audio', 'video'].includes(track.kind))
      track.stop();
  });
}

const getAudioRecorder = (cmd = 'MIC') => new Promise(async resolve => {
  const	audioContext = new AudioContext(),
	dest = audioContext.createMediaStreamDestination();

  let displayStream = null, displayAudioTracks = [], voiceStream = null;
//console.log('CMD', cmd);
  if (cmd.includes('SCREEN')) {
    try {
      displayStream = await openDisplayStream();
      displayAudioTracks = displayStream.getAudioTracks();
	  if (displayAudioTracks.length) {
        const displayAudioStream = new MediaStream(displayAudioTracks);
        audioContext.createMediaStreamSource(displayAudioStream) .connect(dest);
      } else console.log('Warning: Screen audio is not shared');
    } catch(err) {
console.log('Screen recording not done:', err);
    }
  }

  if (cmd.includes('MIC')) {
	const cancelEcho = (displayAudioTracks.length);
    try {
      voiceStream = await openMic({ audio: {echoCancellation: cancelEcho, noiseSuppression: true} });
	  audioContext.createMediaStreamSource(voiceStream) .connect(dest);
    } catch(err) {
console.log('Mic recording error:', err);
    }
  }

  if (voiceStream === null && !displayAudioTracks.length) {
console.log('Warning: no audio tracks, exiting...');
    stopTracks(displayStream);
    resolve({ noAudio: true, micState: false });
  }
  else if (cmd.includes('TEST')) {
    stopTracks(voiceStream);
	stopTracks(displayStream);
    resolve({ micState: true });
  }

  const mediaRecorder = new MediaRecorder(dest.stream);
  let audioChunks = [];

  mediaRecorder.ondataavailable = e => { audioChunks.push(e.data); }

  const start = async () => {
//ttsGame.mediaDevices = navigator.mediaDevices.enumerateDevices();
    await sleep(170); // to exclude recording a loud click
	audioChunks = [];
    mediaRecorder.start();
  }
  
/*
  let audioUrl;
  const clean = async () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
console.log('URL.revokeObjectURL(audioUrl):', audioUrl);
  }
*/

  const stop = (keep = false) => new Promise(resolve => {
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/ogg' }); //type important for downloading and for Safari
      const audioUrl = URL.createObjectURL(audioBlob);
console.log('Audio recording stopped. Audio URL:', audioUrl);
      const audio = new Audio(audioUrl);
//      resolve({ audioUrl, audio });
      resolve({ audio });
    };
    if (mediaRecorder.state === "recording") mediaRecorder.stop();
    if (!keep) {
      stopTracks(voiceStream);
	  stopTracks(displayStream);
	}
  });

  resolve({ start, stop });
});

const testMic = async () => {;
  const res = await audioRecorder.testmic();
console.log('Mic active?', res);
  if (!res) {
console.log('Please check the mic');
    displayAlarmMessage('Please check the microphone');
    if (!embedPageActive()) setRecSwitch(0);
	await sleep(2700); // should be tested
  }
  return res;
}

const audioRecAllowed = () => audioRecAllowed2() 
//  && (elid('rec-checkbox-div').style.display !== 'none');

const audioRecAllowed2 = () => elid('rec-switch').classList.contains('switch-on');

const setRecSwitch = v => {
  setElClass(elid('rec-switch'), 'switch-on', v);
  if (v !== 'NO_CLICK_REC_SWITCH') clickRecSwitch(); // emulate click
}

const clickRecSwitch = async () => {
  if (audioRecAllowed2()) 
    if (! await testMic()) return;

  if (tasksPageActive()) handleRecMuteCheckbox();
}

const toggleRecSwitch = (el) => {
  el.firstElementChild.classList.toggle('switch-on');
  clickRecSwitch();
}

const audioRecorder = function() {
  let cmd, recMode, recState, recorder, record, audio = '', pbr = 1, pbrBasic = 1,
//    startTime, stopTime, recLength, 
	isAudioLocked, keepRecorder;
/*
  const getNewRecorder = async () => {
    recorder = await getAudioRecorder(recMode);
console.log('New recorder ready');
  }
*/

  const cleanAudio = (audio) => {
	if (audio) { 
console.log('Old audio record cleaned');
      URL.revokeObjectURL(audio.src);
	}
	return '';
  }

  const setCmd = async newCmd => {
    if (cmd === newCmd) return; //debounce
console.log('audioRecorder cmd', newCmd);
    switch(newCmd){
      case 'REC_START':
	    newCmd = 'REC_START_MIC';
       if (!audioRecAllowed() || isAudioLocked 
       || recState === 'started') return;
//     else continue 

      case 'REC_START_SCREEN':
      case 'REC_START_MIC_SCREEN':

        cmd = newCmd;
		recMode = newCmd;
        audio = cleanAudio(audio);
        try {        
          if (!recorder || !keepRecorder) {
console.log('waiting for new recorder');
            recorder = await getAudioRecorder(cmd);
          }
		  
		  if (recorder.noAudio) {
console.log('Recorder: NO AUDIO TRACKS');
            recState = 'failed_start';
		    cmd = '';
            break;
          }
//console.log('Recorder:', recorder);
          await recorder.start();
          recState = 'started'; 
//          startTime = Date.now();
console.log('Recording STARTED');
        } catch(err) {
console.log('RECORDER START FAILED:', err); 
	      recState = 'failed_start';
	    }
        break;

      case 'REC_STOP_AND_LOCK':
       if (recState !== 'started') return;
       isAudioLocked = true;
console.log('REC_STOP_AND_LOCK');
       setCmd('REC_STOP');
       break;

      case 'REC_STOP': // run it even if (!audioRecAllowed())
       if (recState !== 'started') return;
       recState = 'stopping';
       cmd = newCmd; 
//       stopTime = Date.now();
//       recLength = stopTime - startTime;
//console.log('Record length =', recLength);

       record = await recorder.stop(keepRecorder);
	   audio = record.audio;
       recState = 'recorded'; 
console.log('AUDIO RECORDED');
//       if (audio) getNewRecorder();
      break;

      case 'REC_PLAY':
       if (!audioRecAllowed()) return;
console.log('cmd', cmd);
//       if (record && recState === 'recorded') { 
       if (audio) { 
	     audio.currentTime = 0;
         audio.playbackRate = pbr/pbrBasic;
         audio.play(); 
         recState = 'playing';

// another cmd might be used in the future to avoid setting timeout if needed
// or onended event might be used to set recState
         record.audio.onended = () => {
// is record.audio.pause() needed?
           recState = 'played';
console.log('Audio recording playing ended');
         }
/*
        if (wordsPageActive()) {
console.log('PREPARE a new recorder with', recMode);
           recorder = await getAudioRecorder(recMode); // prepare a new recorder in advance for shadow reading
		}
*/

/*
         setTimeout(()=>{
           record.audio.pause(); //there's no stop fn for audioBlob
           recState = 'played';
console.log('REC_PLAY_ENDED');
         }, recLength/pbr);
*/
        } else console.log('No audioRec to play!');
      break;

      case 'REC_PAUSE':
	    if (audio) { // should audio state playing be checked?
          recState = 'paused';
console.log('REC_PAUSE');
          audio.pause();
		}
      break;

      case 'REC_DISCARD':
//       record = '';
	     audio = cleanAudio(audio);
       recState = 'discarded';
console.log('REC_DISCARDED');
       isAudioLocked = false;
      break;
  
	  case 'KEEP_RECORDER':
        keepRecorder = true;
	  break;
	  
	  case 'CREATE_RECORDER':
        if (!recorder) {
          recorder = await getAudioRecorder(cmd);
          recState = 'recorder_created'; 
console.log('recorder_created');
        }
	  break;

      case 'TURN_OFF_RECORDER':
	    if (recorder) {
          await recorder.stop();
		  recorder = '';
          audio = cleanAudio(audio);
          recState = 'recorder_turned_off';
console.log('recorder_turned_off');
		}
      break;
    }
  } // end of setCmd

  return {
    async testmic() {
      const res = await getAudioRecorder('TEST_MIC');
	  return res.micState;
    },

	inspect() { return { cmd: cmd, recMode: recMode, recState: recState, recorder: recorder, record: record, audio: audio, 
	pbr: pbr, pbrBasic: pbrBasic, isAudioLocked: isAudioLocked, keepRecorder: keepRecorder }},

	getRecSrc: () => audio.src,
    getState: () => recState,
    setSpeed: (v, v0 = 1) => { 
      pbr = v;
	  pbrBasic = v0; 
// recording length usually depends on the original cue length/pbr, so recording playback rate should take it into account
      if (audio) audio.playbackRate = v/v0; 
    },

    async cmd(v) { await setCmd(v) },

    startBanned: () => isAudioLocked,

    async playOnce() {
      if (!audioRecAllowed()) return;
      switch(recState){
        case 'started':
          setCmd('REC_STOP'); 
        // don't break
        case 'stopping':
          while (recState !== 'recorded') { await sleep(100); 
console.log('Waiting for recording to be stopped...');
          }
        // don't break
        case 'recorded':
         setCmd('REC_PLAY');
         while (recState !== 'played') { await sleep(100);
console.log('Waiting for the audio to be played...');
         }
console.log('Playing done.');
      }
    }
  }
}();

// END OF RECODRING PART

// Speed Controls

const speedCtrl = function() {
  const par = {}; // store speed parameters here

  const calcPBR = (i = 0) => {
    par.speedFactor = par.adv ? par.adv[i] : '';
    return recalcSpeeds().playSpeed;
  }

  const calcRecPBR = (v = 1) => {
    par.recAdv = v;
    return recalcSpeeds().recSpeed;
  }

  const recalcSpeeds = () => {
    const advFactor = parseFloat(par.speedFactor || '1'),
      advRecFactor = par.recAdv || '1',
      base = par.base || 1;
    par.pbr = base * advFactor;
    par.recpbr = base * advRecFactor;
    return { playSpeed: par.pbr, recSpeed: par.recpbr };
  }

  return {
    setBase: v => { par.base = parseFloat(v); recalcSpeeds(); },
    setAdvanced: v => { if (v) par.adv = v.split(','); calcPBR(0); },
    getAdvanced: () => par.adv || ['1'],
    calcSpeed: i => calcPBR(i),
    getPBR: () => par.pbr || 1,
    calcRecSpeed: v => calcRecPBR(v),
    getRecPBR: () => par.recpbr || 1,
    inspect: () => par
  }
}();

const cloneCtrlValue = (v, masterId) => {
  if (!v || !masterId) return;
// collect elements with id starting with masterId
  document.querySelectorAll(`[id^="${masterId}"]`) 
    .forEach(el => el.nextElementSibling.textContent = el.value = v)
}

const setPBR = srcEl => {
  const el = srcEl || elid('setpbr');
  const v = el.value;
  if (srcEl) // user changed control element
    localStorage.setItem('masterPBR', v);
  cloneCtrlValue(v, 'setpbr');
  speedCtrl.setBase(v);
  adjustPBR();
}

const getPlayerPBR = () => speedCtrl.getPBR();

const advancedSpeedUserChange = v => {
  localStorage.setItem('speedFactors', v);
  setAdvancedSpeed(v);
}

const setAdvancedSpeed = v => {
  speedCtrl.setAdvanced(v);
  setReplayNumber(speedCtrl.getAdvanced().length); //adjust rep-num control
}

const adjustSpeeds = v => {
  if (v) {
    elid('speed-set').value = v;
    setAdvancedSpeed(v);
  }
}

const adjustPBR = () => {
  let pbr = getPlayerPBR();
  let recpbr = speedCtrl.getRecPBR();
  if (players.speedCtrlLeft) {
    pbr /= 2;
    recpbr /= 2;
  }
  setPlayerSpeed(pbr);
  audioRecorder.setSpeed(recpbr);
}

const speedCtrlEl = (s = '') => {
  const tip = `Actual playback speed depends on master speed rate and on cue speed factors (see advanced settings).
<x-br></x-br>
To slow down temporarily, press and hold left <kbd>Ctrl</kbd> key.
`;
  return '<label><div>Master speed rate'
  + uiblox.infoPoint(tip)
  + getPbrHtml(s) 
  + '</div></label>';
}

const advSpeedCtrlEl = () => {
  const tip = 'Comma-separated relative speed factors specify how many times and how fast a cue is played';

  return `<div id="speed-set-box" class="inblock">
<label>Cue speed factors`
  + uiblox.infoPoint(tip)
  + `<input type="text" id="speed-set" placeholder="E.g., 0.9, 0.75, 1"
    style="width: 7em;"  oninput="advancedSpeedUserChange(this.value)"/> 
</label>
</div>
`;
}

/*
const recSwitchEl = `
Speech recording allowed
<label class="switch show-focus">
  <input id="rec-switch" type="checkbox" onchange="clickRecSwitch()">
  <div class="slider round"></div>
</label>
`;
*/

const recSwitchEl = `
Speech recording allowed
<button class="plain-button switch-btn show-focus" onclick="toggleRecSwitch(this)">
  <div id="rec-switch" class="slider round"></div>
</button>
`;

const adjustRepNum = (el) => {
  setRepNum();
  const repnum = parseInt(elid('rep-num').value);

  let speeds = "1";
  for (let i=1; i<repnum; i++) {
    speeds += ", 0.7"; 
    i++;
    if (i < repnum) speeds += ", 1"; 
  }
  adjustSpeeds(speeds);

  if (el) // user changed control element
    localStorage.setItem('speedFactors', speeds);
}

// END OF SPEED CONTROLS

// Google Ngram Viewer iframe
const getNgramOptions = s => {
  if (s.match(/(\w+)/g).length > 3) return '';
  return `<b>See also</b><br>
<a onclick="updateNgram('${s}', '*_NOUN ')">noun + ~</a> <br>
<a onclick="updateNgram('${s}','', ' *_NOUN')">~ + noun</a> <br>
<a onclick="updateNgram('${s}', '*_VERB ')">verb + ~</a> <br>
<a onclick="updateNgram('${s}','', ' *_VERB')">~ + verb</a> <br>
<a onclick="updateNgram('${s}', '*_ADJ ')">adj + ~</a> <br>
<a onclick="updateNgram('${s}','', ' *_ADJ')">~ + adj</a> <br>
<a onclick="updateNgram('${s}', '*_ADV ')">adv + ~</a> <br>
<a onclick="updateNgram('${s}','', ' *_ADV')">~ + adv</a>
`
}

const updateNgram = (str, prefix = '', suffix = '') => {
  setElHTML("iframe-box", '<iframe id="iframe-ngram"></iframe>'); // clear iframe
/*
  const chunks = s.split(',');
  let txt = '';
  for (const chunk of chunks) txt += prefix + chunk + suffix + ',';
*/
  const txt = str.split(',') .map(s => prefix + s + suffix) .join();
  elid('iframe-ngram').src = ngramRef(txt);
}

const ngramRef = s => `https://books.google.com/ngrams/graph?content=${s}
&year_start=1800&year_end=2019&corpus=26&smoothing=3`;

//const ngramIframe = s => '<iframe id="iframe-ngram" src=' + ngramRef(s) + '></iframe>';

const showNgram = s => {
  const ngramOptions = getNgramOptions(s) || '',
    url = ngramRef(s),
    ifr = '<iframe id="iframe-ngram" src="' + url + '"></iframe>',
    txt = `<div class="flex-container" style="width: 100%; height: 95%">
<div id="iframe-box" class="border-green" style="width: 87%">${ifr}</div>
<div class="ext-link" style="margin-top: -1.5em;" title="View this in a new tab">
<a href="${url}" target="_blank">&#x20d5</a>
</div>
<div style="width: auto; font-size: 80%; text-align: left; padding: 1em;">${ngramOptions}</div>
</div>
`;
//console.log('Show ngram', s);
  displayInfopage(txt, {width: '75vw', height: '90vh'});
}

const tipStore = function() {
	const idKey = 'tip-ancor';
	let tipArr = [];
	const add = s => {
	  if (!s) return '';
	  tipArr.push(s);
	  return idKey + (tipArr.length -1);
	}

	const get = id => {
	  const i = id.split(idKey)[1] || '';
	  return tipArr[i];
	}

	return {
	  reset: () => {tipArr = []},
	  add: add,
	  get: get,
	  getByN: i => tipArr[i],
	  inspect: () => tipArr
	}
}();

const highlightText = txt => {
  if (!txt) return '';

  const mark = (s, tag, n=1) => '<' + tag + '>' + s.slice(n, -n) + '</' +tag + '>';

  const toHeader = s => { // converts #s to header tags
	const spacePos = s.indexOf(' ');
	const hn = 'h' + (spacePos - s.indexOf('#'));
	let str = s.slice(spacePos).trim();
	if (str.endsWith('<x-p>')) { // expandable element, could be later checked with match for <x-p title="...">
      str = str.slice(0, -5); // cut off <x-p>
      return `<${hn} class="inblock">${str}</${hn}><x-p>`;
    }
	else if (str.endsWith('</x-p>')) { // end of expandable element
      str = str.slice(0, -6); // cut off </x-p>
      return `<${hn} class="inblock">${str}</${hn}></x-p>`;
    }
	else return `<${hn}>${str}</${hn}>`;
  }

  const getTipTag = (tipHtml, txt) => {
	if (!tipHtml || !txt) return txt;
	const tipClass = (txt === '◦')? 'lookup-tip' : 'task-tip'; // a stopgap for alternative tip classes

	txt = highlightText(txt);
//	tipHtml = highlightText(tipHtml); // b/c highlightText is applied in setTipContent
	const tipAnchorId = tipStore.add(tipHtml);
	return `<span id=${tipAnchorId} class=${tipClass} tip>${txt}</span>`;
  }

  const expandTip = (tip, s) => {
	const atag = expandLink(s);
	const txt = atag[0];
	const url = atag[1];
	if (url) {
	  tip = `[${tip}](${url})`;
	  tip = expandLink(tip)[0];
	}
	return getTipTag(tip, txt);
  }

  const expandTip2 = s => {
	const parts = getParts(s, 'tip:');
	return getTipTag(parts[1].trim(), parts[0]);
  }

  const expandWithKey = (s, key) => {
	const parts = getParts(s, key);
	let code = parts[1].trim();
    let playAttr = code.split(' ');
	if (!playAttr[1]) playAttr[1] = '0:0';
	if (key === 'stream:' && !code.includes(':')) code = 'https://youtu.be/' + code;
// 2025-07-10: experimental: try using cueTagBtn 
	if (key === 'play:' && !parts[0]) return cueTagBtn({url: playAttr[0], time: playAttr[1], title: 'Play/pause'});

// player-title might be added for streaming
	const res = {
		'color:': `<color:${code}>${parts[0]}</color>`,
		'bcolor:': `<bcolor:${code}>${parts[0]}</bcolor>`,
		'cue:': `<cue time="${code}" title="Play ${code}">${parts[0]}</cue>`,
		'play:': `<cue url="${playAttr[0]}" time="${playAttr[1]}">${parts[0]}</cue>`,
		'stream:': `<cue url="${code}">${parts[0]}</cue>`,
	};
	return res[key];
  }

  const getTextFromDDList = s => s.split('|') // get array of options
	  .filter(option => option.startsWith('**')) // leave only correct options
	  .join(' or ') // make a text string
	  .replace(/\*/g, ''); // remove asrerisks

  const getTextFromGap = s => s.split(/=>|\\--/)[0] .trim() .replace(/\\|\//g, ' or ');

  const getTextFromGapOrDD = s => s.includes('**') ? 
    getTextFromDDList(s) : getTextFromGap(s);

  const getTextToSay = s => s
      .replace(/\[\[(.*?)\]\]/g, (s, s1) => getTextFromGapOrDD(s1))
      .replace(/<<(.*?)>>/g, (s, s1) => getTextFromGap(s1))
      .replace(/<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g, '') //remove html tags
      .replace(/\[.*?\]\(say:(.*?)\)/g, (s, p1) => p1 + ' ') //extract what to say
      .replace(/\(.*?\)/g, '') //remove comments in brackets

  const ttsLineBtn = s => {
    s = s.slice(3); // remove <))
	let say = '';
    if (/\[\[|<<|\]\(say:/.test(s)) {
	  say = 'say="' + getTextToSay(s) + '"'
//      s = s.replace(/\[.*?\]\(say:.*?\)/g, s => s.split('](say:')[0].slice(1)); 
      s = s.replace(/\[(.*?)\]\(say:.*?\)/g, (match, p1) => p1); 
	}
    return `<tts pos="before" ${say}>${s}</tts>`;
  }

  const ttsBtn = s => {
    if (s.startsWith('<))')) {
//      return '<tts pos=before>' + s.slice(4, -1) + '</tts>'; 
      s = s.slice(3, -1).replace(/\[|\]/g, '');
      const say = getTextToSay(s);
	  return `<tts pos="before" say="${say}">${s}</tts>`;
    } else

    if (s.startsWith('<)')) // Shows only the speaker btn, not the text. Don't use formatted text for this!
	  return '<tts say="' + s.slice(3, -1) + '"></tts>'; 
  }

//  const ttsBtn3 = s => '<tts pos="before">' + s.split('](')[0].slice(1) + '</tts>'; 

  const getParts = (s, splitter = '') => s.slice(1, -1).split('](' + splitter);

  const expandLink = s => { 
  // links as described at https://www.markdownguide.org/basic-syntax/#adding-titles
    const parts = getParts(s);
	if (!parts[1]) return [s];

    const atext = parts[0];
	const atag = parts[1];

//	if (atag.startsWith('tts:')) return ttsBtn3(s);
//	if (atag.startsWith('himark:')) return [expandHilight(s)];
	if (atag.startsWith('say:')) return [s];
	if (atag.startsWith('tip:')) return [expandTip2(s)];

	for (const key of ['color:', 'bcolor:', 'cue:', 'play:', 'stream:']) 
	  if (atag.startsWith(key)) return [expandWithKey(s, key)];

// [](x-vars: ...) // put x-vars params this way?

	let firstSpaceAt = atag.indexOf(' ');
	let url, attributes;
	if (firstSpaceAt === -1) { // no space after url = no attributes
	  url = atag;
	  attributes = '';
	} else {
	  url = atag.slice(0, firstSpaceAt);
	  attributes = atag.slice(firstSpaceAt + 1);
//	  if (!attributes.includes('class="') && !attributes.includes('style="'))
	  if (!/class="|style="|onclick="/.test(attributes))
        attributes = 'title="' + attributes + '"';
	}

//	const target = (url.startsWith('http'))? 'target="_blank"' : ''; // " can interfere with tips
	const target = (url.startsWith('http'))? 'target=_blank' : ''; 

    if (url.endsWith('.txt') && !url.includes('?t=') && !url.includes('url=')) // for task filenames
	// use compact url instead of getNewURL
      url = getActivityKey() + squeezedUrl(url, 0); // what if url starts with / or ../ ?

    return [`<a href=${url} ${attributes} ${target}>${atext}</a>`, url];
  }

  const expandDblBraces = (match, p) => {
	const s = p.trim();
	const tipArr = s.split('|');
	if (tipArr[1]) return expandTip(tipArr[0].trim(), tipArr[1].trim());

	const par = s.slice(s.indexOf(':') + 1) .trim();
	if (s.startsWith('audio:')) return expandAudio(par);
	if (s.startsWith('video:')) return expandVideo(par);
	if (s.startsWith('img:')) return expandImage(par);
    return match;
  }

  const expandAudio = url => `<audio style="height:40px" src="${getNewURL(url)}" controls></audio>`;

  const expandVideo = url => {
    const YTId = getYouTubeId(url);
    if (YTId) return `<div><iframe style="width:480px; height:270px" src="https://www.youtube.com/embed/${YTId}" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"     referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
    else return `<video style="max-width:75%" src="${getNewURL(url)}" controls></video>`;
  }

  const expandImage = url => `<img style="max-width:75%" src="${getNewURL(url)}">`; // title might be extracted

  const simpleATag = url => `<a href=${url} target="_blank">${url}</a>`;

  const toStyle = (style, txt) => `\n<div style="line-height:1.4em;font-size:${style}">${txt}</div>`;

// the leading \n is added (and removed in the end). This helps, e.g. with ### lines
  txt = '\n' + txt;
//gstore.debugTxt = txt;
  txt = txt
  .replace(/\r/g, '')
  

// Special chars are protected by escaping them, e.g. '\\)' or '\\|' or '\\.'
// Choose the chars to escape inside the char class [...] wisely
  .replace(/\\([*|(),\.~])/g, (match, p1) => `___ESCAPED_${p1.charCodeAt(0)}___`)

//.replace(/\n##font-size:(\s?.*)##\x20(.*)(\n|$$)/g, (s, p1, p2) => toStyle(p1, p2)) // why $$ in regex?
  .replace(/\n##font-size:(\s?.*)##\x20(.*)(\n|$)/g, (s, p1, p2) => toStyle(p1, p2))
//  .replace(/\r?\n#+\x20.*\r?\n/g, s => toHeader(s))
  .replace(/\n#+\x20.*\n/g, s => toHeader(s))
  .replace(/\n\x20\*./g, s => '\n\&thinsp;&bull;&thinsp;' + s[3]) // bullet point
  .replace(/\n\x20\S/g, s => '\n&emsp;' + s[2]) // indent
// <hr> as in https://www.markdownguide.org/basic-syntax/#horizontal-rules
  .replace(/\n\n(-|_|\*){3,}\n\n/g, '<hr>')
  .replace(/<br><br>(-|_|\*){3,}<br><br>/g, '<hr>')
  .replace(/<hr>\n/g, '<hr>')
  .replace(/<hr><br>/g, '<hr>')

// look for \*{1,3} instead? This would allow for <i> and/or <b>
//   .replace(/(?<!\*)\*(?!\*).*?[\S^\*]\*(?!\*)/g, s => mark(s, 'b')) //ignore ** (lookbehind doesn't work in Safari as of 2023-01-31)
//   .replace(/\*\*(?!\*)[\S^\*].*?[\S^\*]\*\*(?!\*)/g, s => mark(s, 'i', 2)) //stopgap solution
  .replace(/\^\^.+?\^\^/g, s => mark(s, 'x-small-caps', 2))
  .replace(/\=\=.+?\=\=/g, s => mark(s, 'mark', 2))
//   .replace(/\=\=(.+?)\=\=/g, (s, p1) => `<mark>${p1}</mark>`)

  .replace(/\|_.+?_\|/g, s => mark(s, 'kbd', 2))
  .replace(/``.+?``/g, s => mark(s, 'kbd', 2))

  .replace(/`[\S^`]`/g, s => mark(s, 'code')) // for ~a~ one-letter case
  .replace(/`[\S^`].*?[\S^`]`/g, s => mark(s, 'code')) // doesn't work for `a` one-letter case

  .replace(/\~[\S^\~]\~/g, s => mark(s, 'i')) // for ~a~ one-letter case
  .replace(/\~[\S^\~].*?[\S^\~]\~/g, s => mark(s, 'i')) // doesn't work for ~a~ one-letter case
// underscores do not work well for italics b/c '_' is used in gaps and _blank attribute of <a> tags

//   .replace(/\*\*/g, '{two-stars}') // preserve ** used e.g., for drop-down lists
  .replace(/\*\*/g, '{star}{star}') // preserve ** used e.g., for drop-down lists
  .replace(/\*[\S^\*]\*/g, s => mark(s, 'b')) // for *a* one-letter case
  .replace(/\*[\S^\*].*?[\S^\*]\*/g, s => mark(s, 'b')) // doesn't work for *a* one-letter case
//   .replace(/{two-stars}/g, '**') // restore **
  .replace(/{star}/g, '*') // insert *

// {x-vars .*?} can be added 
  .replace(/\<https?:\/\/.*?\>/g, s => simpleATag(s.slice(1, -1))) // hyperlink as <https?://...>  

//  .replace(/[{]{2,}[^\|]+?\|[^\|]+?[}]{2,}/g, s => expandTip(s)) // tips as {{tip|text}}
//  .replace(/{{\s*audio\s*:\s*([^]+?\s*)}}/g, (match, p1) => expandAudio(p1)) // video as {{video:url}}
//  .replace(/{{\s*video\s*:\s*([^]+?\s*)}}/g, (match, p1) => expandVideo(p1)) // video as {{video:url}}
//  .replace(/[{]{2,}([^\|]+?)\|([^\|]+?)[}]{2,}/g, (match, p1, p2) => expandTip(p1, p2)) // tips as {{tip|text}}

  .replace(/{{([^]+?)}}/g, (match, p) => expandDblBraces(match, p))
  .replace(/\[[^\[]*?\]\(.*?\)?\)/g, s => expandLink(s)[0])

// the order of the two lines to handle tts changed 2024-05-17. Should monitor for side effects.
//  .replace(/\<\)\)?\s*?\[.*?\]/g, s => ttsBtn(s)) // tts for <))[text]... or <)[text]...
  .replace(/\<\)\)?\s*?\[([^\[]+\])/g, s => ttsBtn(s)) // tts for <))[text]... or <)[text]... but not <)) [[text]
//  .replace(/<\)\).*?(?=\n|\r|<br>|$|<\)\)?|<x-br)/g, s => ttsLineBtn(s)) 
  .replace(/<\)\).*?(?=\n|<br>|$|<\)\)?|<x-br)/g, s => ttsLineBtn(s)) 
  // tts for text before any of these tockens:
  // \n, \r, <br>, [end of line], <), <)), <x-br

  .replace(/\${gstore\.(\w+)}/g, (match, p1) => gstore[p1] || '') // insert gstore const
// Protected chars are restored
  .replace(/___ESCAPED_(\d+)___/g, (match, p1) => String.fromCharCode(p1))

  .trimStart() // remove the leading \n if any
  ;
  return txt;
}

const showSpinner = eID => {
  const spinner = '<div class="flex-center" style="height: 100%"><div class="spinner"></div></div>';
  setElHTML(eID, spinner);
}

const fetchText = async url => {
  const response = await fetch(getNewURL(url, 1));

  if (!response.ok) {
//    throw new Error('File loading error: ' + response.status);
    return '';
  }

  const txt = await response.text();
  return txt;
}

const fetchDirInfo = async () => {
  gstore.dirInfo = 'LOADING';
  try {
      gstore.dirInfo = await fetchText('dir.info');
	  if (gstore.dirInfo) gCallback('DIR_INFO_LOADED')
	  else console.log('Dir.info file not found');
  } catch(e) {
      console.error('Dir.info fetch error', e);
//	  gstore.dirInfo = 'ERROR';
	  gstore.dirInfo = ''; // b/c later it's checked: if (!gstore.dirInfo)...
  }
}

const ttsCallBack = (cmd, data) => {
console.log(cmd);

  if (cmd === 'TTS_DEBUG') {
console.log('Debug data:', JSON.stringify(data));
	displayInfopage(JSON.stringify(data));
  }

  if (cmd === 'TTS_STARTED') afterTTSStarted();
  if (cmd === 'TTS_ENDED') afterTTSEnded();
  
  if (langListCtrl()) {
    if (cmd === 'TTS_GOT_LANG_VOICES') loadVoiceList(data); 

    if (cmd === 'VOICES_CHANGED_EVENT') loadLangList();
  
    if (cmd === 'NO_VOICE') displayAlarmMessage('There is no voice for ' + langListCtrl().value);
  }
}

const afterTTSStarted = () => {
  if (tasksPageActive()) gCallback('TTS_STARTED'); 
}

const afterTTSEnded = () => {
  if (wordsPageActive() || embedPageActive()) { 
    restartSTT(); 
  }
  if (tasksPageActive()) gCallback('TTS_ENDED'); 

}

const changeEpisodeUrl = (s, v, pad, min, max) => {
//  const getCurNum = s => String(s).replace(/[\D]/g, ''); // why String object?
  const getCurNum = s => s.replace(/[\D]/g, '');
  const addToNum = (s, v = 0) => parseInt(getCurNum(s)) + parseInt(v);

  const fname = getFnameFromUrl(s);
  const i = addToNum(fname, v);
  if ((i < 0) || (min && i < min) || (max && i > max)) return '';

 if (!pad) pad = getCurNum(fname).length;
  const n = String(i).padStart(pad, '0');

  const i0 = addToNum(fname, 0);
  const n0 = String(i0).padStart(pad, '0');

  const path = getPathFromUrl(s);
//  return path + String(fname).replace(n0, n); // why String object here?
  return path + fname.replace(n0, n);
}

const prevNextEpisodeUrl = (url, epList, v) => {
  const epArray = epList.split(',').map(e => e.trim());
  const currentFname = getFnameFromUrl(url);
  const currentIndex = epArray.indexOf(currentFname);
console.log(currentIndex, ': ', currentFname);

  const newIndex = currentIndex + v;
  if (currentIndex === -1 || newIndex < 0 || newIndex >= epArray.length) return '';

  const currentPath = getPathFromUrl(url);
  const newUrl = currentPath + epArray[newIndex];
console.log(newIndex, ': ', newUrl);
  return newUrl;
}

const setFontSize = inputV => {
  let v;
  if (!inputV || (typeof inputV === 'object')) {
    const el = inputV || elid('input-fsize');
    v = el.value;
  }
  else v = Number(inputV);
  if (!v || v < 0) return;

  if (typeof inputV === 'object') // user changed control element
    localStorage.setItem('fontSize', v);

  cloneCtrlValue(v, 'input-fsize');
  v += 'pt';
  if (tasksPageActive()) transcriptText.style.fontSize = v;
  if (wordsPageActive()) {
    ta.style.fontSize = v;
    gstore.notes.style.fontSize = v;
  }
}

const getDirInfoKey = key => {
    const line = (gstore.dirInfo || '').split('\n').filter(s => s.includes(key))[0];
	return line? line.split(key)[1].trim() : '';
}

const getIndexFileName = () => getDirInfoKey('index-file:');//e.g., 'voa-index-pl.txt'

const isEpiNavPossible = () => !!(getIndexFileName() 
  || getDirInfoKey('first-episode:') || getDirInfoKey('last-episode:')
  || getDirInfoKey('episode-list:'));

const isIndexFile = url => {
  const indexFname = getIndexFileName();
  return indexFname && url.includes(indexFname);
}

const getEpisodeNavigation = (dirInfo, url) => {
  if (!url 
	  || !dirInfo
      || isIndexFile(url) // navigation is not needed for index file
//      || (wordsPageActive() && ttsGame.loadStatus !== 'loaded') // why is this test needed?
	  ) return ''; 

/*
  const atagOld = (btn, href, note) => `[<div class="inline-flex padding-03em rounded btn-lighgray">${btn}</div>]`
    + `(${actKey}${href} class="no-text-deco" title="To the ${note}")`;
*/
  const active = (btn, href, note) => {
    const key = getActivityKey();
	return `<div class="inline-flex padding-03em rounded acolor btn-lighgray" 
	  onclick="changeEpisode('${key}', '${href}')" 
	  title="To the ${note}">${btn}</div>`;
  }
  
  const inactive = btn => `<div class="inline-flex padding-03em discolor">${btn}</div>`;
  const navButton = (btn, href, note) => href? active(btn, href, note) : inactive(btn); // link as [text](url attributes)

  url = squeezedUrl(url);
  const firstEp = getDirInfoKey('first-episode:');
  const lastEp = getDirInfoKey('last-episode:');
  const epList = getDirInfoKey('episode-list:');
  
//  const newRef = v => changeEpisodeUrl(url, v, '', firstEp, lastEp);
  const newRef = v => epList? prevNextEpisodeUrl(url, epList, v) : changeEpisodeUrl(url, v, '', firstEp, lastEp);

//  const prevBtn = navButton('🡰', newRef(-1), 'previous task');
  const prevBtn = navButton('<span style="transform: rotateY(180deg);">&#10154;</span>', newRef(-1), 'previous task');
//  const nextBtn = navButton('🡲', newRef(1), 'next task');
//  const nextBtn = navButton('&#129138;&#xfe0f;', newRef(1), 'next task');
  const nextBtn = navButton('&#10154;', newRef(1), 'next task');

  const indexFile = getIndexFileName();
  const indexRef = getPathFromUrl(url) + indexFile;
  const indexBtn = indexFile? navButton('index', indexRef, 'list of related tasks') : ' ';

  return '<div id="episode-nav-bar" class="epi-nav-bar">Browse tasks: ' + prevBtn + indexBtn + nextBtn + '</div>';
// instead of 'Browse tasks: ' it could be, e.g., 'Related tasks: ' or 'More episodes: '
}

const setDocTitle = s => { 
  document.title = s || getDirInfoKey('doc-title:') || gstore.defaultDocTitle || '';
}

const langListCtrl = () => elid('language-select');

const setTopMenu = () => setElHTML('top-menu', uiblox.topMenuHtml);
const setBottomBar = () => setElHTML('bottom-bar', uiblox.bottomBarHtml.replace(':TRAN:', '<b>' + gstore.translateIcon + '</b>' + 'Translate this site'));

const loadCommonItems = () => {
  setElHTML('set-fsize', getFsizeHtml());
  setFontSize();

  setElHTML('master-pbr-box', speedCtrlEl());
  setElHTML('advanced-speed-box', advSpeedCtrlEl());
  setElHTML('rec-switch-box', recSwitchEl);
  if (wordsPageActive()) setElHTML('vocab-settings-box', uiblox.vocabSettings()); // why is it in common fn?
  
  setTopMenu();
  setBottomBar();


  document.querySelectorAll('.settings-icon') .forEach(el => el.innerHTML = gstore.settingsIcon);
  setElHTML('top-menu-settings', gstore.settingsIcon + '<span style="padding: 0 .2em; vertical-align: -10%;">Settings</span>');
//  setElHTML('top-menu-settings', gstore.settingsIcon + 'Settings');
  

  hideOnClickOutside();

  adjustSpeeds(localStorage.getItem('speedFactors') || '1, 0.7');
  setPBR();

  addLangCtrl();
console.log('langListCtrl', !!langListCtrl());

  const ttsInitParam = {
    langSelector: langListCtrl(), 
	langNames: gstore.langNames, 
	langCodes: gstore.langCodes
  };
//  ttsInitParam.langSelector = elid('language-select');
  tts.init(ttsInitParam);
  
  loadLangList();
  addVoicesCtrl('');
  googleTranslateElementInit();
  gstore.tips.initAll(); //experimental 2025-10-12
}

async function googleTranslateElementInit() {
  const elName = 'google_translate_el';
  if (isIOS() && window.innerWidth < 400) {
// On iOS, Google Translate widget seems to load at the top of the screen by itself.
// On a narrow screen, the widget it doesn't fit, so there's no colse button. 
// So as a temp measure, translation feature is turned off on iOS with a narrow screen.
// Maybe the same problem can be seen on Android and other systems too.
	hideEl(elid(elName).parentNode);
    return; 
  }
  await sleep(100); // without it, for some reason, the widget doesn't load in info/index.html
  new google.translate.TranslateElement(
    {
	  pageLanguage: 'en',
//	  layout: google.translate.TranslateElement.InlineLayout.VERTICAL // or .SIMPLE
	},
    elName
  );

  qsel('body').style=''; // b/c Google Translate widget sets body to relative position
}

const isIOS = () => (/iPad|iPhone|iPod/.test(navigator.platform) 
  || /iPad|iPhone|iPod/.test(navigator.userAgent)) && !window.MSStream;

const setVoiceList = (par) => {
  const numOfVoices = par.voices.length;
  let voiceList = '',
      voiceText = '---',
	  voiceName = 'TTS voice is not avaiable for this language';
	  
  for (const [i, voice] of par.voices.entries()) {
//	if (par.shortNames) {
      const lang = voice.lang.split(/_|-/); // split with minus or underline
      voiceText = (lang[1] || lang[0]).slice(0, 2);
//	} 
//	else voiceText = voice.lang;
	
	if (numOfVoices > 1) voiceText += ' (' + (i + 1) + ')';
	voiceName = voice.name
    voiceList += `<option value="${voiceName}" title="${voiceName}">${voiceText}</option>`;
  }
  
  const n = par.speakerN || '';
  const voiceSelector = elid('voice-select' + n);
  voiceSelector.innerHTML = voiceList;
  
// hide voice test if no voices
  if (numOfVoices) showElid('voice-test' + n)
  else hideElid('voice-test' + n);


// adjust voice tag
  const voiceTag = elid('tts-select-prompt' + n);
  voiceTag.textContent = n? 'Dialogue voice #2:' : 'Voice:';
  if (numOfVoices < 2) {
    voiceSelector.style.display = 'none';
    voiceTag.innerHTML += ` <span class="font-75pc" title="${voiceName}">${voiceText}</span>`;
  } else voiceSelector.style.display = 'initial';

  if (par.selectVoice) chooseVoice(n); // for words and phrases page
  else { // for tasks page
    tts['spVoice' + n] = par.voices[0];
    voiceSelector.title = par.voices[0].name;
// no need to set voiceSelector.value b/c it's set to the first voice
  }
}

const addLangCtrl = () => {
  const html = `
<span title="Used for speech recognition and text-to-speech">Speech Language: </span>
<select id="language-select" class="drop-down darker-hover"
  name="language">
</select>
`;
  setElHTML('lang-ctrl', html);
  elid('language-select').onchange = handleLangSelect;
}

const loadLangList = () => {
  if (!tts.langSelector) return;
  if (tts.langSelector.value) return; // lang list already loaded, don't reload
  let langList = tts.langNames || tts.getTTSLangs();
console.log('# of TTS languages', langList.length);
  const voices = tts.getVoices();
  const options = langList.map(lang => {
    const fullLangName = tasksPageActive()? tts.getFullLangName(lang, voices) : '';
    return `<option value="${lang}" title="${fullLangName}">${lang}</option>`;
  }).join('');

  tts.langSelector.innerHTML = options;
}

const storeLangCode = (v, n='') => {
  tts['langCode' + n] = v;
  localStorage.setItem('langCode' + n, v);
}

const addVoicesCtrl = (v='') => {
  const txt = `
<span id="tts-select-prompt${v}" title = "Text-to-speech computer voice"></span>
<select id="voice-select${v}" class="drop-down darker-hover" name="voice" 
  onchange="handleVoiceSelect(this, ${v})">
</select>
<button id="voice-test${v}" title="Click to hear the voice" class="plain-button font-95pc inline btn-lighgray rounded" 
onclick="sayCtrlVoiceName(${v})"><span style="vertical-align:0.05em">${gstore.speakerIcon}</span>test
</button>
`;
  setElHTML('tts-select' + v, txt);
}

const handleVoiceSelect = (option, v='', initialized = '') => {
//  if (!initialized) tts['manuallyPickedVoice' + v] = option.value;
  if (!initialized) tts['manuallyPickedVoice' + v] = 'VOICE_PICKED';
  setVoiceByName(option.value, v);
  elid('voice-select' + v).title = option.value;
}

const sayCtrlVoiceName = (n='') => {
  const voice = tts['spVoice' + n];
  const v = voice.name;
  const greetings = {
    de: `Hallo! Diese Stimme ist ${v}. Um die Sprechgeschwindigkeit zu ändern, verwenden Sie den Master-Geschwindigkeitsregler.`,
    en: `Hi, this voice is ${v}. To change the speech rate, use the master speed control.`,
	es: `Hola, esta voz es ${v}. Para cambiar la velocidad del habla, utilice el control de velocidad maestro.`,
	fr: `Salut, cette voix est ${v}. Pour modifier le débit de parole, utilisez le contrôle de vitesse principal.`,
	he: `היי, הקול הזה הוא ${v}. כדי לשנות את קצב הדיבור, השתמש במחוון בקרת המהירות.`,
	it: `Ciao, questa voce è ${v}. Per modificare la velocità della voce, utilizzare il controllo della velocità principale.`,
	nl: `Hallo, deze stem is ${v}. Gebruik de hoofdsnelheidsregelaar om de spreeksnelheid te wijzigen.`,
	pl: `Cześć, ten głos jest ${v}. Aby zmienić tempo mowy, użyj regulatora prędkości Master Speed Rate.`,
	pt: `Olá, esta voz é ${v}. Para alterar a velocidade da fala, use o controle deslizante de velocidade.`,
	ru: `Привет, это голос ${v}. Чтобы изменить скорость речи, используйте слайдер контроля скорости.`,
	uk: `Привіт, це голос ${v}. Щоб змінити швидкість мовлення, використовуйте повзунок регулювання швидкості.`,
	zh: `你好，这个声音是 ${v}。 要更改语速，请使用速度控制滑块。`
  };
  const lang = voice.lang.slice(0, 2);
  const intro = greetings[lang] || greetings.en;
//  const outro = new Intl.DateTimeFormat(lang, {weekday: 'long', year:'numeric', month: 'long', day:'numeric'})
//    .format(new Date());
  const txt = intro;
  
  if (
    !tts.latestLang
    || !tts.latestText // no previously spoken text
    || (tts.latestLang && lang !== tts.latestLang.slice(0, 2)) // tts language has changed
    || (tts.latestText && tts.latestText.slice(-16) === txt.slice(-16)) // the text looks like a default greeting
	)
    ttsSpeak(voice, txt); // use a default greeting
  else ttsSpeak(voice, tts.latestText); //repeat the previous text
}

function handleDraggingNew(dropZone, addZone) {
  dropZone.ondragenter = dragEnter;
  addZone.ondragleave = dragLeave;
  addZone.ondragover = allowDrop;
  addZone.ondrop = dragDrop;

  function markDropZone(cmd) {
    showOrHideEl(addZone, cmd);
//console.log('DROP cmd',cmd);
  }

  function dragEnter(event) { markDropZone(1); }
  function dragLeave(event) { markDropZone(0); }

  function allowDrop(event) {
    event.preventDefault();
    event.stopPropagation(); 
//	dropZone.firstElementChild.style.backgroundColor = '#acc';
    markDropZone(1);
  }
    
  function dragDrop(event) {
//console.log('ondrop event', event);	
    markDropZone(0);
    event.preventDefault(); 
    event.stopPropagation(); 
	if (wordsPageActive()) uploadWordFile(event) // how about games?
//    else uploadTaskFile(event);
    else {
	  const file = event.dataTransfer.files[0] || {};
	  uploadFile(file);
	}
  }
}

const uploadFile = file => {
  if (!file) return null;
  if (/^(audio|video)/.test(file.type)
    || /\.(mp3|mp4|wav|webm|m4a|ogg)$/i.test(file.name)) {
    const fileURL = URL.createObjectURL(file);
    if (/^video/.test(file.type) || /\.(mp4|webm)$/i.test(file.name))
      players.mediaType = 'video';
    else players.mediaType = 'audio';
    getVideoByURL(fileURL, 'NEW_TASK');
  }
  else uploadTaskFile(event);
  return true;
}

async function highlightEl(el, msec = 4000) {
  if (!el || this.on) return;
  this.on = 1;

  await blinkElClass(el, 'outlined', 0, 100, msec);
/*  
  const ecl = el.classList;
  ecl.remove('outlined');
  await sleep(100);
  ecl.add('outlined');
  await sleep(msec);
  ecl.remove('outlined');
*/  
  this.on = 0;
}

const makeAcronym2 = s => {
  const res = (s || '')
    .trim()
    .replaceAll(' ', '| ').replaceAll('-', '|-')
    .split('|')
    .map(w => {
      if (w.length < 2) return w;
	  if (w.startsWith(' ') || w.startsWith('-')) {
        if (w.length === 2) return w;
        if (w.length > 2) return w[0] + w[1] + '___';
	  } else return w[0] + '___';
    })
    .join('');
  
  return res;
}

const getTranslationLinks = (txt) => {
  const transl = txt
    .replaceAll("'", '%27')
    .replaceAll("(", '%28')
    .replaceAll(")", '%29')
    .replaceAll(" ", '%20')
	;
//console.log('=== text to translate ===', txt);

  const transl4Deepl = transl.replace(/%2F|\//g, '%5C%2F'); // '/' should be escaped
  const lang = getLangCode() || 'en';
  const trLines = [
    `Translate with `,
	`[Google](https://translate.google.com/?sl=auto&tl=en&text=${transl}&op=translate), `,
	`[Bing](https://bing.com/translator?to=en&text=${transl}), `,
	`[Deepl](https://deepl.com/translator#${lang}/en/${transl4Deepl})`
  ];
  
  return highlightText(trLines.join(''));
}

const offerTranslationHtml = (txt, style) => {
  txt = encodeURIComponent(gstore.vocab.getBeforeVocab(txt));
  const tip = getTranslationLinks(txt);
//console.log('=== text to translate ===', txt);

  const res = `<div class="inblock" style="${style}">{{${tip}|${gstore.translateIcon}}}</div>`;
  
  return highlightText(res);
}

const getVocabCtrl = () => {
  const hidden = gstore.vocabArr?.length ? '' : 'hidden';
  return `<div id="vocab-settings-box" class="${hidden}">` + uiblox.vocabSettings() + '</div>'
}

//gstore.vocabModes = ['highlight', 'hover meanings', 'show meanings', 'hover originals', 'hide originals', 'plain hover', 'off'];

const showVocabMode = () => {
  const vocabEl = elid('vocab-settings-box');
  if (gstore.vocabArr?.length && vocabEl) {
    elid('vocab-mode').value = gstore.vocabMode;
    setElHTML('vocab-mode-show', gstore.vocab.modes[gstore.vocabMode]);
    showEl(vocabEl);
  }
  else hideEl(vocabEl);
}

const setVocabMode = (v = 0) => {
  if (!gstore.vocabArr) return '';
  if (v) gstore.vocabMode = parseInt(v) || 0; // v is a string
  else gstore.vocabMode = gstore.vocabMode || 0;
  showVocabMode();
  refreshTask();
}

const changeVocabMode = d => {
  if (!gstore.vocab.isAllowed()) return;
  if (!gstore.vocabMode) gstore.vocabMode = 0;
  gstore.vocabMode += d;
  if (gstore.vocabMode < 0) gstore.vocabMode = gstore.vocab.modes.length - 1;
  if (gstore.vocabMode >= gstore.vocab.modes.length) gstore.vocabMode = 0;
  setVocabMode(gstore.vocabMode);
}

function detectLang(txt) {
  const langRanges = {
	de: /\b(?:ein|eine|der|die|das)\b/,
	pl: /ł|\bsię(\s|[.,!?;:])/,
    ru: /[\u0400-\u04ff]/,
    ar: /[\u0600-\u06ff]/,
    he: /[\u0590-\u05ff]/,
    ja: /[\u3040-\u30ff]/, // Japanese (Hiragana and Katakana, but no Kanji b/c those can be Chinese too)
    ko: /[\uac00-\ud7a3]/,
    zh: /[\u4e00-\u9fff]/,
  };

  for (const lang in langRanges)
    if (langRanges[lang].test(txt)) return lang;
  return null;
}

gstore.translations = {};
/*
gstore.getTranslation = async s => {
// this fn is plan B b/c of the alternatives

// Another free API up to 5000 chars a day https://mymemory.translated.net/doc/usagelimits.php
// https://api.mymemory.translated.net/get?q=Hello&langpair=en|es
	

// One more alternative API is aperitum.org
// try out https://apertium.org/apy/translate?langpair=en|es&q=what%27s%20up
// see https://wiki.apertium.org/wiki/Apertium-apy

  const langs = {en: 'English', de: 'German', es: 'Spanish', fr: 'French', it: 'Italian', pl: 'Polish'}
//  const srcLang = gstore.langNames[gstore.langCodes.indexOf(getLangCode())];
  const srcLang = langs[getLangCode()];
  const result = await gstore.Connect.predict("/translate", {
    text: s,
    src_lang: srcLang,
    tgt_lang: "Russian",
  });
  return result.data[0] .replace(/\s\.$/,''); // remove trailing \s\.
} 
*/
gstore.fetchTranslation = async (query, sl='en', tl='ru') => {
  const url = `https://api.mymemory.translated.net/get?q=${query}&mt=1&langpair=${sl}|${tl}`;
  const response = await fetch(url);

  if (!response.ok) {
console.log('Transl response', response);
    throw new Error('Translation API error: ' + response);
  }

  const res = await response.json();
  if (res.responseStatus !== 200) {
console.log('Transl problem', res);
    throw new Error('Translation API reported error');
  }

console.log(res.matches.map(entry => entry.translation));
  return res.matches
    .filter(entry => entry.translation && Number(entry.quality)) // filter out entries that are empty or have '0' quality
// perhaps the entry with highest quality (converted to integer) should be returned
    .map(entry => entry.translation)
	[0]; // first value is usually the most accurate
}

const getYouTubeId = url => {
  let res = null;
  if (!url.match(/[^0-9-_a-zA-Z]/) && (url.length === 11)) // url looks like YT ID?
    res = url;
  else { // check full url
    const rx = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
    const YTIdInfo = url.replace(/youtube\.com\/(shorts|live)\//, 'youtu.be\/') .match(rx);
    if (YTIdInfo !== null) res = YTIdInfo[1];
  }
  return res;
}

/*
window.onunhandledrejection = event => {
  const error = event.reason;
  console.warn("Unhandled rejection:", error);
  displayAlarmMessage(String(error));
  event.preventDefault(); // prevent the default browser error
};

window.onerror = (message, source, lineno, colno, error) => { // it doesn't catch TypeErrors
  displayAlarmMessage(message + '<br>' + source + ':' + lineno + ':' + colno, 10000);
  console.log("Message:", message);
  console.log("Source:", source);
  console.log("Line:", lineno);
  console.log("Column:", colno);
  console.log("Error object:", error);
  return true; // prevents default handling
};


addEventListener("error", (event) => { // it doesn't catch TypeErrors
  displayAlarmMessage(event.message);
  console.warn('Error! ', event);
  return true;
});

*/
/***  Text handling pathway  ***

handleYTstyleInput OR edited task OR load from file/url -> 
loadElementWithText -> 
*parseTaskText* OR parseInfoPage OR parseWordlist, etc, 
depending on the text purpose/target window -> 

*parseTaskText* sanitizes, calls processYTtranscript, 
replaces tags, calls parseTextFile, makeTestForm, parseXTag

*processYTtranscript* may use textContent/innerText to process 
time codes more reliably.

  ***  Future plans  ***

- loadElementWithText: add highlighting text according to wordList.list
- Make infopage self-center and fit content

- texts and media can be kept e.g. on github, dropbox. For example, this one is at dropbox:
https://dl.dropboxusercontent.com/scl/fi/d2u8md2p5u50u58pvnjm7/cloze1.txt?rlkey=49ddbt9e1qh2j23mk6p9nxhmo

Bugs:
*/