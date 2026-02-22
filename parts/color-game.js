const numberOfColors = 20;
const colorVars = {
  ordinal: false,
  init() {
    this.newColor = ''; this.currentColor = ''; 
    this.colorNum = -1; this.incompleteAction = '';
  }
};

const playColors = (inputText) => {
let transcript = inputText.toLowerCase();
console.log('transcript: ',transcript);
  let speakPhrase,notePhrase;
  if (/enough|exit|game over/.test(transcript)) {
    sayFinalThanks();
//    takeNotes = true;
    clearPlaygroundDiv();
    playIsOn = false; playName = '';
    ta.classList.remove('text-area-small-font');
    return;
  }

  if (/help/.test(transcript)) {giveColorHelp(); return;}
  if (/cardinal/.test(transcript)) {setOrdinalNumbers(false); return;}
  if (/ordinal/.test(transcript)) {setOrdinalNumbers(true); return;}

  if (/shades of red|red shades/.test(transcript)) {listShades('red'); return;}
  if (/shades of orange|orange shades/.test(transcript)) {listShades('orange'); return;}
  if (/shades of yellow|yellow shades/.test(transcript)) {listShades('yellow'); return;}
  if (/shades of green|green shades/.test(transcript)) {listShades('green'); return;}
  if (/shades of blue|blue shades/.test(transcript)) {listShades('blue'); return;}
  if (/shades of violet|violet shades/.test(transcript)) {listShades('violet'); return;}
  if (/shades of white|white shades/.test(transcript)) {listShades('white'); return;}
  if (/shades of black|black shades/.test(transcript)) {listShades('black'); return;}
  if (/shades of gray|gray shades|shades of grey|grey shades/.test(transcript)) {listShades('Grey'); return;}
  if (/basic colors|basic palette/.test(transcript)) {listShades('basic'); return;}

  switch(transcript){
    case "let's play colors": case "let's play colours": 
      displayInfo('');
      ta.classList.add('text-area-small-font');
      gameLevel = 1;
      ttsGame.totalAnswers = 0; ttsGame.correctAnswers = 0;
      speakPhrase = "Please read the instruction and start playing.";
      notePhrase = "Check the color or " +
        "say what new color you want to set. For example:\n" +
        "'Is the 1st color red?'\n 'I want to set the 2nd one pink.'\n " +
        "'Make them all gold.'\n " +
        "'What's the 3rd color?'\n 'Where's yellow?'\n" +
        "'What shades of green do you have?'\n" +
        "For more info, ask for help.\n";
      ta.innerText = " 🌟 Let's play colors 🌟 \n" + notePhrase;
      newColorTask();
      speak(sayAgree() + speakPhrase);
    break;

    default:
    colorInputCheck(transcript);
  }
} // end of playColors

const listShades = (basicColor) => {
  let speakPhrase, notePhrase;
  const shadesPrefix = "So far we have the following shades of ",
        shadesSuffix = "\nGuess which color is which.",
        shadesList = ["red: brown, pink, carmine, crimson, maroon, mahogany, ruby, salmon, scarlet, tomato, vermilion.",
          "orange: apricot, bronze, coral, ochre, peach, tangerine, tea rose.",
          "yellow: cream, canary yellow, gold, saffron, amber, beige, khaki.",            
          "green: pale green, dark green, jade, malachite, olive, lime.",
          "blue: aqua, aquamarine, azure, web azure, indigo, navy, sapphire, teal, turquoise, ultramarine.",
          "violet: fuchsia, lavender, mauve, orchid, plum, purple.",
          "Grey: we don't have 50 shades of it.",
          "We don't have shades of white or black yet."
        ];

  let shades = shadesList.find(e => e.includes(basicColor)); 

  switch(basicColor){
    case "Grey": 
      speakPhrase = shades;
      notePhrase = speakPhrase + ' 😊';
    break;

    case "black": case "white": 
      speakPhrase = shades;
      notePhrase = speakPhrase;
    break;

    case "basic":  
      speakPhrase ="So far we have the following basic colors: " + basicPalette + shadesSuffix;
      notePhrase = speakPhrase;
      setPalette(basicPalette);
    break;

    default:
      speakPhrase = shadesPrefix + shades + shadesSuffix;
      notePhrase = speakPhrase;
      setPalette(shades);
  }
  speak(speakPhrase);
  ta.innerText = " 🌟 Let's play colors 🌟 \n" + notePhrase;
}

