const speakWrite = (oralText, writtenText) => { //used in math game
console.log('oral text',oralText);
  speak(oralText, true);
  if (ttsGame.takeNotes) { 
console.log('written text',writtenText);
//    let note = (typeof writtenText === 'undefined') ? oralText : writtenText;
    let note = writtenText || oralText;
    ta.innerText += note; ta.scrollTo(0, ta.scrollHeight + 100); 
  }
}

const playNumbers = (transcript) => {
console.log('transcript: ',transcript);
  let speakPhrase,notePhrase;
  if (/enough|exit|game over/.test(transcript)) {
    speakPhrase = '\nYour score is ' + ttsGame.correctAnswers + 
                  ' out of ' + ttsGame.totalAnswers + '. Thank you.';
    ttsGame.takeNotes = true;
    speakWrite(speakPhrase, speakPhrase + ' 😊\n');
    playIsOn = false; playName = '';
    return;
  }

  if (transcript.includes('take notes')) {
    ttsGame.takeNotes = true; 
    speakPhrase = 'OK, notes are being taken. So what is ' + ttsGame.mathTaskToSpeak +'?';
    notePhrase = ttsGame.mathTask + ' = ';
    speakWrite(speakPhrase, notePhrase);
    return;
  }

  if (/next|skip|no idea|don't|do not |what|yes/.test(transcript)) {
    ttsGame.totalAnswers ++;
    speakPhrase = "It's " + ttsGame.mathTaskResult + '. ';
    if (/yes/.test(transcript)) speakPhrase = "No. " + speakPhrase;
    notePhrase = "\n(It is " + ttsGame.mathTaskResult + ')\n';
    newMathTask();
    speakPhrase += sayNext() + 'what is ' + ttsGame.mathTaskToSpeak + '?';
    notePhrase += (ttsGame.mathTask + ' = ');
    speakWrite(speakPhrase, notePhrase);
    return;
  }

  if (/again|repeat|sorry/.test(transcript)) {
    speakWrite('What is ' + ttsGame.mathTaskToSpeak +'? ');
    return;
  }

  if (/a hint/.test(transcript)) {
    const res = ttsGame.mathTaskResult.toString();
    speakPhrase = "OK, here's a hint. " +
      "The last digit is" + res[res.length -1] + ". ";
    speak(speakPhrase);
    return;
  }

  if (/help/.test(transcript)) {
    speakPhrase = "Maybe you have a calculator at hand? If not, you can ask for a hint. " +
      "Or just say next or skip or Idunno. So what is ";
    speak(speakPhrase + ttsGame.mathTaskToSpeak +'? ');
    return;
  }

  if (/level 1|level one/.test(transcript)) {
      ttsGame.level = 1;
      newMathTask();
      speakWrite("Let's go to Level 1. What is " + ttsGame.mathTaskToSpeak +'?', 
                 '\nLevel 1 is selected. ' + ttsGame.mathTask + ' = ');
    return;
  }

  if (/level 2|level two/.test(transcript)) {
      ttsGame.level = 2;
      newMathTask();
      speakWrite("Welcome to Level 2. What is " + ttsGame.mathTaskToSpeak +'?', 
                 '\nLevel 2 is selected.\n' + ttsGame.mathTask + ' = ');
    return;
  }

  switch(transcript){
    case "let's play numbers": 
      ttsGame.takeNotes = false;
      displayInfo('');

//      clearPlaygroundDiv();
      ttsGame.level = 1;
      ttsGame.totalAnswers = 0; ttsGame.correctAnswers = 0;
      ta.innerText = " 🌟 Let's play numbers 🌟 \nYou can ask to say it again to repeat the task.\n" +
        "If you need the transcript, say 'take notes'.\n"+
        "Say 'Level 2' to make it harder to play.\n" +
        "To skip the problem, say 'next' or 'I don't know'.\n" +
        "To exit the game, say 'enough' or 'exit'.\n"; 
      newMathTask();
console.log('speakWrite next after newMathTask');
      speakWrite(sayAgree() + 'What is ' + ttsGame.mathTaskToSpeak +'?', ttsGame.mathTask + ' = ');
    break;

    default:
    ttsGame.totalAnswers ++;
    if (transcript.replace(/[^0-9,-.]/g, '') == (ttsGame.mathTaskResult)) {
      ttsGame.correctAnswers ++;
      speakPhrase = (sayCorrect(ttsGame.mathTaskResult));
      notePhrase = (' ' + ttsGame.mathTaskResult + ' :)\n');

      newMathTask();
      speakPhrase += ' ' + ttsGame.mathTaskToSpeak + '?';
      notePhrase += (ttsGame.mathTask + ' =');
      speakWrite(speakPhrase, notePhrase);

    } else {
        ttsGame.incorrectCount += 1;
        if (ttsGame.incorrectCount > 3) { 
//          speakPhrase += 'If you wish to stop, say "enough".';
//          notePhrase  += 'If you wish to stop, say "enough". ';
          ttsGame.totalAnswers ++;
          speakPhrase = 'It is ' + ttsGame.mathTaskResult + '. ';
          notePhrase = ttsGame.mathTaskResult + '\n';
          newMathTask();
          speakPhrase += 'Now what is' + ttsGame.mathTaskToSpeak + '?';
          notePhrase += (ttsGame.mathTask + ' =');
          speakWrite(speakPhrase, notePhrase);
          break;
        }
        speakPhrase = sayIncorrect(transcript) + ' ' + ttsGame.mathTaskToSpeak + '? ';
        notePhrase = (' ' + transcript + ' :(\n');
        speakWrite (speakPhrase, notePhrase);
    }
  }
}

