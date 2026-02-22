const wrstore = {};
wrstore.iconYT = '<div class="inblock gray kbd" style="padding-right:3px; height: .9em; line-height: 1em">▶︎</div>&thinsp;';
//function showTrackInfo(total, current, videoID) {
function showTrackInfo(arr) {
  const [total, current, videoID, query, lang] = arr;
  const e = elid('widget-header');
  if (total < 0) { 
    e.innerHTML = ''; 
	widget.close();
	return; 
  }

  const queryForURI = encodeURIComponent(query);
  const widgetHeader = total ?
    wrstore.iconYT + `[YouTube](https://youtu.be/${videoID} Open on YouTube) 
	clips via [YouGlish](https://youglish.com/pronounce/"${queryForURI}"/${lang} Open on YouGlish):
	[${current}](/?noauto&m=https://youtu.be/${videoID} Open on Audiodrill) of ${total}`
    + getYGChevronHtml()

    : '∙ YouTube clips not found via YouGlish';

  e.innerHTML = vbreakDiv(0.3) + highlightText(widgetHeader);
}

const checkImage = (imageSrc, proceedFn, errorFn) => {
  const img = new Image();
  img.src = imageSrc;
  img.onerror = errorFn;
  img.onload = proceedFn; 
}

const showPubChemImage = compoundName => {
  const imgSrc = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/'
    + compoundName + '/png';

  checkImage(imgSrc, () => showChemImage(compoundName), hideEl(chemImage));
}

const showChemImage = compoundName => {
  const url = 'https://pubchem.ncbi.nlm.nih.gov/compound/' + compoundName;
  chemImage.innerHTML = '<a target="_blank" rel="noopener" href="' + url + '">' 
    + 'Chemical structure<br><img src="https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/' 
    + compoundName + '/png"></a>';

  showEl(chemImage);
}

const popFilmWindow = query => {
  widget.pause();
  const phrase = query.replace(/ /g, '+');
console.log('phrase ',phrase);
  window.open("https://playphrase.me/#/search?q=" + phrase,
    "myWindow", "width=480,height=300,top=200,left=400");
}

