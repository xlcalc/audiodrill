var tasks = [], playIsOn = false, playName, oldPlayName;

const ttsGame = {}, drillText = {};
const dlg = {
  lineN: null,

  isRunning() { return (taskIsDialog() && this.lineN !== null) },

  currentLine() {
    if (!this.isRunning()) return null;
    return currentTask().lines[this.lineN];
  },

  length: () => taskIsDialog() ? currentTask().lines.length : 0,

  atTheStart() { 
    if (!this.isRunning()) return false;
    return (currentTask().speakers.indexOf('A') < this.lineN);
  },

  atTheEnd() { return (this.lineN >= this.length() - 1) },

  end() { this.lineN = null; }
};

const fetchGrammarGame = async (url, param) => {
  ttsGame.loadStatus = 'loading';
  try {
    const txt = await fetchText(url);
    ttsGame.loadStatus = 'loaded';
    parseGrammarGame(txt, param);
  } catch (e) { 
    console.error(e);
    ttsGame.loadStatus = e.message;
//    infoGameLoading(e);
    displayAlarmMessage(e.message);
    speak("Sorry, the game can't be loaded. Please check its address and internet connection.");
  }
}

const testDialogSample = `
Read the highlighted lines of the dialogue
-What's wrong with you?
-Nothing! You know, I think he really likes you.
-Don't be daft! He's only being polite.
-Do you think so?
-Yes, and why are you so interested all of a sudden?
-No, no reason really. 
Look, I've got to get back to the flat. 
I've got loads of studying to do.

::
:say: Meeting a friend 
A: Hi there!

Where have you been?
B: Hi, how are you? 
Just came from Rome.
::
:say:Could you, hm, me more about it?| 
:write:Could you ____ me more about it?
:accept:Could you tell me more about it?
::
Another dialogue
A: Hey, how are you?
How have you been?
B: Hi, I'm well, and you? 
::
Yet Another dialogue
- Could you hold on?
I'm trying to connect.
- Thank you.
- Sorry, the line is busy.
Can I leave a message?
`;

async function parseGrammarGame(text, param) {
  const tags = ['say', 'write', 'accept', 'error', 'show', ''];
  const globalTags = ['keylist', 'gametype', 'title', 
      'intro', 'outro', 'lang', 'lang2', 'noecho', 'target'];
    
  let newtask = [],
    task = {say:'', write:'', accept:'', error:[]}, 
    parsedText = decodedText(text);

  ttsGame.randomizeTasks = !parsedText.includes(':norandom:');
  ttsGame.text = parsedText.replace(':norandom:', '');

  ttsGame.templateTask = false;
  if (parsedText.includes("${")) {
    getTemplateVars(parsedText);
    ttsGame.templateTask = true;
  }

  parsedText = parsedText.split('\n');

  const resetGrammarGameParameters = () => {
    ttsGame.taskNumber = 0; 
    tasks = [];

    ttsGame.tasks=[];
    for (const tag of globalTags) ttsGame[tag] = ''; // init global params 
  }

  resetGrammarGameParameters();

  const parseTags = line => {
// check global tags
    let noGlobalTag = true;
    for (const tag of globalTags) {
      if (line.includes(":" + tag + ":")) {
        noGlobalTag = false;
        ttsGame[tag] = line.split(tag + ":")[1] .trim();
      }
    }
// draft adding dialog new!
// ignore empty lines and lines with global tags
    if (line && line.trim() && noGlobalTag) newtask.push(line.trim()); 

// check cue tags
//    for (let [i, tag] of tags.entries()) {
    for (const tag of tags) {
      if (line.includes(":" + tag + ":")) {
        if (tag === '') { // end of task ::
          tasks.push(task);
//          task = {say:'', write:'', accept:'', error:[], a:[], b:[]};
          task = {say:'', write:'', accept:'', error:[]};

// draft adding dialog new!
          newtask.pop() // remove trailing ::
          ttsGame.tasks.push(newtask);
          newtask = []; 
          break;
        }

        const str = line.split(tag + ':')[1];
        if (tag === 'error') {
          const errors = str.split('=>');
          const tip = errors[1];
          task.error.push([errors[0].split('|'), tip]);
        } else {
            task[tag] = str.split('|');
            if (tag === 'say' && str[str.length-1] === '|') // :say: ends with '|'
              task[tag][1] = ' ';
        }
      }
    }
  }

  for (const line of parsedText) parseTags(line);
// draft adding dialog new!
  if (newtask.length) { // add the rest if the game not ends in ::
    ttsGame.tasks.push(newtask);
    tasks.push(task);
  }
  setTaskTypesAndMerge();
  
console.log('param ',param);
  if (['uploaded-game','from-ta'].includes(param)) { //assign playName to a key from the loaded file
    playName = ttsGame.gametype || 'other-ttsgames';
    ttsGame.origin = 'non-voice';
  }
  else { ttsGame.origin = 'voice'; }

// assign game title if not given in the game
  const titles = {conditionals: "Conditionals", 
    'sound-alikes': "Sound-alike words",
    verbs: "Irregular Verbs"
  };

  if (!ttsGame.title && (ttsGame.flashcards)) ttsGame.title = 'Flashcard Game';
  ttsGame.title = (ttsGame.title.split('//')[0] || titles[playName] || "Let's Play") + "\n";

  playIsOn = true;
  if (!embedPageActive()) {
    setPageHeader("game");
    gstore.autoStartVideo = 0;
    ta.classList.remove('small-font');
    showEl(editBtn);
  } else mic.style.display = 'block';

  if (ttsGame.templateTask) setTemplateGameTask();

// ttsGame.lang may be set in parseTags fn
console.log('parseGrammarGame with ttsGame.lang ', ttsGame.lang);

//  ttsGame.langCode = ttsGame.lang || '';
  storeLangCode(ttsGame.lang || '');
//  ttsGame.langCode2 = ttsGame.lang2 || '';
  storeLangCode(ttsGame.lang2 || '', '2');
  if (embedPageActive()) {
//    if (ttsGame.langCode) {
    if (ttsGame.lang) {
      await setEmbedVoice();
    }
//  } else setLanguage(ttsGame.langCode);
  } else setLanguage(ttsGame.lang);
  
  ttsGame.loadStatus = 'GAME_PARSED';

  startPlaying();
} // end of parseGrammarGame fn

