gstore.vocab = {
// should gstore.vocabMode and gstore.vocabArr be moved here?
	
  isAllowed: () => tasksPageActive() || (wordsPageActive() && isPageHeader('ttsRead')),
  prefix: ':vocab:',

  modes: ['highlight', 'hover meanings', 'show meanings', 'hover originals', 'hide originals', 'plain hover', 'off'],
  
  init(){
    if (!gstore.vocabMode) gstore.vocabMode = 0;
    if (!gstore.vocabArr) gstore.vocabArr = [];
    return this.prefix + '\n';
  },
  
  build(){ return this.init() + gstore.vocabArr.join('\n') + '\n' },
  
  getBeforeVocab(s) { return (s && s.includes(this.prefix))? s.substring(0, s.indexOf(this.prefix)) : s },
  getVocab(s) { return (s && s.includes(this.prefix))? s.substring(s.indexOf(this.prefix)) : '' },
  getVocabEntries(s) { return (s && s.includes(this.prefix))? s.substring(s.indexOf(this.prefix) + this.prefix.length) : '' },
  
//  isEmpty() { return (!gstore.vocabArr || !!gstore.vocabArr.length) }, // may be not needed?

  twinEntries: (query) =>
    (gstore.vocabArr || []) 
    .filter(s => s.includes('=') // keep only entries with '=' 
	  && trimToLower(s.split('=')[0]) === trimToLower(query)) // and matching the query
  ,

  addEntry(s, entry, meaning) { // used by task.html
	entry = trimToLower(entry);
	meaning = trimToLower(meaning);
	const line = entry + ' = ' + meaning;
	const twinEntriesArr = this.twinEntries(entry);
    if (twinEntriesArr.length) {
	  const twinEntryIndex = gstore.vocabArr.indexOf(twinEntriesArr[0]);
	  gstore.vocabArr[twinEntryIndex] = line;
//console.log('Same entry', gstore.vocabArr[twinEntryIndex], twinEntryIndex);
      s = this.getBeforeVocab(s) + this.build();
      vocabCallback('VOCAB_ENTRY_ADDED', s);
	}
	else this.addQuery(s, line);
  },

  getMeaning: (v) => // used by word-ref and task.html
    (gstore.vocabArr || []) 
    .filter(s => s.includes('=')) // keep only entries with '='

    .map(s => trimToLower(s.split('=')[0]) === trimToLower(v) // entry matches the query?
	  ? s.split('=')[1].trim() // return matching meanings 
	  : '') // or return ''

    .filter(s => s)[0] || '', // keep only non-empty entries and give first element, if any - or ''

// ===

  addQuery(s, query, context) {
// may be reviewed later to just add query without much checking
// for checking, twinEntries can be used	  
//console.log('addQuery', query);
    let vocab = this.getVocab(s);
    if (!vocab) s += '\n' + this.init();
	if (!s.endsWith('\n')) s += '\n';
	let resQ = trimToLower(query);
	const isQueryMatch = (vocabEntry, s) => trimToLower(vocabEntry.split('=')[0]) .includes(s);
// the problem arises if we try to remove a partly matching entries, e.g. if we have entries 'the meaning' and 'meaning'	
	
//    if (!gstore.vocabArr || !gstore.vocabArr.filter(entry => trimToLower(entry.split('=')[0]) === trimToLower(query)) .length)
// exact match of vocabEntry and query may be checked as an option in the future, depending on cmd mode
/*
    if (!gstore.vocabArr 
     || !gstore.vocabArr
	      .filter(vocabEntry => isQueryMatch(vocabEntry, trimmedQ))
		  .length
	 )
      s += query + '\n';
*/
    let matchedArr = [];
    if (gstore.vocabArr) {
	  matchedArr = gstore.vocabArr .filter(vocabEntry => isQueryMatch(vocabEntry, resQ));
//console.log('matchedArr', matchedArr);
    }
	
    if (matchedArr.length) {
	  const matchedQ = matchedArr[0] .split('=')[0] .trim();
	  if (context && context.toLowerCase().includes(matchedQ)) resQ = matchedQ;
	  else matchedArr = [];
	}

    if (!gstore.vocabArr || !matchedArr.length) s += resQ + '\n';
    else if (gstore.ctrlKey || gstore.metaKey){
   // Remove entry if Ctrl is pressed
//	  gstore.vocabArr = gstore.vocabArr.filter(entry => trimToLower(entry.split('=')[0]) !== trimToLower(query));
	  gstore.vocabArr = gstore.vocabArr.filter(vocabEntry => !isQueryMatch(vocabEntry, resQ));
	  s = this.getBeforeVocab(s);
	  if (gstore.vocabArr.length) s += this.build();
	}
	
	if (gstore.vocab.sentenceExample) {
	  const entry = resQ.split('=')[0].trim();
      const regex = new RegExp(entry, 'gi');
	  const example = gstore.vocab.sentenceExample.replace(regex, s => '*' + s + '*'); //highlight
	  gstore.vocab.sentenceExample = '';
	  s += ' ' + example + '\n';
	}
    vocabCallback('VOCAB_ENTRY_ADDED', s);
	return resQ;
  },

// ===
  tag: '<RENDER_VOCAB_PREFIX>',

  render(s, options = {}) {
	this.exists = false; 
// maybe this.vocabArr should be cleared too?
    gstore.vocabArr = [];

    const vocab = this.getVocab(s);
//console.log('vocab', vocab);
    if (!vocab) return s;
	this.exists = true;
  
    gstore.vocabArr = vocab.replace(this.prefix, '')
//    .replace(gstore.vocab.suffix, '')
//      .replace(/\r/g, '')
	  .split('\n')
//	  .filter(s => s.trim()); // remove empty entries;
// 2025-01-12: Entries can contain usage examples. Should they be filtered out?
//console.log('gstore.vocabArr', gstore.vocabArr);

    if (gstore.vocabArr) {
		gstore.vocabArr = gstore.vocabArr.filter(entry => entry.trim()); // keep non-empty lines
    }
// may need to check: if gstore.vocabArr is empty, make it null?
    if (!gstore.vocabArr.length) return s.replace(this.prefix, '');
    return markVocabEntries(s, gstore.vocabArr, gstore.vocabMode || '', options)
      .replace(this.prefix, this.tag);
  },

  renderTag(s, cmd)  {
	const optionalHeaderDiv = gstore.vocab.optionalHeaderDiv || '';
    const tip=`tip="Click to change vocabulary mode
  or use keyboard shortcut<br>|_Ctrl_| + |_._|
"`;
    const vocabHeader = '<div id="vocab-section" class="vocab-section inherit">';
	if (cmd === 'EMPTY_VOCAB_HEADER') 
	  return s.replace(this.tag + '\n', vocabHeader); 
	
//    const header = '<hr><div class="small-font ptr" style="width: fit-content; margin: auto;" onclick="showTopSettings();stopPropagation(event)" onmouseenter="showTip(this)" onmouseleave="hideTip()"'
//    const header = `<hr><div class="small-font ptr" style="width: fit-content; margin: auto;" onclick="vocabCallback('VOCAB_MODE_BTN');" onmouseenter="showTip(this)" onmouseleave="hideTip()"`
    const header = vocabHeader + `<div class="flex small-font ptr" style="width: fit-content; margin: auto;">※※※&emsp;${optionalHeaderDiv}<div onclick="vocabCallback('VOCAB_MODE_BTN');"`
	  + tip
      + '>' + gstore.settingsIcon + '&ensp;Vocabulary</div>&emsp;※※※</div>';
	const getBtnHtml = (callback, caption) => `<button class="btn-darker margin-1em" onclick=vocabCallback('${callback}')>${caption}</button>`
    let addinfo = getBtnHtml('GOTO_BTN', 'Go to ' + cmd);
//	if (cmd === 'writing practice') addinfo += getBtnHtml('VOCAB_MODE_BTN', 'Change vocab mode');
//	else addinfo += '<div class="abs top font-150pc">{x-view-gaps}</div>';
	if (cmd !== 'writing practice') addinfo += '<div class="abs top font-150pc">{x-view-gaps}</div>';

//    return s.replace(gstore.vocab.tag, '<hr><div class="rel center small-font" onclick="stopPropagation(event)">※※※&emsp;📝&emsp;※※※<br>' + addinfo + '</div>');
    return s.replace(this.tag, header + '<div class="center">' + addinfo + '</div></div>');
  },

/*
  applyChanges(el) {
// is this fn used any longer?
    const s = el.innerText.replace(/\n+/g, '\n');
//console.log('applyChanges fn called', s);
    vocabCallback('VOCAB_EDITED', s);
  },
*/
}

