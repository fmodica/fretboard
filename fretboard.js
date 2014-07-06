// The jQuery plugin
(function ($) {
    "use strict";

    $.fn.fretboard = function (options) {
        // The plugin will be called like this:
        // $('#container').fretboard({ ... {);
        // Iterate over each element in the jQuery 
        // collection, initializing a fretboard.   
        return this.each(function () {
            var element = $(this);

            // Return early if this element already has a plugin instance.
            // Otherwise, place a fretboard object on the element's data
            if (element.data('fretboard')) return;

            var fretboard = new Fretboard(element, options);

            element.data('fretboard', fretboard);
        });
    };
})(jQuery);

(function ($) {
    // Make this object available on the global scope
    Fretboard = function ($fretboardContainer, settings) {
        var self = this; // the fretboard object

        var ALL_NOTE_LETTERS = ["G#/Ab", "A", "A#/Bb", "B", "C", "Db/C#", "D", "Eb/D#", "E", "F", "Gb/F#", "G"];
        // The values in this object are used in note arithmetic and must also map correct to the ALL_NOTE_LETTERS array for validation purposes.
        // Example: Db/C# is value 5, and is at index 5 of ALL_NOTE_LETTERS
        var NOTE_LETTER_VALUE_MAP = {
            "Ab": 0,
            "G#": 0,
            "G#/Ab": 0,
            "A": 1,
            "A#": 2,
            "Bb": 2,
            "A#/Bb": 2,
            "B": 3,
            "C": 4,
            "Db": 5,
            "C#": 5,
            "Db/C#": 5,
            "D": 6,
            "Eb": 7,
            "D#": 7,
            "Eb/D#": 7,
            "E": 8,
            "F": 9,
            "Gb": 10,
            "F#": 10,
            "Gb/F#": 10,
            "G": 11
        };

        // Default config settings
        var config = {
            // x and y location of the upper left of the fretboard (the tuning squares will be further to the left)
            fretboardOrigin: [80, 15],
            numFrets: 15,
            fretWidth: 67, // (px) 
            fretHeight: 31, // (px)  
            // Default strings (note letters), from high to low.
            guitarStringNotes: [
				{
				    "noteLetter": "E",
				    "noteOctave": 5
				}, {
				    "noteLetter": "B",
				    "noteOctave": 5
				}, {
				    "noteLetter": "G",
				    "noteOctave": 4
				}, {
				    "noteLetter": "D",
				    "noteOctave": 4
				}, {
				    "noteLetter": "A",
				    "noteOctave": 4
				}, {
				    "noteLetter": "E",
				    "noteOctave": 3
				},
            ],
            clickedNoteColor: 'green',
            placedNoteColor: 'red',
            placedNoteColorOverlap: 'darkred',
            tuningTriangleColor: 'green',
            fretsToDrawOneCircleOn: [3, 5, 7, 9, 12], // Will do octaves of these numbers as well 
            opacityAnimateSpeed: 125,
            fretboardColor: 'tan',
            stringColor: 'black'
        };

        // Config options will be copied to these private variables
        var extendedConfig,
			fretboardOrigin,
			numFrets,
			fretWidth,
			fretHeight,
			guitarStringNotes,
			clickedNoteColor,
			placedNoteColor,
			fretboardColor,
			stringColor,
			placedNoteColorOverlap,
			tuningTriangleColor,
			fretsToDrawOneCircleOn,
			opacityAnimateSpeed,
			letterFontSize,
			noteCircRad,
			noteTuningSquareWidth,
			numStrings,
			// Will hold the squares (Raphael objects) that show the each string's note letter
			tuningSquares,
			// A 2-d array that holds each Raphael group that contains both the circle and text for each note                           
			allRaphaelNotes,
			svgWidth,
			svgHeight,
			svgHeightBuffer,
			svgWidthBuffer,
			$svg,
			$window,
			paper,
			disabled,
			// This holds the fret numbers that are clicked, from high to low.
			// Example for a maj7 fingering in Standard E tuning:
			// [3, 5, 4, null, 3, null] .
			// If allowing multiple notes per string (not implemented yet) this could be an array of arrays
			notesClickedTracker,
			// Same as above, but for notes placed on the fretboard programatically (instead of clicked)
			notesPlacedTracker;

        // This function initializes all private variables and can be called
        // internally if a fretboard redraw is necessary, such as when adding/removing 
        // strings. It would be faster to just draw or remove the strings in question,
        // but for now that is not implemented.
        function init() {
            notesClickedTracker = [];
            notesPlacedTracker = [];
            extendedConfig = {};

            // Extend default config settings.
            // Preserve the original objects (extend/copy properties into a new object).
            if (settings) {
                $.extend(extendedConfig, config, settings);
            }

            // copy config options to fretboard private variables
            fretboardOrigin = extendedConfig.fretboardOrigin;
            numFrets = extendedConfig.numFrets;
            fretWidth = extendedConfig.fretWidth;
            fretHeight = extendedConfig.fretHeight / 1.1;
            guitarStringNotes = extendedConfig.guitarStringNotes;
            numStrings = guitarStringNotes.length;
            tuningSquares = []; // will hold the squares that show the each string's note letter
            allRaphaelNotes = new Array(numStrings); // a 2-d array that holds each group (circle and text) for each string
            clickedNoteColor = extendedConfig.clickedNoteColor;
            placedNoteColor = extendedConfig.placedNoteColor;
            fretboardColor = extendedConfig.fretboardColor;
            stringColor = extendedConfig.stringColor;
            placedNoteColorOverlap = extendedConfig.placedNoteColorOverlap;
            tuningTriangleColor = extendedConfig.tuningTriangleColor;
            fretsToDrawOneCircleOn = extendedConfig.fretsToDrawOneCircleOn;
            opacityAnimateSpeed = extendedConfig.opacityAnimateSpeed;
            letterFontSize = extendedConfig.fretHeight / 4;
            noteCircRad = extendedConfig.fretHeight / 2.5;
            noteTuningSquareWidth = extendedConfig.fretHeight / 1.35;
            svgWidth = 0;
            svgHeight = 0;
            svgHeightBuffer = 5;
            svgWidthBuffer = 0;
            $svg = null;
            $window = $(window);

            console.log("Fretboard init called");

            // If this function is being called to add/remove strings, 
            // remove the Raphael paper object as a new one is about to
            // be created.
            if (paper) {
                paper.remove();
            }

            // create paper object (requires Raphael.js)
            paper = new Raphael($fretboardContainer.attr('id'), '100%', '100%');

            for (var i = 0; i < numStrings; i++) {
                // Probably don't need to call Array, but it works for now
                allRaphaelNotes[i] = new Array(numFrets);
            }

            validateGuitarStringNotes();

            drawAndWireUpFretboard();
        }

        function drawAndWireUpFretboard() {
            var topFretExtended, bottomFretExtended, stringXBegin, stringXEnd, stringY, i, j, x, y,
				circX, circY, circ, stringLetter, noteLetter, stringOctave, noteOctave, text, group,
				squareWidth, squareX, squareY, square, midX, midY, topX, topY, bottomX, bottomY,
				squareNoteText, squareOctaveText, squareOctaveTextX, squareOctaveTextY;

            // For drawing things that extend above or below the top/bottom string, 
            // like the left vertical part of the fret or the guitar body
            topFretExtended = fretboardOrigin[1] - (1 / 4 * fretHeight);
            bottomFretExtended = fretboardOrigin[1] + ((numStrings - 1) * fretHeight) + (1 / 4 * fretHeight);

            // For the instrument's strings
            stringXBegin = fretboardOrigin[0] + (fretWidth * (1 / 5));
            stringXEnd = fretboardOrigin[0] + (fretWidth * (numFrets)) + (1 * fretWidth); // (1/2 * fretWidth)

            // Draw the rectangle that represents the guitar body 
            paper.rect(stringXBegin, topFretExtended, stringXEnd - stringXBegin, bottomFretExtended - topFretExtended).attr({
                "fill": fretboardColor,
                'stroke-opacity': 0
            });

            // Add frets and circles for note letters, attach data to the frets, and other things
            for (i = 0; i < numStrings; i++) {
                notesClickedTracker[i] = null;
                notesPlacedTracker[i] = null;

                stringY = fretboardOrigin[1] + (i * fretHeight);

                paper.path("M" + stringXBegin + "," + stringY + "L" + stringXEnd + "," + stringY + "z").attr("stroke", stringColor);

                for (j = 0; j < numFrets + 1; j++) {

                    // Coordinates for the left of the fret and string
                    x = fretboardOrigin[0] + j * (fretWidth);
                    y = fretboardOrigin[1] + i * (fretHeight);

                    // Coordinates for the center of the fret and string
                    circX = x + fretWidth * (1 / 2);
                    circY = y;

                    if (j > 0) {
                        // Draw the left vertical line (left edge of the fret)
                        paper.path("M" + x + "," + topFretExtended + "L" + x + "," + bottomFretExtended + "z").attr("stroke", stringColor);

                        // If it's the last fret, close it on the right
                        //if (j === numFrets) {
                        //    var lineRight = paper.path("M" + (x + fretWidth) + "," + topFretExtended + 
                        // "L" + (x + fretWidth) + "," + bottomFretExtended + "z").attr("stroke", 'black');
                        //}

                        if (j === 1) {
                            // Draw a rectangle at the left of the first fret, which represents the nut
                            paper.rect(x - (fretWidth / 5), topFretExtended, (fretWidth / 5), bottomFretExtended - topFretExtended).attr({ fill: stringColor, stroke: stringColor });
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
                    circ = paper.circle(circX, circY, noteCircRad).attr("fill", "white");

                    stringLetter = guitarStringNotes[i].noteLetter;
                    noteLetter = getNoteLetterByFretNumber(stringLetter, j);
                    stringOctave = guitarStringNotes[i].noteOctave;
                    noteOctave = getNoteOctaveByFretNumber(stringOctave, stringLetter, j);

                    text = paper.text(circX, circY, noteLetter).attr("font-size", letterFontSize);

                    // Don't let the note text be selectable because that's annoying and ugly
                    makeTextUnselectable(text);

                    // Create a group to hold the circle and its text
                    group = paper.set();

                    // Assign it a unique id
                    group.id = "group" + "_string_" + i + "_fret_" + j;
                    group.stringNumber = i;
                    group.stringLetter = stringLetter;
                    group.stringOctave = stringOctave;
                    group.fretNumber = j;
                    group.noteLetter = noteLetter;
                    group.noteOctave = noteOctave;

                    // When you click on a note, it could be either the circle or the text. 
                    // So for both cases, store a pointer to the group, which event handlers
                    // will use to then retrieve the circle and text together.
                    circ.data({
                        group: group
                    });
                    text.data({
                        group: group
                    });

                    group.push(circ, text);

                    bindEventHandlersToNote(group);
                    makeNoteInvisibleImmediate(group);

                    group.toFront();

                    // Store it for tracking
                    allRaphaelNotes[i][j] = group;
                }
            }

            // Add the squares and triangles which will show/control the string tunings
            for (var i = 0; i < numStrings; i++) {
                x = fretboardOrigin[0] - (fretWidth * (1 / 2));
                y = fretboardOrigin[1] + i * (fretHeight);

                squareWidth = noteTuningSquareWidth;
                squareX = x - (squareWidth);
                squareY = y - (squareWidth / 2)
                square = paper.rect(squareX, squareY, squareWidth, squareWidth).attr("fill", "white");
                squareNoteText = paper.text(squareX + squareWidth / 2, squareY + squareWidth / 2, guitarStringNotes[i].noteLetter).attr("font-size", letterFontSize);

                // Show the octave near the note on the tuning square
                squareOctaveTextX = squareX + (.80 * squareWidth);
                squareOctaveTextY = squareY + (.20 * squareWidth);
                squareOctaveText = paper.text(squareOctaveTextX, squareOctaveTextY, allRaphaelNotes[i][0].stringOctave).attr("font-size", letterFontSize);

                squareNoteText.data({
                    x: squareOctaveTextX,
                    y: squareOctaveTextY,
                    octaveText: squareOctaveText
                });

                makeTextUnselectable(squareNoteText);
                makeTextUnselectable(squareOctaveText);

                tuningSquares[i] = squareNoteText;

                // Triangles for changing the string tunings
                midX = squareX + squareWidth + 25;
                midY = squareY + squareWidth / 2;
                topX = squareX + squareWidth + 10;
                topY = midY - squareWidth / 2;
                bottomX = topX;
                bottomY = midY + squareWidth / 2;

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
        } // drawAndWireUpFretboard method

        //self.disable = function () {
        //    $svg.css('z-index', -1000);
        //};

        //self.enable = function () {
        //    $svg.css('z-index', 1);
        //}

        self.disable = function () {
            disabled = true;
        }

        self.enable = function () {
            disabled = false;
        }

        self.clearClickedNotes = function () {
			var i, fret, group, circ, color;
			
            for (i = 0; i < numStrings; i++) {
                fret = notesClickedTracker[i];

                if (fret !== null) {
                    group = allRaphaelNotes[i][notesClickedTracker[i]];
                    circ = group[0];

                    // This clicked note could also be a placed note. In that case, 
                    // it should not be made invisible. Just give it the correct color.
                    if (fret === notesPlacedTracker[i]) {
                        color = placedNoteColor;
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
                    var group = allRaphaelNotes[i][notesClickedTracker[i]];

                    var musicalNote = {
                        noteLetter: group.noteLetter,
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
                    var group = allRaphaelNotes[i][notesPlacedTracker[i]];

                    var musicalNote = {
                        noteLetter: group.noteLetter,
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

        function validateGuitarStringNotes() {
            for (var i = 0; i < guitarStringNotes.length; i++) {
                guitarStringNotes[i].noteLetter = validateNoteLetter(guitarStringNotes[i].noteLetter);
            }
        }
		
        // This inspects a note letter and returns the representation that
        // will be used in this code
        function validateNoteLetter(noteLetter) {
            var notes = noteLetter.split("/");

            // Make sure it's a valid note by checking to see if it has a numeric value
            for (var i = 0; i < notes.length; i++) {
                var noteVal = NOTE_LETTER_VALUE_MAP[notes[i]];
                if (!isNaN(noteVal)) {
                    return ALL_NOTE_LETTERS[noteVal];
                }
            }

            throwNoteLetterError(noteLetter);
        }

        function throwNoteLetterError(noteLetter) {
            throw noteLetter + " is not a valid note. All valid notes are defined in the following array: " + ALL_NOTE_LETTERS;
        }

        function validateStringNum(stringNum) {
            if (!isNaN(stringNum) && stringNum <= guitarStringNotes.length - 1) {
                return stringNum;
            }

            throwStringNumError(stringNum);
        }

        function throwStringNumError(stringNum) {
            throw stringNum + " is not a valid string number. There are " + guitarStringNotes.length + " strings. ";
        }

        function validateFretNum(fretNum) {
            if (!isNaN(fretNum) && fretNum <= numFrets) {
                return fretNum;
            }
        }

        function throwFretNumError(fretNum) {
            throw fretNum + " is not a valid fret number. There are " + numFrets + " frets.";
        }

        // To be used internally
        function setClickedNoteByStringNoteAndFretNum(stringLetter, stringOctave, fretNumber, params) {
            var stringNoteInput = { noteLetter: stringLetter, noteOctave: stringOctave };

            for (var i = 0; i < guitarStringNotes.length; i++) {
                // Find the note, and click it if it's not clicked (otherwise it will disappear)
                if (getNoteUniqueValue(guitarStringNotes[i]) === getNoteUniqueValue(stringNoteInput) && !notesClickedTracker[i]) {
                    var group = allRaphaelNotes[i][fretNumber];
                    var circ = group[0];
                    circ.trigger("click", circ, params);
                }
            }
        }

        // to be used externally as API function
        self.setClickedNoteByStringNoteAndFretNum = function (stringLetter, stringOctave, fretNumber, immediate) {
            setClickedNoteByStringNoteAndFretNum(validateNoteLetter(stringLetter), stringOctave, validateFretNum(fretNumber), {
                immediate: immediate,
                wasCalledProgramatically: true
            });
        }

        // Let this take a note as input instead of stringLetter and stringOctave
        function placeNoteOnFretboardByStringNoteAndFretNum(stringLetter, stringOctave, fretNumber, params) {
            var stringNoteInput = { noteLetter: stringLetter, noteOctave: stringOctave };

            for (var i = 0; i < guitarStringNotes.length; i++) {
                if (getNoteUniqueValue(guitarStringNotes[i]) === getNoteUniqueValue(stringNoteInput)) {
                    var group = allRaphaelNotes[i][fretNumber];
                    placeNote(group, i, fretNumber, params);
                }
            }
        }

        // Let this take a note as input instead of stringLetter and stringOctave
        self.placeNoteOnFretboardByStringNoteAndFretNum = function (stringLetter, stringOctave, fretNumber, immediate) {
            placeNoteOnFretboardByStringNoteAndFretNum(validateNoteLetter(stringLetter), stringOctave, validateFretNum(fretNumber), {
                immediate: immediate,
                wasCalledProgramatically: true
            });
        }

        function placeNote(group, stringNumber, fretNumber, params) {
            var wasCalledProgramatically = params && params.wasCalledProgramatically;
            var immediatelyVisible = params && params.immediate;

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

            if (immediatelyVisible) {
                makeNoteVisibleImmediate(group, color);
            } else {
                makeNoteVisibleAnimated(group, color);
            }

            group.unhover(noteMouseOver, noteMouseOut);;

            notesPlacedTracker[stringNumber] = fretNumber;

            //if (!params.wasCalledProgramatically) {
            $fretboardContainer.trigger("notePlaced");
            //}
        }

        self.clearPlacedNotes = function () {
            for (var i = 0; i < notesPlacedTracker.length; i++) {
                var fret = notesPlacedTracker[i];
                if (fret !== null) {
                    var group = allRaphaelNotes[i][fret];
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

                $fretboardContainer.trigger("tuningChanged");
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

                $fretboardContainer.trigger("tuningChanged");
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

                $fretboardContainer.trigger("tuningChanged");
            }
        }

        // could make this a public function that loops over a list of clicked/placed notes
        // and sets them

        function resetOldPlacedAndClickedNotes(oldPlacedNotes, oldClickedNotes) {
            var minStrings;
            if (oldPlacedNotes) {
                minStrings = Math.min(guitarStringNotes.length, oldPlacedNotes.length);

                for (var i = 0; i < minStrings; i++) {
                    var stringNum = i;
                    var fretNum = oldPlacedNotes[i];

                    // nulls are "valid" in oldPlacedNotes since it tracks every string
                    if (fretNum !== null) {
                        placeNoteOnFretboardByStringNoteAndFretNum(guitarStringNotes[stringNum].noteLetter, guitarStringNotes[stringNum].noteOctave, fretNum, {
                            immediate: true,
                            wasCalledProgramatically: true
                        });
                    }
                }
            }

            if (oldClickedNotes) {
                minStrings = Math.min(guitarStringNotes.length, oldClickedNotes.length);

                for (var i = 0; i < minStrings; i++) {
                    var stringNum = i;
                    var fretNum = oldClickedNotes[i];

                    // nulls are "valid" in oldPlacedNotes since it tracks every string
                    if (fretNum !== null) {
                        setClickedNoteByStringNoteAndFretNum(guitarStringNotes[stringNum].noteLetter, guitarStringNotes[stringNum].noteOctave, fretNum, {
                            immediate: true,
                            wasCalledProgramatically: true
                        });
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
            circ.animate({
                'fill-opacity': 1,
                'stroke-opacity': 1,
                'opacity': 1,
                'fill': circColor
            }, opacityAnimateSpeed);
            text.animateWith(circ, null, {
                'fill-opacity': 1,
                'stroke-opacity': 1,
                'opacity': 1
            }, opacityAnimateSpeed);
            group.attr('cursor', 'pointer');
        }

        function makeNoteVisibleImmediate(group, circColor) {
            var circ = group[0];
            var text = group[1];
            circ.attr({
                'fill-opacity': 1,
                'stroke-opacity': 1,
                'opacity': 1,
                'fill': circColor
            });
            text.attr({
                'fill-opacity': 1,
                'stroke-opacity': 1,
                'opacity': 1
            });
            group.attr('cursor', 'pointer');
        }

        function makeNoteInvisible(group) {
            group.animate({
                'fill-opacity': 0,
                'stroke-opacity': 0,
                'opacity': 0
            }, opacityAnimateSpeed);
        }

        function makeNoteInvisibleImmediate(group) {
            group.attr({
                'fill-opacity': 0,
                'stroke-opacity': 0,
                'opacity': 0
            });
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
            var wasCalledProgramatically = params && params.wasCalledProgramatically;

            if (disabled && !wasCalledProgramatically) {
                return false;
            }
            var immediatelyVisible = params && params.immediate;

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
            else if ((allRaphaelNotes[thisString][notesClickedTracker[thisString]]).id === group.id) {
                notesClickedTracker[thisString] = null;

                if (immediatelyVisible) {
                    makeNoteVisibleImmediate(group, '#FFF');
                } else {
                    makeNoteVisibleAnimated(group, '#FFF');
                }

                group.hover(noteMouseOver, noteMouseOut); // unbind functions 
            } else {
                // Take care of note that was already clicked
                var alreadyClickedGroup = allRaphaelNotes[thisString][notesClickedTracker[thisString]];
                makeNoteInvisible(alreadyClickedGroup);
                alreadyClickedGroup.hover(noteMouseOver, noteMouseOut);

                // Take care of new note
                makeNoteVisibleAnimated(group, clickedNoteColor);
                group.unhover(noteMouseOver, noteMouseOut); // unbind functions 
                notesClickedTracker[thisString] = thisFret;
            }

            //if (!wasCalledProgramatically) {
            $fretboardContainer.trigger("noteClicked")
            //}
        }

        function tuningTriangleClick() {
            if (disabled) {
                return false;
            }

            var triangle = this;

            var thisStringNumber = triangle.data("stringNumber");
            var direction = triangle.data("direction");
            var previousStringLetter = guitarStringNotes[thisStringNumber].noteLetter;

            //console.log("new notes");

            for (var i = 0; i <= numFrets; i++) {
                var group = allRaphaelNotes[thisStringNumber][i];
                var circ = group[0];
                var text = group[1];

                var previousNoteOctave = group.noteOctave;
                var newNoteLetter;
                var newNoteOctave;

                if (direction === "right") {
                    newNoteLetter = getNoteLetterByFretNumber(previousStringLetter, i + 1);
                    if (newNoteLetter === ALL_NOTE_LETTERS[0])
                        newNoteOctave = ++previousNoteOctave;
                    else
                        newNoteOctave = previousNoteOctave;
                } else {
                    newNoteLetter = getNoteLetterByFretNumber(previousStringLetter, i - 1);
                    if (newNoteLetter === ALL_NOTE_LETTERS[11])
                        newNoteOctave = --previousNoteOctave;
                    else
                        newNoteOctave = previousNoteOctave;
                }

                // Set the new string letter on the tuning square and array 
                if (i === 0) {
                    guitarStringNotes[thisStringNumber].noteLetter = newNoteLetter;
                    tuningSquares[thisStringNumber].attr("text", newNoteLetter).data("octaveText").attr("text", newNoteOctave);
                    guitarStringNotes[thisStringNumber].noteOctave = newNoteOctave;
                }



                text.attr("text", newNoteLetter); // change the text    

                group.noteLetter = newNoteLetter;
                group.noteOctave = newNoteOctave;

                //console.log(newNoteLetter + " " + newNoteOctave);
            }

            $fretboardContainer.trigger("tuningChanged");
        }

        function drawTuningTriangleAndBindEventHandlers(midX, midY, topX, topY, bottomX, bottomY, direction, stringNumber) {
            var tri = paper.path("M" + midX + "," + midY + "L" + topX + "," + topY + "L" + bottomX + "," + bottomY + "z");

            tri.attr("fill", tuningTriangleColor).attr("cursor", "pointer").data({
                "direction": direction,
                "stringNumber": stringNumber
            });

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

        function getNoteUniqueValue(note) {
            return NOTE_LETTER_VALUE_MAP[note.noteLetter] + (12 * note.noteOctave);
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

// This function allows us to call a "trigger" event on a Raphael element.
// It takes the name of the event to fire and the scope to fire it with
Raphael.el.trigger = function (str, scope, params) {
    scope = scope || this;
    for (var i = 0; i < this.events.length; i++) {
        if (this.events[i].name === str) {
            this.events[i].f.call(scope, params);
        }
    }
};