const startPlaying = () => {
  ta.innerHTML = `
<div id='game-title' class='center'></div>
<div id='game-intro' style='font-size: 85%; font-weight: 600; padding: 0 0.2em; line-height: 1.2em;'></div>
<div id='game-task' class='game-task'></div>
<div id='game-feedback'></div>
`;
  setElHTML('game-title', '🌟<b>' + ttsGame.title + '</b>🌟');
  const intro = (ttsGame.intro || '').split("|"),
        writtenIntro = intro[1] || intro[0];

  if (writtenIntro) setElHTML('game-intro', highlightText(writtenIntro)); //elAddHTML may be used insted to set *bold* text

  restartGrammarGame(); //why intro is spoken here?
}

const prepNavBox = () => {
  taBottom.classList.add('flex', 'flex-center');
  const st = taBottom.style;
  st.cursor = 'default';
  st.color = '#bbb';
  st.fontSize = '90%';
 // st.height = '9%';
  st.minHeight = '5vh'; 
//  st.width = '100%';
  st.marginTop = '1px';
//  st.padding = '0.1em';
//  st.borderTop = '1px solid silver';
  st.backgroundColor = '#eee';
  st.borderLeft = '1px solid #e3e3e3';
  st.borderRight = '1px solid #e3e3e3';
  st.borderBottom = '1px solid #e3e3e3';
  st.borderBottomLeftRadius = '6px';
  st.borderBottomRightRadius = '6px';
  ta.style.borderBottomLeftRadius = '0';
  ta.style.borderBottomRightRadius = '0';
}

const showNavButtons = () => {
  prepNavBox();
//  setElHTML('playground-div', getNavButtons());
  setElHTML('ta-bottom', getNavButtons());
}

const getNavButtons = () => {
  const redoBtn = `
<div class="btn inblock padding-03em" onclick="restartCurrTask()" title="Redo this task">&#x21ba;
</div>
`;

  let flipBtn = ''
  if (taskIsDialog()) flipBtn = `
<div class="btn inblock padding-03em" onclick="flipCurrDialog()" title="Flip this dialogue: 
your lines will be read by the computer and vice versa"
  style="position: relative; margin-left: -0.25em; margin-right: 0.4em; font-weight: 600">&ensp;
  <span class="flip-btn-a">&curvearrowright;</span>
  <span class="flip-btn-b">&curvearrowright;</span>
</div>
`;

  let previousLineBtn = '', nextLineBtn = '';

  if (taskIsDialog()) {
    previousLineBtn = `
<span class="btn" onclick="handleDlgPrevLineBtn()" 
title="Previous line">&#9664;</span>
`;
    nextLineBtn = `
<span class="btn" style="margin-left: -0.2em" onclick="handleDlgNextLineBtn()" 
title="Next line">&#9654;</span>
`;
  }
  let previousTaskBtn = '', nextTaskBtn = '';

  if (tasks.length > 1) {
    previousTaskBtn = `
<span class="btn small-font v-align-middle" onclick="playGrammar('go back')" 
title="Go back"><span style="margin-right:-0.2em; border-right: 2px solid"></span>
&#9664;<span style="margin-left:-0.2em;">&#9664;</span>
</span>
`;
    nextTaskBtn = `
<span class="btn small-font v-align-middle" onclick="playGrammar('next')" 
title="Next">&#9654;<span style="margin-left:-0.2em;">&#9654;</span>
<span style="margin-left:-0.2em; border-left: 2px solid"></span>
</span>
`;
  }

  return previousTaskBtn + previousLineBtn + 
    redoBtn + flipBtn + nextLineBtn + nextTaskBtn;
}

const loadGameFromTA = async (cmd) => {
  if (cmd === 'FLASHCARDS') ttsGame.flashcards = true; 
  mic.turnOn();
  parseGrammarGame(ta.text, 'from-ta');
}

const loadGrammarGame = async () => {
  recognition.allowed = false;

  if (!ttsGame.loadFrom && ta.innerText) parseGrammarGame(ta.innerText, 'uploaded-game');
  if (ttsGame.loadFrom === 'url-address') {
    await fetchGrammarGame(ttsGame.url, 'uploaded-game');
  }
  if (ttsGame.loadFrom === 'url-parameter') parseGrammarGame(ttsGame.text, 'uploaded-game');
}

const globalCommand = cmd => {
// think of alternatives to switch
// e.g., https://www.30secondsofcode.org/articles/s/javascript-switch-object
  const commands = {"enough":1, "exit":1, "game over":1,
           "say it again":2, "say again":2, "repeat":2, "sorry":2,
           "do it again":3, reset:4, restart:4,
           'offer_a_game':5, 'offer_all_games':6, 'a_new_game':7
  };

  const res = commands[cmd];
  switch(res) {
    case 1: 
      sayFinalThanks();
//      takeNotes = true;
      playIsOn = false; playName = '';
      if (ttsGame.flashcards) {
        ttsGame.flashcards = false;
        mic.turnOff();
        setPageHeader("words");
        refreshTA();
      }
      break;

    case 2: 
      if (!ttsGame.partialAnswer) speak(ttsGame.speakTask, true);
// What does repeat mean? Repeat the task or the correct answer?
// maybe startTask() might be needed instead? What if it's a dialog?       
      break;

    case 3:
      if (!ttsGame.partialAnswer) restartCurrTask();
      break;

    case 4: restartGrammarGame();
      break;

    case 5: offerGame('ONE');
      break;

    case 6: offerGame('ALL');
      break;

    case 7: makeNewGame();
      break;
  }
  return res;
}

