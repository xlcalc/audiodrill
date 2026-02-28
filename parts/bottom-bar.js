const uiblox = {};

uiblox.topMenuHtml = `
<style>
.menu-box {
/*  height: 0; */
  width: auto;
  position: fixed;
  z-index: 5; /* changed 2024-07-12 */
  top: 0;
  right: 0;
  background-color: #99a499;
  background-color: hsl(150, 22%, 40%);
  border-radius: 3px;
  box-shadow: -6px 6px 1em rgba(0, 0, 0, 0.20);
  overflow-x: hidden;
}

/*
.menu-box:focus-within, .menu-box:focus {
  height: auto;
}
*/
.menu-box a:hover, .menu-box a:focus {
  color: white;
  background-color: #a5afa5;
/*  backdrop-filter: brightness(107%);*/
}

.menu-box a {
  padding: 8px;
  text-decoration: none;
  font-size: 150%;
  color: #eee;
  display: block; 
  clear: right;
/*  transition: 0.2s;*/
  outline: none;
}

.menu-content {
  position: relative;
  top: 0;
  max-height: 100vh;
}

.menu-box .closebtn {
  margin-bottom: -1.2em;
  text-align: right;
  float: right;
  clear: right;
  width:auto;
  line-height: 0.5em;
  border-radius: 3px;
  border: 1px solid;

  font-size: 160%;
  padding: 0.2em;
  cursor: pointer;
  color: #eee;
  outline: none;
}

.menu-box .closebtn:hover, .menu-box .closebtn:focus {
  color: #99a499;
  background-color: #eee;
}

.menu-button {
  position: absolute;
  position: fixed;  /* added 2023-07-26 */
  z-index: 5; /* changed 2024-07-12 */

  top: -0.3em;
  top: 0.1em;
  right: 0.4em;
  right: 0.1em;
  padding:0.5em 0.3em;
  padding: 0.1em;
  padding: 0.6em;
  color: #687;
  cursor: pointer;
  line-height:1.2em;
  line-height: 1em;
  line-height: 0;
  border-radius: 50%;
  border-radius: 1em;
/*  transform: scale(1.2,0.85);*/
  display: flex;
  justify-content: center;
  width: 1em;
  height: 1em;
  font-size: 120%;
  backdrop-filter: blur(10px);
  background: rgba(255,255,255,0.82);
}
#bottomMenu a:hover {
  background-color: #eee;
  text-decoration:none;
}
#bottomMenu.night-mode a:hover { background-color: #444; }

.menu-button:active, #bottomMenu a:active {background-color: #ddd}
</style>
<button id="topMenuBtn" data-themeable class="plain-button menu-button darker-bg-onhover" title="Audiodrill menu" onclick="showTopMenu()">
<b>&vellip;</b>
</button>
<!--
<a href="#" id="hiddenLink" style="position:absolute;top:-10em;left:0;"></a>
 hiddenLink div may not be needed after the change 2023-09-11 -->
<div id="topMenu" class="menu-box hidden">
  <div class="menu-content">
    <button id="menuCloseBtn" class="plain-button closebtn" onclick="hideTopMenu()">&times;</button>
    <a href="/">Home</a>
    <a href="/?t">Tasks</a>
    <a href="/words/">Words & phrases</a>
    <a href="/words/?game=all">Voice games</a>
    <a href="/words/?shadow-read">Shadow reading</a>
    <a href="/words/?tts-read">TTS reader</a>
    <a href="/info/?show=resources">Resources</a>
    <a href="" style="border-bottom: 1px solid" onclick="hideTopMenu('HELP');event.preventDefault();">Help</a>
    <a id="top-menu-read-lines" href="" title="" onclick="hideTopMenu('TTS_READ_LINES');event.preventDefault();">🗣 Read lines</a>
    <a id="top-menu-settings" href="" title="Ctrl + ," onclick="hideTopMenu('SHOW_SETTINGS');event.preventDefault();">⚙ Settings</a>
  </div>
</div>
`;

