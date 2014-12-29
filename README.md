# fretboard.js

(In progress) A jQuery plugin for displaying a responsive, interactive, and configurable fretboard of any number of frets, strings, and tunings. I am also working on an AngularJS directive to wrap this.

First load the fretboard.js file into a script tag. Also load the styles.css file. 

Then initialize on your element:

```
$(".my-fretboard-js").fretboard();
```

This is enough to create the default fretboard. 

The majority of the fretboard's HTML elements (which represent notes, frets, strings, etc.) are absolutely positioned and animated in JavaScript. You can still configure quite a bit, however. 

The fretboard itself has a CSS class of "fretboard-body" and you can set things like its background (maybe use a cool image!), border, box-shadow etc. However, if you want to set its height or width you must do so on its parent element which has a CSS class of ".fretboard-container". 

```
.fretboard-container {
    overflow: hidden;
    width: 100%;
    height: 240px;
    min-width: 700px;
    margin: 0 auto;
}

.fretboard-container .fretboard-body {
    background: wheat;
    border: 1px solid gray;
    -webkit-box-shadow: 10px 10px 5px 0px rgba(0,0,0,0.75);
    -moz-box-shadow: 10px 10px 5px 0px rgba(0,0,0,0.75);
    margin: 10px;
}
```

This is done so that the height/width of the fretboard-container can be queried when the window is resized or strings/frets are added and the fretboard-body can be animated into that container, filling the space by default. Thus you can make this responsive by changing the height and width of ".fretboard-container" using media queries.

If you want the width and height of the fretboard-body to be determined by a more complex function (perhaps based on the number of strings, frets, browser width, etc.) you can supply that function in the configuration object discussed below.

### Configuration Object

allNoteLetters: An array of strings which represent the note letters. There must be 12 items in this array. The lowest item should represent the note at which the octave number is incremented. The default array is:

```
["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "Ab/G#", "A", "A#/Bb", "B"]
```

tuning: An array of note objects that represents the tuning, from high to low. Each note object has a "letter" and "octave" property. The default array is:

```
[{
    letter: "E",
    octave: 4
}, {
    letter: "B",
    octave: 3
}, {
    letter: "G",
    octave: 3
}, {
    letter: "D",
    octave: 3
}, {
    letter: "A",
    octave: 2
}, {
    letter: "E",
    octave: 2
}]
```

numFrets: 15 by default

isChordMode: A boolean which when true means that only one note can be clicked on a string at a time. Technically what happens is a "clicked" CSS class gets added to a clicked note and that CSS class is removed from all other notes on that string. The default CSS sets a background color for the clicked note.

noteClickingDisabled: If this is true a user cannot click a note (but can still hover over them to see their letters by default, which is defined in the CSS by the "hover" class). TODO - a disabled CSS class should be added somewhere in the HTML when this is true so it can be reacted to in CSS (perhaps don't allow showing of the notes on hover either).

dimensionsFunc: This function allows you to return an object with "width" and "height" properties which will determine the width/height of the fretboard-body if the default behavior (filling the space of the fretboard-container element) is not sufficient. This function will be passed the fretboard-body and fretboard-container as jQuery objects. 

```
function($fretboardContainer, $fretboardBody) {
    var settings = this,
        numStrings = settings.tuning.length,
        numFrets = settings.numFrets,
        browserWidth = $(window).width();
        
    return {
        width: // your width,
        height: // your height
    }
}
```

animationSpeed: This determines how fast the fretboard body and all inner elements are animated. The default is 500 (ms).

Pass your configuration object in when initializing the fretboard:

```
$(".my-fretboard-js").fretboard({
    // Configuration properties
});
```

See the index.html for an example of 2 fretboards. One is using the default CSS, and another has an astronomy theme.

