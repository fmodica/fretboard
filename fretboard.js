Raphael.el.trigger = function (str, scope, params) { //takes the name of the event to fire and the scope to fire it with
    scope = scope || this;
    for (var i = 0; i < this.events.length; i++) {
        if (this.events[i].name === str) {
            this.events[i].f.call(scope, params);
        }
    }
};

(function ($) {
    // Make this object available on the global scope
    this.Fretboard = function ($fretboardContainer, settings) {
        // public
        var self = this; // the fretboard object

        var MAP_FROM_PROGRAM_FRIENDLY_SHARP_TO_VIEW_FRIENDLY_SHARP = { "Aflat": "Ab", "Bflat": "Bb", "Csharp": "C#", "Eflat": "Eb", "Fsharp": "F#" };
        var ALL_NOTE_LETTERS = ["Aflat", "A", "Bflat", "B", "C", "Csharp", "D", "Eflat", "E", "F", "Fsharp", "G"];
        var NOTE_LETTER_VALUE_MAP = { "Aflat": 0, "A": 1, "Bflat": 2, "B": 3, "C": 4, "Csharp": 5, "D": 6, "Eflat": 7, "E": 8, "F": 9, "Fsharp": 10, "G": 11 };
        var notesClickedTracker;                     // Holds the notes clicked. Access like: stringTracker[i][notesClickedTracker[i]] to get the Raphael group
        var notesPlacedTracker;                      // same as above, but for notes placed on the fretboard explicitly (instead of clicked)

        // Default config settings
        var config = {
            fretboardOrigin: [80, 15], // x and y location of the upper left of the fretboard
            numFrets: 15,
            fretWidth: 67,             // in pixels  
            fretHeight: 31,            // in pixels  
            guitarStringNotes: [       // default strings (note letters), from high to low.
                { "noteLetter": "E", "noteOctave": 5 },
                { "noteLetter": "B", "noteOctave": 5 },
                { "noteLetter": "G", "noteOctave": 4 },
                { "noteLetter": "D", "noteOctave": 4 },
                { "noteLetter": "A", "noteOctave": 4 },
                { "noteLetter": "E", "noteOctave": 3 },
            ],
            clickedNoteColor: 'green',
            placedNoteColor: 'red',
            placedNoteColorOverlap: 'darkred',
            tuningTriangleColor: 'green',
            fretsToDrawOneCircleOn: [3, 5, 7, 9, 12],   // Will do octaves of these numbers as well 
            opacityAnimateSpeed: 125
        };

        var extendedConfig;

        // Config options will be copied to these private variables
        var fretboardOrigin,
            numFrets,
            fretWidth,
            fretHeight,
            guitarStringNotes,
            clickedNoteColor,
            placedNoteColor,
            placedNoteColorOverlap,
            tuningTriangleColor,
            fretsToDrawOneCircleOn,
            opacityAnimateSpeed,
            letterFontSize,
            noteCircRad,
            noteTuningSquareWidth,
            numStrings,
            tuningSquares,                             // will hold the squares that show the each string's note letter
            stringTracker,          // a 2-d array that holds each group (circle and text) for each string
            svgWidth,
            svgHeight,
            svgHeightBuffer,
            svgWidthBuffer,
            $svg,
            $window,
            paper;

        function init() {
            notesClickedTracker = [];
            notesPlacedTracker = [];
            extendedConfig = {};

            // Extend default config settings.
            // Preserve the original objects (extend/copy properties into a new object)
            if (settings) {
                $.extend(extendedConfig, config, settings);
            }

            // Config options that are calculated
            extendedConfig.letterFontSize = extendedConfig.fretHeight / 3.5;
            extendedConfig.noteCircRad = extendedConfig.fretHeight / 2.5;
            extendedConfig.noteTuningSquareWidth = extendedConfig.fretHeight / 1.5;

            // copy config options to fretboard private variables
            fretboardOrigin = extendedConfig.fretboardOrigin;
            numFrets = extendedConfig.numFrets;
            fretWidth = extendedConfig.fretWidth;
            fretHeight = extendedConfig.fretHeight;
            guitarStringNotes = extendedConfig.guitarStringNotes;
            clickedNoteColor = extendedConfig.clickedNoteColor;
            placedNoteColor = extendedConfig.placedNoteColor;
            placedNoteColorOverlap = extendedConfig.placedNoteColorOverlap;
            tuningTriangleColor = extendedConfig.tuningTriangleColor;
            fretsToDrawOneCircleOn = extendedConfig.fretsToDrawOneCircleOn;
            opacityAnimateSpeed = extendedConfig.opacityAnimateSpeed;
            letterFontSize = extendedConfig.letterFontSize;
            noteCircRad = extendedConfig.noteCircRad;
            noteTuningSquareWidth = extendedConfig.noteTuningSquareWidth;
            numStrings = guitarStringNotes.length;
            tuningSquares = [];                             // will hold the squares that show the each string's note letter
            stringTracker = new Array(numStrings);          // a 2-d array that holds each group (circle and text) for each string
            svgWidth = 0;
            svgHeight = 0;
            svgHeightBuffer = 5;
            svgWidthBuffer = 0;
            $svg = null;
            $window = $(window);

            console.log("jQuery init called");

            if (paper) {
                paper.remove();
            }
            // create paper object (requires Raphael.js)
            paper = new Raphael($fretboardContainer.attr('id'), '100%', '100%');

            for (var i = 0; i < numStrings; i++) {
                stringTracker[i] = new Array(numFrets);
            }

            setUpFretboard();
        }

        function setUpFretboard() {
            // For drawing things that extend above or below the top/bottom string, 
            // like the left vertical part of the fret or the guitar body
            var topFretExtended = fretboardOrigin[1] - (1 / 4 * fretHeight);
            var bottomFretExtended = fretboardOrigin[1] + ((numStrings - 1) * fretHeight) + (1 / 4 * fretHeight);

            // For the instrument's strings
            var stringXBegin = fretboardOrigin[0] + (fretWidth * (1 / 5));
            var stringXEnd = fretboardOrigin[0] + (fretWidth * (numFrets)) + (1 * fretWidth); // (1/2 * fretWidth)

            // Draw the rectangle that represents the guitar body 
            paper.rect(stringXBegin, topFretExtended, stringXEnd - stringXBegin, bottomFretExtended - topFretExtended).attr({ "fill": 'tan', 'stroke-opacity': 0 });

            // Add frets and circles for note letters, attach data to the frets, and other things
            for (var i = 0; i < numStrings; i++) {
                notesClickedTracker[i] = null; // initialize the array that tracks clicked frets on each string to null
                notesPlacedTracker[i] = null; // initialize the array that tracks placed frets on each string to null

                var stringY = fretboardOrigin[1] + (i * fretHeight);

                paper.path("M" + stringXBegin + "," + stringY + "L" + stringXEnd + "," + stringY + "z").attr("stroke", 'black');

                for (var j = 0; j < numFrets + 1; j++) {

                    // Coordinates for the left of the fret and string
                    var x = fretboardOrigin[0] + j * (fretWidth);
                    var y = fretboardOrigin[1] + i * (fretHeight);

                    // Coordinates for the center of the fret and string
                    var circX = x + fretWidth * (1 / 2);
                    var circY = y;

                    if (j > 0) {
                        // Draw the left vertical line (left edge of the fret)
                        paper.path("M" + x + "," + topFretExtended + "L" + x + "," + bottomFretExtended + "z").attr("stroke", 'black');

                        // If it's the last fret, close it on the right
                        //if (j === numFrets) {
                        //    var lineRight = paper.path("M" + (x + fretWidth) + "," + topFretExtended + 
                        // "L" + (x + fretWidth) + "," + bottomFretExtended + "z").attr("stroke", 'black');
                        //}

                        if (j === 1) {
                            // Draw a rectangle at the left of the first fret, which represents the nut
                            paper.rect(x - (fretWidth / 5), topFretExtended, (fretWidth / 5), bottomFretExtended - topFretExtended).attr("fill", 'black');
                        }

                        // Draw the circles you usually see on the 3rd, 5th, etc. fret (only do it once, so just
                        // choose i === 0)
                        if (i === 0) {
                            drawFretCircle(j, circX, circY, topFretExtended, bottomFretExtended);
                        }

                        if (j === numFrets) {
                            svgWidth = x + fretWidth + svgWidthBuffer;
                        }
                    }

                    // Draw note circle and note text, and attach data to them
                    var circ = paper.circle(circX, circY, noteCircRad).attr("fill", "white");

                    var stringLetter = guitarStringNotes[i].noteLetter;
                    var noteLetter = getNoteLetterByFretNumber(stringLetter, j);
                    var stringOctave = guitarStringNotes[i].noteOctave;
                    var noteOctave = getNoteOctaveByFretNumber(stringOctave, stringLetter, j);

                    var text = paper.text(circX, circY, MAP_FROM_PROGRAM_FRIENDLY_SHARP_TO_VIEW_FRIENDLY_SHARP[noteLetter] || noteLetter).attr("font-size", letterFontSize);

                    // Don't let the note text be selectable because that's annoying and ugly
                    makeTextUnselectable(text);

                    // Create a group to hold the circle and its text
                    var group = paper.set();

                    group.id = "group" + "_string_" + i + "_fret_" + j; // assign it a unique id
                    group.stringNumber = i;
                    group.stringLetter = stringLetter;
                    group.stringOctave = stringOctave;
                    group.fretNumber = j;
                    group.noteLetter = noteLetter;
                    group.noteOctave = noteOctave;

                    // When you click on a note, it could be either the circle or the text. 
                    // So for both cases, store a pointer to the group, which event handlers
                    // will use to then retrieve the circle and text together.
                    circ.data({ "group": group });
                    text.data({ "group": group });

                    group.push(circ, text);

                    bindEventHandlersToNote(group);
                    makeNoteInvisibleImmediate(group);

                    group.toFront();

                    // Store it for tracking
                    stringTracker[i][j] = group;
                }
            }

            // Add the squares and triangles which will show/control the string tunings
            for (var i = 0; i < numStrings; i++) {
                var x = fretboardOrigin[0] - (fretWidth * (1 / 2));
                var y = fretboardOrigin[1] + i * (fretHeight);

                var squareWidth = noteTuningSquareWidth;
                var squareX = x - (squareWidth);
                var squareY = y - (squareWidth / 2)
                var square = paper.rect(squareX, squareY, squareWidth, squareWidth).attr("fill", "white");

                var text = paper.text(squareX + squareWidth / 2, squareY + squareWidth / 2,
                    MAP_FROM_PROGRAM_FRIENDLY_SHARP_TO_VIEW_FRIENDLY_SHARP[guitarStringNotes[i].noteLetter] || guitarStringNotes[i].noteLetter)
                    .attr("font-size", letterFontSize);

                makeTextUnselectable(text);

                tuningSquares[i] = text;

                // Triangles for changing the string tunings
                var midX = squareX + squareWidth + 25;
                var midY = squareY + squareWidth / 2;
                var topX = squareX + squareWidth + 10;
                var topY = midY - squareWidth / 2;
                var bottomX = topX;
                var bottomY = midY + squareWidth / 2;

                drawTuningTriangleAndBindEventHandlers(midX, midY, topX, topY, bottomX, bottomY, "right", i);

                midX = squareX - 25;
                midY = squareY + squareWidth / 2;
                topX = squareX - 10;
                topY = midY - squareWidth / 2;
                bottomX = topX;
                bottomY = midY + squareWidth / 2;

                drawTuningTriangleAndBindEventHandlers(midX, midY, topX, topY, bottomX, bottomY, "left", i);

                if (i === numStrings - 1) {
                    svgHeight = squareY + squareWidth + svgHeightBuffer;
                }
            }

            $svg = $fretboardContainer.find("svg");

            $svg.css({
                height: svgHeight,
                width: svgWidth,
                "z-index": 1
            });

            $window.on("load resize", function () {
                setScrollBar($svg, $fretboardContainer);
            });

            setScrollBar($svg, $fretboardContainer);
        } // end of SetUpFretboard method

        self.disable = function () {
            $svg.css('z-index', -1000);
        };

        self.enable = function () {
            $svg.css('z-index', 1);
        }

        self.clearClickedNotes = function () {
            for (var i = 0; i < numStrings; i++) {
                var fret = notesClickedTracker[i];

                if (fret !== null) {
                    var group = stringTracker[i][notesClickedTracker[i]];
                    var circ = group[0];

                    // This clicked note could also be a placed note. In that case, 
                    // it should not be made invisible. Just give it the correct color.
                    if (fret === notesPlacedTracker[i]) {
                        var color = placedNoteColor;
                        makeNoteVisibleImmediate(group, color);
                    } else {
                        group.hover(noteMouseOver, noteMouseOut); // bind functions 
                        makeNoteInvisible(group);
                    }
                }

                notesClickedTracker[i] = null;
            }

            $fretboardContainer.trigger("notesCleared");
            //self.clearPlacedNotes();
        }

        self.getGuitarStringNotes = function () {
            return guitarStringNotes;
        }

        self.getClickedNotes = function () {
            var notes = [];

            for (var i = 0; i < guitarStringNotes.length; i++) {
                if (notesClickedTracker[i] !== null) {
                    var group = stringTracker[i][notesClickedTracker[i]];

                    var musicalNote = {
                        noteLetter: group.noteLetter, //NOTE_LETTER_VALUE_MAP[group.noteLetter],
                        noteOctave: group.noteOctave,
                        fretNumber: group.fretNumber,
                        stringNumber: group.stringNumber,
                        stringLetter: group.stringLetter,
                        stringOctave: group.stringOctave
                    }

                    notes.push(musicalNote);
                } else {
                    notes.push(null);
                }
            }

            return notes;
        }

        self.getPlacedNotes = function () {
            var notes = [];

            for (var i = 0; i < notesPlacedTracker.length; i++) {
                if (notesPlacedTracker[i] !== null) {
                    var group = stringTracker[i][notesPlacedTracker[i]];

                    var musicalNote = {
                        noteLetter: group.noteLetter, //NOTE_LETTER_VALUE_MAP[group.noteLetter],
                        noteOctave: group.noteOctave,
                        fretNumber: group.fretNumber,
                        stringNumber: group.stringNumber,
                        stringLetter: group.stringLetter,
                        stringOctave: group.stringOctave
                    }

                    notes.push(musicalNote);
                }
            }

            return notes;
        }

        // to be used internally
        function setClickedNoteByStringNoteAndFretNum(stringLetter, stringOctave, fretNumber, params) {
            for (var i = 0; i < guitarStringNotes.length; i++) {
                // Find the note, make sure it's not clicked, and click it
                if (guitarStringNotes[i].noteLetter === stringLetter && guitarStringNotes[i].noteOctave === stringOctave && !notesClickedTracker[i]) {
                    var group = stringTracker[i][fretNumber];
                    var circ = group[0];
                    circ.trigger("click", circ, params);
                }
            }
        }

        // to be used externally as API function
        self.setClickedNoteByStringNoteAndFretNum = function (stringLetter, stringOctave, fretNumber, immediate) {
            setClickedNoteByStringNoteAndFretNum(stringLetter, stringOctave, fretNumber, { immediate: immediate, wasSetInternally: false });
        }

        // to be used internally
        function setClickedNoteByStringNumAndFretNum(stringNum, fretNum, params) {
            var group = stringTracker[stringNum][fretNum];
            var circ = group[0];
            circ.trigger("click", circ, params);
        }

        // to be used externally as API function
        self.setClickedNoteByStringNumAndFretNum = function (stringNum, fretNum, immediate) {
            setClickedNoteByStringNumAndFretNum(stringNum, fretNum, { immediate: immediate, wasSetInternally: false });
        }

        function placeNoteOnFretboardByStringNoteAndFretNum(stringLetter, stringOctave, fretNumber, params) {
            // Loop over the instrument's strings, comparing note and octave to the string this note is on
            // to find a match. If a match is found, show the note.
            for (var i = 0; i < guitarStringNotes.length; i++) {
                if (guitarStringNotes[i].noteLetter === stringLetter && guitarStringNotes[i].noteOctave === stringOctave) {
                    //if (fretNumber >= 0 && fretNumber <= numFrets) {
                    var group = stringTracker[i][fretNumber];
                    placeNote(group, i, fretNumber, params);
                }
            }
        }

        self.placeNoteOnFretboardByStringNoteAndFretNum = function (stringLetter, stringOctave, fretNumber, immediate) {
            placeNoteOnFretboardByStringNoteAndFretNum(stringLetter, stringOctave, fretNumber, { immediate: immediate, wasSetInternally: false });
        }

        function placeNoteOnFretboardByStringNumAndFretNum(stringNumber, fretNumber, params) {
            var group = stringTracker[stringNumber][fretNumber];

            if (group) {
                placeNote(group, stringNumber, fretNumber, params);
            }
        }

        self.placeNoteOnFretboardByStringNumAndFretNum = function (stringNumber, fretNumber, immediate) {
            placeNoteOnFretboardByStringNumAndFretNum(stringNumber, fretNumber, { immediate: immediate, wasSetInternally: false });
        }

        function placeNote(group, stringNumber, fretNumber, params) {
            var circ = group[0];
            var text = group[1];

            var color;
            var opacity;

            if (notesClickedTracker[stringNumber] === fretNumber) {
                color = placedNoteColorOverlap;

                //color = placedNoteColor;
                opacity = 1;
            } else {
                color = placedNoteColor;
                opacity = 1;
            }

            if (params.immediate) {
                makeNoteVisibleImmediate(group, color);
            } else {
                makeNoteVisibleAnimated(group, color);
            }

            group.unhover(noteMouseOver, noteMouseOut);;

            notesPlacedTracker[stringNumber] = fretNumber;

            //if (!params.wasSetInternally) {
            $fretboardContainer.trigger("notePlaced");
            //}
        }

        self.clearPlacedNotes = function () {
            for (var i = 0; i < notesPlacedTracker.length; i++) {
                var fret = notesPlacedTracker[i];
                if (fret !== null) {
                    var group = stringTracker[i][fret];
                    var circ = group[0];
                    var text = group[1];

                    // This placed note could also be a clicked note. In that case, 
                    // it should not be made invisible. Just give it the correct color.

                    if (fret === notesClickedTracker[i]) {
                        var color = clickedNoteColor;
                        makeNoteVisibleImmediate(group, color);
                    } else {
                        makeNoteInvisible(group);
                        group.hover(noteMouseOver, noteMouseOut); // bind hover events
                    }
                }

                notesPlacedTracker[i] = null;
            }
        }

        self.addString = function (stringNote) {
            if (stringNote) {
                var oldPlacedNotes = notesPlacedTracker.slice(); // make a copy, minus the last
                var oldClickedNotes = notesClickedTracker.slice();

                settings.guitarStringNotes.push(stringNote);

                init();

                //notesPlacedTracker = oldPlacedNotes;
                //notesClickedTracker = oldClickedNotes;

                resetOldPlacedAndClickedNotes(oldPlacedNotes, oldClickedNotes);
                //$fretboardContainer.trigger("tuningChanged"); 
            }
        }

        self.removeString = function () {
            if (guitarStringNotes.length > 1) {
                var oldPlacedNotes = notesPlacedTracker.slice(); // make a copy
                var oldClickedNotes = notesClickedTracker.slice();

                settings.guitarStringNotes.pop();

                init();

                //notesPlacedTracker = oldPlacedNotes.pop(); // remove last note
                //notesClickedTracker = oldClickedNotes.pop();

                resetOldPlacedAndClickedNotes(oldPlacedNotes, oldClickedNotes);
                //$fretboardContainer.trigger("tuningChanged");
            }
        }

        self.setGuitarStringNotes = function (newGuitarStringNotes) {
            if (newGuitarStringNotes && newGuitarStringNotes.length > 0) {
                var newLength = settings.guitarStringNotes.length;

                var oldPlacedNotes = notesPlacedTracker.slice(0, newLength); // make a copy
                var oldClickedNotes = notesClickedTracker.slice(0, newLength);

                settings.guitarStringNotes = newGuitarStringNotes;

                init();

                //notesPlacedTracker = oldPlacedNotes;
                //notesClickedTracker = oldClickedNotes;

                resetOldPlacedAndClickedNotes(oldPlacedNotes, oldClickedNotes);
                //$fretboardContainer.trigger("tuningChanged");
            }
        }

        // could make this a public function that loops over a list of clicked/placed notes
        // and sets them
        function resetOldPlacedAndClickedNotes(oldPlacedNotes, oldClickedNotes) {
            if (oldPlacedNotes) {
                for (var i = 0; i < oldPlacedNotes.length; i++) {
                    var stringNum = i;
                    var fretNum = oldPlacedNotes[i];
                    if (stringNum != undefined && stringNum != null && stringNum <= guitarStringNotes.length - 1 &&
                        fretNum != undefined && fretNum != null && fretNum <= numFrets) {
                        placeNoteOnFretboardByStringNumAndFretNum(stringNum, fretNum, { immediate: true, wasSetInternally: true });
                    }
                }
            }

            if (oldClickedNotes) {
                for (var i = 0; i < oldClickedNotes.length; i++) {
                    var stringNum = i;
                    var fretNum = oldClickedNotes[i];
                    if (stringNum != undefined && stringNum != null && stringNum <= guitarStringNotes.length - 1 &&
                        fretNum != undefined && fretNum != null && fretNum <= numFrets) {
                        setClickedNoteByStringNumAndFretNum(stringNum, fretNum, { immediate: true, wasSetInternally: true });
                    }
                }
            }
        }

        function bindEventHandlersToNote(group) {
            group.click(noteClick); // bind click events
            group.hover(noteMouseOver, noteMouseOut); // bind hover events
        }

        function makeNoteVisibleAnimated(group, circColor) {
            var circ = group[0];
            var text = group[1];
            circ.animate({ 'fill-opacity': 1, 'stroke-opacity': 1, 'opacity': 1, 'fill': circColor }, opacityAnimateSpeed);
            text.animateWith(circ, null, { 'fill-opacity': 1, 'stroke-opacity': 1, 'opacity': 1 }, opacityAnimateSpeed);
            group.attr('cursor', 'pointer');
        }

        function makeNoteVisibleImmediate(group, circColor) {
            var circ = group[0];
            var text = group[1];
            circ.attr({ 'fill-opacity': 1, 'stroke-opacity': 1, 'opacity': 1, 'fill': circColor });
            text.attr({ 'fill-opacity': 1, 'stroke-opacity': 1, 'opacity': 1 });
            group.attr('cursor', 'pointer');
        }

        function makeNoteInvisible(group) {
            group.animate({ 'fill-opacity': 0, 'stroke-opacity': 0, 'opacity': 0 }, opacityAnimateSpeed);
        }

        function makeNoteInvisibleImmediate(group) {
            group.attr({ 'fill-opacity': 0, 'stroke-opacity': 0, 'opacity': 0 });
        }

        function bindEventHandlersToTuningTriangle(triangle) {
            triangle.click(tuningTriangleClick);
        }

        function drawFretCircle(fret, circX, circY, topFretExtended, bottomFretExtended) {
            for (var k = 0; k < fretsToDrawOneCircleOn.length; k++) {
                var num = fretsToDrawOneCircleOn[k];

                var matchOrMultiple = ((fret - num) % 12);

                if (matchOrMultiple === 0) {
                    paper.circle(circX, topFretExtended + ((bottomFretExtended - topFretExtended) / 2), noteCircRad / 3).attr("fill", "black");
                    break;
                }
            }
        }

        function makeTextUnselectable(text) {
            $(text.node).css({
                "-webkit-touch-callout": "none",
                "-webkit-user-select": "none",
            });
        }

        function noteMouseOver() {
            var group = this.data("group");
            makeNoteVisibleAnimated(group, '#FFF');
        }

        function noteMouseOut() {
            var group = this.data("group");
            makeNoteInvisible(group);
        }

        function noteClick(params) {
            var immediatelyVisible = params && params.immediate === true;
            var triggerClick = (params.wasSetInternally === undefined || params.wasSetInternally === true);

            var group = this.data("group");

            var circ = group[0];
            var text = group[1];
            var thisString = group.stringNumber;
            var thisFret = group.fretNumber;

            if (notesClickedTracker[thisString] === null) {
                notesClickedTracker[thisString] = thisFret;
                if (immediatelyVisible) {
                    makeNoteVisibleImmediate(group, clickedNoteColor);
                } else {
                    makeNoteVisibleAnimated(group, clickedNoteColor);
                }
                // bind functions which are attached to the circle but work for the group
                group.unhover(noteMouseOver, noteMouseOut);
            } // if the fret clicked was already clicked...
            else if ((stringTracker[thisString][notesClickedTracker[thisString]]).id === group.id) {
                notesClickedTracker[thisString] = null;

                if (immediatelyVisible) {
                    makeNoteVisibleImmediate(group, '#FFF');
                } else {
                    makeNoteVisibleAnimated(group, '#FFF');
                }

                group.hover(noteMouseOver, noteMouseOut); // unbind functions 
            }
            else {
                // Take care of note that was already clicked
                var alreadyClickedGroup = stringTracker[thisString][notesClickedTracker[thisString]];
                makeNoteInvisible(alreadyClickedGroup);
                alreadyClickedGroup.hover(noteMouseOver, noteMouseOut);

                // Take care of new note
                makeNoteVisibleAnimated(group, clickedNoteColor);
                group.unhover(noteMouseOver, noteMouseOut); // unbind functions 
                notesClickedTracker[thisString] = thisFret;
            }

            if (triggerClick) {
                $fretboardContainer.trigger("noteClicked")
            }
        }

        function tuningTriangleClick() {
            var triangle = this;

            var thisStringNumber = triangle.data("stringNumber");
            var direction = triangle.data("direction");
            var previousStringLetter = guitarStringNotes[thisStringNumber].noteLetter;

            //console.log("new notes");

            for (var i = 0; i <= numFrets; i++) {
                var group = stringTracker[thisStringNumber][i];
                var circ = group[0];
                var text = group[1];

                var previousNoteOctave = group.noteOctave;
                var newNoteLetter;
                var newNoteOctave;

                if (direction === "right") {
                    newNoteLetter = getNoteLetterByFretNumber(previousStringLetter, i + 1);
                    if (newNoteLetter === "Aflat")
                        newNoteOctave = ++previousNoteOctave;
                    else
                        newNoteOctave = previousNoteOctave;
                }
                else {
                    newNoteLetter = getNoteLetterByFretNumber(previousStringLetter, i - 1);
                    if (newNoteLetter === "G")
                        newNoteOctave = --previousNoteOctave;
                    else
                        newNoteOctave = previousNoteOctave;
                }

                // Set the new string letter on the tuning square and array 
                if (i === 0) {
                    guitarStringNotes[thisStringNumber].noteLetter = newNoteLetter;
                    tuningSquares[thisStringNumber].attr("text", MAP_FROM_PROGRAM_FRIENDLY_SHARP_TO_VIEW_FRIENDLY_SHARP[newNoteLetter] || newNoteLetter);
                    guitarStringNotes[thisStringNumber].noteOctave = newNoteOctave;
                }

                text.attr("text", MAP_FROM_PROGRAM_FRIENDLY_SHARP_TO_VIEW_FRIENDLY_SHARP[newNoteLetter] || newNoteLetter); // change the text

                group.noteLetter = newNoteLetter;
                group.noteOctave = newNoteOctave;

                //console.log(newNoteLetter + " " + newNoteOctave);
            }

            $fretboardContainer.trigger("tuningChanged");
        }

        function drawTuningTriangleAndBindEventHandlers(midX, midY, topX, topY, bottomX, bottomY, direction, stringNumber) {
            var tri = paper.path("M" + midX + "," + midY + "L" + topX + "," + topY + "L" + bottomX + "," + bottomY + "z");

            tri.attr("fill", tuningTriangleColor).attr("cursor", "pointer").data({ "direction": direction, "stringNumber": stringNumber });

            bindEventHandlersToTuningTriangle(tri)
        }

        function getNoteLetterByFretNumber(stringLetter, fretNumber) {
            var fretOffset = NOTE_LETTER_VALUE_MAP[stringLetter] + fretNumber;
            //var dividedByTwelve = fretOffset / 12;
            var numOctavesAboveString = Math.floor(fretOffset / 12);
            // reduce the index by the correct amount to get it below 12
            fretOffset = fretOffset - (12 * numOctavesAboveString);

            return ALL_NOTE_LETTERS[fretOffset];
        }

        function getNoteOctaveByFretNumber(stringOctave, stringLetter, fretNumber) {
            // The string letter has a value, which can be thought of as an amount
            // of notes above the note that begins an octave (Ab, whose value is 0).
            // Add the fret number to that.
            var fretOffset = NOTE_LETTER_VALUE_MAP[stringLetter] + fretNumber;
            // Now divide by 12 and floor it. That is the number of octaves this
            // fret is above the string.
            var numOctavesAboveString = Math.floor(fretOffset / 12);

            return stringOctave + numOctavesAboveString;
        }

        function setScrollBar($svg, $fretboardContainer) {
            var svgRightPosition = $svg.width() + $svg.position().left;
            var containerRightPosition = $fretboardContainer.width() + $fretboardContainer.position().left;

            if (svgRightPosition > containerRightPosition) {
                $fretboardContainer.css({
                    "overflow-x": "scroll"
                });
            } else {
                $fretboardContainer.css({
                    "overflow-x": "hidden"
                });
            }
        }

        init();
    };
})(jQuery);

(function ($) {
    "use strict";

    $.fn.fretboard = function (options) {
        return this.each(function () {
            var element = $(this);

            // Return early if this element already has a plugin instance
            if (element.data('fretboard')) return;
            //paper.canvas.setAttribute('preserveAspectRatio', 'none');

            // Pass options to plugin constructor
            var fretboard = new Fretboard(element, options);

            // Store plugin object in this element's data
            element.data('fretboard', fretboard);
        });
    };
})(jQuery);