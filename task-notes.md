## Task Notes

- wordlist is no longer in use since h2 2025. Should it be repurposed or removed?

- For cloze gaps in de, cs, pl, show special characters, like in dictation. Use getTypeKeys(), updateTypeKeys, etc.

- make text invisible/white it out, e.g., on mouse hover or click/selection, so that the user could 
say it out loud without visual support, just from their memory
- b/c of <x-audio> and <x-video>, playerBox and settings may need to be created from 
an html constant in the left column or transcriptText, e.g., in movePlayer fn.
- add {x-voice-ctrl} or {x-tts-ctrl} to tasks, similar to {x-speed-ctrl}?
- add live captioning? see https://github.com/MidCamp/live-captioning
- add an option to show acronyms in gaps. {x-view-gaps} could have 3 positions
- remember and suggest history: n last vocab entries/urls/activities? User turns it on/off in settings.

for mobile, right column could pop up at the bottom and be closed via x button?

- implement showing tips for 3-4 sec on touchscreen via touchstart or onpointerdown

- resize video via resize:both - see https://web.dev/resize-observer/
- create a word/phrase list in the tasklist. Now it's done via a link to word list
+- add play-with-a-pause button capability in task scripts. 
It will set start, stop in the settings and emulate pressing Play button.
+ drag and drop task file - see w3schools or https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
+- Translate site with Google. See more at https://stackoverflow.com/questions/34763527/convert-onclick-event-to-page-load-event
+- set position: fixed for video and settings for wide screens?


TBD:
- use just one the audio recorder - from words/index? It lacks set/getflag fn. Now testMic() is shared.
- There are two types of vocab now: in wordList and in transcriptText. How to deal with them in the future?
- hide left column if the task has no yt-ID, startmedia, url key or link to video? What about settings in this case?
- use two individual playing flags for YT and html player? (playing two videos in parallel?)
- use unicode-bidi: plaintext for transcriptText? Then, direction rtl may need to change in parseTTSTag fn. 
unicode-bidi replaced with direction rtl or ltr 2024-06-10.

Issues:
- TTS sentences not always recognized when there are time cues. To be investigated.
- if playing directly in YT player, clicking on cue will skip the first replay 
and go right away to "repeat after the speaker".

- Subtitles do not load starting from November 2021. 
see https://stackoverflow.com/questions/69946755/extracting-subtitles-from-youtube-videos-no-longer-works
https://stackoverflow.com/questions/69937867/google-video-no-longer-able-to-retrieve-captions
https://stackoverflow.com/questions/23665343/get-closed-caption-cc-for-youtube-video

Useful resources:
https://vanillajstoolkit.com
https://gomakethings.com