const markVocabEntries = (s, vocab, cmd, options = {}) => {
  const maskVocabEntry = (s, entry, i) => {
    const arr = entry.split('=');
    entry = arr[0].trim(); // using in entry characters like *, <)), etc. will lead to error
    const meaning = (arr[1] || '').trim();

	if (entry.length < 5) entry = '\\b' + entry; // see the comment below
// For short vocab entries, the target word should start exactly as entry.
// For example, for 'pan' entry, target 'PANned' but ignore 'comPANy'.

//    const searchExp = new RegExp(entry, "ig");
// ignore entries in [[ ]] (gaps), but entries in << >> (old-style gaps) are still changed
    const searchExp = new RegExp(`(?<!\\[\\[\\s*)${entry}(?!\\s*\\]\\])`, "ig");
    return s.replace(searchExp, s => applyMask(s, meaning));
  }

  const getVocabMask = i => '{vocab_entry_' + i + '}';

  const applyMask = (s, meaning) => {
    bodyEntriesArr.push([s, meaning]) // mask index and vocab entry index might be added if needed
    const index = bodyEntriesArr.length -1;
    return getVocabMask(index);
  }
  
  const demaskBody = (txt, entryArr, index, cmd) => {
    const entry = entryArr[0].trim();
    const meaning = (entryArr[1] || '').trim();
    const markedText = getMarkedEntry(entry, meaning, cmd);
    const mask = getVocabMask(index);
    return txt.replace(mask, markedText);
  }

  const getMarkedEntry = (entry, meaning, cmd) => {
    let markedEntry = '==' + entry + '=='; // marked text
    if (cmd === 1 && meaning) markedEntry = `=={{${meaning}|${entry}}}==`; // marked tip

    if (cmd === 3) { // fading span
      const direct = (['he', 'ar'].includes(tts.langCode))? 'rtl' : 'ltr';
      markedEntry = `==<span class="transp-grad-${direct}">` + entry + '</span>=='; 
//      markedEntry = `==<span class="reveal-on-hover-${direct}">` + entry + '</span>=='; // experimental
    }

    if (cmd === 4) { // gap
/*
      const acro = entry.split(' ') 
	    .map(w => w.length > 1? w[0] + '___' : w)
	    .join(' ');
acro can take care of hyphenated words
*/
      const acro = makeAcronym2(entry);

      markedEntry = `[[${entry} => ${acro}]]`; 
    }

    if (cmd === 5  && meaning) markedEntry = `{{${meaning}|${entry}}}`; // plain tip
	
    if (cmd === 6) markedEntry = entry; // no marking

    const addedMeaning = (meaning && cmd > 1 && cmd < 5) 
	  ? '&thinsp;(<span class="font-85pc">' + meaning + '</span>)' // added in brackets
	  : '';
    return markedEntry + addedMeaning;
  }

  
// markVocabEntries action starts here:

//  const vocabArr = vocab.filter(el => el.trim());
// remove examples (starting with space) and empty lines.
  const vocabArr = vocab.filter(el => !el.startsWith(' ') && el.trim());
  if (!vocabArr.length) return s;

  cmd = cmd || 0;
  const bodyEntriesArr = []; 
  let bodyText = gstore.vocab.getBeforeVocab(s);

// Mask body entries

  const longerToShorterArr = vocabArr.toSorted((a, b) => b.split('=')[0].length - a.split('=')[0].length);
//console.log('longerToShorterArr', longerToShorterArr);
  for (const [i, entry] of longerToShorterArr.entries())
    bodyText = maskVocabEntry(bodyText, entry, i);

// Replace masks with entries in reverse mode

  while (bodyEntriesArr.length) {
    const savedEntry = bodyEntriesArr.pop();
//console.log('savedEntry', savedEntry);
    bodyText = demaskBody(bodyText, savedEntry, bodyEntriesArr.length, cmd);
  }
//console.log('bodyText', bodyText);

// Mark vocab if needed
  let vocabText = gstore.vocab.prefix + '\n';
  if (options.addDiv === true)
//    vocabText += '<div id="vocab-entries" contenteditable="true" onblur="gstore.vocab.applyChanges(this)">';
    vocabText += '<div id="vocab-entries" class="vocab-content">';
//  for (entry of vocabArr) {
  const vbreak = tasksPageActive() ? vbreakDiv() : ''; 
	
  for (const entry of vocab) {
    if (entry.startsWith(' ')) {
	  vocabText += ' ' + (options.examplePrefix || '') 
	  + entry.trim()
      + (options.exampleSuffix || '');
	}
	else if (entry.trim()) {
	  let left = entry.split('=')[0] .trim();
	  if ([3, 4].includes(cmd)) left = getMarkedEntry(left, '', cmd);

	  vocabText += vbreak
	    + (options.prefix || '') 
	    + left
		+ (options.suffix || '') 
		+ ' = ' + (entry.split('=')[1] || '');
    }
	vocabText += '\n';
  }

//console.log('vocab text', vocabText);  
  return bodyText + vocabText + '</div>';
}

/*
Bug: in tasks, the same chunk can be added to vocab several times. This doesn't happen in ttsread
(For tasks page,) vocab could also include examples of usage in sentences. How not to create mess with entries?
For example, start the example line with space, so that it be ignored when vocab entries are processed.
*/