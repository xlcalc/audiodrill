const pronouns = {en: {subj:['I', 'we', 'you', 'he', 'she', 'it', 'they'], 
                       obj: ['me', 'us', 'you', 'him', 'her', 'it', 'them']
                      },
                  ru: {subj:['я', 'мы', 'ты', 'он', 'она', 'оно', 'они'] 
                       , р: ['меня', 'нас', 'тебя', 'его', 'ее', 'его/ее (неодуш.)', 'их']
                       , в: ['меня', 'нас', 'тебя', 'его', 'ее', 'его/ее (неодуш.)', 'их']
                       , п: ['мне', 'нас', 'тебе', 'нем', 'ней', 'нем/ней (неодуш.)', 'них']
                       , verbEnding: ['(а)', 'и', '(а)', '', 'а', 'о', 'и']
                      }
};

const gVars = {verbs: {tl: {1:['see', 'look at', 'hear about', 'talk about', 'write about'], 
                    2: ['saw', 'looked at', 'heard about', 'talked about', 'wrote about']
                      },
                  sl: ['видел|acc', 'смотрел на|acc', 'слышал о|pre', 
                          'говорил о|pre', 'писал о|pre']
                    },
                when: {}
};

const getTemplateVars = script => {
  const lines = script.split('\n');
  const tags = [":verbs-tl-1:", ":verbs-tl-2:", ":verbs-sl:", ":when-sl:", ":when-tl:"];
  for (str of lines) {
    for (tag of tags) { setTaskVars(tag, str); }
  }
}

const setTaskVars = (tag, str) => {
  if (str.includes(tag)) {
    let list = str.split(tag)[1] 
                  .trim() 
                  .replace(/,\s*/g, ",") //remove spaces after commas
                  .split(",");

    let props = tag.replace(/:/g, "") .split("-");
    const param = props[0];
    const lang = props[1];
    const type = props[2];
    if (type) { gVars[param][lang][type] = list; }
    else { gVars[param][lang] = list; }
  }
}

const setTemplateGameTask = () => {
  ttsGame.randTask = [tasks[0][1][0], tasks[0][2][0]];
}

const makeTemplateTask = () => {
  const tasksNumber = 10;
  const sayTask = tasks[0][0];
  shuffleTemplateVars();
  tasks = [];
  for (let i=0; i<tasksNumber; i++) {
    let task = ['','','',[],''];
    task[0] = sayTask;
    const randomAnswer = nextRandomAnswer(ttsGame.randTask[1]);
    const randomTask = makeTaskSentence(ttsGame.randTask[0]);
    task[1] = randomTask.split("|");
    task[2] = randomAnswer.split("|");
    tasks.push(task);
  }
}

const shuffleTemplateVars = () => {
  shufflePronouns();
  shuffleVerbs();
  shuffleWhen();
}

const shufflePronouns = () => {
  ttsGame.pron = {tl: {}, counter: 0};
  ttsGame.pron.tl.subj = arrayShuffle(pronouns.en.subj);
  ttsGame.pron.tl.obj = arrayShuffle(pronouns.en.obj);
}

const shuffleVerbs = () => {
  ttsGame.verb = {tl: {}, counter: 0};
  ttsGame.verb.tl[1] = arrayShuffle(gVars.verbs.tl[1]);
  ttsGame.verb.tl[2] = arrayShuffle(gVars.verbs.tl[2]);
}

const shuffleWhen = () => {
  ttsGame.when = {tl: {}, counter: 0};
  ttsGame.when.tl = arrayShuffle(gVars.when.tl);
}

const nextPronouns = () => {
  let pron = {};
  pron.subj = ttsGame.pron.tl.subj[ttsGame.pron.counter];
  pron.obj = matchObjPronoun(pron.subj, ttsGame.pron.counter);

  ttsGame.pron.counter ++;
  if (ttsGame.pron.counter >= 7) shufflePronouns();

  if (pron.subj == 'it') pron = nextPronouns();
  
  return pron;
}

const nextVerb = () => {
  let verb = ttsGame.verb.tl[2][ttsGame.verb.counter];

  ttsGame.verb.counter ++;
  if (ttsGame.verb.counter >= ttsGame.verb.tl[2].length) shuffleVerbs();
 
  return verb;
}