// *** Main Voice Input Control Fn
const playGrammar = async (inputText) => {
  let transcript = renderStr(inputText);
  let speakPhrase, notePhrase;

  if (oldPlayName == 'drill-sentence') {
    oldPlayName = '';
    speakPhrase = 'Welcome back to the game! ';
    speak(speakPhrase + ttsGame.speakTask, true); 
    return;
  }

  if (globalCommand(transcript)) return;

  if (playName === 'verbs' && /verb |drill /.test(transcript)) {
    ttsGame.key = wordMatchInStrings (transcript, ttsGame.keylist);
    changeTaskN(1);
console.log('ttsGame.key ',ttsGame.key); 
    return;
  }

  switch(transcript) {
    case "let's edit the game": 
      taEdit('ON');
    break;

    case "let's play the game":
      infoGameLoading("Loading the game...");
      if (wordsPageActive()) taEdit('OFF'); // the logic may need to be changed
      else { //embed
        await setEmbedVoice();
        ttsSpeakLang('Loading the game', 'en-US');
//        loadGrammarGame();
      }
      loadGrammarGame();
      animateStarter(0);
    break;

    case "let's play conditionals":  
    case "let's play irregular verbs":  
    case "let's play sound alike words":
      recognition.allowed = false;
	  const gameURLs = {
        "let's play conditionals": '/game/conditionals-1.txt', 
        "let's play irregular verbs":  '/game/verbs-1.txt',
        "let's play sound alike words": '/game/pronunciation-1.txt'
      };
      fetchGrammarGame(gameURLs[transcript]);
      while (ttsGame.loadStatus === 'loading') { //wait
		console.log('Loading...');
		await sleep (300);
	  }
    break;

    case "next": 
      if (ttsGame.nextAction == 'repeat-task') {
        ttsGame.nextAction = '';
        startTask();
        speak(ttsGame.speakTask);
      } else changeTaskN(1);
// try to use 'next' with dialogues: 
// clear highlight in the current dialogue line and show the next one.
//      } else if (!toNextDialogLineA()) changeTaskN();
    break;

    case "go back": 
//      if (ttsGame.taskNumber > 0) { 
//        ttsGame.taskNumber -= 2; 
        changeTaskN(-1);
//      }
    break;

    case "you say it yourself": 
    case "how can i say it": 
    case "how can i say that": 
      speak(getAceptableAnswers());
    break;

    case "help": 
    case "help me":
      if (playName === 'verbs') {
        speakPhrase = 'You can read the list of verbs to drill. Say, for example,' +
          '"Verb, to buy." or. "Reset".';
        notePhrase = 'Verbs to drill: ' + ttsGame.keylist + '.\n\nTo exit, say "enough".';
        ta.innerHTML = ttsGame.title + notePhrase;
//        speak(speakPhrase);
        ttsSpeakLang(speakPhrase, 'en-US');
        ttsGame.nextAction = 'repeat-task'; // because the task is replaced by help prompt
      } else if (playName === 'conditionals') {
        speakPhrase = "To exit, say 'game over'.";
//        speak(speakPhrase);
        ttsSpeakLang(speakPhrase, 'en-US');
      } else {
        speakPhrase = "You can ask to repeat the task or to play the next one. " + 
          "If you wish, ask. 'How can I say it'. Or. 'You say it yourself'. To exit, say 'game over'.";
        if (ttsGame.keylist) {
          speakPhrase = 'Study target vocabulary. ' + speakPhrase;
          notePhrase = 'Target vocabulary: ' + ttsGame.keylist + 
            '.\n\nSay "next" to continue. To exit, say "game over".';
          ta.innerHTML = ttsGame.title + notePhrase;
          ttsGame.nextAction = 'repeat-task'; // because the task is replaced by help prompt
        }
//        speak(speakPhrase);
        ttsSpeakLang(speakPhrase, 'en-US');
      }
    break;

    default:
//        startTask(); // why called here?
        grammarInputCheck(transcript);
  }
} // End of playGrammar game dispatcher

const gameIsPromped = () => (ttsGame.loadStatus === "READY_TO_LOAD");

const askAgain = () => {
  ttsSpeakLang(reply('pardon-me'));
}

const wordMatchInStrings = (stringA, stringB) => {
  const wordsA = stringA.split(' ');
  for (const word of wordsA) {
    if (stringB.includes(word)) return word;
  }
  return '';
}

const restartGrammarGame = async () => {
//  if (embedPageActive()) await setEmbedVoice();
  if (ttsGame.templateTask) makeTemplateTask();
  ttsGame.correctAnswers = [];
  if (ttsGame.randomizeTasks) tasks = arrayShuffle(tasks);
  ttsGame.key = '';
  ttsSpeakLang((ttsGame.origin == 'voice') ? sayAgree() : "Welcome to the game!", 'en-US', false);

//  if (ttsGame.intro) ttsSpeakLang(ttsGame.intro.split('|')[0]);
  const inLang = (langListCtrl() && langListCtrl().value !== 'English') ? 
    ' in ' + langListCtrl().value : '';
  const intro = ttsGame.intro || 'Say the highlighted text' + inLang;
  const lang = ttsGame.intro ? '' : 'en-US';
  ttsSpeakLang(intro.split('|')[0], lang);

  ttsGame.taskNumber = -1;
  changeTaskN(1, true);
}

const changeTaskN = (step, newGame) => {
  let task, i=0;
  while (true) {
//    if (ttsGame.taskNumber < tasks.length-1) ttsGame.taskNumber ++;
//    else ttsGame.taskNumber = 0;
    ttsGame.taskNumber += step;
    if (ttsGame.taskNumber >= tasks.length ||
        ttsGame.taskNumber < 0) ttsGame.taskNumber = 0;

    task = currentTask().say[0];
    if (ttsGame.key === '') break;
    if (task.includes(ttsGame.key)) break;
    i++;
    if (i > tasks.length) {
console.log ('ttsGame.key not found');
      return; // ttsGame.key not found in tasks, do nothing
    }
  }
console.log ('playName', playName);

  task = task || '';

  if (playName == 'sound-alikes') {
    ttsGame.taskHalfway = false;
    ttsGame.query = Math.floor(Math.random() * 2);
    const askWord = currentTask().say[ttsGame.query+1];
    task += ' ' + askWord +'.';
	
    const acceptAnswer = currentTask().write[ttsGame.query];
    currentTask().acceptForPrint = [acceptAnswer];
    currentTask().accept = acceptAnswer.split('|').map(el => renderStr(el));
  }

  ttsGame.speakTask = task;

  if (!newGame) {
    tts.cancel(); // cancel any previous speechSynthesis
    if (step) ttsSpeakLang(reply ("next-phrase", ttsGame.taskNumber +1, true), 'en-US');
  }
  ttsSpeakLang(task);

  if (step) ttsGame.showGaps = currentTaskGapped(); 
//  endDialog();  
  dlg.end();  
  startTask();
console.log('task ',task);

  ttsGame.partialAnswer = '';
  ttsGame.errorsInARow = 0;
  showRef('');
}

const restartCurrTask = () => {
    changeTaskN(0);
}

