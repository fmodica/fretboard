(function($) {
    var Fretboard = function(paper, settings) {
        // Default config settings
        var config = {
            'fretboardOrigin': [240, 25],                            // x and y location of the upper left of the fretboard
            'numFrets' : 24,                                         // in pixels                                    
            'fretWidth' : 67,                                        // in pixels  
            'fretHeight' : 31,                                       // in pixels  
            'guitarStringNotes' : ["E", "B", "G", "D", "A", "E"],    // default strings (note letters), from high to low. Adding more will
                                                                     // automatically set up the fretboard correctly,
                                                                     // just make sure to set the guitarStringOctaves array as well.
            'guitarStringOctaves' : [5, 5, 4, 4, 4, 3],
            'clickedNoteColor' : 'green',
            'placedNoteColor' : 'red',
            'placedNoteColorOverlap' : 'darkred',
            'tuningTriangleColor' : 'green',
            'fretsToDrawOneCircleOn' : [3, 5, 7, 9, 12],
            'opacityAnimateSpeed' : 200
        };
        
        // Extend default config settings
        if (settings) { 
            $.extend(config, settings); 
        }
        
        // Config options that are calculated
        config.letterFontSize = config.fretHeight / 3.5;             // size of notes that appear on the fretboard
        config.noteCircRad = config.fretHeight / 2.5;                // radius of the circle that shows the notes on the frets
        config.noteSquareWidth = config.fretHeight / 1.5;            // width/length of the square surrounding the letters that show the tuning
        
        // private
        var self = this;
        
        // public 
        
        // copy config options to fretboard properties
        self.fretboardOrigin = config.fretboardOrigin;
        self.numFrets = config.numFrets;
        self.fretWidth = config.fretWidth;
        self.fretHeight = config.fretHeight;
        self.guitarStringNotes = config.guitarStringNotes;
        self.guitarStringOctaves = config.guitarStringOctaves;
        self.clickedNoteColor = config.clickedNoteColor;
        self.placedNoteColor = config.placedNoteColor;
        self.placedNoteColorOverlap = config.placedNoteColorOverlap;
        self.tuningTriangleColor = config.tuningTriangleColor;
        self.fretsToDrawOneCircleOn = config.fretsToDrawOneCircleOn;
        self.opacityAnimateSpeed = config.opacityAnimateSpeed;
        self.letterFontSize = config.letterFontSize;
        self.noteCircRad = config.noteCircRad;
        self.noteSquareWidth = config.noteSquareWidth;
        
        self.paper = paper;
        self.numStrings = Math.min(config.guitarStringNotes.length, config.guitarStringOctaves.length); // TODO: this will change later since the notes and octaves will be together.
        self.notesClickedTracker = [];                      // will hold the fret number, null for not clicked, for each string
        self.notesPlacedTracker = [];                       // same as above, but for notes placed on the fretboard explicitly (instead of clicked)
        self.tuningSquares = [];                            // will hold the squares that show the each string's note letter
        self.stringTracker = new Array(self.numStrings);    // a 2-d array that holds each group (circle and text) for each string
        for (var i = 0; i < self.numStrings; i++) {
            self.stringTracker[i] = new Array(this.numFrets);
        }
        
        self.ALLNOTELETTERS = ["Ab", "A", "Bb", "B", "C", "C#", "D", "Eb", "E", "F", "F#", "G"];

        self.NOTE_LETTER_VALUE_MAP = { "Ab": 0, "A": 1, "Bb": 2, "B": 3, "C": 4, "C#": 5, "D": 6, "Eb": 7, "E": 8, "F": 9, "F#": 10, "G": 11 };
        
        // public methods
        self.createResetButton = function (buttonId, buttonClass, buttonValue, elementOnWhichToAppend) {
            var buttonHtml = "<input type='button' id='" + buttonId + "' class='" + buttonClass + "' value='" + buttonValue + "'/>";

            $('#' + elementOnWhichToAppend).append(buttonHtml);

            // If clicked, remove the clicked colored circles and bind hover events to those frets
            $('#' + buttonId).click(function () {
                for (var i = 0; i < self.numStrings; i++) {
                    if (self.notesClickedTracker[i] != null) {
                        var group = self.stringTracker[i][self.notesClickedTracker[i]];
                        var circ = group[0];

                        group.hover(self.noteMouseOver, self.noteMouseOut); // bind functions 
                        makeNoteInvisible(group);                

                        self.notesClickedTracker[i] = null;
                    }
                }

                $('#next-previous-voicings-buttons').hide();
                self.clearPlacedNotes();
            });
        }
        
        self.placeNoteOnFretboard = function (stringLetter, stringOctave, fretNumber) {
            // Loop over the instrument's strings, comparing note and octave to the string this note is on
            // to find a match. If a match is found, show the note.
            for (var i = 0; i < self.guitarStringNotes.length; i++) {
                if (self.guitarStringNotes[i] === stringLetter && self.guitarStringOctaves[i] === stringOctave) {
                //if (fretNumber >= 0 && fretNumber <= self.numFrets) {
                    var group = self.stringTracker[i][fretNumber];
                    var circ = group[0];
                    var text = group[1];

                    var color;
                    var opacity;

                    if (self.notesClickedTracker[i] === fretNumber) {
                        color = self.placedNoteColorOverlap;

                        //color = self.placedNoteColor;
                        opacity = 1;
                    } else {
                        color = self.placedNoteColor;
                        opacity = 1;
                    }

                    makeNoteVisible(group, color);

                    group.unhover(noteMouseOver, noteMouseOut);
                    //group.unclick(circ.data("click"));

                    self.notesPlacedTracker[i] = fretNumber;
                //}
                } 
            }
        }
        
        self.clearPlacedNotes = function () {
            for (var i = 0; i < self.notesPlacedTracker.length; i++) {
                var fret = self.notesPlacedTracker[i];
                if (fret != null) {
                    var group = self.stringTracker[i][fret];
                    var circ = group[0];
                    var text = group[1];
                    
                    // This placed note could also be a clicked note. In that case, 
                    // it should not be made invisible. Just give it the correct color.

                    if (fret === self.notesClickedTracker[i]) {
                        var color = self.clickedNoteColor;
                        makeNoteVisible(group, color);
                    } else {
                        makeNoteInvisible(group);
                        group.hover(noteMouseOver, noteMouseOut); // bind hover events
                    }
                }

                self.notesPlacedTracker[i] = null;
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
            circ.animate({ 'fill-opacity': 1, 'stroke-opacity': 1, 'opacity': 1, 'fill': circColor }, self.opacityAnimateSpeed);
            text.animateWith(circ, null, { 'fill-opacity': 1, 'stroke-opacity': 1, 'opacity': 1 }, self.opacityAnimateSpeed);
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
            group.animate({ 'fill-opacity': 0, 'stroke-opacity': 0, 'opacity': 0 }, self.opacityAnimateSpeed);
        }
        
        var makeNoteInvisibleImmediate = function (group) {
            group.attr({ 'fill-opacity': 0, 'stroke-opacity': 0, 'opacity': 0 });
        }
        
        var bindEventHandlersToTuningTriangle = function (triangle) {
            triangle.click(tuningTriangleClick);
        }
        
        var drawFretCircle = function (fret, circX, circY, topFretExtended, bottomFretExtended) {
            for (var k = 0; k < self.fretsToDrawOneCircleOn.length; k++) {

                var num = self.fretsToDrawOneCircleOn[k];

                var matchOrMultiple = ((fret - num) % 12);

                if (matchOrMultiple === 0) {
                    self.paper.circle(circX, topFretExtended + ((bottomFretExtended - topFretExtended) / 2), self.noteCircRad / 3).attr("fill", "black");
                    break;
                }
            }
        }
        
        /*
        for (var k = 0; k < self.fretsToDrawTwoCirclesOn.length; k++) {

            var num = self.fretsToDrawTwoCirclesOn[k];

            var matchOrMultiple = ((j - num) % 12);

            if (matchOrMultiple === 0) {
                self.paper.circle(circX, topFretExtended + ((1 * (bottomFretExtended - topFretExtended)) / 3), self.noteCircRad / 3).attr("fill", "black");
                self.paper.circle(circX, topFretExtended + ((2 * (bottomFretExtended - topFretExtended)) / 3), self.noteCircRad / 3).attr("fill", "black");
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

            if (self.notesClickedTracker[thisString] === null) {
                self.notesClickedTracker[thisString] = thisFret;
                makeNoteVisible(group, self.clickedNoteColor);
                // bind functions which are attached to the circle but work for the group
                group.unhover(noteMouseOver, noteMouseOut);
            } // if the fret clicked was already clicked...
            else if ((self.stringTracker[thisString][self.notesClickedTracker[thisString]]).id === group.id) {
                self.notesClickedTracker[thisString] = null;
                makeNoteVisible(group, '#FFF');
                group.hover(noteMouseOver, noteMouseOut); // unbind functions 
            }
            else {
                // Take care of note that was already clicked
                var alreadyClickedGroup = self.stringTracker[thisString][self.notesClickedTracker[thisString]];
                makeNoteInvisible(alreadyClickedGroup);
                alreadyClickedGroup.hover(noteMouseOver, noteMouseOut);

                // Take care of new note
                makeNoteVisible(group, self.clickedNoteColor);
                group.unhover(noteMouseOver, noteMouseOut); // unbind functions 
                self.notesClickedTracker[thisString] = thisFret;
            }

            $('#next-previous-voicings-buttons').hide();
            self.clearPlacedNotes();
        }
        
        var tuningTriangleClick = function () {
            var triangle = this;
            var fretboard = triangle.fretboard;

            var thisStringNumber = triangle.data("stringNumber");
            var direction = triangle.data("direction");
            var previousStringLetter = self.guitarStringNotes[thisStringNumber];

            console.log("new notes");

            for (var i = 0; i <= self.numFrets; i++) {
                var group = self.stringTracker[thisStringNumber][i];
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
                    self.guitarStringNotes[thisStringNumber] = newNoteLetter;
                    self.tuningSquares[thisStringNumber].attr("text", newNoteLetter);
                    self.guitarStringOctaves[thisStringNumber] = newNoteOctave;
                }

                text.attr("text", newNoteLetter); // change the text

                group.noteLetter = newNoteLetter;
                group.noteOctave = newNoteOctave;

                console.log(newNoteLetter + " " + newNoteOctave);
            }
        }
        
        var drawTuningTriangleAndBindEventHandlers = function (midX, midY, topX, topY, bottomX, bottomY, id, direction, stringNumber) {
            var tri = self.paper.path("M" + midX + "," + midY + "L" + topX + "," + topY + "L" + bottomX + "," + bottomY + "z");

            tri.id = id;
            tri.fretboard = self;
            tri.attr("fill", self.tuningTriangleColor).attr("cursor", "pointer").data({ "direction": direction, "stringNumber": stringNumber });

            bindEventHandlersToTuningTriangle(tri)
        }
        
        var getNoteLetterByFretNumber = function (stringLetter, fretNumber) {
            var fretOffset = self.NOTE_LETTER_VALUE_MAP[stringLetter] + fretNumber;
            //var dividedByTwelve = fretOffset / 12;
            var numOctavesAboveString = Math.floor(fretOffset / 12);
            // reduce the index by the correct amount to get it below 12
            fretOffset = fretOffset - (12 * numOctavesAboveString);

            return self.ALLNOTELETTERS[fretOffset];
        }

        var getNoteOctaveByFretNumber = function (stringOctave, stringLetter, fretNumber) {
            // The string letter has a value, which can be thought of as an amount
            // of notes above the note that begins an octave (Ab, whose value is 0).
            // Add the fret number to that.
            var fretOffset = self.NOTE_LETTER_VALUE_MAP[stringLetter] + fretNumber;
	        // Now divide by 12 and floor it. That is the number of octaves this
	        // fret is above the string.
	        var numOctavesAboveString = Math.floor(fretOffset / 12);

            return stringOctave + numOctavesAboveString;
        }
        
        var setUpFretboard = function () {
            // For drawing things that extend above or below the top/bottom string, 
            // like the left vertical part of the fret or the guitar body
            var topFretExtended = self.fretboardOrigin[1] - (1 / 4 * self.fretHeight);
            var bottomFretExtended = self.fretboardOrigin[1] + ((self.numStrings - 1) * self.fretHeight) + (1 / 4 * self.fretHeight);
            
            // For the instrument's strings
            var stringXBegin = self.fretboardOrigin[0] + (self.fretWidth * (1 / 5));
            var stringXEnd = self.fretboardOrigin[0] + (self.fretWidth * (self.numFrets)) + (1 * self.fretWidth); // (1/2 * self.fretWidth)
                
            // Draw the rectangle that represents the guitar body 
            self.paper.rect(stringXBegin, topFretExtended, stringXEnd - stringXBegin, bottomFretExtended - topFretExtended).attr({ "fill": 'tan', 'stroke-opacity': 0 });
            
            // Add frets and circles for note letters, attach data to the frets, and other things
            for (var i = 0; i < self.numStrings; i++) {

                self.notesClickedTracker[i] = null; // initialize the array that tracks clicked frets on each string to null
                self.notesPlacedTracker[i] = null; // initialize the array that tracks placed frets on each string to null

                var stringY = self.fretboardOrigin[1] + (i * self.fretHeight);

                self.paper.path("M" + stringXBegin + "," + stringY + "L" + stringXEnd + "," + stringY + "z").attr("stroke", 'black');

                for (var j = 0; j < self.numFrets + 1; j++) {

                    // Coordinates for the left of the fret and string
                    var x = self.fretboardOrigin[0] + j * (self.fretWidth);
                    var y = self.fretboardOrigin[1] + i * (self.fretHeight);

                    // Coordinates for the center of the fret and string
                    var circX = x + self.fretWidth * (1 / 2);
                    var circY = y;

                    if (j > 0) {
                        // Draw the left vertical line (left edge of the fret)
                        self.paper.path("M" + x + "," + topFretExtended + "L" + x + "," + bottomFretExtended + "z").attr("stroke", 'black');

                        // If it's the last fret, close it on the right
                        //if (j === self.numFrets) {
                        //    var lineRight = self.paper.path("M" + (x + self.fretWidth) + "," + topFretExtended + 
                        // "L" + (x + self.fretWidth) + "," + bottomFretExtended + "z").attr("stroke", 'black');
                        //}

                        if (j === 1) {
                            // Draw a rectangle at the left of the first fret, which represents the nut
                            self.paper.rect(x - (self.fretWidth / 5), topFretExtended, (self.fretWidth / 5), bottomFretExtended - topFretExtended).attr("fill", 'black');
                        }

                        // Draw the circles you usually see on the 3rd, 5th, etc. fret (only do it once, so just
                        // choose i === 0
                        if (i === 0) {
                            drawFretCircle(j, circX, circY, topFretExtended, bottomFretExtended);
                        }
                    }

                    // Draw note circle and note text, and attach data to them
                    var circ = self.paper.circle(circX, circY, self.noteCircRad).attr("fill", "white");

                    var stringLetter = self.guitarStringNotes[i];
                    var noteLetter = getNoteLetterByFretNumber(stringLetter, j);
                    var stringOctave = self.guitarStringOctaves[i];
                    var noteOctave = getNoteOctaveByFretNumber(stringOctave, stringLetter, j);

                    var text = self.paper.text(circX, circY, noteLetter).attr("font-size", self.letterFontSize);

                    // Don't let the note text be selectable because that's annoying and ugly
                    makeTextUnselectable(text);

                    // Create a group to hold the circle and its text
                    var group = self.paper.set();

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
                    group.fretboard = self;
                    
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
                    self.stringTracker[i][j] = group;
                }
            }

            // Add the squares and triangles which will show/control the string tunings
            for (var i = 0; i < self.numStrings; i++) {
                var x = self.fretboardOrigin[0] - (self.fretWidth * (1 / 2));
                var y = self.fretboardOrigin[1] + i * (self.fretHeight);

                var squareWidth = self.noteSquareWidth;
                var squareX = x - (squareWidth);
                var squareY = y - (squareWidth / 2)
                var square = self.paper.rect(squareX, squareY, squareWidth, squareWidth).attr("fill", "white");
                var squareId = "noteSquare" + "_" + x + "x_" + y + "y"; // assign it a unique id
                square.id = squareId;

                var text = self.paper.text(squareX + squareWidth / 2, squareY + squareWidth / 2, self.guitarStringNotes[i]).attr("font-size", self.letterFontSize);
                var textId = "tuningLetter" + "_" + x + "x_" + y + "y"; // assign it a unique id
                text.id = textId;

                makeTextUnselectable(text);

                self.tuningSquares[i] = text;

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
            }
        } // end of SetUpFretboard method
        
        setUpFretboard();
    };

    $.fn.fretboard = function(options) {
        return this.each(function() {
            var element = $(this);

            // Return early if this element already has a plugin instance
            if (element.data('fretboard')) return;
            
            // create paper object (requires Raphael.js)
            var paper = new Raphael(element.attr('id'), '100%', '100%');

            // Pass options to plugin constructor
            var fretboard = new Fretboard(paper, options);

            // Store plugin object in this element's data
            element.data('fretboard', fretboard);
        });
    };
})(jQuery);
