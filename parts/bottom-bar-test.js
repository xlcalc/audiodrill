const bottomBar = `
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
  border-top: 1px  silver;
  border-bottom: 1px  silver;
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
/*  padding-left: 0.5em;
margin-bottom: 0.5em;
white-space: pre-wrap; 
background-color: white; 
overflow: hidden; */
  border: 1px  green;
  padding: 0.5em;
  line-height: 1.4em;
}

#infopage {
  position: fixed;
border-radius: 5px;
border: solid 1px lightgray;
box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.2), 0 8px 20px 0 rgba(0, 0, 0, 0.19);
  background-color: #f9f9f5;
color: DarkSlateGray;
  opacity: 0.95;
/*  display: none; */
  z-index: 3;
  font-size: 20px;
/*
  overflow: overlay;
  overflow: hidden;
*/
}

@media screen and (max-width: 800px ) {
  #infopage {  
    width: calc(85vw);
    left: calc(7vw); 
  }
}

#infopage-save-box {
  position: absolute; 
  cursor: default;
}

#infopage-content {
/*position: absolute;
  overflow-x: hidden; */
  overflow: auto; 
  height: 97%;
  height: 95%;
/*  width: 97%; */
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

.yesno-button {
  background-color: white;
  color: #aaa;
  border: 1px dotted #777;
  width: 9%;
  min-width: 3em;
  height: 67%;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  border-radius: 12px;
  font-size: 80%;
}

iframe {
  overflow: scroll;
  width: 100%;
  height:100%;
  border: 1px solid gray;
}

#bottomMenu {
  margin-top: 16px;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  padding: 0.7em 0.7em 0;
  padding: 0 0.7em;
  border-top: 1px solid #b9c9c0;
}

#bottomMenu a {
/*  margin: 0 0.3em 0.3em 0.3em;
  padding: 0.2em;
  color: #687;
  border-radius: 4px;
*/
  color: inherit;
}

#bottomMenu h4, p {
  margin: 0 0 0.8em 0;
}

.bottom-column {
  margin: 0 1em;
  padding: 0 1em 0 1em;
  padding: 1em;
  padding: 0.5em 1em 0;
  color: #677;
  border-radius: 4px;
}

.menu-box {
/*  height: 0; */
  width: auto;
  position: fixed;
  z-index: 3;
  top: 0;
  right: 0;
  background-color: #99a499;
  border-radius: 3px;
  box-shadow: -6px 6px 1em rgba(0, 0, 0, 0.20);
  overflow-x: hidden;
}

.menu-box:focus-within, .menu-box:focus {
  height: auto;
}

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
}

.menu-box .closebtn:hover, .menu-box .closebtn:focus {
  color: #99a499;
  background-color: #eee;
}

.menu-button {
  position: absolute;
  position:fixed;  /* added 2023-07-26 */
  z-index: 3; /* changed 2023-09-03 */

  top: 0;
  top: -0.3em;
  right: 0.4em;
  padding:0.5em 0.3em;
  color: #687;
  cursor: pointer;
  line-height:1.2em;
  border-radius: 50%;
  transform: scale(1.2,0.85);
}
.menu-button:hover, #bottomMenu a:hover {
  background-color: #eee;
  text-decoration:none;
}

@media screen and (max-width: 700px) {
  .menu-button {
/*    z-index: 1;
	position:fixed;
*/
  }
}

</style>
<div class="overlay"></div>

<div id="infopage" class="hidden">
  <div id="infopage-close" class="close-x01 rnd dark-hover" onclick="displayInfopage('hide')">&times;</div>
  <div id="infopage-content" tabindex="-1"></div>
  <div id="infopage-save-box" class="flex">
    <div id="infopage-save-yes" class="yesno-button btn" title="Save" 
      onclick="displayInfopage('SAVE_AND_EXIT')">✔</div>
    <div id="infopage-save-no" class="yesno-button btn" title="Discard changes" 
      onclick="displayInfopage('hide')">✖</div>
  </div>
</div>

<div id="topMenuBtn" class="menu-button" title="Audiodrill menu" onclick="showElid('topMenu')">
<b>&#9776;</b>
</div>

<a href="#" id="hiddenLink" style="position:absolute;top:-10em;left:0;"></a>

<div id="topMenu" class="menu-box hidden">
  <div class="menu-content">
    <a id="menuCloseBtn" class="closebtn" href="" onclick="hideElid('topMenu');event.preventDefault();">&times;</a>   
    <a href="/">Home</a>
    <a href="/?t">Tasks</a>
    <a href="/words/">Words & phrases</a>
    <a href="/words/?game=all">Voice games</a>
    <a href="/words/?shadow-read">Shadow reading</a>
    <a href="/words/?tts-read">TTS reader</a>
    <a href="/info/?show=resources">Resources</a>
    <a href="" onclick="hideTopMenu('help');event.preventDefault();">Help</a>
	<hr>
    <a href="" onclick="hideTopMenu('settings');event.preventDefault();">⚙ Settings</a>	
  </div>
</div>

`;