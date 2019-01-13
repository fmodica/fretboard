# Fretboard

A jQuery plugin for displaying a fretboard that is configurable, interactive, responsive, and stylable. Your fretboard can have any number of strings or frets, and be of any custom tuning. You can display notes programatically or capture user input. The fretboard is made with HTML/CSS/JavaScript.

I am developing features as I need them, but if you have a feature request feel free to contact me.

## Demo

Check out the <a href="http://frankmodica.net/static/fretboarddemo/index-with-full-config.html" target="_blank">demo fretboard (default styles)</a>. Here is the same fretboard styled with a <a href="http://frankmodica.net/static/fretboarddemo/index-with-full-config-dark-theme.html" target="_blank">dark theme</a> using CSS.

## Setup

Load your scripts and styles:

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

## Code Examples

<a href="https://github.com/fmodica/fretboard/blob/master/jquery-plugin/index.html">jQuery plugin (basic, using the default config)</a>

<a href="https://github.com/fmodica/fretboard/blob/master/jquery-plugin/index-with-full-config.html">jQuery plugin (using all config options + API)</a>

## Extra

You can also check out my <a target="_blank" href="http://frankmodica.net/voiceleader/index">Guitar Voiceleading Helper</a>, where I use the fretboard to help users create progressions with good voice leading.

## Tests
Unit tests can be run using the <a href="https://github.com/fmodica/fretboard/tree/master/tests">Spec Runner</a>.

## AngularJS 1 Directive

If you are using Angular 1, the fretboard is also wrapped as an <a href="https://github.com/fmodica/fretboard-angular-1">Angular 1 directive</a>.

## AngularJS 2 Component

If you are using Angular 2, the fretboard is wrapped as an <a href="https://github.com/fmodica/fretboard-angular">Angular 2 component</a>.
