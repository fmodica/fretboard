# Fretboard

A jQuery plugin for displaying a fretboard that is configurable, interactive, responsive, and stylable. Your fretboard can have any number of strings or frets, and be of any custom tuning. You can display notes programatically or capture user input. The fretboard is made with HTML/CSS/JavaScript.


I am developing features as I need them, but if you have a feature request feel free to contact me.



## Demo

Check out the <a href="http://frank-modica.com/static/fretboarddemo/index-with-full-config.html" target="_blank">demo fretboard (default styles)</a>. Here is the same fretboard styled with a <a href="http://frank-modica.com/static/fretboarddemo/index-with-full-config-dark-theme.html" target="_blank">dark theme</a> using CSS.

## Setup

Load your scripts:

```
<script src="./jquery-1.11.2.min.js"></script>
<script src="./fretboard.js"></script>
<link rel="stylesheet" type="text/css" href="./styles.css">
```

Create an element to contain the fretboard:

```
<div class="my-fretboard-js"></div>
```

Initialize:

```
$(".my-fretboard-js").fretboard();
```

This is enough to create a fretboard using the default configuration.

Learn about <a target="_blank" href="https://github.com/fmodica/fretboard.js/wiki/Configuration-and-API">fretboard configuration and the API</a>.

## AngularJS Directive

The jQuery plugin is also wrapped as an <a href="https://github.com/fmodica/fretboard.js/wiki/AngularJS-Directive">AngularJS directive</a>. Check out the <a href="http://frank-modica.com/static/fretboarddemo/angular-directive/index-with-full-config.html">demo</a> which shows the fretboard and the config updated in real time. Here is the same fretboard styled with a <a href="http://frank-modica.com/static/fretboarddemo/angular-directive/index-with-full-config-dark-theme.html" target="_blank">dark theme</a> using CSS.

## Code Examples

<a href="https://github.com/fmodica/fretboard.js/blob/master/index.html">jQuery plugin (basic, using the default config)</a>

<a href="https://github.com/fmodica/fretboard.js/blob/master/index-with-full-config.html">jQuery plugin (using all config options + API)</a>

<a href="https://github.com/fmodica/fretboard.js/blob/master/angular-directive/index.html">AngularJS directive (basic, using the default config)</a>

<a href="https://github.com/fmodica/fretboard.js/blob/master/angular-directive/index-with-full-config.html">AngularJS directive (using all config options + API)</a>

## Extra

You can also check out my <a target="_blank" href="http://frank-modica.com/#/voiceleader/index">Guitar Voiceleading Helper</a>, where I use the fretboard to help users create progressions with good voice leading.
