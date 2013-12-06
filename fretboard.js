(function ($) {
    "use strict";
    var Fretboard = function ($fretboardContainer, paper, settings) {
        // public
        var self = this; // the fretboard object
        // private
        // To play sounds
        //var music = new BandJS();
        //music.setTimeSignature(4, 4);
        //music.setTempo(120);

        var ALL_NOTE_LETTERS = ["Ab", "A", "Bb", "B", "C", "C#", "D", "Eb", "E", "F", "F#", "G"];
        var NOTE_LETTER_VALUE_MAP = { "Ab": 0, "A": 1, "Bb": 2, "B": 3, "C": 4, "C#": 5, "D": 6, "Eb": 7, "E": 8, "F": 9, "F#": 10, "G": 11 };
        var notesClickedTracker = [];
        var notesPlacedTracker = [];                       // same as above, but for notes placed on the fretboard explicitly (instead of clicked)

        // Default config settings
        var config = {
            fretboardOrigin: [80, 15],                            // x and y location of the upper left of the fretboard
            numFrets: 15,                                         // in pixels                                    
            fretWidth: 67,                                        // in pixels  
            fretHeight: 31,                                       // in pixels  
            guitarStringNotes: [                                   // default strings (note letters), from high to low.
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
            fretsToDrawOneCircleOn: [3, 5, 7, 9, 12],
            opacityAnimateSpeed: 125
        };

        var extendedConfig = {};

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
        var fretboardOrigin = extendedConfig.fretboardOrigin,
            numFrets = extendedConfig.numFrets,
            fretWidth = extendedConfig.fretWidth,
            fretHeight = extendedConfig.fretHeight,
            guitarStringNotes = extendedConfig.guitarStringNotes,
            clickedNoteColor = extendedConfig.clickedNoteColor,
            placedNoteColor = extendedConfig.placedNoteColor,
            placedNoteColorOverlap = extendedConfig.placedNoteColorOverlap,
            tuningTriangleColor = extendedConfig.tuningTriangleColor,
            fretsToDrawOneCircleOn = extendedConfig.fretsToDrawOneCircleOn,
            opacityAnimateSpeed = extendedConfig.opacityAnimateSpeed,
            letterFontSize = extendedConfig.letterFontSize,
            noteCircRad = extendedConfig.noteCircRad,
            noteTuningSquareWidth = extendedConfig.noteTuningSquareWidth,
            numStrings = guitarStringNotes.length,
            tuningSquares = [],                             // will hold the squares that show the each string's note letter
            stringTracker = new Array(numStrings),          // a 2-d array that holds each group (circle and text) for each string
            svgWidth = 0,
            svgHeight = 0,
            svgBuffer = 0,
            $svg = null,
            $window = $(window);

        for (var i = 0; i < numStrings; i++) {
            // This will hold the fret number, null for not clicked, for each string
            stringTracker[i] = new Array(numFrets);
        }

        // public methods
        self.createResetButton = function (buttonId, buttonClass, buttonValue, elementOnWhichToAppend) {
            var buttonHtml = "<div class='reset-button-container'><input type='button' id='" + buttonId + "' class='" + buttonClass + "' value='" + buttonValue + "'/></div>";

            $('#' + elementOnWhichToAppend).append(buttonHtml);

            // If clicked, remove the clicked colored circles and bind hover events to those frets
            $('#' + buttonId).click(function () {
                self.reset();
            });
        }

        self.reset = function () {
            for (var i = 0; i < numStrings; i++) {
                if (notesClickedTracker[i] != null) {
                    var group = stringTracker[i][notesClickedTracker[i]];
                    var circ = group[0];

                    group.hover(noteMouseOver, noteMouseOut); // bind functions 
                    makeNoteInvisible(group);

                    notesClickedTracker[i] = null;
                }
            }

            self.clearPlacedNotes();
        }

        //self.createPlayButton = function (buttonId, buttonClass, buttonValue, elementOnWhichToAppend) {
        //    var buttonHtml = "<input type='button' id='" + buttonId + "' class='" + buttonClass + "' value='" + buttonValue + "'/>";

        //    $('#' + elementOnWhichToAppend).append(buttonHtml);

        //    $('#' + buttonId).click(function () {

        //        var instruments = [];
        //        var clickedNotes = self.getClickedNotes();
        //        for (var i = 0; i < clickedNotes.length; i++) {
        //            instruments.push(music.createInstrument());
        //        }

        //        for (var i = 0; i < instruments.length; i++) {
        //            instruments[i].note('quarter', 'C4');
        //            instruments[i].finish();
        //        }

        //        music.end();
        //        music.play();
        //    });
        //}

        self.getGuitarStringNotes = function () {
            return guitarStringNotes;
        }

        //self.setGuitarStringNotes = function (notes) {
        //    guitarStringNotes = notes;
        //}

        self.getClickedNotes = function () {
            var notes = [];
            for (var i = 0; i < guitarStringNotes.length; i++) {
                if (notesClickedTracker[i] !== null) {
                    var group = stringTracker[i][notesClickedTracker[i]];

                    var musicalNote = {
                        noteLetter: group.noteLetter, //NOTE_LETTER_VALUE_MAP[group.noteLetter],
                        octave: group.noteOctave
                    }

                    notes.push(musicalNote);
                }
            }

            return notes;
        }

        self.placeNoteOnFretboard = function (stringLetter, stringOctave, fretNumber) {
            // Loop over the instrument's strings, comparing note and octave to the string this note is on
            // to find a match. If a match is found, show the note.
            for (var i = 0; i < guitarStringNotes.length; i++) {
                if (guitarStringNotes[i].noteLetter === stringLetter && guitarStringNotes[i].noteOctave === stringOctave) {
                    //if (fretNumber >= 0 && fretNumber <= numFrets) {
                    var group = stringTracker[i][fretNumber];
                    var circ = group[0];
                    var text = group[1];

                    var color;
                    var opacity;

                    if (notesClickedTracker[i] === fretNumber) {
                        color = placedNoteColorOverlap;

                        //color = placedNoteColor;
                        opacity = 1;
                    } else {
                        color = placedNoteColor;
                        opacity = 1;
                    }

                    makeNoteVisible(group, color);

                    group.unhover(noteMouseOver, noteMouseOut);
                    //group.unclick(circ.data("click"));

                    notesPlacedTracker[i] = fretNumber;
                    //}
                }
            }
        }

        self.clearPlacedNotes = function () {
            for (var i = 0; i < notesPlacedTracker.length; i++) {
                var fret = notesPlacedTracker[i];
                if (fret != null) {
                    var group = stringTracker[i][fret];
                    var circ = group[0];
                    var text = group[1];

                    // This placed note could also be a clicked note. In that case, 
                    // it should not be made invisible. Just give it the correct color.

                    if (fret === notesClickedTracker[i]) {
                        var color = clickedNoteColor;
                        makeNoteVisible(group, color);
                    } else {
                        makeNoteInvisible(group);
                        group.hover(noteMouseOver, noteMouseOut); // bind hover events
                    }
                }

                notesPlacedTracker[i] = null;
            }
        }

        // private methods
        var bindEventHandlersToNote = function (group) {
            group.click(noteClick); // bind click events
            group.hover(noteMouseOver, noteMouseOut); // bind hover events
        }

        var makeNoteVisible = function (group, circColor) {
            var circ = group[0];
            var text = group[1];
            circ.animate({ 'fill-opacity': 1, 'stroke-opacity': 1, 'opacity': 1, 'fill': circColor }, opacityAnimateSpeed);
            text.animateWith(circ, null, { 'fill-opacity': 1, 'stroke-opacity': 1, 'opacity': 1 }, opacityAnimateSpeed);
            group.attr('cursor', 'pointer');
        }

        var makeNoteVisibleImmediate = function (group, circColor) {
            var circ = group[0];
            var text = group[1];
            circ.attr({ 'fill-opacity': 1, 'stroke-opacity': 1, 'opacity': 1, 'fill': circColor });
            text.attr({ 'fill-opacity': 1, 'stroke-opacity': 1, 'opacity': 1 });
            group.attr('cursor', 'pointer');
        }

        var makeNoteInvisible = function (group) {
            group.animate({ 'fill-opacity': 0, 'stroke-opacity': 0, 'opacity': 0 }, opacityAnimateSpeed);
        }

        var makeNoteInvisibleImmediate = function (group) {
            group.attr({ 'fill-opacity': 0, 'stroke-opacity': 0, 'opacity': 0 });
        }

        var bindEventHandlersToTuningTriangle = function (triangle) {
            triangle.click(tuningTriangleClick);
        }

        var drawFretCircle = function (fret, circX, circY, topFretExtended, bottomFretExtended) {
            for (var k = 0; k < fretsToDrawOneCircleOn.length; k++) {
                var num = fretsToDrawOneCircleOn[k];

                var matchOrMultiple = ((fret - num) % 12);

                if (matchOrMultiple === 0) {
                    paper.circle(circX, topFretExtended + ((bottomFretExtended - topFretExtended) / 2), noteCircRad / 3).attr("fill", "black");
                    break;
                }
            }
        }

        /*
        for (var k = 0; k < self.fretsToDrawTwoCirclesOn.length; k++) {
    
            var num = self.fretsToDrawTwoCirclesOn[k];
    
            var matchOrMultiple = ((j - num) % 12);
    
            if (matchOrMultiple === 0) {
                paper.circle(circX, topFretExtended + ((1 * (bottomFretExtended - topFretExtended)) / 3), noteCircRad / 3).attr("fill", "black");
                paper.circle(circX, topFretExtended + ((2 * (bottomFretExtended - topFretExtended)) / 3), noteCircRad / 3).attr("fill", "black");
                break;
            }
        }*/

        var makeTextUnselectable = function (text) {
            $(text.node).css({
                "-webkit-touch-callout": "none",
                "-webkit-user-select": "none",
            });
        }

        var noteMouseOver = function () {
            var group = this.data("group");
            makeNoteVisible(group, '#FFF');
            //console.log("mouseover called");
        }

        var noteMouseOut = function () {
            var group = this.data("group");
            makeNoteInvisible(group);
            //console.log("mouseout called \n\n");
        }

        var noteClick = function () {
            var group = this.data("group");

            var circ = group[0];
            var text = group[1];
            var thisString = group.stringNumber;
            var thisFret = group.fretNumber;

            if (notesClickedTracker[thisString] === null) {
                notesClickedTracker[thisString] = thisFret;
                makeNoteVisible(group, clickedNoteColor);
                // bind functions which are attached to the circle but work for the group
                group.unhover(noteMouseOver, noteMouseOut);
            } // if the fret clicked was already clicked...
            else if ((stringTracker[thisString][notesClickedTracker[thisString]]).id === group.id) {
                notesClickedTracker[thisString] = null;
                makeNoteVisible(group, '#FFF');
                group.hover(noteMouseOver, noteMouseOut); // unbind functions 
            }
            else {
                // Take care of note that was already clicked
                var alreadyClickedGroup = stringTracker[thisString][notesClickedTracker[thisString]];
                makeNoteInvisible(alreadyClickedGroup);
                alreadyClickedGroup.hover(noteMouseOver, noteMouseOut);

                // Take care of new note
                makeNoteVisible(group, clickedNoteColor);
                group.unhover(noteMouseOver, noteMouseOut); // unbind functions 
                notesClickedTracker[thisString] = thisFret;
            }

            self.clearPlacedNotes();

            $fretboardContainer.trigger("noteClicked");
        }

        var tuningTriangleClick = function () {
            var triangle = this;
            var fretboard = triangle.fretboard;

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
                    if (newNoteLetter === "Ab")
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
                    tuningSquares[thisStringNumber].attr("text", newNoteLetter);
                    guitarStringNotes[thisStringNumber].noteOctave = newNoteOctave;
                }

                text.attr("text", newNoteLetter); // change the text

                group.noteLetter = newNoteLetter;
                group.noteOctave = newNoteOctave;

                //console.log(newNoteLetter + " " + newNoteOctave);
            }

            $fretboardContainer.trigger("tuningChanged");
        }

        var drawTuningTriangleAndBindEventHandlers = function (midX, midY, topX, topY, bottomX, bottomY, id, direction, stringNumber) {
            var tri = paper.path("M" + midX + "," + midY + "L" + topX + "," + topY + "L" + bottomX + "," + bottomY + "z");

            tri.id = id;
            tri.fretboard = self;
            tri.attr("fill", tuningTriangleColor).attr("cursor", "pointer").data({ "direction": direction, "stringNumber": stringNumber });

            bindEventHandlersToTuningTriangle(tri)
        }

        var getNoteLetterByFretNumber = function (stringLetter, fretNumber) {
            var fretOffset = NOTE_LETTER_VALUE_MAP[stringLetter] + fretNumber;
            //var dividedByTwelve = fretOffset / 12;
            var numOctavesAboveString = Math.floor(fretOffset / 12);
            // reduce the index by the correct amount to get it below 12
            fretOffset = fretOffset - (12 * numOctavesAboveString);

            return ALL_NOTE_LETTERS[fretOffset];
        }

        var getNoteOctaveByFretNumber = function (stringOctave, stringLetter, fretNumber) {
            // The string letter has a value, which can be thought of as an amount
            // of notes above the note that begins an octave (Ab, whose value is 0).
            // Add the fret number to that.
            var fretOffset = NOTE_LETTER_VALUE_MAP[stringLetter] + fretNumber;
            // Now divide by 12 and floor it. That is the number of octaves this
            // fret is above the string.
            var numOctavesAboveString = Math.floor(fretOffset / 12);

            return stringOctave + numOctavesAboveString;
        }

        var setUpFretboard = function () {
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
                            svgWidth = x + fretWidth + svgBuffer;
                        }
                    }

                    // Draw note circle and note text, and attach data to them
                    var circ = paper.circle(circX, circY, noteCircRad).attr("fill", "white");

                    var stringLetter = guitarStringNotes[i].noteLetter;
                    var noteLetter = getNoteLetterByFretNumber(stringLetter, j);
                    var stringOctave = guitarStringNotes[i].noteOctave;
                    var noteOctave = getNoteOctaveByFretNumber(stringOctave, stringLetter, j);

                    var text = paper.text(circX, circY, noteLetter).attr("font-size", letterFontSize);

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
                    group.fretboard = self;
                    group.xCoord = circX;
                    group.yCoord = circY;

                    // When you click on a note, it could be either the circle or the text. 
                    // So for both cases, store a pointer to the group, which event handlers
                    // will use to then retrieve the circle and text together.
                    circ.data({ "group": group, "visible": 'false' });
                    text.data({ "group": group, "visible": 'false' });

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
                var squareId = "noteSquare" + "_" + x + "x_" + y + "y"; // assign it a unique id
                square.id = squareId;

                var text = paper.text(squareX + squareWidth / 2, squareY + squareWidth / 2, guitarStringNotes[i].noteLetter).attr("font-size", letterFontSize);
                var textId = "tuningLetter" + "_" + x + "x_" + y + "y"; // assign it a unique id
                text.id = textId;

                makeTextUnselectable(text);

                tuningSquares[i] = text;

                // Triangles for changing the string tunings
                var midX = squareX + squareWidth + 25;
                var midY = squareY + squareWidth / 2;
                var topX = squareX + squareWidth + 10;
                var topY = midY - squareWidth / 2;
                var bottomX = topX;
                var bottomY = midY + squareWidth / 2;

                drawTuningTriangleAndBindEventHandlers(midX, midY, topX, topY, bottomX, bottomY, ("rightTri" + i), "right", i);

                midX = squareX - 25;
                midY = squareY + squareWidth / 2;
                topX = squareX - 10;
                topY = midY - squareWidth / 2;
                bottomX = topX;
                bottomY = midY + squareWidth / 2;

                drawTuningTriangleAndBindEventHandlers(midX, midY, topX, topY, bottomX, bottomY, ("leftTri" + i), "left", i);

                if (i === numStrings - 1) {
                    svgHeight = squareY + squareWidth + svgBuffer;
                }
            }

            $svg = $fretboardContainer.find("svg");

            $svg.css({
                height: svgHeight,
                width: svgWidth
            });

            $window.on("load resize", function () {
                setScrollBar($svg, $fretboardContainer);
            });

            setScrollBar($svg, $fretboardContainer);
        } // end of SetUpFretboard method

        setUpFretboard();
    };

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

    $.fn.fretboard = function (options) {
        return this.each(function () {
            var element = $(this);

            // Return early if this element already has a plugin instance
            if (element.data('fretboard')) return;

            // create paper object (requires Raphael.js)
            var paper = new Raphael(element.attr('id'), '100%', '100%');
            //paper.canvas.setAttribute('preserveAspectRatio', 'none');

            // Pass options to plugin constructor
            var fretboard = new Fretboard(element, paper, options);

            // Store plugin object in this element's data
            element.data('fretboard', fretboard);
        });
    };
})(jQuery);