const startTask = async () => {
//  if (inDialog()) return;
  if (dlg.isRunning()) return;

  showNavButtons();
  const task = currentTask(),
        writtenTask = task.say[1] || task.say[0];

  let taskWording = (playName === 'sound-alikes') ? 
    'Listen to the task and choose the right sentence.' 
    : writtenTask || '';

  let taskIntro = taskWording + vbreakDiv(0.3);
  if (tasks.length > 1) taskIntro = ttsGame.taskNumber + 1 + 
    '/' + tasks.length + ': ' + taskIntro;
  const e = elid('game-task');
  e.innerHTML = parseTextFile(taskIntro);

  let taskLine = '';

  if (taskIsDialog()) {
// find the first line to speak (either A or B)
    dlg.lineN = 0;
    for (const speaker of task.speakers) {
      if (/[AB]/.test(speaker)) break;
      const line = dlg.currentLine();
      if (line.length > 3 && // ignore short lines (likely numbers)
        line[0] !== ':') elAddHTML(e, line + '<br>') // show dialogue header, 
      dlg.lineN++;
    }

    const pcFirst = await playDialogResponse(); // if dialogue starts with speaker B (flipped)
    showDialogLine();
  } 
  else { // not a dialogue
    taskLine = '';
    for (const subTask of task.write) taskLine += '- ' + subTask + '<br>';
    addHighlightedLine(taskLine);
  }
  informGameResult('listen');
}

const commentOnError = transcript => {
  const possibleErrors = currentTask().error;
  let tip = '', i;
  for (const line of possibleErrors) {
    i = checkArrayMatch(line[0], transcript);
console.log('error match ', i, ' for ', line[0]);
    if (i !== -1) { tip += line[1]; console.log(line[1]);}
  }
  return tip;
}

const grammarInputCheck = async transcript => {
  const task = currentTask(), acceptableAnswers = task.accept;
  let str, acceptableAnswer, goodAnswer = false, 
    speakPhrase, testedAnswer;

  ttsGame.partialAnswer += getSeparator() + transcript;
  ttsGame.partialAnswer = ttsGame.partialAnswer.trim();
console.log('Partial answer ', ttsGame.partialAnswer);
  testedAnswer = ttsGame.partialAnswer.toLowerCase();

  for (const accAnswer of acceptableAnswers) {
//    acceptableAnswer = renderStr(accAnswer);
    acceptableAnswer = accAnswer;
console.log('Acceptable answer:', acceptableAnswer);
    if (testedAnswer === acceptableAnswer) { goodAnswer = true; break;}  
    if (transcript === acceptableAnswer) { goodAnswer = true; break;}  
    if (acceptableAnswer.startsWith(testedAnswer)) { 
      informGameResult('good', ttsGame.partialAnswer + "<br>(continue speaking...)");
      return;
    } 
  }

  ttsGame.partialAnswer = '';

  if (goodAnswer) {
    ttsGame.errorsInARow = 0;
    informGameResult('good', "");

    if (!taskIsDialog()) ttsSpeakLang(reply('correct-phrase', acceptableAnswer));
   
    if (dlg.currentLine()) {
      if (onlyUserSpeaks() && !ttsGame.noecho) 
           ttsSpeakLang(reply('correct-phrase', acceptableAnswer));
      
      if (await handleDlgNextLineBtn()) return;
console.log('End of Dialogue');
      if (repeatWithGaps()) return;
    } else { //not dialogue
      str = task.show;
      if (!str) str = task.acceptForPrint.join('\n');
      showCorrectVersion('- ' + str);
    }

    if (playName === 'sound-alikes') {
      ttsGame.taskHalfway = !ttsGame.taskHalfway;
      const askWord = task.say[ttsGame.query+1];
      showRef(askWord);
    }

    if (playName !== 'sound-alikes' || !ttsGame.taskHalfway) {
      if (ttsGame.correctAnswers) { //record correct answers
        if (!ttsGame.correctAnswers.includes(ttsGame.taskNumber))
          { ttsGame.correctAnswers.push(ttsGame.taskNumber); }
      }
      else {
        ttsGame.correctAnswers = [];
        ttsGame.correctAnswers.push(ttsGame.taskNumber);
      }

      if (ttsGame.taskNumber == tasks.length -1) {
        const outro = (ttsGame.outro || '').split("|"),
          writtenOutro = outro[1] || outro[0],
          taskOrTasks = (ttsGame.correctAnswers.length === 1) ? ' task' : ' tasks',
          congrats = reply('congrats') + ' You did ' + ttsGame.correctAnswers.length +
            taskOrTasks + ' out of ' + tasks.length + ' correctly! ';
        ttsSpeakLang(congrats, 'en-US');
        ttsSpeakLang(outro[0]);
        informGameResult('good', congrats);
        addGameFeedback(writtenOutro);
      } else {
        let continueWord = (ttsGame.taskNumber == 0) ? "'next'" : "'next' or 'go back'";
        addGameFeedback("Say " + continueWord + " to continue.");
      }
    } 
    else {
      addGameFeedback("Now say the other sentence.");
      ttsSpeakLang(" Now say the other sentence.", "en-US");
      ttsGame.speakTask = "Say the other sentence."
      adjustAcceptableAnswer();
      if (playName === 'sound-alikes') {
        const line = currentTask().write[ttsGame.query];
        addHighlightedLine('- ' + line);
      }
    }
  } else { // !goodAnswer
    getTextError(testedAnswer, acceptableAnswers);
    speakPhrase = reply('incorrect-phrase', ttsGame.errorHint) + commentOnError(transcript);
console.log(speakPhrase);
    informGameResult('bad', ttsGame.errorHintNote + '<br>Try again');

    ttsGame.errorsInARow ++;
    if (ttsGame.errorsInARow > 3) {
      speakPhrase = reply('give-correct', acceptableAnswers[0]) + reply('repeat-after-me');
      ttsGame.errorsInARow = 0;
      }
  }
  if (speakPhrase) speak(speakPhrase);
}

const getTextError = (sample, ref) => { // this fn isn't finished
//  ttsGame.correctWords = [];
  let errorPos = -1, errorEnd, refWords, i;
  const  splitter = getSeparator(),
    sampleWords = renderStr(sample).split(splitter);
  errorEnd = sampleWords.length;

  for (const r of ref) {
    if (sample == r) return -1;
    refWords = renderStr(r).split(splitter);
//    ttsGame.correctWords.push(refWords);

// check from the start
    for (const [i, s] of sampleWords.entries()) {
      if (!refWords[i] || s != refWords[i]) {
        if (i > errorPos) { errorPos = i; }
        break;
      }
    }

    let j = refWords.length-1; //check from the end 
    for (let i = sampleWords.length-1; i>= 0; i--) {
      if (!refWords[j] || sampleWords[i] != refWords[j]) {
        if (i < errorEnd) { errorEnd = i; }
        break;
      }
      j--;
    }
  }

//console.log('ErrorStart ', errorPos, 'errorEnd ', errorEnd);
  ttsGame.errorHint = sampleWords[errorPos];
  if (errorPos > 0) ttsGame.errorHint = sampleWords[errorPos -1] + splitter + ttsGame.errorHint;
  if (errorPos < sampleWords.length-1) ttsGame.errorHint += splitter + sampleWords[errorPos +1];

  sampleWords.splice(errorPos, 0, '~');
  sampleWords.splice(errorEnd+2, 0, '~');
  ttsGame.errorHintNote = sampleWords.join(splitter);

  return errorPos;
}