function handleReference(txt, lang = 'en', context) {
  gstore.currentQuery = txt;

  if (!txt) {
    wrstore.refBox().innerHTML = '';  // a different handler may be needed
    return;
  }

  const vBreak = vbreakDiv(0.3);

// replace apostrophe as it breaks string logic
  const query = txt.replace(/'/g, '%27'); 
  const hyphQuery = query.replace(/\s+/g, '-');

  let tubeQuizard = ''; 
  if (lang == 'en') {
    const query64 = encode64(query).replace(/=/g, '');
    tubeQuizard = `!<<tubequizard.com/search.php?pattern=!${query64}&quizType=0'
      title="Instant quizzes for subtitled Youtube video">TubeQuizard</a>`
  }

//see https://bharatchodvadiya.wordpress.com/2015/04/08/how-to-check-if-an-image-exists-using-javascript/
//or https://stackoverflow.com/questions/18837735/check-if-image-exists-on-server-using-javascript/18837818
// to append an image to div, see https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/Image
  if (typeof pubchem !== 'undefined') {
	  if (pubchem.checked) {
//    addFeatures += '<div id="chem-image" title="View in PubChem"></div>';
      showPubChemImage(query); 
    } else { hideEl(chemImage); }
  }
  wrstore.tubeQuizard = tubeQuizard;
  wrstore.hyphQuery = hyphQuery;
  wrstore.query = query;
  wrstore.queryForURI = encodeURIComponent(query);
  wrstore.markedQ = '<span class="marked-word">' + txt + '</span>';
  const markedQ = '<span class="marked-word">' + txt + '</span>';

  let refMsg = wrstore.getQueryRef(lang);

  for (const i in refMsg) {
    refMsg[i] = expandLinks(refMsg[i]);
  }
  wrstore.refMsg = refMsg;

  const targetLang = localStorage.getItem('translLangCode') || 'ru';  
  refMsg.vocabInput = gstore.vocab.getMeaning(gstore.currentQuery) 
    || (gstore.translations[gstore.currentQuery] && gstore.translations[gstore.currentQuery][targetLang])
    || '';

  wrstore.refBox().innerHTML = prepRefBox(refMsg);
// This erases previous links and moves video up. 
// Maybe rewriting should be done without totally erasing and collapsing the boxes with links?
//  refBox().refMsg = refMsg;
//  initRefTabs();
  wrstore.refTabs.init();

// add features - the logic could be streamlined
  const transl = context || query;
  let addFeatures = '<b>' + gstore.translateIcon + '</b>' 
    + getTranslationLinks(transl);

  addFeatures += ` ${vBreak}🎧Listen with
    <<forvo.com/search/${wrstore.queryForURI}/${lang}'>Forvo</a>`;
	
  if (tts.spVoice) addFeatures += ' or synthetic speech:' + speakerButton();

  const imgIcon = '<span title="Images at google.com">🖼️images</span></a>';
  let imgLang = 'lang_' + lang;
  if (lang === 'ko') imgLang = 'lang_kr';
  if (lang === 'sv') imgLang = 'lang_se';
  
  addFeatures += `${vBreak}<<google.com/search?udm=2&safe=active&lr=${imgLang}&q=${query}'>${imgIcon}</a>`;

//  if (wrstore.getQueryRef(lang, 'add')) addFeatures += wrstore.getQueryRef(lang, 'add');
  addFeatures += wrstore.getQueryRef(lang, 'add') .trim();

// link to YouGlish can be added to addFeatures, if used with tasks page
//  if (wrCallback('YOUGLISH_LINK_NEEDED')) 
  if (tasksPageActive()) 
    addFeatures += `${vBreak}${wrstore.iconYT}videos with ` + highlightText(`[YouGlish](https://youglish.com/pronounce/"${wrstore.queryForURI}"/${lang} Open on YouGlish)`);

  elid('feature-box').innerHTML = vbreakDiv(0.3) 
    + '<div id="wiki-box"><div id="wiki-menu"></div><div id="wiki-articles"></div></div>' 
	+ expandLinks(addFeatures);

  wrstore.addWikis(wrstore.queryForURI, lang);
  
  if (elid('vocab-meaning-input')) elid('vocab-meaning-input').focus();
}

const expandLinks = txt => txt
  .replace(/!<</g, "<a target='_blank' rel='noopener' onclick='widget.pause()' href='http://")
  .replace(/<</g, "<a target='_blank' rel='noopener' onclick='widget.pause()' href='https://");


wrstore.addWikis = async (query, lang = 'en') => {
//  title = encodeURIComponent(title);
//  wrstore.title = title;
  const url1 = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${query}`;
  wrstore.checkWikiAPI(url1);

  const url2 = `https://${lang}.wiktionary.org/w/rest.php/v1/page/${query}`;
  const txt = await wrstore.checkWikiAPI(url2);

  if (txt && lang === 'en') addIPA(txt);
}

wrstore.checkWikiAPI = url => {
  const wiki = url.split('.')[1];
  return fetch(url)
    .then(resp => resp.ok ? resp.text() : '')
    .then(txt => {
	  if (txt) addWikiLabel(wiki);
	  return txt;
  })
  .catch(err => {
console.error(`Failed to get ${wiki} response:`, err);
  });
}

const getShareBtnHtml = href => {
  const shareIcon = `${uiblox.shareIcon('2 2 22 18', 24)}`;
  return highlightText(`[<div class="abs top action-icon share-icon gray"  
	  style="right:-34px; width:auto" title="Open in a new tab">${shareIcon}</div>](${href})`);
}

const onWikiClick = (btn) => {
  toggleEl(btn, 'chevron-down');
  
//  const wiktionary = {id: 'wiktionary-article'};
//  const wikipedia = {id: 'wikipedia-article'};
//  const wiktionary = {id: 'wiktionary'};
//  const wikipedia = {id: 'wikipedia'};
  let target1 = 'wikipedia';
  let target2 = 'wiktionary';

  if (btn.id.startsWith('wiktionary')) {
    target2 = 'wikipedia';
    target1 = 'wiktionary';
  }
  const el1 = elid(target1 + '-article');
  const el2 = elid(target2 + '-article');

  const hideWiki2 = () => {
    if (el2 && !isElHidden(el2)) {
      hideEl(el2);
	  toggleEl(elid(target2 + '-article-btn'), 'chevron-down');
    }
  }

  if (!el1) {
    addWikiArticle(target1);
	hideWiki2();
  } else if (isElHidden(el1)) {
      hideWiki2();
	  showEl(el1);
  } else hideEl(el1);
}

const addWikiLabel = sld => {
  const id = sld + '-article';
  const wiki = sld[0].toUpperCase() + sld.slice(1);
  let label = `<div class="inline rounded btn-lighgray acolor padding-01em" 
    onclick="onWikiClick(this.nextSibling)">${wiki} article</div>`
    + gstore.freeChevron(id, '', 'margin-left: 0', "onWikiClick(this)");

  const el = elid('wiki-menu');
  if (!el || el.innerHTML.includes(wiki)) return; // debounce b/c menu element is already there
  if (el.innerHTML) label = '&nbsp;&nbsp;' + label; //2nd menu item
  else label = '[w]&nbsp;' + label; // 1st meny item
//  el.innerHTML += label;
  elAddHTML(el, label);
}

const addWikiArticle = sld => {
  const lang = getLangCode();
  const url = `https://${lang}.${sld}.org/wiki/${wrstore.queryForURI}`;	
  const id = sld.toLowerCase() + '-article';
  const shareBtn = getShareBtnHtml(url);
  const article = `<div id="${id}" class="rel" style="width: 94%; padding-bottom: 55%;">
	<iframe id="${id}-iframe" class="abs" src=${url} style="height:100%;width:100%;border:1px silver solid;"></iframe>
	${shareBtn}
	<div id="${id}-loader" class="abs spinner" style="left: 45%"></div>
	</div>`;
//  elid('wiki-articles').innerHTML += article; // reloading DOM with existing iframe is a bad idea
  elAddHTML(elid('wiki-articles'), article);
  elid(id + '-iframe').onload = () => { hideElid(id + '-loader'); }
}

const addIPA = (txt) => { // transcription so far only for English words
//  if (s.includes(' ')) return; // if more than one word
//  const url = 'https://en.wiktionary.org/w/rest.php/v1/page/' + s;
//  fetch(url).then(resp => resp.text()) .then(txt => {
// English verbs, nouns, adj. can have different IPA. This should be accounted for later.
      const step1 = txt.split('{{IPA|en|/');
	  if (!step1) return; // meaning?
	  
	  let res = '';
	  let counter = 1;
	  while (step1[counter]) {
	    let infoBefore = step1[counter -1].toLowerCase();
        let ipa = step1[counter].split('}}')[0] || '';
	  
	    if (ipa) {
		  if (counter > 1) res += ', ';
// with wiktionary, there's no strict format, so results for parts of speech are not reliable		  
		  if (infoBefore.includes('en|verb')) res += '(v)';
		  if (infoBefore.includes('en|noun')) res += '(n)';
		  if (infoBefore.includes('adjective')) res += '(adj)';
		  if (infoBefore.includes('adverb')) res += '(adv)';
          const ipaArr = ipa.split('/');
	      res += ' /' + ipaArr[0] + '/';
	      if (ipaArr[2]) res += ', /' + ipaArr[2] + '/';
		counter ++;
	    }
	  }
//console.log('*** IPA|en|', res);
	  asyncWriteToElid('IPA', res, 2000);
}

const asyncWriteToElid = async (id, txt, wait = 2000) => {
  let t = 0;
  while (t < wait) { // don't wait too long
    await sleep(100);
	if (elid(id)) {
	  elid(id).textContent = txt;
	  break;
    }
	t += 100;
  } 
}

const getWordsFromJson = obj => {
  if (obj && obj.length) {
    const wordList = obj.map(a => a.word) .join(",");
    loadElementWithText (wordList + '\n', 'ta'); 
  }
}

const datamuseSearch = (key, query) => {
  const url = `https://api.datamuse.com/words?${key}=${query}`;
  fetch(url).then(resp => resp.text()) .then(text => {
      try { getWordsFromJson(JSON.parse(text)); } 
      catch(ex) { console.log('ex = ' + ex); }
    })
    .catch(err => {
        console.error('Failed to get Datamuse response, error ', err);
    });
}

const exploreWords = (keyList, urlKeys) => {
  const keys = keyList.split('|');
  for (const key of keys) {
    const value = urlKeys.get(key);
    if (value) {
      datamuseSearch(key, value);
      return true;
    }
  }
  return false;
}

const prepRefBox = ref => {
//  const placeholder = ref.meaning || 'Add the meaning or translation';
  const placeholder = 'Enter meaning or translation';
  const vocabMeaningInput = gstore.vocab.isAllowed()
    ? `<br><input type="text" id="vocab-meaning-input" class="inblock left-rounded" placeholder="${placeholder}"
      style="width: 16em; border: 1px solid #bbb; outline-offset:0" value="${ref.vocabInput}" 
	  onclick="handleKeyEvent"
	  />
	  <input type="submit" class="inblock ddd-bg-onhover right-rounded" 
	  style="margin-left: -6px; width: 50px; border: 1px solid #bbb; color:inherit; outline-offset:0" value="Save" 
	  onclick="gstore.vocab.addMeaning(this.previousElementSibling)">`
	: '';
// a fn may be needed to return '', e.g. if the page is not ttsRead
// add tabs
  let txt = wrstore.refboxStyle + ref.header + vocabMeaningInput +
    '<div id="tabs-box" class="tabs-box border-black">';
	
  const tabList = {
    dic: 'Dictionaries',
    thes: 'Thesauri',
    coll: 'Collocations',
    quotes: 'Quotes',
    misc: 'Misc'
  }

  for (const key in tabList) {
    if (ref[key]) {
      txt += '<div class="tab-item" id="tab-' + key + '">' 
             + tabList[key] + '</div>';
    }
  }
// add content and add features boxes
  txt += '</div><div id="content-box" class="content-box border-green"></div>'
       + '<div id="feature-box" class="border-green"></div>';
  return txt;
}

wrstore.showTabRefs = tab => {
  const refs = wrstore.refMsg[tab];
  elid('content-box').innerHTML = refs;
}

wrstore.refBox = () => elid('ref-box');

wrstore.refTabs = {
  getTabs: () => Array.from(document.getElementsByClassName('tab-item')),

  init() {
    const tabs = this.getTabs();
    if (tabs.length) {
      tabs.forEach(tab => {
        tab.onmouseenter = () => { this.activate(tab, 250); };
        tab.onclick = () => { this.activate(tab); };
      });
      this.activate(tabs[0]);
    }
  },

  async activate(el, delay = 0) {
    let cancel = false;
    el.onmouseleave = () => { cancel = true; }
    await sleep(delay);
    if (cancel) return;

//    this.deactivate();
	removeElementsClass(this.getTabs(), 'tab-active');
    el.classList.add('tab-active');

    const key = el.id.split('-')[1];
    wrstore.showTabRefs(key);
  },

/*  
  deactivate() {
    for (const el of this.collectTabs())
      el.classList.remove('tab-active');
    
  }
*/
};

wrstore.getQueryRef = (lang, key) => {
  const lookup = () => `Look up ${wrstore.markedQ} in`;

  const queryRefs = {
    en: {
  header: `Look up ${wrstore.markedQ} <span id="IPA" style="font-family: sans-serif;font-size:85%"></span>`
  ,meaning: `Add the meaning or translation`
  ,dic: `<<ahdictionary.com/word/search.html?q=${wrstore.query}'
title="The American Heritage® Dictionary">AHD</a>,
<<en.bab.la/dictionary/english/${wrstore.query}' title="English definitions powered by Oxford Languages">Bab.la</a>,
<<britannica.com/dictionary/${wrstore.query}'>Britannica</a>,
<<dictionary.cambridge.org/dictionary/english/${wrstore.query}'>Cambridge</a>,
<<collinsdictionary.com/dictionary/english/${wrstore.hyphQuery}'>Collins</a>,
<<dictionary.com/browse/${wrstore.query}'>Dictionary.com</a>,
<<ldoceonline.com/dictionary/${wrstore.hyphQuery}'>Longman</a>,
<<merriam-webster.com/dictionary/${wrstore.query}'>Merriam-Webster</a>,
<<oxfordlearnersdictionaries.com/search/english/?q=${wrstore.query}'
title="The Oxford Advanced Learner's Dictionary">OALD</a>,
<<dictionary.reverso.net/english-definition/${wrstore.query}'>Reverso</a>,
<<multitran.com/m.exe?l1=1&l2=2&s=${wrstore.query}'>Multitran</a>,
<<translate.ru/dictionary/en-ru/${wrstore.query}'>PROMT.One</a>
`
  ,thes:`
<<collinsdictionary.com/dictionary/english-thesaurus/${wrstore.hyphQuery}'>Collins</a>,
<<merriam-webster.com/thesaurus/${wrstore.query}'>Merriam-Webster</a>,
<<thesaurus.com/browse/${wrstore.query}'>Thesaurus.com</a>,
<<visuwords.com/${wrstore.query}'>Visuwords</a>,
<<wordnik.com/words/${wrstore.query}#relate'>Wordnik</a>
`
  ,coll:`
<<linguatools.de/kollokationen-en/bolls/?utf8=%E2%9C%93&query=${wrstore.query}'>linguatools</a>,
<<ozdic.com/collocation/${wrstore.query}'>ozdic</a>,
<<skell.sketchengine.eu/#result?f=wordsketch&lang=en&query=${wrstore.query}'>SKELL</a>,
<<wordreference.com/englishcollocations/${wrstore.query}'>WordReference</a>
`
  ,quotes:`
<<fraze.it/n_search.jsp?q="${wrstore.query}"'>fraze.it</a>,
<!-- <<lingo.life/quotes?search=${wrstore.query}'>Lingo.Life</a>, -->
<<wordhippo.com/what-is/sentences-with-the-word/${wrstore.query}.html'>WordHippo</a>,
<<online-translator.com/contexts/english-russian/${wrstore.query}'>PROMT.One</a>,
<<goodreads.com/quotes/search?&q="${wrstore.query}"'>Goodreads</a>,
<<lyricsondemand.com/results.html?q="${wrstore.query}"'>lyrics</a>
`
  ,misc:`
<<idioms.thefreedictionary.com/${wrstore.query}'
title="Idioms at TheFreeDictionary.com">Idioms</a>,
<<audiodrill.com?ml=${wrstore.query}'>related words</a>,
<<audiodrill.com?sl=${wrstore.query}'>sound-alikes</a>,
<a onclick="showNgram('${wrstore.query}')" title="Google Books Ngram Viewer">ngrams</a>, 
<<google.com/search?q=define+${wrstore.query}'>Google box</a>, 
<<lyricstraining.com/search?qry=${wrstore.query}'>LyricsTraining</a>, 
<<rhymezone.com/r/rhyme.cgi?Word=${wrstore.query}&typeofrhyme=perfect' title="Rhymes at RhymeZone">RhymeZone</a>,
<<merriam-webster.com/rhymes/perfect/${wrstore.query}' title="Rhymes at Merriam-Webster">Rhymes@MW</a>,
${wrstore.tubeQuizard}
`
  ,add:`, 
<span style="filter: brightness(2)">🎞️</span>film clips with 
<<yarn.co/yarn-find?text=${wrstore.query}'>Yarn.co</a>, 
<!-- <<lingo.life/movie-phrases?q=${wrstore.query}'>Lingo.Life</a>, -->
<a href="https://playphrase.me/#/search?q=${wrstore.query}" onclick="popFilmWindow('${wrstore.query}'); return false;">PlayPhrase.me</a>
`
    }
    ,de: {
  header: `Schau ${wrstore.markedQ} nach`
  ,dic: `<!-- Collins dictionary doesn't work with umlaut well -->
<<dwds.de/wb/${wrstore.query}'>DWDS</a>,
<<de.langenscheidt.com/deutsch-englisch/${wrstore.query}'>Langenscheidt</a>,
<<linguee.com/german-english/translation/${wrstore.query}.html'>Linguee</a>,
<<openthesaurus.de/synonyme/${wrstore.query}'>OpenThesaurus</a>,
<<de.pons.com/%C3%BCbersetzung?l=dedx&q=${wrstore.query}'>PONS</a>,
<<de.thefreedictionary.com/${wrstore.query}'>The Free Dictionary</a>,
<<woerterbuch.reverso.net/deutsch-definition/${wrstore.query}'>Reverso</a>,
<<translate.ru/dictionary/de-ru/${wrstore.query}'>PROMT.One</a>
`
  ,coll:`<<skell.sketchengine.eu/#result?f=wordsketch&lang=de&query=${wrstore.query}'>SKELL</a>
`
  ,quotes:`<<dwds.de/r/?corpus=korpus21&q=${wrstore.query}'>DWDS Korpus21</a>,
<<fraze.it/n_search.jsp?l=3&q="${wrstore.query}"'>fraze.it</a>,
<<online-translator.com/kontexte/deutsch-englisch/${wrstore.query}'>PROMT.One</a>`

  ,add:`, 
<a href="https://playphrase.me/#/search?q=${wrstore.query}&language=de" 
onclick="popFilmWindow('${wrstore.query}&language=de'); return false;">PlayPhrase.me</a>
`
    }

    ,it: {
  header: `Cercare ${wrstore.markedQ} nel `
  ,dic: `<<linguee.com/italian-english/translation/${wrstore.query}.html'> Linguee</a>,
<<treccani.it/vocabolario/ricerca/${wrstore.query}'> Treccani</a>,
<<it.thefreedictionary.com/${wrstore.query}'> The Free Dictionary</a>,
<<dizionario.reverso.net/italiano-inglese/${wrstore.query}'> Reverso</a>,
<<translate.ru/dictionary/it-ru/${wrstore.query}'>PROMT.One</a>
`
  ,coll:`<<skell.sketchengine.eu/#result?f=wordsketch&lang=it&query=${wrstore.query}'>SKELL</a>`
  ,quotes:`<<fraze.it/n_search.jsp?l=4&q="${wrstore.query}"'>fraze.it</a>,
<<online-translator.com/contexts/italian-english/${wrstore.query}'>PROMT.One</a>`
  ,add:`, 
<a href="https://playphrase.me/#/search?q=${wrstore.query}&language=it" 
onclick="popFilmWindow('${wrstore.query}&language=it'); return false;">PlayPhrase.me</a>
`
    }

    ,fr: {
  header: `Rechercher ${wrstore.markedQ} dans`
  ,dic: `<<cnrtl.fr/definition/${wrstore.query}'>CNRTL</a>,
<<larousse.fr/dictionnaires/francais/${wrstore.query}'>Larousse</a>,
<<dictionnaire.lerobert.com/definition/${wrstore.query}'>Le Robert</a>,
<<linguee.com/french-english/translation/${wrstore.query}.html'> Linguee</a>,
<<fr.thefreedictionary.com/${wrstore.query}'>The Free Dictionary</a>,
<<dictionnaire.reverso.net/francais-definition/${wrstore.query}'>Reverso</a>,
<<translate.ru/dictionary/fr-ru/${wrstore.query}'>PROMT.One</a>
`
  ,quotes:`<<fraze.it/n_search.jsp?l=1&q="${wrstore.query}"'>fraze.it</a>,
<<online-translator.com/contexts/french-english/${wrstore.query}'>PROMT.One</a>`

  ,add:`, 
<a href="https://playphrase.me/#/search?q=${wrstore.query}&language=fr" 
onclick="popFilmWindow('${wrstore.query}&language=fr'); return false;">PlayPhrase.me</a>
`
    }

    ,es: {
  header: `Buscar ${wrstore.markedQ} en`
  ,dic: `<<dle.rae.es/${wrstore.query}'> DLE</a>,
<<spanishdict.com/translate/${wrstore.query}'>SpanishDict</a>,
<<linguee.com/spanish-english/translation/${wrstore.query}.html'> Linguee</a>,
<<es.thefreedictionary.com/${wrstore.query}'> The Free Dictionary</a>,
<<dictionary.reverso.net/spanish-definition/${wrstore.query}'> Reverso</a>,
<<translate.ru/dictionary/es-ru/${wrstore.query}'>PROMT.One</a>
`
  ,quotes:`<<fraze.it/n_search.jsp?l=2&q="${wrstore.query}"'>fraze.it</a>,
<<online-translator.com/contexts/spanish-english/${wrstore.query}'>PROMT.One</a>`

  ,add:`, 
<a href="https://playphrase.me/#/search?q=${wrstore.query}&language=es" 
onclick="popFilmWindow('${wrstore.query}&language=es'); return false;">PlayPhrase.me</a>
`
    }

    ,pl: {
  header: `Zobacz ${wrstore.markedQ} w słownikach:
<<pl.bab.la/slownik/polski-angielski/${wrstore.query}'>Bab.la</a>,
<<dictionary.cambridge.org/dictionary/polish-english/${wrstore.query}'>Cambridge</a>,
<<diki.pl/slownik-angielskiego?q=${wrstore.query}'>Diki</a>,
<<multitran.com/m.exe?l1=14&l2=2&s=${wrstore.query}'>Multitran</a>,
<<sjp.pwn.pl/szukaj/${wrstore.query}'>PWN</a>,
<<pl.thefreedictionary.com/${wrstore.query}'>The Free Dictionary</a>,
<<wsjp.pl/szukaj/podstawowe/wyniki?szukaj=${wrstore.query}'>WSJP</a>
<br>
<<google.com/search?q=definicja+${wrstore.query}'>Przegląd od Google AI</a> ∙ 
<<synonim.net/synonim/${wrstore.query}'>Synonimy</a> ∙ Cytaty:
<<pl.bab.la/zdania/polski/${wrstore.query}'>Bab.la</a>,
<<sjp.pwn.pl/korpus/szukaj/${wrstore.query}'>korpus PWN</a>
`
  ,meaning:`Dodaj znaczenie lub tłumaczenie`
    }

    ,pt: {
  header: `Pesquisar ${wrstore.markedQ} no`
  ,dic: `<<infopedia.pt/dicionarios/lingua-portuguesa/${wrstore.query}'> DILP</a>,
<<www.dicio.com.br/${wrstore.query}'> Dicio (BR)</a>,
<<linguee.com/portuguese-english/translation/${wrstore.query}.html'> Linguee</a>,
<<pt.thefreedictionary.com/${wrstore.query}'> The Free Dictionary</a>,
<<dictionary.reverso.net/portuguese-english/${wrstore.query}'> Reverso</a>
`
  ,thes:`<<sinonimos.com.br/${wrstore.query}'> Sinônimos (BR)</a>,
<<antonimos.com.br/${wrstore.query}'> Antônimos (BR)</a>`
  ,quotes:`<<fraze.it/n_search.jsp?l=9&q="${wrstore.query}"'>fraze.it</a>,
<<online-translator.com/contexts/portuguese-english/${wrstore.query}'>PROMT.One</a>`
    }

    ,zh: {
  header: lookup() + `
<<dictionary.cambridge.org/dictionary/chinese-simplified-english/${wrstore.query}'>Cambridge</a>,
<<collinsdictionary.com/dictionary/chinese-english/${wrstore.query}'>Collins</a>,
<<linguee.com/english-chinese/search?query=${wrstore.query}'>Linguee</a>,
<<zh.thefreedictionary.com/${wrstore.query}'>The Free Dictionary</a>,
<<en.wiktionary.org/wiki/${wrstore.query}#Chinese'>Wiktionary</a>,
<<dictionary.writtenchinese.com/#sk=${wrstore.query}&svt=pinyin'>Written Chinese</a>,
<<chinese.yabla.com/chinese-english-pinyin-dictionary.php?define=${wrstore.query}'>Yabla</a>
`
   }

    ,ko: {
  header: lookup() + `
<<en.wiktionary.org/wiki/${wrstore.query}#Korean'>Wiktionary</a>
`
   }

    ,ja: {
  header: lookup() + `
<<linguee.com/english-japanese/search?query=${wrstore.query}'> Linguee</a>,
<<en.wiktionary.org/wiki/${wrstore.query}#Japanese'>Wiktionary</a>,
<<jisho.org/search/${wrstore.query}'>Jisho</a>,
<<translate.google.com/#view=home&op=translate&sl=ja&tl=en&text=${wrstore.query}'>Google Translate</a>
`
  ,add:`, 
<a href="https://playphrase.me/#/search?q=${wrstore.query}&language=ja" 
onclick="popFilmWindow('${wrstore.query}&language=ja'); return false;">PlayPhrase.me</a>
`
   }

    ,th: {
  header: lookup() + `
<<en.wiktionary.org/wiki/${wrstore.query}'>Wiktionary</a>
`
   }

    ,tr: {
  header: lookup() + `
<<tureng.com/en/turkish-english/${wrstore.query}'> Tureng</a>,
<<tr.thefreedictionary.com/${wrstore.query}'> The Free Dictionary</a>,
`
   }

    ,uk: {
  header: lookup() + `
<<https://goroh.pp.ua/%D0%A2%D0%BB%D1%83%D0%BC%D0%B0%D1%87%D0%B5%D0%BD%D0%BD%D1%8F/${wrstore.query}'>Goroh</a>,
<<slovnyk.ua/index.php?swrd=${wrstore.query}'>Slovnyk</a>,
`
   }

    ,vi: {
  header: lookup() + `
<<en.wiktionary.org/wiki/${wrstore.query}'>Wiktionary</a>
`
   }

    ,ru: {
  header: `Искать ${wrstore.markedQ} в
<<dic.academic.ru/searchall.php?SWord=${wrstore.query}'>Academic</a>,
<<gramota.ru/slovari/dic/?word=${wrstore.query}&all=x'>Gramota</a>,
<<linguee.com/english-russian/search?query=${wrstore.query}'> Linguee</a>,
<<translate.ru/перевод/русский-английский/${wrstore.query}'>PROMT.One</a>,
<<ruscorpora.ru/explore?req=${wrstore.query}'>RU Corpus</a>,
<<skell.sketchengine.eu/#result?f=wordsketch&lang=ru&query=${wrstore.query}'>SKELL</a>,
`
  ,meaning:`Добавь значение или перевод`
   }

    ,ar: {
  header: lookup() + `
<<en.wiktionary.org/wiki/${wrstore.query}#Arabic'>Wiktionary</a>,
<<translate.google.com/#view=home&op=translate&sl=ar&tl=en&text=${wrstore.query}'>Google Translate</a>
`
   }

    ,nl: {
  header: `Zoek ${wrstore.markedQ} op
<<linguee.com/dutch-english/translation/${wrstore.query}.html'> Linguee</a>,
<<nl.thefreedictionary.com/${wrstore.query}'> The Free Dictionary</a>,
<<woorden.org/woord/${wrstore.query}'>Woorden.org</a>
`
   }

    ,he: {
  header: lookup() + `
<<en.wiktionary.org/wiki/${wrstore.query}#Hebrew'>Wiktionary</a>,
<<pealim.com/he/search/?q=${wrstore.query}'>Pealim</a>,
<<translate.google.com/#view=home&op=translate&sl=iw&tl=en&text=${wrstore.query}'>Google Translate</a>
`
   }

    ,el: {
  header: lookup() + `
<<wordreference.com/gren/${wrstore.query}'>WordReference</a>, 
<<translate.google.com/#view=home&op=translate&sl=el&tl=en&text=${wrstore.query}'>Google Translate</a>
`
   }

    ,sv: {
  header: lookup() + `
<<ne.ord.se/ordbok/svenska/engelska/s%C3%B6k/${wrstore.query}'>Ord</a>,
<<translate.google.com/#view=home&op=translate&sl=sv&tl=en&text=${wrstore.query}'>Google Translate</a>
`
   }

    ,hi: {
  header: lookup() + `
<<en.wiktionary.org/wiki/${wrstore.query}#Hindi'>Wiktionary</a>
`
   }

    ,fa: {
  header: lookup() + `
<<en.wiktionary.org/wiki/${wrstore.query}#Persian'>Wiktionary</a>
`
   }

    ,cs: {
  header: lookup() + `
<<glosbe.com/cs/en/${wrstore.query}'>Glosbe</a>,
<<prirucka.ujc.cas.cz/?slovo=${wrstore.query}'>Jazyková příručka</a>,
<<korpus.cz/slovo-v-kostce/search/cs/${wrstore.query}'>Korpus</a>
`
   }

  ,xx: {
  header: ` ${wrstore.markedQ} `
  ,dic: ``
  ,thes:``
  ,coll:``
  ,quotes:``
  ,misc:``
   }
  }

//console.log(queryRefs[lang]);
  if (!queryRefs[lang]) return '';
  if (key) return queryRefs[lang][key] || '';
  else return queryRefs[lang];
};

wrstore.refboxStyle = `
<style>
#ref-box, #widget-header, #chem-image {
  padding: 0 1em 0 0.3em;
  font-family: "Times New Roman", Times, serif;
  font-size: 55%; 
  line-height: 1.2em; 
  text-align: left; 
  margin-top: 1px;
  white-space: normal;
}

#ref-box {margin-top: 0}

/*
#ref-box a, #widget-header a {
  text-decoration: underline;
  text-decoration-color: #ddd;
}
*/
#widget-header { margin-bottom: 0.1em;}

#ref-box a:hover, #widget-header a:hover {
  background-color: #eee;
  text-decoration:none;
}

.tabs-box {
  display: flex;
  flex-wrap: wrap;
  margin-top: 0.2em;
  cursor: default;
/*  width: fit-content;*/
}

.tab-item {
  display:inline-block;
  padding: 0.1em 0.3em;
  color: gray;
  background-color: #eee;
  border: 1px solid silver;
  border-bottom: 0;
  border-radius: 5px 5px 0 0;
}

.tab-active {
  color: #444;
  background-color: white;
  box-shadow:  0 5px 0 #fff, 1px 0 2px #aaa, -1px 0 2px #aaa;
}

.content-box {
  margin-bottom: 0.2em;
  padding: 0.2em;
  line-height: 1.4em;
/*  width: fit-content; */
  border-bottom: 1px solid #e3e3e3;

}

.marked-word {
  background-color: #ddFBdd; 
  background-color: #f0fff0; 
  background-color: #efe; 
  font-weight: 500;
  font-size: 110%;
  font-style: italic;
  padding: 0 0.2em;
}

</style>
`;

/*
*** Future plans ***
- add Morfix for Hebrew?

- free images could be fetched via https://api.openverse.org/v1/images/?q="query"

- one more API is free: https://api.dictionaryapi.dev/api/v2/entries/en/...
- it offers phonetic transcription. See https://dictionaryapi.dev/
- MediaWiki API: https://www.mediawiki.org/wiki/API
Example: https://en.wiktionary.org/w/rest.php/v1/page/sugar
usage examples are kept at {{ux|en|...
or
https://en.wiktionary.org/w/api.php?action=parse&format=json&prop=text|revid|displaytitle&callback=?&page=%D7%91%D7%94%D7%A6%D7%9C%D7%97%D7%94
mobileformat boolean key can be added
- Wikipedia API: https://awik.io/get-extract-wikipedia-page-wikipedia-api/
- Witionary API:
https://gist.github.com/nichtich/674522
https://github.com/PalmerAL/wiktionary-parser/blob/gh-pages/wiktionary-parser.js

Google translation APIs: https://github.com/ssut/py-googletrans/issues/268

*/