const nextWhen = () => {
  let when = ttsGame.when.tl[ttsGame.when.counter];

  ttsGame.when.counter ++;
  if (ttsGame.when.counter >= ttsGame.when.tl.length) shuffleWhen();
 
  return when;
}

const matchObjPronoun = (subj, counter) => {
  let i = counter;
  if (i >= 7) i = 0;

  let obj = ttsGame.pron.tl.obj[i];

  if ((subj == 'I') || (subj == 'we'))
    if ((obj == 'me') || (obj == 'us')) obj = matchObjPronoun(subj,i+1);

  if ((subj == 'you') && (obj == 'you')) obj = matchObjPronoun(subj,i+1);
 
  return obj;
}

const matchTaskVerb = () => {
  const source = ttsGame.verb.picked;
  const i = gVars.verbs.tl[2].indexOf(source);
  return gVars.verbs.sl[i];
}

const matchTaskWhen = () => {
  const source = ttsGame.when.picked;
  const i = gVars.when.tl.indexOf(source);
  return gVars.when.sl[i];
}

const getSubjPronounIndex = () => {
  const source = ttsGame.pron.picked;
  return pronouns.en.subj.indexOf(source.subj);
}

const getObjPronounIndex = () => {
  const source = ttsGame.pron.picked;
  return pronouns.en.obj.indexOf(source.obj);
}

const matchTaskSubjPronoun = () => pronouns.ru.subj[getSubjPronounIndex()];

const matchTaskObjPronoun = (verb, objCase) => {
  const objIndex = getObjPronounIndex();
  const prepositionalCase = 'п';
  let pr = pronouns.ru[objCase][objIndex];

  if ((objIndex > 2) && (objCase !== prepositionalCase)) pr = updateTaskPronouns(verb, pr);
  return pr;
}

const updateTaskVerb = verb => {
  let str = verb.split(" ");
  const i = getSubjPronounIndex();
  str[0] += pronouns.ru.verbEnding[i];

// for Russian "обо мне", "со мной", etc.
  if (getObjPronounIndex() === 0) {
    const preps = ['о', 'с', 'к', 'в', 'под', 'над', 'перед'];
    if (preps.includes(str[1])) {
      if (str[1] === 'о') { str[1] += 'бо'; }
      else str[1] += 'о';
    }
  }
  return str.join(" ");
}

const updateTaskPronouns = (verb, pron) => {
// add letter н to some obj prepositions
//see http://new.gramota.ru/spravka/letters/65-n-mesto%3Cspan%20class=
  if (verb.indexOf(" ") == -1) return pron;

  if (pron.indexOf("/") == -1) return 'н' + pron;
  let pr = pron.split("/"); // for Russian 'его/ее'
  pr[0] = 'н' + pr[0];
  pr[1] = 'н' + pr[1];
  return pr.join("/");
}

const nextRandomAnswer = templ => {
  const pron = nextPronouns();
  ttsGame.pron.picked = pron;

  const verb = nextVerb();
  ttsGame.verb.picked = verb;

  const when = nextWhen();
  ttsGame.when.picked = when;

  let str = templ.replace("${subj}", pron.subj)
    .replace("${obj}", pron.obj)  
    .replace("${verb}", verb)
    .replace("${when}", when);
  
  return capitalize(str);
}

const makeTaskSentence = templ => {
  let str = templ.replace("${subj}", matchTaskSubjPronoun());

  const verbAndCase = matchTaskVerb().split("|");
//console.log("verb and case ", verbAndCase);
  const verb = updateTaskVerb(verbAndCase[0]);
  const objCase = verbAndCase[1];
  str = str.replace("${verb}", verb) 
           .replace("${obj}", matchTaskObjPronoun(verb, objCase))
           .replace("${when}", matchTaskWhen());
  
  return capitalize(str);
}

const nextRandomTask = () => {
  const ra = nextRandomAnswer(ttsGame.randTask[1]);
  const rt = makeTaskSentence(ttsGame.randTask[0]);
//console.log("task ", rt);
//console.log("answer ", ra);
}

const capitalize = s => {
  return (!s || (typeof s !== 'string'))? '' : s[0].toUpperCase() + s.slice(1)
}