//=====================================
uiblox.bottomBarHtml = `
<style>
.accordion {
  background-color: #eee;
  background-image: linear-gradient(#eee, #eaeaea, #eee);
  color: slategray;
  cursor: pointer;
  padding: 0.3em;
  margin: 2px;
  width: 95%;
  border: none;
  text-align: left;
  outline: none;
  font-size: 100%;
  font-weight: 600;
/*  line-height: 1.1em; */
/*  transition: 0.2s; */
  border-top: 1px silver;
  border-bottom: 1px silver;
}

.accordion:hover {
  background-color: #ccc; 
  background-image: linear-gradient(#d7d7d7, #eee, #d7d7d7);
}

.active{
  background-color: #ddd; 
  background-image: linear-gradient(#d5d5d5, #dcdcdc, #d5d5d5);
/*margin-bottom:0.5em;*/
}

.panel {
/*
padding-left: 0.5em;
margin-bottom: 0.5em;
white-space: pre-wrap; 
background-color: white; 
overflow: hidden; 
*/
  border: 1px  green;
  padding: 0.5em;
  line-height: 1.4em;
}

#infopage {
  position: fixed;
  border-radius: 5px;
  border: solid 1px lightgray;
  background-color: #f9f9f5;
  color: DarkSlateGray;
  color: var(--color-text);
  opacity: 0.95;
  z-index: 3;
  z-index: 4; /* 2025-05-25: elevated due to conflict with settings in task page */
  font-size: 20px;
/*
display: none;
box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.2), 0 8px 20px 0 rgba(0, 0, 0, 0.19);
overflow: overlay;
overflow: hidden;
*/
}

#infopage-save-box {
  position: absolute; 
  cursor: default;
}

#infopage-content {
/*
position: absolute;
overflow-x: hidden; 
width: 97%;
*/
  overflow: auto; 
  height: 97%;
  height: 95%;
border:0px solid green;
  margin: 0.9em 0em 0.7em 0.7em;
  margin: 0.8em 0em 0.5em 0.7em;
  white-space: pre-wrap;
  outline: none;
outline: 1px solid transparent;
  padding: 0 7px 0 0;
}

#infopage-save-box {
  bottom: 0;
  justify-content: space-evenly;
  align-items: center;
  height: 8%;
  width: 98%;
border:0px solid red;
}

iframe {
  overflow: scroll;
  width: 100%;
  height:100%;
/*
  border: 1px solid gray;
*/  
}

#bottomMenu {
  margin-top: 16px;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  padding: 0.7em 0.7em 0;
  padding: 0 0.7em;
/*
  border-top: 1px solid #b9c9c0;
*/
  border-top: 1px solid hsl(150, 30%, 95%);
  border-bottom: 1px solid hsl(150, 25%, 95%);
  background-color: hsl(150, 40%, 98%);
}

#bottomMenu a {
/*
margin: 0 0.3em 0.3em 0.3em;
padding: 0.2em;
color: #687;
border-radius: 4px;
*/
  color: inherit;
}

#bottomMenu h4, p {
  margin: 0 0 0.8em 0;
}

#bottomMenu> div {
  margin: 0 1em;
  padding: 0 1em 0 1em;
  padding: 1em;
  padding: 0.5em 1em 0;
  color: #677;
  border-radius: 4px;
}

#google_translate_el * {
  color:inherit;
  background-color: inherit;
}
#google_translate_el select {
  border-color: gainsboro;
  border-color: #ddd;
  border-color: var(--color-ddd-555);
  border-radius: 4px;
}
#google_translate_el select:hover {
  color: #455;
  border-color:silver;
  background-color: #eee;
}

/*
@media screen and (max-width: 800px ) {
  #infopage {  
    width: calc(85vw);
    left: calc(7vw); 
  }
}
*/

</style>
<div class="overlay"></div>

<div id="infopage" data-themeable class="box-shadow hidden">
  <div id="infopage-close" class="close-x01 rnd dark-hover" onclick="displayInfopage('hide')">&times;</div>
  <div id="infopage-content" tabindex="-1"></div>
  <div id="infopage-save-box" class="flex">
    <div id="infopage-save-yes" class="yesno-button btn" title="Save" 
      onclick="displayInfopage('SAVE_AND_EXIT')">✔</div>
    <div id="infopage-save-no" class="yesno-button btn" title="Discard changes" 
      onclick="displayInfopage('hide')">✖</div>
  </div>
</div>

<div id="bottomMenu" data-themeable>
<div>
<h4>Activities</h4>
<p><a href="/?t">Tasks</a></p>
<p><a href="/words/">Words and phrases</a></p>
<p><a href="/words/?game=all">Voice games</a></p>
<p><a href="/words/?shadow-read">Shadow reading</a></p>
<p><a href="/words/?tts-read">Text-to-speech reader</a></p>
<p><a href="/words/?dictate">Dictation</a></p>
<p><a href="/radio">Radio</a></p>
<p><a href="/tv">TV channels</a></p>
<p><a href="/gapper">Gap maker</a></p>
</div>

<div>
<h4>Info</h4>
<p><a href="/?home">Home</a></p>
<p><a href="/info/?show=resources">Resources</a></p>
<p><a href="/info/?show=news">News</a></p>
<!-- <p><a href="/info/?show=features">Features</a></p> -->
<p><a href="javascript:void(0)" onclick="displayInfopage('help')">Help</a></p>
</div>

<div>
<h4>About</h4>
<p><a href="/info/?show=copyright">Open license</a></p>
<p><a href="/info/?show=privacy-notice">Privacy notice</a></p>
<p><a href="/demo-embed">Embed in your site</a></p>
<p><a href="/info/?show=feedback">Contact/Feedback</a></p>
<p><a href="javascript:void(0)" onclick="displayInfopage('contribute')">Contribute</a></p>
<p><a href="https://github.com/xlcalc/audiodrill" target="_blank" rel="noopener noreferrer">View on GitHub</a></p>
</div>

<div>
:TRAN:
<div id="google_translate_el" style="line-height: normal; padding-bottom: 0.7em"></div>
</div>
</div>
<div class="flex-center font-80pc" style="padding: 0.25em">
Copyright 2019-2026 Audiodrill
</div>
`;

