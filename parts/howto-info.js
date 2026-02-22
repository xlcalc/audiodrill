const getHowToHtml = cmd => {
  const editBtn = `the <tip '' ref='inside-edit-btn' x-shift='10' y-shift='40'>Edit button
<div class="inblock" style="color: #aaa; font-size:120%;">a</div><div class="inblock" style="vertical-align:text-bottom; font-size:120%; transform: scale(.6, 0.8)">|</div></tip>`;
 
  const saveBtn = `<tip '' ref='edit-save' y-shift=35>Save button ✓</tip>`;
  const micBtn = `<tip '' ref='mic' x-shift=10 y-shift=45>mic</tip>`;
 
  const msgArr = {
	words: [`
Click on the words and phrases in the textbox 
to explore their meaning and use, and to hear their pronunciation
in popular tools like [Forvo.com](https://forvo.com),
[YouGlish.com](https://youglish.com),
[Yarn.co](https://yarn.co),
[PlayPhrase.me](https://playphrase.me). Or click on the ${micBtn} and dictate any word or phrase you want to explore.
<x-br></x-br>
To edit the list, click on ${editBtn}.
<x-br></x-br>
To start shadow reading in Chrome or Edge, 
click on the ${micBtn} and say 
"Let's read together."
`,
`
&bull; [Do you pronounce these English words right?](/?w=colonel,corps,faux-pas,feisty,segue,sew,southern,subtly,viscount,yolk)
<br>
&bull; [Flashcards: say hello and goodbye in Polish](/words?url=//pl/vocab/greetings-pl1.txt)
<br>
&bull; [English words with silent ~b~](/?w&url=//en/pronun/words-silent-b.txt)
`],

	game: [`*Make your own voice game* through these simple steps.
<br>1. Paste the game script into the text box. 
For example, you can copy and paste this simple dialogue:
<div style="font-size: 90%; margin: 0.3em 0; color: #469">
-Hi, I'm Tom, and you are...
<br>-Hi, I'm Paul. Nice to meet you.
<br>-Nice to meet you too.
</div>
2. Finish editing by pressing ${saveBtn}, and the game will start. 
Don't forget to turn on the ${micBtn}.
<br>
3. To share the game, click on the <tip '' ref='link' y-shift='15'>link button</tip>. 
<x-br></x-br>
For more info, <a onclick="showHelpItem('qna_create_game')">read this help section</a>.
`,
`
&bull; [Several built-in voice games](/?game=all)
<br>
&bull; [Games collection](https://docs.google.com/spreadsheets/d/1EtMSKg7AadwYDGtymTAcbpIDBssFcA4q6FRIHDerqi8)
<br>
&bull; [English irregular verbs](https://docs.google.com/document/d/1nNOJ48orCH-zsVN_1JG1NtK1UIQLufuC7sMBTZPki-g)
<br>
&bull; [Greetings in Polish](/?game=1&url=//pl/game/greeting1.txt)
<br>
&bull; [A sample dialogue in Chinese](href=/?game=1&url=//zh/game/test-game2.txt)
`],

    shadowRead: [`*Shadow reading* means listening to the speaker and repeating.
Try it out with the sample text or find a text fragment 
you wish to practice on the internet and copy/paste it to the text area. Make sure you
click on ${editBtn} to allow pasting or editing.
<x-br></x-br>
*To start shadow reading*, click on the ${micBtn}.
The computer will read the first text chunk, wait for your cue, and move on. 
<br>To change the reading order, say "I will read first" or "I will read after you".
To exit, say "game over".
<x-br></x-br>
For more info, read help section 'Can I practice shadow reading?'
`,
`
&bull; [Scratch, scrawl, or scribble?](/?shadow-read&url=//en/read/scratch-scrawl-scribble.txt&user-leads=1)
`],

    ttsRead: [`👉<a onclick="popupVid('ttsRead')"><u>See the video</u></a> and read the explanation below
<x-br></x-br>
The computer can read out loud the text you've written 
 or pasted in the text area. Make sure you
 click on ${editBtn} to enable editing. In dialogues, start speaker's new line with a hyphen.
 In Chrome and Edge browsers, you can aslo *voice dictate* in editing mode.
<x-br></x-br>
*To start listening*, click on the button 
<span style="color: #bbb">&#9655;</span> to the left of a text chunk or 
<span style="color: #bbb">&#9654;</span> under the text area. 
In the settings, you can choose whether to read by chunks, sentences, paragraphs, or to the end of the text.
<x-br></x-br>
*To look up a word* or hear it in a video, just click on it. It will be highlighted and added to the vocabulary at the bottom of the text. You can type the meaning into the input field at the top of the info about the word. Try out different vocabulary modes in the settings.
<x-br></x-br>
You can repeat after the computer and *record your speech* by clicking 
<tip '' ref='tts-rec-start-stop'>
<span style="color: #bbb; font-size:70%; font-family:sans-serif">[<span style="font-size:80%">&#11044;</span>REC]</span></tip> button.
Make sure you allow using the mic and sharing system audio when prompted. After playback, you can download the recorded audio by pressing <span style="color: #bbb">&vellip;</span> button on the player.
`,
`
&bull; [Are these ChatGPT's jokes funny?](/?tts-read&url=//en/read/blog_2023-01-03.txt)
<br>
&bull; [English vocab practice](/?tts-read&url=//en/read/how-we-talk-1.txt)
<br>
&bull; [A task in Polish](/?tts-read&url=//pl/voa/voa110pl.txt)
`],

    dictate: [`*Listen to text chunks* by clicking on the buttons 
<span style="color: #bbb">&#9655;</span> to the left of input fields and *type in* what you hear. 
If not sure about the word, type _ (underscore) instead.
 When done, *listen again and repeat out loud* after the speaker.
<x-br></x-br>
To *view and/or edit* the text, click on ${editBtn}.
 In Chrome and Edge browsers, you can aslo *voice dictate* in editing mode.
`,
`
&bull; [Social emotions](/?dictate&url=//en/vocab/self-consc-dictation.txt)
<br>
&bull; [Veg names](/?dictate&url=//en/vocab/veg-dictation.txt)
<br>
&bull; Samples of dictation [in Polish](/?dictate&url=//pl/vocab/dictation-pl1.txt)
and [in Czech](/?dictate&url=//cs/vocab/dictation-cs1.txt)
`]
  };
  
  const msg = msgArr[cmd];
  
  const getHtml = (title, s) => `
<div class="ptr inblock" style="margin-bottom: 0.25em" onclick="clickChevron(this.nextElementSibling)">
<i>${title}</i>
</div>
<div class="half-padding small-font chevron chevron-down" onclick="clickChevron(this)"></div>
<div class="hidden">${s}</div>
`;

  const settingsBtn = 
// button could be used instead of div  
    '<div class="abs flex-center btn-darker rounded gray hide-on-mobile" style="right:0;" onclick="showSettings()">'
	+ '<div id="lang-indicator" class="sans-serif font-75pc" style="transform: scaleX(.9); opacity: .8"></div>'
//    + '<div class="small-font flex rnd">'
//    + gstore.settingsIcon 
//	+ '</div></div>';
	+ '</div>';

  return settingsBtn
    + getHtml('How can I use it?', msg[0]) 
    + '<x-br></x-br>' 
	+ getHtml('Usage examples', msg[1]);
}