const colors = [ // the order of the colors is important for look-up results
  'red', ['ruby','224,17,95'],'salmon','tomato','brown','pink','crimson', 'maroon', 
  ['mahogany','192,64,0'],['scarlet','255,36,0'],['carmine','150,0,24'],['vermilion','227,66,52'],
  'orange',['apricot','251,206,177'], ['peach','255,229,180'], ['ochre','204,119,34'],
  ['tangerine','242,133,0'], ['tea rose','248,131,121'], ['coral','255,127,80'],
  ['bronze','205,127,50'],
  'yellow',['cream','255,255,204'], ['canary yellow','255,255,153'], 'khaki',
  'beige','gold',['saffron','244,196,48'],['amber','255,191,0'],
  'green',['pale green','palegreen'],['dark green','darkgreen'],'lime',
  ['malachite','11,218,81'],['jade','0,168,107'],'olive',
  'blue','turquoise','navy','aqua','aquamarine','teal','indigo', ['sapphire','15,82,186'],
  ['azure','0,127,255'],['web azure','azure'],['ultramarine','18,10,143'],
  'violet','purple','plum','lavender',['mauve','224,176,255'],'orchid','fuchsia',
  'white','gray',['light gray','lightgray'],'black','silver','transparent'
];

const setPaletteColor = (color) => {
  for (let i=0; i < numberOfColors; i++) setNewColor(i, color, true);
}

const setPalette = (shadeString) => {
  setPaletteColor('transparent');
  const shadeStr = shadeString.replace(/: |, /g, '|');
  const shadeSt = shadeStr.replace(/[.]/g, '');
  let shade = shadeSt.split('|');
//console.log('shade before',shade);
  shade = arrayShuffle(shade);
//console.log('shade after',shade);

  let randomPos, palette=[], n;

  for (i=0; i<numberOfColors; i++) palette.push(i); // model pallette
  palette = arrayShuffle (palette); // randomize it
  for ([i,color] of shade.entries()) {
    n = checkArrayMatch(colors, color); // look up the color
    if (n !== -1) setNewColor(palette[i], colors[n], true);  
  }
}

const giveColorHelp = () => {
  const cue = `To see available colors, say, for example,
'What shades of green do you have?'
or 'Show me the basic colors.'\n
Say 'ordinal numbers' or 'cardinal numbers' to switch between the two.
To exit the game, say 'enough' or 'exit'.`; 
  speak(cue);
  ta.innerText = " 🌟 Let's play colors 🌟 \n" + cue;
}

/*
const checkArrayDeepMatch = (array, checkStr) => {
  let i=0, match = -1;
  for (entry of array) { //main array
    if (Array.isArray(entry)) {
      for (element of entry) // child array
//console.log('element ', element);
        if (checkStr.includes(element)) match = i; 
    }
    else if (checkStr.includes(entry)) match = i; // no child array
    i++;
  }
  return match;
}
*/