//=====================================
uiblox.infoPoint = (tip) => `
<span tip = "${tip}">
  <span class="info-point">&#8505;</span>
</span>`;

uiblox.vocabSettings = () => {
  const tip = 'Use keyboard shortcut <br><kbd>Ctrl</kbd> + <kbd>.</kbd><br>to change vocab mode';
  return '<label><div class="inblock align-top">Vocab mode</div>'
    + uiblox.infoPoint(tip)
	+ `
<div class="inblock"><input id="vocab-mode" type="range" list="vocab-tickmarks" value="0" min="0" max="6" step="1" oninput="setVocabMode(this.value)" style="width:80px; vertical-align: middle">`
    + uiblox.getSliderMarksHtml('vocab-tickmarks', 0, 6, 1)
	+ `
</div>
<span id="vocab-mode-show" class="padding-03em"></span>
</label>
`;
}

uiblox.getSliderMarksHtml = (id, min, max, step) => {
  let options = `<datalist id="${id}">`;
  for (let i = min; i <= max; i += step) {
    options += `<option value="${i}"></option>`;
//console.log('Marks', i);
  }
  options += '</datalist>';
//console.log('Options', options);
  return options;
}

uiblox.vocabHeader = `
<style>
    .vocab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
	  border-radius: 5px;
/*      padding-bottom: 0.2em;*/
	  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), 0 -1px 2px rgba(0, 0, 0, 0.1);
    }

    .vocab-title {
	  padding: 5px 10px;
	  border-radius: 5px;
	  cursor: pointer;
      font-weight: 600;
/*      font-size: 1.2em;
      color: #333; */
    }
.vocab-title:hover {
  background-color: rgba(0,0,0,0.1);
}

.vocab-actions {
  margin-right:0.5em;
}

.vocab-actions button {
  background: none;
  color: inherit;
  padding: 5px 8px;
  border: 1px solid #ccc;
  border: 0px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.vocab-actions button:hover {
      background-color: #eee;
}

</style>
    <div class="vocab-header">
      <div class="vocab-title  btn-active">Vocabulary</div>
      <div class="vocab-actions">
        <button id="vocab-edit-btn" class="btn-active"><span style="border-right:1px solid;">Aa</span></button>
        <button id="vocab-download-btn" class="btn-active padding-03em" style="text-underline-offset:3px; vertical-align:0.15em"><u>↓</u></button>
        <button id="vocab-mode-btn" class="btn-active">Vocab Mode</button>
      </div>
    </div>
`;


//uiblox.vocabModeBtnLabel = `{{Click to change vocabulary mode or use keyboard shortcut
//  <br>|_Ctrl_| + |_._||Set mode}}`;

uiblox.vocabModeBtnLabel2 = `Click to change vocabulary mode 
or use keyboard shortcut
[ Ctrl ] + [ . ]`;

uiblox.shareIcon = (viewBox, width) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}">
  <path stroke="currentColor" d="M21,12L14,5V9C7,10 4,15 3,20C5.5,16.5 9,14.9 14,14.9V19L21,12Z" />
</svg>
`;

uiblox.chevronIcon = (cmd) => {
  const points = {left: '14,6 8,12 14,18', right: '10,6 16,12 10,18'};
  if (!points[cmd]) console.error('uiblox.chevronIcon: wrong parameter', cmd);
  return `<svg width="20" height="20" viewBox="0 0 24 24">
    <polyline points="${points[cmd]}" fill="none" stroke="currentColor" stroke-width="2"></polyline>
  </svg>`;
}

uiblox.specKeys = {
  boxHtml: '<div id="spec-keys" class="center padding-03em" style="width:100%; line-height:0"></div>',

  set(trigger, upper) {
    const el = elid('spec-keys');
    if (el) {
      el.innerHTML = this.getBtns(upper);
      Array.from(el.children).forEach(btn => {
        btn[trigger] = () => onSpecKeyClick(event, btn);
      });
    }
  },

  getBtns(upper) {
//    const lang = getLangCode();
    const lang = gstore.getContextLangCode();
    const keys = {'cs': 'áčďéěíňóřšťúůýž', 'de': 'äöüß', 'es': 'áéíóúüñ¿¡', 
	  'fr': 'àâäæçéèêëîïôœùûüÿ', 'it': 'àèéìíîòóù', 'pl': 'ąćęłńóśźż', 'pt': 'áàâãçéêíóôõú',
	};
    let btns = keys[lang];
    if (!btns) return '';
    
    let btnSize = '75%';
    if (upper) {
//      btnSize = '64%';
	  if (lang === 'de') btns = btns.replace('ß', 'ẞ'); // otherwise ß => SS
	  btns = btns.toUpperCase();
    }

    return [...btns].map(ch => `<button class="plain-button padding-01em ptr btn-darker gray" 
      style="font-size: ${btnSize}; min-width:1.4em">${ch}</button>`).join('');
  },
}