const adjustAcceptableAnswer = () => {
  if (playName !== 'sound-alikes' || !ttsGame.taskHalfway) return;
  ttsGame.query ^= 1; // flip it

  const acceptAnswer = currentTask().write[ttsGame.query];
  currentTask().acceptForPrint = [acceptAnswer];
  currentTask().accept = acceptAnswer.split('|').map(el => renderStr(el));
}

const getAceptableAnswers = () => currentTask().accept.join(' ');

const reply = (key, result, optional) => {
  const phrases = {'correct-phrase':['You are right', 'Yes,|is correct', 'So it is!',
    'Absolutely correct!', 'This is right.', "Sure.", "Exactly.", "Right.",
    "Of course,", 'Of course,|is correct', 'Perfect!', 'Indeed.', '|You nailed it!'
    ],
    'incorrect-phrase': ["Sorry,|isn't correct. Let's try again!", "Oops,|isn't right!", 
    "I'm afraid|isn't right", "No, it isn't", '?|? Try again!', '?|? is it?',
    'Is it|? Really?', 'Are you sure|is correct? Please check it', 'Did you say|? How can you correct it?', 
    'Sorry? Is it|?', "Sorry, it isn't", "Sorry,|isn't correct"
    ],
    'incorrect-phrase-short': ["Not really", "No", "Uh, no", "Is it?"
    ],
    'next-phrase':["OK, let's do this one", "Well, how about this?", "Now, number |.", "Let's do number |.",
    "OK. number |.", "Let's try this one", "Now say this one", "Alright. Now this one", "","","","",""
    ],
    'give-correct':["The correct way to say it, is.|", "The correct sentence is.|",
      "Well, the right answer is.|", "The right answer is.|", "You can say.|", "You could say.|"
    ],
    'repeat-after-me':["Can you repeat it?","Could you repeat it?","Now you repeat it",
      "Now you say it","Now you can repeat it","Now it's your turn"
    ],
    'pardon-me':["Sorry?", "Say it again?", "Could you say it again?", 
    "I'm not sure I got it right. Please say it again.", "Sorry, what did you say?"
    ],
    'congrats':["Great job!", "Fantastic job!", "Congratulations!", "Well done!"
    ]
  };
 
  let smartKey = key;
  if (key == 'incorrect-phrase' && ttsGame.errorsInARow > 1) {
    smartKey = 'incorrect-phrase-short';
    result = "";
  }
  const phrase = randomElement(phrases[smartKey]);
  return commentResult(phrase, result, optional);
}

const offerGame = async key => {
  const br = embedPageActive() ? '<br>' : '',
    hero = 
`
<div id="game-starter" style="font-size: 15vw; 
cursor:pointer; border-radius: 50%; padding: 0.12em" 
onclick="toggleMic()" title="MEOW!">🐱</div>
`,
    cues = {
      ALL: `
<div class="left-bubble" style="font-size:2vw;line-height: 1.3em;margin-top: 4em;">Meow! To choose a game, click on me 
and say one of the phrases:<b><i>
• Let's play numbers
• Let's play colors
• Let's play conditionals
• Let's play irregular verbs
• Let's play sound-alike words</b></i>
</div>
`,
      ONE: `
<div class="left-bubble" style="font-size: 3vw; line-height: 1.3em; margin-top: 5.5em;
width: max-content">Meow! Click on me and say:
${br}<b><i>Let's play the game.</i></b>
</div>
`
}, 
  seeMore = `<div style="font-size: 1.5vw; width:max-content; position: absolute; bottom: 1em; left: 50%; transform: translateX(-50%);">
<a onclick="makeNewGame()">
Edit your voice game</a> • <a 
onclick="showHelpItem('qna_games')">Show more info about voice games
</a></div>`;

  let txt = '<div class="flex-center" ' 
      + 'style="margin: 0; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -60%);">'
      + hero + cues[key] + '</div>';

  if (wordsPageActive()) txt += seeMore;

//  displayInfo(txt, 150);
// Plan to show it in infopage instead - good for mobile
  if (embedPageActive()) setElHTML('ta', txt);
  else displayInfopage(txt, {width: '100vw', height: '85vh', top: '7vh'});

  animateStarter(1);
  ttsGame.loadStatus = "READY_TO_LOAD";
}

const infoGameLoading = txt => {
  e = document.getElementsByClassName("left-bubble")[0];
  if (e) e.innerHTML = txt;
}

const animateStarter = cmd => {
  animateFace(cmd, "game-starter", 1);
}

const animateTTS = cmd => {
  animateFace(cmd, "game-face", 2);
}

const animateFace = async (cmd, eID, mode) => {
  const face = ["😺", "🐱"],
    blink = async cmd => {
    if (elid(eID) && ttsGame.blinker) {
      setElHTML(eID, face[cmd]);
      let t;
      if (mode === 1) t = cmd ? 1000 + Math.floor(Math.random() * 5000) : 350;
      if (mode === 2) t = cmd ? 200 : Math.floor(Math.random() * 300);
      setTimeout(blink, t, 1 - cmd);
    }
    if (elid(eID) && !ttsGame.blinker) {
      setElHTML(eID, face[1]);
    }
  }

  if (cmd && !ttsGame.blinker) {
    await sleep(800);
    ttsGame.blinker = 1;
    blink(0);
  } 
  if (!cmd) ttsGame.blinker = 0;
}

