# Responsive Fretboard (In progress)

A jQuery plugin for displaying a responsive, interactive, configurable, stylable fretboard of any number of frets, strings, and tunings. I also have this wrapped as an AngularJS directive.

I initially wrote this so I could capture user input (chords/scales) and display chords/scales of my own. I am developing features as I need them, but if you have a feature request feel free to contact me.



## Demo

Check out the "index.html" files in the project for examples.

You can also check out my voice leading page, where I use the fretboard to help users create progressions with good voice leading:


http://frank-modica.com/#/voiceleader

## Details

First load the fretboard.js file into a script tag in your HTML document (along with jQuery). Also load the styles.css file. 

Then initialize on your element:

```
$(".my-fretboard-js").fretboard();
```

This is enough to create the default fretboard. 

Learn more:

https://github.com/fmodica/responsive-fretboard.js/wiki/Configuration-and-API
