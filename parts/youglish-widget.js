const youglish = {
  supportedLanguages: [ //could be moved to fetchVideo if needed
    'Arabic', 'Chinese', 'Dutch', 'English', 'French', 'German', 'Greek', 
    'Hebrew', 'Hindi', 'Italian', 'Japanese', 'Korean', 'Persian', 'Polish', 'Portuguese', 'Russian', 
    'Spanish', 'Swedish', 'Thai', 'Turkish', 'Ukrainian', 'Vietnamese', 'Sign Languages'
  ],
  
  hasAccent(lang) { return ['Chinese', 'Dutch', 'English', 'French', 'Portuguese', 'Spanish'].includes(lang) },

  getSuggestedComponents(lang) { return this.hasAccent(lang)? 8411 : 8408 },

  hasAccentPanel(v) { return v % 4 === 3 }, // last two bits are 11
  

  reload(){
console.log('YG player reloading...');
    ygCallback('RELOAD_PLAYER');
    onYouglishAPIReady();
  },

  fetchVideo([query, lang] = ['','']) { // called from index.html 
    if (widget) {
      if (query && this.supportedLanguages.includes(lang)) {
        youglish.manuallyPaused = false;
	    youglish.manuallyClosed = false;
        if (ygCallback('GET_AUTOSTART') !== youglish.autoStart
		|| this.hasAccent(lang) !== this.hasAccentPanel(youglish.components)
		) { onYouglishAPIReady(this.getSuggestedComponents(lang)); } //apply autoStart via reloading the widget
// accent panel can be added via reloading if (this.hasAccent(lang))

        ygCallback('RESET_SPEED');

	    youglish.query = query;
	    youglish.lang = lang;
        if (lang === 'Chinese') {
          widget.fetch(query, lang);
        } else {
          widget.fetch('"' + query + '"', lang); // doesn't work properly with Chinese, tbc
        }

      } else { // clear track info and widget
        youglish.manuallyPaused = true;
        ygCallback('SHOW_TRACK_INFO', [-1]); // no query
        widget.close();
      }
    } else ygCallback('YG_ERROR', 3);
  }
}

//  See reference to YouGlish widget at https://youglish.com/api 
function onYouglishAPIReady(components = 8408) {
  function errorHandler(e) {
    const msgArr = ['YouGlish error.', // dummy error code 0
      'YouGlish internal error.', 
      'The browser does not support YouGlish. Try a newer one.',
	  'YouGlish is currently unavailable.'
	];
    ygCallback('YG_ERROR', {code: e.code, msg: msgArr[e.code]}); 
console.error('** YouGlish error', e.code);
  }

  function onSearchDone(e) {
    youglish.totalTracks = e.totalResult;
    if (e.totalResult > 0) widget.show();
    else {
      widget.hide();
      ygCallback('SHOW_TRACK_INFO', [0]);
    }
  }

  function onVideoChange(e) {
//    youglish.manuallyPaused = false; // it's set in onPlayerStateChange() when e.state changes to 3 (playing)
console.log('Video change event:', e);
    if (!youglish.manuallyClosed) youglish.manuallyPaused = false;
    youglish.curTrack = e.trackNumber;
    youglish.views = 1;
    ygCallback('RESET_SPEED');
    ygCallback('SHOW_TRACK_INFO', [youglish.totalTracks, youglish.curTrack, e.video, youglish.query, youglish.lang]);
  }

  function onPlayerReady(e) {
console.log('YG player ready');
  ygCallback('PLAYER_READY');
  }

  const replayOrNext = () => {
// To avoid early replay, should be bounced if user manually moves to the next clip
// To check it, the clip number should be compared with the previous one
    if (youglish.views < ygCallback('GET_REPLAY_NUMBER')) {
      ygCallback('SET_SPEED', youglish.views);
      widget.replay();
      youglish.views ++;
    } 
	else if (youglish.curTrack < youglish.totalTracks) {
	// next track or stop
      ygCallback('RESET_SPEED');
      widget.next();
    }
  }

  const onCaptionConsumed = async e => {
console.log('Caption consumed, id:', e.id);
    await ygCallback('SLEEP', 1000); // wait a bit because onCaptionConsumed may fire too early
    widget.pause();
    await ygCallback('SLEEP', 4000); // pause so that the user could read and think
  
    if (youglish.manuallyPaused) return;

    replayOrNext();
  }

/*
  const onCaptionChange = async e => {
console.log('Caption:' ,e.caption);
console.log('Caption ID:' ,e.id);
// info on captions could be collected as {video id, caption id, caption text} and shown to the user
  }
*/

  const onPlayerStateChange = e => {
  // e.state values are those of YT player
  // other properties (e.action, e.wid) aren't very useful
    ygCallback('PLAYER_STATE_CHANGED', e.state);
    console.log('Player state changed to', e.state);

	if (e.state === 3) // YG.PlayerState.BUFFERING
      youglish.manuallyPaused = false; // added 2024-11-02
    else if (youglish.manuallyPaused) return; // do nothing 

    if (!e.state) replayOrNext(); // state 0: YG.PlayerState.ENDED
	
// widget.fetch() may not start playing if autostart has changed from 0 to 1.
// So, force it to play
    if (ygCallback('GET_AUTOSTART') && e.state === -1) { //state -1: YG.PlayerState.UNSTARTED
	  widget.play(); 
      console.log('** FORCE widget.play()');
	  }
  }

  const params = ygCallback('GET_PARAMS');
  params.components ??= components;
  const autoStart = ygCallback('GET_AUTOSTART');

  widget = new YG.Widget('widget-1', {
//  width: 640,
    autoStart: autoStart  | 0, // bitwise OR ZERO (just in case, to get 0 or 1 - not false or true)
    components: params.components, 
    markerColor: params.markerColor || '#efe',
    captionSize: params.captionSize || 33,
	videoQuality: params.videoQuality,
    events: {
      'onError': errorHandler,
      'onFetchDone': onSearchDone,
      'onVideoChange': onVideoChange,
      'onPlayerReady': onPlayerReady,
      'onCaptionConsumed': onCaptionConsumed,
//      'onCaptionChange': onCaptionChange,
      'onPlayerStateChange': onPlayerStateChange
    }          
  });

  youglish.components = params.components;
  youglish.autoStart = autoStart;
console.log('Youglish widget ready');
  ygCallback('WIDGET_READY');
} // end of onYouglishAPIReady() wrapping


// *** Possible issues ***

