# Responsive Fretboard (In progress)

A jQuery plugin for displaying a responsive, interactive, and configurable fretboard of any number of frets, strings, and tunings. I initially wrote it so I could capture user input (chords/scales) and display chords/scales via an API. I am also working on an AngularJS directive to wrap this (see below).

## Demo
Check out my voice leading page, where I use the fretboard to get chords from the user and display chords of my own:

http://frank-modica.com/Voiceleader

Check out an example fretboard I made that has an astronomy theme (why would I do this? I don't know, I majored in astronomy. Whatever.)

http://frank-modica.com/Sandbox

##How to use it

First load the fretboard.js file into a script tag in your HTML document. Also load the styles.css file. 

Then initialize on your element:

```
$(".my-fretboard-js").fretboard();
```

This is enough to create the default fretboard. 

The majority of the fretboard's HTML elements (which represent strings, frets, notes, etc.) are absolutely positioned and animated in JavaScript. You can still configure quite a bit, however. 

The fretboard itself has a CSS class of "fretboard-body" and you can set things like its background (maybe use a cool image!), border, box-shadow etc. 

```
/* This is the fretboard itself. It will expand to fill the 
    space of the ".fretboard-container" element. */
.fretboard-container .fretboard-body {
    background: wheat;
    border: 1px solid gray;
    -webkit-box-shadow: 10px 10px 5px 0px rgba(0,0,0,0.75);
    -moz-box-shadow: 10px 10px 5px 0px rgba(0,0,0,0.75);
    margin: 10px;
}

```

You can also change how most of the other fretboard elements look directly with CSS (which is how the astronomy theme mentioned above was accomplished). 

## Configuration Object

allNoteLetters: An array of strings which represent how the note letters are displayed. There must be 12 items in this array. The lowest item should represent the note at which the octave number is incremented. The default array is:

```
["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "Ab/G#", "A", "A#/Bb", "B"]
```

tuning: An array of note objects that represents the tuning, from high to low. Each note object has a "letter" and "octave" property. The default array represents Standard E Tuning:

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

isChordMode: A boolean which when true means that only one note can be clicked on a string at a time. It defaults to true. Set it to false when you want to allow the user to click scales onto the fretboard. Technically what happens is a "clicked" CSS class gets added to a clicked note and that CSS class is removed from all other notes on that string. The default CSS sets a background color on the clicked note.

noteClickingDisabled: If this is true a user cannot click a note. This might be useful if you are taking information about the fretboard and sending it to the server and you don't want someone to be able to click during that time (kind of like disabling a form's inputs while the form is being submitted). The user can still hover over notes to see their letters (upon hovering a "hover" CSS class is added to the note, and the default CSS animates its opacity). TODO - a disabled CSS class should be added somewhere in the HTML when this is true so it can be reacted to in CSS (perhaps don't allow showing of the notes on hover either).

dimensionsFunc: The default function will make the ".fretboard-body" element grow via animation to meet the width and height of its container, which is the ".fretboard-container" element. Technically, this means you can simply set the ".fretboard-container" height/width in CSS, and that will often be sufficient for responsive behavior. But you can supply your own dimensionsFunc function if you want the height/width of the fretboard body to be a complex function of perhaps the number of strings, frets, etc.

Here is an example dimensionsFunc override. You are passed the ".fretboard-container" and ".fretboard-body" as jQuery objects. You then return an object with height and/or width properties:

```
function($fretboardContainer, $fretboardBody) {
    // "this" will be the configuration object into which we place this function
    var options = this,
        numStrings = options.tuning.length;
        
    return {
        height: numStrings * 32
        // Return a width property too if you want
    };
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


#API
You can interact with the fretboard via the API.

Initialize and get the fretboard instance:

```
$(".my-fretboard-js").fretboard({
    // Configuration properties
});

var fretboardInstance = $(".my-fretboard-js").data('fretboard');
```

Set chord mode (true to allow clicking of chords, false for scales)

```
var isChordMode = false;

fretboardInstance.setChordMode(isChordMode);
```
        
Trigger note clicks. Here is an example of programatically clicking a Cmaj7 chord onto the fretboard:

```
var clickedNotes = [{
        stringItsOn: {
            letter: "E",
            octave: 4
        },
        fretNumber: 3
    },{
        stringItsOn: {
            letter: "B",
            octave: 3
        },
        fretNumber: 5
    }, {
        stringItsOn: {
            letter: "G",
            octave: 3
        },
        fretNumber: 4
    }, {
        stringItsOn: {
            letter: "D",
            octave: 3
        },
        fretNumber: 5
    }, {
        stringItsOn: {
            letter: "A",
            octave: 2
        },
        fretNumber: 3
    }];
        
fretboardInstance.setClickedNotes(clickedNotes);
```

Get all notes that were clicked by the user or set programatically:

```
var clickedNotes = fretboardInstance.getClickedNotes();
```

You may want to call this whenever a "notesClicked" event is triggered, to stay updated with what the user is doing.

```
$(".my-fretboard-js").on("notesClicked", function() {
    var clickedNotes = fretboardInstance.getClickedNotes();
});
```

Disable/enable note clicking:

```
var isDisabled = true;

fretboardInstance.setNoteClickingDisabled(isDisabled);
```

Change the tuning by passing in a new tuning array. For example, to change to Drop D:

``` 
var tuning = [{
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
        letter: "D",
        octave: 2
    }];
    
fretboardInstance.setTuning(tuning);
```    
    
Change the number of frets: 

``` 
var numFrets = 15;

fretboardInstance.setNumFrets(numFrets);
``` 

Unclick all of the clicked notes:

``` 
fretboardInstance.clearClickedNotes();
```

# AngularJS Responsive Fretboard Directive
This directive provides two-way data-binding between options on the configuration object and the fretboard. You place the configuration object on your scope and pass it into the directive. Then when you change the "tuning" array, "clickedNotes" array, numFrets property etc., the fretboard UI will change. Also, when users interact with the fretboard your "clickedNotes" array will automatically be updated. 

(More details to come). See the angular-directive folder for an example of its use.

