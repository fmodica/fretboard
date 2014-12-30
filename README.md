# Responsive Fretboard

(In progress) A jQuery plugin for displaying a responsive, interactive, and configurable fretboard of any number of frets, strings, and tunings. I am also working on an AngularJS directive to wrap this (see below).

First load the fretboard.js file into a script tag. Also load the styles.css file. 

Then initialize on your element:

```
$(".my-fretboard-js").fretboard();
```

This is enough to create the default fretboard. 

The majority of the fretboard's HTML elements (which represent strings, frets, notes, etc.) are absolutely positioned and animated in JavaScript. You can still configure quite a bit, however. 

The fretboard itself has a CSS class of "fretboard-body" and you can set things like its background (maybe use a cool image!), border, box-shadow etc. However, if you want to set its height or width you must do so on its parent element, which has a CSS class of "fretboard-container". 

```
/* Set height and width here. The ".fretboard-body" element
   will expand to fill this space. */
.fretboard-container {
    overflow: hidden;
    width: 100%;
    height: 240px;
    /* At a certain point it doesn't make sense for the fretboard
       size to decrease, so we set a min-width. A scroll-bar will 
       be displayed.
    min-width: 700px; */
    margin: 0 auto;
}

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

This is done so that the height/width of the fretboard-container can be queried when the window is resized or strings/frets are added, and the fretboard-body can be animated into that container, filling the space by default. Thus you can make this responsive by changing the height/width of ".fretboard-container" using media queries.

```
@media (max-width: 1000px) {
    .fretboard-container {
        /* New height/width */
    }
}
```

If you want the height/width of the fretboard-body to be determined by a more complex function (perhaps based on the number of strings, frets, browser width, etc.) you can supply that function in the configuration object discussed below.

### Configuration Object

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


isChordMode: A boolean which when true means that only one note can be clicked on a string at a time. It defaults to true. Technically what happens is a "clicked" CSS class gets added to a clicked note and that CSS class is removed from all other notes on that string. The default CSS sets a background color on the clicked note. Set it to false to allow clicking of scales onto the fretboard. 


noteClickingDisabled: If this is true a user cannot click a note. This might be useful if you are taking information about the fretboard and sending it to the server and you don't want someone to be able to click during that time (kind of like disabling a form's inputs while the form is being submitted). The user can still hover over notes to see their letters (upon hovering a "hover" CSS class is added to the note, and the default CSS animates its opacity). TODO - a disabled CSS class should be added somewhere in the HTML when this is true so it can be reacted to in CSS (perhaps don't allow showing of the notes on hover either).


dimensionsFunc: This function allows you to return an object with "height" and/or "width" properties which will determine the height/width of the fretboard-body if the default behavior (filling the space of the fretboard-container element) is not sufficient. This function will be passed the fretboard-body and fretboard-container as jQuery objects. If your return object has a width property, remove the width from the fretboard-container in your CSS. I like to return an object with only a height property (as shown below), which is based on the number of strings on the fretboard. I keep the width defined in fretboard-container CSS, since it's usually less complex to define. 


```
function($fretboardContainer, $fretboardBody) {
    // "this" will be the options object into which we place this function
    var options = this,
        numStrings = options.tuning.length;
        
    return {
        height: numStrings * 32
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
This directive provides two-way data-binding between options on the configuration object and the fretboard. (More details to come). See the angular-directive folder for an example of its use.