const newMathTask = () => {
  ttsGame.incorrectCount = 0;
  let decimal = false;
  const signsToSpeak = ['+',' minus ',' times '];
  const signs = '+-*';
  const signIndex = Math.floor(Math.random() * 3);
  let a = Math.floor(Math.random() * 100);
  let b = Math.floor(Math.random() * 100);
  if (ttsGame.level === 1) {
    if (signIndex === 1) {
      if (a < b) {const c = b; b = a; a = c;} // swap a and b to prevent negative result
    }
    if (signIndex === 2) {
      a = Math.floor(Math.random() * 11);
      b = Math.floor(Math.random() * 11);
    }
  }
  else if (signIndex < 2)  {
    decimal = true;
    a = a*100 + Math.floor(Math.random() * 100);
    b = b*100 + Math.floor(Math.random() * 100);
  }

  ttsGame.mathTaskToSpeak = a + signsToSpeak[signIndex] + b;
  ttsGame.mathTask = a + signs[signIndex] + b;
  ttsGame.mathTaskResult = eval(ttsGame.mathTask);
  if (decimal) {
    ttsGame.mathTask = a/100 + signs[signIndex] + b/100;
    ttsGame.mathTaskToSpeak = a/100 + signsToSpeak[signIndex] + b/100;
    ttsGame.mathTaskResult = ttsGame.mathTaskResult/100;
    }
console.log(ttsGame.mathTask + ' = ', ttsGame.mathTaskResult);

  showRef('');
}

const sayAgree = () => {
  const phrases = ['OK', 'Sure', 'No problem', 'Alright', "It's a good idea"];
  return randomElement(phrases) + '. ';
}

const sayNext = () => {
  const phrases = ['OK,', 'Well,', 'Now,', "Let's try this one.", "Alright,", ""];
  return randomElement(phrases) + ' ';
}


const sayCorrect = result => {
  const phrases = ['You are right. It is', 'Yes,|is the right answer', 'You are right.', 'So it is!',
    'Absolutely correct!', 'This is right.', "Yes, it's", 'Sure it is', 'Sure,|is the right answer',
    "Of course, it's", 'Of course,|is correct', 'Perfect! It is', 'It is|indeed', 'Indeed,|is correct'
  ];
  return commentResult(randomElement(phrases), result + '');
}

const sayIncorrect = result => {
  const phrases = ["Sorry,|isn't correct. Let's try again!", "Oops,|isn't right!", 
    "I'm afraid it isn't", "No, it isn't", '?|? Try again!', '?|? is it?',
    'Is it|really?', 'Are you sure|is correct? Please check it', 'Did you say|?', 
    'Sorry? Is it', "Sorry, it isn't", "Sorry,|isn't correct"
  ];
  return commentResult(randomElement(phrases), result + '');
}