const popupVid = (cmd) => {
  const refs = {
	ttsRead: `<div style="margin: auto; height: 97%;"><iframe width="100%" height="100%" frameborder="0" style="border: 0"
	src="https://www.youtube.com/embed/gKK9Lr02XsU" allowfullscreen></iframe></div>`
  }
  displayInfopage(refs[cmd], {width:'81vw',height:'45vw'});
}

const getNotesMsg = () => {
  const txt = ta.text || '';
  if (!isPageHeader('ttsRead') || !txt) return '';
  //const transl = gstore.vocab.getBeforeVocab(txt).replace(/\n/g, '%0A').replaceAll('#', '%23').replaceAll('"', '%23');
//tags, including :lang: and highlighting symbols may be removed from the txt in the future
// or ta.innerText could be used, but it has an issue with vocab header ※※※&emsp;📝&emsp;※※※
  
  const transl = encodeURIComponent(gstore.vocab.getBeforeVocab(txt)).replaceAll("'", '%27');
//console.log('Transl', transl);

  const transl4Deepl = transl.replaceAll('%2F', '%5C%2F'); // '/' should be escaped
  const lang = getLangCode() || 'en';
  const notesPrompt = gstore.notes.textContent? 'See the notes/translation' : 'Add your notes/translation';
  const html = `<i>Translate this text with 
    <<translate.google.com/?sl=${lang}&tl=en&text=${transl}&op=translate'>Google</a>, 
	<<bing.com/translator?from=${lang}&to=en&text=${transl}'>Bing</a>, or
	<<deepl.com/translator#${lang}/en/${transl4Deepl}'>DeepL</a>
	<x-br></x-br>
	${notesPrompt} <a href="javascript:" onclick="showNotes()">here</a>
	</i>`;
//console.log('Links', html);
  return expandLinks(html);
}

const getNotesHtml = () => '<div id="howto-translation-links"><x-br></x-br>' 
	+ getNotesMsg()
	+ '</div>';

const addTranslationToHowto = () => {
  const el = elid('howto-translation-links');
  if (el) el.innerHTML = '<x-br></x-br>' + getNotesMsg();
  else elid('howto-info-box').firstElementChild .innerHTML += getNotesHtml();
}