const drillSentence = async inputText => {
  let transcript = inputText.toLowerCase();
console.log('you said: ',inputText);
  let speakPhrase, notePhrase;

  if (/enough|exit/.test(transcript)) {
    playName = oldPlayName;
    oldPlayName = 'drill-sentence';
    playGrammar("");
    return;
  }

  switch(transcript){
    case "let's focus on the pronunciation":
      drillText.full = currentTask().accept[0];
      drillText.part = drillText.full;
console.log('drill: ', drillText.part);
//      takeNotes = true;
      speak("OK, let's drill it. Say " + drillText.part);
      drillText.nextTask = 'full';
      let s = ta.innerText;
      ta.innerText = s.slice(0,s.search ('\n>')+2)
    break;

    default:
      await drillOK(transcript);
      speakPhrase = drillText.part;
      if (drillText.nextTask == 'finish') {speakPhrase = "Perfect! ";
        if (oldPlayName) {
          playName = oldPlayName;
          oldPlayName = 'drill-sentence';
          speakPhrase += "Let's go back to the game.";
          playGrammar ("repeat");
          break;
        }
      }
console.log('speak phrase', speakPhrase);
      speak (speakPhrase);
  }
}

const drillOK = test => {
  const pos = drillErrorPos(drillText.part, test);
  if (pos == -1) {
    drillText.part = drillText.full;
    if (drillText.nextTask == 'word') { drillText.nextTask = 'full'; }
    else {drillText.nextTask = 'finish';}
    return true;
  }
  if (drillText.part == drillText.full) {
    const words = drillText.full.split(" ");
    drillText.part = words[pos];
    drillText.nextTask = 'word';
    recognitionWord(words[pos]);
  }
  return false;
}

const drillErrorPos = (ref, test) => {
  const refArray = ref.split(" ");
  const testArray = test.split(" ");

  let str, acceptableAnswer;

  let errorPos = -1;
  for (const [i, el] of refArray.entries()) {
    acceptableAnswer = renderStr(el);
console.log('acceptable word ', acceptableAnswer);
    if (!testArray[i]) { errorPos = i; break;} 
    if (testArray[i] !== acceptableAnswer) { errorPos = i; break;} 
  }
console.log('Error position ', errorPos);
  return errorPos;
}

const recognitionWord = word => {
  const grammar = '#JSGF V1.0; grammar words; public <word> = ' + word + ' ;'
  let speechRecognitionList;
  if ('SpeechGrammarList' in window) {speechRecognitionList = new SpeechGrammarList(); }
  else if ('webkitSpeechGrammarList' in window) {speechRecognitionList = new webkitSpeechGrammarList(); }
  else {return;}
  speechRecognitionList.addFromString(grammar, 1);
  recognition.grammars = speechRecognitionList;
}

const grammarFileOpen = () => {
  elid("grammar-file-open").click(); 
  recognition.allowed = false;
}

const editGameScript = () => {
  if (ttsGame.text) {
    ta.classList.add('small-font');
    ta.innerText = ttsGame.text;
    playIsOn = false; playName = '';
  }
}

const adjustGameControls = () => { 
//  elid('auto-video-div').style.display = 'none'; 
  elid('rep-num-div').style.display = 'none'; 
  elid('lookup-div').style.display = 'none'; 
  elid('advanced-speed-box').style.display = 'none'; 
}

const getSeparator = () => (ttsGame.lang === 'zh') ? '' : ' ';

const informGameResult = (result, note = '') => {
  const info = {'good': '😺', bad: '😼', listen: '🐱'},
    nextBack = (tasks.length > 1) ? '&#8226; next<br>&#8226; go back<br>' : '',
    offerNoGaps = (ttsGame.showGaps && currentTaskGapped()) ? 
      '<span class="smaller-font"><i>Note: to play without gaps, <a onclick="playWithoutGaps()">click here</a>.</i></span>' : '',
    flashcard = ttsGame.flashcards ? 'the flashcard equivalent of ' : '',
    controls = `
<div style='clear:left; font-size:50%; 
line-height:1.3em; margin-top:-0.5em;'>
Say ${flashcard}the highlighted text out loud. <br>
Use voice commands to control the game:<br>
&#8226; help<br>
&#8226; restart<br>
&#8226; repeat<br>
${nextBack}
&#8226; game over<br>
${offerNoGaps}<br>
</div>
`;

  const reaction = `<div id='game-face' class='game-face' 
onclick='giveHint()' 
title="MEOW! I'm listening...
Click on me to get help.">${info[result]}</div>`;
  const addNote = `
<div id='game-react' class='game-react'>${note}</div>`;

  displayInfo(vbreakDiv(0.2) + controls, 250);
  setElHTML('game-feedback', reaction + addNote);
}

const addGameFeedback = txt => {
  elid('game-react').innerHTML += vbreakDiv(0.4) + txt;
}

const sayTheAnswer = () => {
  speak(currentTask().accept[0], false, 0.75);
}

const currentTask = () => tasks[ttsGame.taskNumber] || [];

const currentTaskGapped = () => {
  const testArray = (arr, s) => {
    if (!arr) return 0;
    for (const el of arr)
      if (el.includes(s)) return 1;
    return 0;
  }

// the logic is too complicated, task.lines should be joined and tested for '<<' and '[['
  const task = currentTask();
  if (testArray(task.lines, '<<')) return 1; 
//  if (testArray(task.write, '__')) return 1; // disabled b/c not sure how to show filled gaps for plain gaps ___ 
  return 0;
}

// == Dialogue ==
//
const gapTextToShow = s => {
  const res = s.slice(2, -2).split("=>");                 
  return res[1] || "___";                    
}

const parseGameGaps = s => { // print gapped cues
  return s.replace(/\/\*|\*\/|\[\[|\]\]/g, "") // remove comment marks /* */ and [[ ]]
    .replace(/\\[\.\!\?:;,]/g, s => s.slice(1)) // replace escaped by backslash
    .replace(/<<.*?>>/g, s => "<x-gap>" + gapTextToShow(s) + "</x-gap>");
}

const getAccAnswersRaw = arr => {
// use replace, not slice(2, -2)
  const getCorrectText = s => s.replace(/<<|>>/g, '').split("=>")[0];

  return arr.join("|")
// highlight gaps with <x-gap-correct> tag
//    .replace(/[^\s^|^\/]*<<.*?>>[^\s^\/]*/g, s => "<x-gap-correct>" + getCorrectText(s) + "</x-gap-correct>")
// due to problems with Chinese, this was adjusted 2022-11-07:
    .replace(/<<.*?>>/g, s => "<x-gap-correct>" + getCorrectText(s) + "</x-gap-correct>")
}