const checkArrayMatchWord = (refArray, checkStr) => {
  const checkedWords = checkStr.split(/[ .,!?"]/);
  let match = -1;
  for (word of checkedWords) {
    let i = 0;
    for (ref of refArray) {
      if (word === ref ||
           (Array.isArray(ref) && ref.includes(word))) match = i;
      i++;
    }
    if (match > -1) break;
  }
  return match;
}

const checkArrayMatch = (array, checkStr, searchByValue) => {
  let i=0, match = -1;
  for (entry of array) {
    if (checkStr.includes(entry)) match = i;
    if (Array.isArray(entry)) {
      if (searchByValue) { if (checkStr.includes(entry[1])) match = i; }
      else { if (checkStr.includes(entry[0])) match = i; }
    }
    i++;
  }
  return match;
}

const getObjColor = el => getColorOrRgb(el.style.backgroundColor);

const getColorOrRgb = color => color.includes("rgb(")? color.replace(/[rgb()\s]/g, '') : color;

const reportColor = (objNumber, colors, speakPrefix) => {
  if (objNumber === -1) { 
    speak('Sorry, which color number do you mean?');
    return; 
  }
  const obj = elid("obj-" + objNumber);
  let color = getObjColor(obj);
  let i = checkArrayMatch(colors, color, true); 
//console.log('color ',color);
  if (i !== -1) { 
//console.log('color index', i);
    if (Array.isArray(colors[i])) { color = colors[i][0];}
  }
//  speak(speakPrefix + 'The ' + ordinalNumbers[objNumber] + ' color is ' + color);
  speak(speakPrefix + objNumPhrase(objNumber) + ' is ' + color);

  showRef(color);
}

const verifyColor = (objNumber, color) => {
  let colorName = color;
  let colorValue = color;
  if (Array.isArray(color)) {
    colorName = color[0];
    colorValue = color[1];
  }
  if (objNumber === -1) { 
console.log('object (not specified)'); 
    colorVars.incompleteAction = 'verify color';
    speak('Sorry, which color number is ' + colorName + '?');
    return; 
  }
  const obj = elid("obj-" + objNumber);
console.log('Object color ', getObjColor(obj));
console.log(' colorValue ',colorValue);
  if (getObjColor(obj) === colorValue) {
console.log('obj #', objNumber, 'color ',colorValue,' match');
//    speak('Yes, the ' + ordinalNumbers[objNumber] + ' color is ' + colorName);
    reportColor(objNumber, colors, 'Yes, ');
  } else reportColor(objNumber, colors, 'No, ');

  colorVars.incompleteAction = '';
}

const tellColorPos = color => {
  const colorName = (Array.isArray(color)) ? color[0] : color;
  const n = searchColorPos(color);
  if (n === -1) speak("There's no " + colorName +' here. But you can set any color ' + colorName);
//  else speak('The ' + ordinalNumbers[n] + ' color is ' + colorName);
  else speak(objNumPhrase(n) + ' is ' + colorName);
}

const searchColorPos = color => {
  const colorValue = (Array.isArray(color)) ? color[1] : color;
  let match = false, i;
  for (i = 0; i<numberOfColors; i++) {
    const obj = elid("obj-" + i);
    if (getObjColor(obj) === colorValue) {
      match = true;
      break;
    }
  }
  return match? i : -1;
}

const setNewColor = (objNumber, color, mute) => {
  if (color ==='') return;
  let colorName = color;
  let colorValue = color;
  if (Array.isArray(color)) {
    colorName = color[0];
    colorValue = color[1];
    if (colorValue.includes(',')) colorValue = 'rgb(' + color[1] + ')';
  }

  if  (objNumber !== -1) {
//console.log('Set #',objNumber,' to ',color);
    const obj = elid("obj-" + objNumber);
    obj.style.backgroundColor = colorValue;

    if (colorValue === 'transparent') obj.style.color = 'lightgray';
    else obj.style.color = 'darkslategray';

    if (!mute) {
//      speak(sayAgree()+'Now the ' + ordinalNumbers[objNumber] + ' color is ' + colorName);
      speak(sayAgree()+'Now ' + objNumPhrase(objNumber) + ' is ' + colorName);
      showRef(colorName);
    }
    colorVars.incompleteAction = '';
  } 
  else {
    speak('Sorry, which number do you wish to set ' + colorName +'?');
    colorVars.incompleteAction = 'set new color';
  }
}

const ordinalNumbers = ['first','second','third','fourth','fifth','sixth',
    'seventh','eighth','ninth','tenth','eleventh','twelfth','thirteenth','fourteenth',
    'fifteenth','sixteenth','seventeenth','eighteenth','nineteenth','twentieth'];

const ordinalNumbersAlt = ['1st', '2nd', '3rd',['4th','force color'],['5th','v c'],
    ['6th','six'],'7th',['8th','8','eight','eights','aids'],
    '9th','10th',['11th','xi'],['12th','xii'],['13th','xiii'],
    ['14th','xiv'],['15th','xv'],['16th','xvi'],
    ['17th','xvii'],['18th','xviii'],['19th','xix'],['20th','xx']];

const cardinalNumbersAlt = [['1','one'], ['2','two'], ['3','three'], ['4','four'], ['5','five'],
    ['6','six'], ['7','seven'], ['8','eight'], ['9','nine'],['10','ten'], ['11','eleven'],
    ['12','twelve'], ['13','thirteen'], ['14','fourteen'], ['15','fifteen'], ['16','sixteen'],
    ['17','seventeen'], ['18','eighteen'], ['19','nineteen'], ['20','twenty']];

const colorNumberCheck = (transcript) => {
  let i = checkArrayMatchWord(ordinalNumbers, transcript);
  if (i === -1) i = checkArrayMatchWord(ordinalNumbersAlt, transcript);
  if (i === -1) i = checkArrayMatchWord(cardinalNumbersAlt, transcript);
  if (i === -1 ) return false;
  colorVars.colorNum = i; console.log('object: ',i+1, ' colorVars.colorNum', colorVars.colorNum);
  return true;
}

const colorNameCheck = (transcript) => {
  let colorName = '';
  const n = checkArrayMatch(colors, transcript); 
  if (n !== -1) { colorName = colors[n]; }
  else if (transcript.includes(' grey')) colorName = 'gray';
  return colorName;
}

const colorInputCheck = transcript => {
  const allColorsMentioned = /all the colors|all the colours|them all/.test(transcript),
    colorNumberMentioned = colorNumberCheck(transcript), 
    colorMentioned = colorNameCheck(transcript);

console.log ('colorVars.colorNum ',colorVars.colorNum);

  if (!colorNumberMentioned && !colorMentioned) {
    if (allColorsMentioned && colorVars.incompleteAction === 'set new color') {
      setPaletteColor(colorVars.newColor);
      return;
    } 
    speak(reply('pardon-me'));
    return;
  }

  if (/what is |what's |what color|which is|which color/.test(transcript)) {
    reportColor(colorVars.colorNum, colors,'');
    return;
  }

  if (/make |set /.test(transcript)) { //set new color
    if (colorMentioned) {
      colorVars.newColor = colorMentioned;
console.log ('New color: ', colorMentioned);
      if (allColorsMentioned) setPaletteColor(colorMentioned);
      else setNewColor(colorVars.colorNum, colorMentioned); 
    } else speak("Did you say, " + transcript + "? Sorry, I can't set this color");
    return;
  } // end of set new color
  else { 
    if (colorMentioned) {
      colorVars.currentColor = colorMentioned; 
console.log ('Current color: ', colorMentioned);
      if (/where's |where is /.test(transcript)) tellColorPos(colorMentioned);
      else verifyColor(colorVars.colorNum, colorMentioned);
    } else speak('Sorry, what is the color again?');
  }

  if (colorNumberMentioned && !colorMentioned) {
      if (colorVars.incompleteAction === '') speak('Sorry, what about ' + objNumPhrase(colorVars.colorNum) + '?');
      if (colorVars.incompleteAction === 'set new color') setNewColor(colorVars.colorNum, colorVars.newColor);
      if (colorVars.incompleteAction === 'verify color') verifyColor(colorVars.colorNum, colorVars.currentColor); 
  }   
}

const createColoredObjects = () => {
  const objBox = elid('playground-div');
  let content = '';
  for (let i=0; i<numberOfColors; i++) {
    content += '<div class="obj-colored" id="obj-' + i +
      '" onclick="clickColorNumber(this)"></div>';
  }
  objBox.innerHTML = content;
  updateObjNumbers(colorVars.ordinal);
}

const basicPalette = 'red, orange, yellow, green, blue, violet, white, light gray, gray, black.';
const newColorTask = () => {
  colorVars.init();
  createColoredObjects();
  setPalette(basicPalette);
  showRef('');
}

function clickColorNumber(el) {
console.log('Color ID', el.id);
//  const n = parseInt(el.id.split('-')[1]);
  const n = parseInt(el.innerText);
  colorVars.colorNum = n-1;
  if (colorVars.ordinal) speak("What's the " + ordinalNumbers[n-1] +" color?");
  else speak("What color is number " + n + "?");
}

const setOrdinalNumbers = v => {
  colorVars.ordinal = v;
  updateObjNumbers(v);
}

const updateObjNumbers = ordinal => {
  const suff = {0:'st', 1:'nd', 2:'rd'};
  let suffix = '';
  for (let i=0; i<numberOfColors; i++) {
    if (ordinal) suffix = (suff[i])? suff[i] : 'th';
    setElHTML('obj-' + i, i+1 + suffix);
  }
}

const objNumPhrase = n => (colorVars.ordinal)? "the " + ordinalNumbers[n] +" color"
  : "color number " + (n+1);