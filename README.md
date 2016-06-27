# Responsive Fretboard

Responsive Fretboard is a jQuery plugin for displaying a fretboard that is configurable, interactive, responsive, and stylable. Your fretboard can have any number of strings or frets, and be of any custom tuning. You can display notes programatically or capture user input. The fretboard is made with HTML/CSS/JavaScript.


I am developing features as I need them, but if you have a feature request feel free to contact me.



## Demo

Check out the <a href="http://frank-modica.com/static/fretboarddemo/index.html" target="_blank">demo fretboard</a>.

You can also check out my <a target="_blank" href="http://frank-modica.com/#/voiceleader/index">Guitar Voiceleading Helper</a>, where I use the fretboard to help users create progressions with good voice leading.

Or check out the code examples using the <a href="https://github.com/fmodica/responsive-fretboard.js/blob/master/index.html">jQuery plugin</a> or the <a href="https://github.com/fmodica/responsive-fretboard.js/blob/master/angular-directive/index.html">AngularJS directive</a>.


## Details

First load the fretboard.js file into a script tag in your HTML document (along with jQuery). Also load the styles.css file. 

Then initialize on your element:

```
$(".my-fretboard-js").fretboard();
```

This is enough to create the default fretboard. 

Learn about <a target="_blank" href="https://github.com/fmodica/responsive-fretboard.js/wiki/Configuration-and-API">fretboard configuration and the API</a>

## AngularJS Directive

The jQuery plugin is also wrapped as an <a href="https://github.com/fmodica/responsive-fretboard.js/wiki/AngularJS-Directive">AngularJS directive</a>