const getAccAnswers = arr => getAccAnswersRaw(arr)
// add removing comments in round brackets? Or replace () with [[]], as in index.html?
// a switch may be added in the future to enable comments in round brackets
  .replace(/\(.*?\)/g, '') // remove comments in () 
  .replace(/\/\*.*\*\//g, '') // remove comments in /* */ - doesn't work well for *highlighted* text
  .replace(/\[\[.*?\]\]/g, '') // remove comments in [[]]
  .replace(/\*/g, '')// TEST: remove asterisks b/c they are used to highlight text
  .replace(/<[^>]+>/g, '') // remove tags
  .replace(/^:?[AB]:|^[-\u2013\u2014]/, '') // remove leading (:)A: and -
  .split('|') // further rendering is done in grammarInputCheck()
  .map(el => renderStr(el)); //to be tested

const getAccAnswerForPrint = arr => getAccAnswersRaw(arr)
  .replace(/\/\*|\*\/|\[\[|\]\]/g, '') // remove comment marks /* */ and [[ ]]
  .replace(/\\[\.\!\?:;,]/g, s => s.slice(1)) // replace escaped by backslash
//  .split("|")[0];
  .split(/[\|\\]/)[0];

const taskIsDialog = () => currentTask().isDialog;

const setTaskTypesAndMerge = () => {
  const dlgMarkers = /^:?[AB]:|^[-\u2013\u2014]/;

  const dialogOrMonolog = task => {
    for (const line of task) {
      if (dlgMarkers.test(line)) return 2;// not quite right: a monologue can have a dialog marker
      if (/:write:/.test(line)) return 0;
    }
    return 1;
  }

  const nextSpeaker = {'':'A', A:'B', B:'A'};

  for (let [i, task] of ttsGame.tasks.entries()) {
// set speakers
    tasks[i].speakers = [];
    let type = dialogOrMonolog(task);
    if (type) {
// copy dialogs to old vesion tasks
      tasks[i].lines = task; 
      let speaker = '';
      for (const line of tasks[i].lines) {
        if (/^:?A:/.test(line)) speaker = 'A';
        else if (/^:?B:/.test(line)) speaker = 'B';
        else if (/^[-\u2013\u2014]/.test(line)) speaker = nextSpeaker[speaker];
        tasks[i].speakers.push(speaker);
      }
      if (!tasks[i].speakers.join('')) {// monologue
        tasks[i].speakers = [];
        for (const line of tasks[i].lines) tasks[i].speakers.push('A');
      }
    }
    else { // not a dialogue nor monologue
      if (tasks[i].accept) {
        tasks[i].acceptForPrint = tasks[i].accept;
        tasks[i].accept = tasks[i].accept.map(el => renderStr(el));
      }
    }

// review dialogue type
    type = 0;
    const sp = tasks[i].speakers;
    if (sp.includes('A') || sp.includes('B')) type = 1;
    if (sp.includes('A') && sp.includes('B')) type = 2;
    tasks[i].isDialog = type;

    if (ttsGame.randomizeTasks && ttsGame.flashcards) 
      tasks[i].lines = arrayShuffle(tasks[i].lines);
// TBC: only ttsGame.tasks might be left, and tasks eliminated?
  }
}

const dialogPrompt = () => ''; // may be obsolete

const toNextDialogLineA = () => {
// does not check for line A, but is used only to show lines A
  if (!taskIsDialog() || dlg.atTheEnd()) return null;
  dlg.lineN++;
  showDialogLine();
  return dlg.lineN;
}

const toPreviousDialogLineA = () => {
  if (!taskIsDialog()) return null;
  let i = dlg.lineN, res = 0;
  while (i && !res) {
    i--;
    if (currentTask().speakers[i] === 'A') res = 1;
  }

  if (res) {
    dlg.lineN = i;
    showDialogLine();
  }
  return dlg.lineN;
}

const handleDlgNextLineBtn = async () => {
  if (!taskIsDialog()) return null;

// handle current line
  const str = getAccAnswerForPrint([dlg.currentLine()]);
  showCorrectVersion(str);

// let computer speak
  await playDialogResponse('NEXT_LINE');
    
  return toNextDialogLineA();
}

const handleDlgPrevLineBtn = async () => {
  if (!taskIsDialog() || !dlg.atTheStart()) return;
 
// handle current line
  const str = getAccAnswerForPrint([dlg.currentLine()]);
  showCorrectVersion(str);

  return toPreviousDialogLineA();
}

const showDialogLine = () => {
  const line = dlg.currentLine();
  if (!line) return null;

  const target = (ttsGame.target && ttsGame.target === 'back') ? 1 : 0;
  const acceptable = line.split('//')[target] || line; // adapt to flashcards
  currentTask().accept = getAccAnswers([acceptable]);

  const promptLine = line.split('//')[1] || line.split('|')[0]; // hide alternative variants
  addHighlightedLine(promptLine);
//  scrollToBottom(elid("game-task"));
}

const addHighlightedLine = txt => {
  let res = ttsGame.showGaps ? parseGameGaps(txt)
            : getAccAnswerForPrint([txt]);
  const s = '<x-p>' + res + '</x-p>';
  elAddHTML(elid("game-task"), s);
  scrollToBottom(elid("game-task"));
}

const onlyUserSpeaks = () => !currentTask().speakers.includes('B');

const playDialogResponse = async jumpLine => {
  let res = 0;
  if (dlg.atTheEnd()) return res;
  if (jumpLine) dlg.lineN++;
  const task = currentTask();

  const isSpeakerB = i => (i < task.speakers.length && 
    task.speakers[i] === 'B') ? task.lines[i] : '';

  while (true) {
    const lineToSpeak = isSpeakerB(dlg.lineN);
    if (!lineToSpeak) {
      if (jumpLine) dlg.lineN--;
      return res;
    }
    res = 1;
    informGameResult('listen', '');

    const textToSpeak = getAccAnswers([lineToSpeak]).join(' Or. ')
    ttsSpeakLang(textToSpeak);
    animateTTS(1);
    await ttsFinish();
    animateTTS(0);       

    showLineB(getAccAnswerForPrint([lineToSpeak]));
    dlg.lineN++;
  }
}

const scrollToBottom = async e => {
// Not smooth scroll:  e.scrollTop = e.scrollHeight;
// Try out smooth scroll
  const n = e.scrollHeight - e.scrollTop;
  for (let i=0; i < n; i++) {
    e.scrollTop++; 
    await sleep(1);
  }
}

const showLineB = s => showCorrectVersion(s, false);

const showCorrectVersion = (s, replace = true) => {
  const e = elid('game-task');
  const highlight = e.getElementsByTagName('x-p')[0];
  if (highlight) highlight.remove();
  else if (replace) return;  // have to replace but there's no highlight

  if (s) {
    s = s.replace('//', ' &sdot; ');
    elAddHTML(e, s  + '<br>');
  }
  scrollToBottom(e);
}

const flipCurrDialog = () => {
  if (flipDialog(ttsGame.taskNumber)) restartCurrTask();
}

const flipDialog = i => {
  const flip = {A:'B', B:'A'};
  if (tasks[i].isDialog) {
    tasks[i].speakers = tasks[i].speakers.map(sp => (flip[sp]) || '');
    return 1;
  } else return 0;
}

const flipAllDialogs = () => { // not used yet
//  if (!ttsGame.dialogFlipCount) ttsGame.dialogFlipCount = 0;
//  ttsGame.dialogFlipCount++;
  for (let i = 0; i < tasks.length; i++) flipDialog(i);

  restartGrammarGame();
}

const playWithoutGaps = () => {
  ttsGame.showGaps = 0;
  changeTaskN(0);
}

const repeatWithGaps = () => {
  if (ttsGame.showGaps || !currentTaskGapped()) return 0;

  ttsGame.showGaps = 1;
  ttsSpeakLang('Now try with gaps', 'en-US');
  changeTaskN(0, 1)
  return 1;
}

// == End Dialogue ==

const arrayShuffle = arr => { //Fisher-Yates shuffle algorithm
  const array = [...arr]; //copy source array in order not to change it
  for (let i = array.length -1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const vi = array[i]; array[i] = array[j]; array[j] = vi;
  }
  return array;
}

const randomElement = arr => arr[Math.floor(Math.random() * arr.length)];

const commentResult = (comment, result, optional) => {
  if (!comment || !result) return comment;
  const c = comment.split('|');
  let r = c[0];

  if ((optional) && c[1]) { r += ' ' + result + ' ' + c[1];}
  else if (!optional){
    r += ' ' + result;
    r = r.trim();
    if (c[1]) { r += ' ' + c[1];}
  }
  r = r.trim();
  const lastChar = r[r.length-1]; //get the last char
//  if ("?!.".indexOf(lastChar) === -1) r += '. ';
//  console.log('r ',"'"+r+"'",' last char ',"'"+lastChar+"'");
  if (!/[!?.]/.test(lastChar)) r += '. '; //check if punctuation is already there
  else r += ' ';
//  console.log(r);

  return r;
}

const getXgaps = () => document.getElementsByTagName('x-gap');

const giveHint = () => {
  const gaps = getXgaps();
  if (!gaps.length) { sayTheAnswer(); return; }
  const gapsOrig = getTaskGapOrig();
  let smallHint = false;
  for (let g = 0; g < gaps.length; g++) { 
    const gap = gaps[g];
    const ref = gapsOrig[g];

    const gapText = gap.textContent;
    const pos = findFirstDiffPos(gap.textContent, ref);
    if (pos === -1 || pos >= ref.length) {
      gap.textContent = gapText.replace(/_/g, '');
      continue;
    }

    const source = ref.split(' ');
// gapText is analysed until the last symbol '_'
    let gapTail = gapText.slice(gapText.lastIndexOf('_') + 1);
    if (gapTail && !/[\s.!?,;:'"]/.test(gapTail[0])) gapTail = ' ' + gapTail;
    let target = gapText.slice(0, gapText.lastIndexOf('_') + 1).split(' ');

// the cycle is run twice to show the length of each word right away
    for (let i = 0; i < source.length; i++) {
      if (target.length <= i) target.push('_');
      const slength = source[i].length;
      if (target[i].length < slength) target[i] = target[i].padEnd(slength, '_');
      if (target[i].length > slength) target[i] = target[i].slice(0, slength);
    }
    gap.textContent = target.join(' ') + gapTail; 

    for (let i = 0; i < source.length; i++) {
      const j = findFirstDiffPos(target[i], source[i]);
      if (j !== -1 && j < ref.length) {
        const t = target[i];
        target[i] = t.substring(0, j) + source[i][j] + t.substring(j+1);
        break;
      }
    }
    gap.textContent = target.join(' ') + gapTail;
    smallHint = true;
    break;
  } // for gaps
  if (!smallHint) sayTheAnswer();
}

const getTaskGapOrig = () => getGapContent(dlg.currentLine());

const getGapContent = s => {
  let txt = []; //should be an array if a line has several gaps
  const getCorrectText = s => txt.push(s.slice(2,-2).split("=>")[0]);

//  s.replace(/.{2}(?<=<<)(.*?)(?=>>).{2}/g, s => getCorrectText(s)) // handle gaps
  s.replace(/<<.*?>>/g, s => getCorrectText(s)) // handle gaps
  return txt;
}

function findFirstDiffPos(a, b) {
  if (a === b) return -1;
  let i = 0;
  while (a[i] === b[i]) i++;
  return i;
}

const makeNewGame = () => {
  displayInfopage('hide');
//  showUserGameInfo();
  showHeaderAndHowTo('game');
  taEdit('ON');
//  initTips(); // turned off 2025-10-12
}


/* Bugs
- scrollToBottom fn doesn't work at big font size
- Accept for Chinese dialogue messes pinying 

**  To-Do List  **
- add removing comments in round brackets in getAccAnswers()? Or replace () with [[]], as in index.html?

- add acceptable answer variants due to Google's recognition mistakes.
The string for acceptable answers is split into array of chunks: .split(/<<|>>/);
Or use slash / or backslash \ ?
But what to do with legacy separator '|'? Check for it first?
Each chunk is an array of 1 or more options split by '\': .split('\\');
stt transcript is checked in cycles against each option of each chunk, 
with moving index of the start char of the tested string or using 
if (s.startsWith(chunk)) s = s.slice(chunk.length)

- maxAttempts (now 3)
- series of hints given by the cat on click

- when task is done, you can offer to flip ALL dialogues+ restart.

- enable showing the whole dialogue and picking the line to start from

- voice response phrases in other languages

- combine :say: with dialogues to improve experience for //en/game/say-tell1.txt
Game options and url key can control it.

** Current Dialogue pathways **
Start dialogue in startTask(). It is called directly 
from playGrammar() (case next, default) and from changeTaskN

Dialogue continues via playGrammar() -> grammarInputCheck() -> 
  toNextDialogLineA() -> showDialogLine() -> 
    voice input -> playGrammar() loop

Any alternatives?
*/
