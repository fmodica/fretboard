(function($) {
    "use strict";
    
    window.Fretboard = function(options, $element) {
        var self = this,
            // The value for C needs to be first
            DEFAULT_NOTE_LETTERS = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "Ab/G#", "A", "A#/Bb", "B"],
            DEFAULT_TUNING = [{
                    "letter": "E",
                    "octave": 5
                }, {
                    "letter": "B",
                    "octave": 5
                }, {
                    "letter": "G",
                    "octave": 4
                }, {
                    "letter": "D",
                    "octave": 4
                }, {
                    "letter": "A",
                    "octave": 4
                }, {
                    "letter": "E",
                    "octave": 3
            }],
            DEFAULT_NUM_FRETS = 15,
            defaults = {
                allNoteLetters: DEFAULT_NOTE_LETTERS,
                tuning: DEFAULT_TUNING,
                numFrets: DEFAULT_NUM_FRETS
            },
            settings = {},
            ui = {
                $body: null,
                $stringContainers: {}
            };
            
		    $.extend(settings, defaults, options);
		    
		    validate();
		    init();
            
            function init() {
                var numStrings = settings.tuning.length,
                    i, j, $stringContainer, $string, $fret, $note, 
                    $letter, letter, fretWidth;
                    
                ui.$body = $("<div class='body'></div>");
                
                $element.append(ui.$body);
                
                for (i = 0; i < numStrings; i++) {
                    $stringContainer = $("<div class='string-container'></div>");
                    $string = $("<div class='string'></div>");
                    $stringContainer.append($string);
                    ui.$body.append($stringContainer);
                    // Make the hash key the note of the string
                    ui.$stringContainers[i] = $stringContainer;
                    fretWidth = $stringContainer.width() / (settings.numFrets + 1);
                    
                    for (j = 0; j <= settings.numFrets; j++) {
                        letter = "A";
                        $fret = $("<div class='fret'></div>");
                        $note = $("<div class='note'></div>");
                        $letter = $("<div class='letter'>" + letter + "</div>");
                        $note.append($letter);
                        $fret.width(fretWidth).append($note);
                        $stringContainer.append($fret); 
                    }
                }
            }
            
            function validate() {
                validateAllNoteLetters();
            }
            
            function validateAllNoteLetters() {
                 if (settings.allNoteLetters.length !== 12) {
                    throw "allNoteLetters is not valid: " + settings.allNoteLetters;
                }
            }
    };
})(jQuery);

if (!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

// The jQuery plugin
(function($) {
	"use strict";

	$.fn.fretboard = function(options) {
		// The plugin will be called like this:
		// $('.fretboard-container').fretboard({ ... });
		// Iterate over each element in the jQuery 
		// collection, initializing a fretboard.   
		return this.each(function() {
			var $element = $(this), fretboard;

			// Return early if this element already has a plugin instance.
			// Otherwise, place a fretboard object on the element's data
			if ($element.data('fretboard')) return;

			fretboard = new Fretboard(options, $element);

			$element.data('fretboard', fretboard);
		});
	};
})(jQuery);

(function($) {
	"use strict";
	// Make this object available on the global scope
	window.Fretboard_old = function($fretboardContainer, settings) {
		var self = this, // the fretboard object
		    ALL_NOTE_LETTERS = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "Ab/G#", "A", "A#/Bb", "B"],
		
		// The values in this object are used in note arithmetic and must also map correct to the ALL_NOTE_LETTERS array for validation purposes.
		// Example: Db/C# is at index 1 and is considered valid input but will be converted the value at index 1 of ALL_NOTE_LETTERS, which is C#/Db.
            NOTE_LETTER_VALUE_MAP = {
			"C": 0,
			"Db": 1,
			"C#": 1,
			"Db/C#": 1,
			"C#/Db": 1,
			"D": 2,
			"Eb": 3,
			"D#": 3,
			"Eb/D#": 3,
			"D#/Eb": 3,
			"E": 4,
			"F": 5,
			"Gb": 6,
			"F#": 6,
			"Gb/F#": 6,
			"F#/Gb": 6,
			"G": 7,
			"Ab": 8,
			"G#": 8,
			"Ab/G#": 8,
			"G#/Ab": 8,
			"A": 9,
			"A#": 10,
			"Bb": 10,
			"A#/Bb": 10,
			"Bb/A#": 10,
			"B": 11,
		},

		// Default config settings
		config = {
			// x and y location of the upper left of the fretboard (the tuning squares 
			// will be further to the left).
			fretboardOrigin: [80, 15],
			noteClickingDisabled: false,
			// For the default tuner
			tuningClickingDisabled: false,
			numFrets: 15,
			fretWidth: 67, 
			fretHeight: 31,
			// If isChordMode is true, clicking a note on a string will result
			// in any other notes on that string disappearing.
			isChordMode: false,
			// Default strings (note letters), from high to low.
			guitarStringNotes: [{
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
			}, ],
			clickedNoteCircColor: 'green',
			clickedNoteTextColor: 'black',
			hoverNoteCircColor: 'white',
			hoverNoteTextColor: 'black',
			tuningTriangleColor: 'green',
			showTuningTriangles: true,
			showTuningSquares: true,
			tuningSquaresColor: "white",
			tuningSquaresTextColor: "black",
			// Octaves of these numbers will have circles drawn on them too.
			// 0 is actually ignored, but if included then 12, 24, 36, etc 
			// will have circles.
			fretsToDrawOneCircleOn: [0, 3, 5, 7, 9], 
			opacityAnimateSpeed: 125,
			fretboardColor: 'tan',
			stringColor: 'black',
			nutColor: 'black',
			fretboardAnimationSpeed: 100
		},

		// Make a copy of the original settings provided by the user.
		settingsCopy = $.extend(true, {}, settings || {}),
		extendedConfig,
		fretboardOrigin,
		numFrets,
		fretWidth,
		fretHeight,
		isChordMode,
		guitarStringNotes,
		clickedNoteCircColor,
		clickedNoteTextColor,
		hoverNoteCircColor,
		hoverNoteTextColor,
		fretboardColor,
		stringColor,
		tuningTriangleColor,
		fretsToDrawOneCircleOn,
		opacityAnimateSpeed,
		letterFontSize,
		noteCircRad,
		fretCircRad,
		noteTuningSquareWidth,
		showTuningSquares,
		showTuningTriangles,
		tuningSquaresColor,
		tuningSquaresTextColor,
		nutColor,
		fretboardAnimationSpeed,
		svgWidth,
		svgHeight,
		svgWidthBuffer,
		$window,
		paper,
		noteClickingDisabled,
		tuningClickingDisabled,
		// This holds the fret numbers that are clicked, from high to low.
		// Example for a maj7 fingering in Standard E tuning:
		// [[3], [5], [4], [], [3], []] .
		notesClickedTracker,
		// This will be an object that holds all ui elements (Raphael objects).
		ui;
			
		function init() {
			console.log("init called");

			initVariables();
			drawAndWireUpFretboard();
		}

		self.disableNoteClicking = function() {
			noteClickingDisabled = true;
		}

		self.disableTuningClicking = function() {
			tuningClickingDisabled = true;
		}

		self.enableNoteClicking = function() {
			noteClickingDisabled = false;
		}

		self.enableTuningClicking = function() {
			tuningClickingDisabled = false;
		}

		self.setChordMode = function(isChordModeInput) {
			isChordMode = isChordModeInput;
		}

		self.clearClickedNotes = function() {
			var i, j, clickedFrets, clickedFret, clickedGroup, color;

			for (i = 0; i < guitarStringNotes.length; i++) {
				clickedFrets = notesClickedTracker[i];

				// See if any of the frets were also clicked            
				for (j = 0; j < clickedFrets.length; j++) {
					clickedFret = clickedFrets[j].fret;
					clickedGroup = ui.allRaphaelNotes[i][clickedFret];

					makeNoteInvisibleAnimated(clickedGroup);
					clickedGroup.hover(noteMouseOver, noteMouseOut);
				}

				notesClickedTracker[i] = [];
			}

			ui.$fretboardContainer.trigger("notesCleared");
		}

		self.getGuitarStringNotes = function() {
			return guitarStringNotes;
		}

		self.getClickedNotes = function() {
			var i, j, frets, fret, group, musicalNote, notes = [];

			for (i = 0; i < guitarStringNotes.length; i++) {
				frets = notesClickedTracker[i];

				for (j = 0; j < frets.length; j++) {
					fret = frets[j].fret;

					group = ui.allRaphaelNotes[i][fret];

					musicalNote = {
						noteLetter: group.noteLetter,
						noteOctave: group.noteOctave,
						fretNumber: group.fretNumber,
						stringItsOn: {
							noteLetter: group.stringLetter,
							noteOctave: group.stringOctave
						}
					}

					notes.push(musicalNote);
				}
			}

			return notes;
		}

		function validateNotes(notes) {
		    if (!Array.isArray(notes)) {
		        throw "\"notes\" must be in an array. It is: " + notes;
		    }
		    
			for (var i = 0; i < notes.length; i++) {
				notes[i].noteLetter = validateNoteLetter(notes[i].noteLetter);
			}
		}

		// This inspects a note letter and returns the representation that
		// will be used in this code.
		function validateNoteLetter(noteLetter) {
			// Make sure it's a valid note by checking to see if it has a numeric value
			var noteVal = NOTE_LETTER_VALUE_MAP[noteLetter];

			if (!isNaN(noteVal)) {
				return ALL_NOTE_LETTERS[noteVal];
			}

			throwNoteLetterError(noteLetter);
		}

		function throwNoteLetterError(noteLetter) {
			throw noteLetter + " is not a valid note.";
		}
		
		function validateNumFrets(fretNums) {
			if (isNaN(fretNums) || fretNums < 1) {
				throwFretNumsError(fretNums); 
			}		
		}
		
		function throwFretNumsError(fretNums) {
		    throw fretNums + " is not a valid number of frets.";
		}

		function validateFretNum(fretNum) {
			if (isNaN(fretNum) || fretNum < 0 || fretNum > numFrets) {
				throwFretNumError(fretNum);
			}
		}

		function throwFretNumError(fretNum) {
			throw fretNum + " is not a valid fret number. There are " + numFrets + " frets.";
		}

		// To be used internally

		function setClickedNoteByStringNoteAndFretNum(stringNote, fretNumber, params) {
			for (var i = 0; i < guitarStringNotes.length; i++) {
				if (getNoteUniqueValue(guitarStringNotes[i]) === getNoteUniqueValue(stringNote) /*&& !notesClickedTracker[i]*/ ) {
					var group = ui.allRaphaelNotes[i][fretNumber];
					var circ = group[0];
					circ.trigger("click", circ, params);
				}
			}
		}

		// to be used externally as API function
		self.setClickedNoteByStringNoteAndFretNum = function(note) {
		    var noteLetter = validateNoteLetter(note.stringItsOn.noteLetter);
		    
			validateFretNum(note.fretNumber);
			
			setClickedNoteByStringNoteAndFretNum({
				noteLetter: noteLetter,
				noteOctave: note.stringItsOn.noteOctave
			}, note.fretNumber, {
				wasCalledProgramatically: true,
				circColor: note.circColor,
				textColor: note.textColor
			});
		}

		function doCommonTuningChangeRedrawLogic(oldGuitarStringNotes, topFretExtended, bottomFretExtended, newHeight) {
			var i, oldLength = oldGuitarStringNotes.length;

			// If a guitar string was already drawn at location i, and the new note that should
			// be on that string is different than the old note just change the notes so it's quick.
			// Otherwise, draw/remove guitar strings.
			for (i = 0; i < guitarStringNotes.length; i++) {
				if (i < oldLength) {
					if (getNoteUniqueValue(oldGuitarStringNotes[i]) !== getNoteUniqueValue(guitarStringNotes[i])) {
						alterGuitarString(i, guitarStringNotes[i]);
					} else {
					    console.log("notes were the same - doing nothing");
					}
				} else {
					drawGuitarStringAtLocation(i);
				}
			}
		}

		self.setTuning = function(newGuitarStringNotes) {
			var newLength, oldLength, oldGuitarStringNotes, numberOfNewStrings, i, j,
			    topFretExtended, bottomFretExtended, newHeight, highestStringToDeleteIndex,
			    lowestStringToDeleteIndex;

			validateNotes(newGuitarStringNotes);
			
			oldGuitarStringNotes = $.extend(true, [], guitarStringNotes);

			oldLength = oldGuitarStringNotes.length;
			newLength = newGuitarStringNotes.length;
			numberOfNewStrings = newLength - oldLength;

            // copy to the private variable
			guitarStringNotes = $.extend(true, [], newGuitarStringNotes);

			topFretExtended = getTopFretExtended();
			bottomFretExtended = getBottomFretExtended();
			newHeight = bottomFretExtended - topFretExtended;
			
			// If we are removing strings
			if (numberOfNewStrings < 0) {
				// Remove any strings from the dom that aren't part of the new tuning
				// and also their events (unhover and clicks)
				highestStringToDeleteIndex = oldLength - 1;
				 // numberOfNewStrings is negative, offset 1
				lowestStringToDeleteIndex = highestStringToDeleteIndex + (numberOfNewStrings + 1);

                 // Remove ui elements
				for (i = lowestStringToDeleteIndex; i <= highestStringToDeleteIndex; i++) {
					console.log("removing");
					// square-stuff could be in a set, and just call remove on the set?
					ui.allRaphaelTuningSquares[i].remove();
					ui.allRaphaelTuningSquareNoteLetters[i].remove();
					ui.allRaphaelTuningSquareNoteOctaves[i].remove();
					ui.stringLines[i].remove();

                    
					for (j = 0; j < ui.allRaphaelNotes[i].length; j++) {
						ui.allRaphaelNotes[i][j].unhover(noteMouseOver, noteMouseOut).unclick(noteClick).remove();
					}

					for (j = 0; j < 2; j++) {
						ui.allRaphaelTuningTriangles[i][j].unclick(tuningTriangleClick).remove();
					}
				}
				
				// Shorten arrays that track the UI elements
				notesClickedTracker = notesClickedTracker.slice(0, newLength);
				ui.allRaphaelNotes = ui.allRaphaelNotes.slice(0, newLength);
				ui.allRaphaelTuningSquares = ui.allRaphaelTuningSquares.slice(0, newLength);
				ui.allRaphaelTuningSquareNoteLetters = ui.allRaphaelTuningSquareNoteLetters.slice(0, newLength);
				ui.allRaphaelTuningSquareNoteOctaves = ui.allRaphaelTuningSquareNoteOctaves.slice(0, newLength);
				ui.allRaphaelTuningTriangles = ui.allRaphaelTuningTriangles.slice(0, newLength);
				ui.stringLines = ui.stringLines.slice(0, newLength);

				doCommonTuningChangeRedrawLogic(oldGuitarStringNotes, topFretExtended, bottomFretExtended, newHeight);
				
				animateFretboardHeight(doPostDrawFixes);

			} else {
				for (i = 0; i < numberOfNewStrings; i++) {
					// Only need to add slots for things that are 2D arrays, 
					// because the inner array will get accessed by index.
					// The function that actually draws the new strings will 
					// add everythin gelse.
					notesClickedTracker.push([]);
					ui.allRaphaelNotes.push([]);
					ui.allRaphaelTuningTriangles.push([]);
				}

				doCommonTuningChangeRedrawLogic(oldGuitarStringNotes, topFretExtended, bottomFretExtended, newHeight);
				
				animateFretboardHeight(doPostDrawFixes);
			}

			ui.$fretboardContainer.trigger("tuningChanged");
		}

		// Could make this a public function that loops over a list of clicked notes and sets them

		function resetOldClickedNotes(oldClickedNotes) {
			var i, j, stringNum, fretNums, fretNum;

			for (i = 0; i < oldClickedNotes.length; i++) {
				stringNum = i;
				fretNums = oldClickedNotes[i];

				for (j = 0; j < fretNums.length; j++) {
					fretNum = fretNums[j].fret;

					setClickedNoteByStringNoteAndFretNum({
						noteLetter: guitarStringNotes[stringNum].noteLetter,
						noteOctave: guitarStringNotes[stringNum].noteOctave
					}, fretNum, {
						immediate: true,
						wasCalledProgramatically: true,
						circColor: fretNums[j].circColor,
						textColor: fretNums[j].textColor
					});
				}
			}
		}

		function bindEventHandlersToNote(group) {
			group.click(noteClick);
			group.hover(noteMouseOver, noteMouseOut);
		}

		function makeNoteVisibleAnimated(group, circColor, textColor) {
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
				'opacity': 1,
				'fill': textColor
			}, opacityAnimateSpeed);
			group.attr('cursor', 'pointer');
		}

		function makeNoteVisibleImmediate(group, circColor, textColor) {
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
				'opacity': 1,
				'fill': textColor
			});
			group.attr('cursor', 'pointer');
		}

		function makeNoteInvisibleAnimated(group) {
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

		function drawFretCircle(fretNum, circX, circY, topFretExtended, bottomFretExtended) {
		    var i, num, matchOrMultiple;
		    
			for (i = 0; i < fretsToDrawOneCircleOn.length; i++) {
				num = fretsToDrawOneCircleOn[i];

				matchOrMultiple = ((fretNum - num) % 12);

				if (matchOrMultiple === 0) {
					ui.fretCircles.push(paper.circle(circX, topFretExtended + ((bottomFretExtended - topFretExtended) / 2), fretCircRad).attr("fill", "black"));
					
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

			makeNoteVisibleAnimated(group, hoverNoteCircColor, hoverNoteTextColor);
		}

		function noteMouseOut() {
			var group = this.data("group");

			makeNoteInvisibleAnimated(group);
		}

		function noteClick(params) {
			//console.log(params);
			var wasCalledProgramatically = params && params.wasCalledProgramatically;
			var circColor = (params && params.circColor) || clickedNoteCircColor;
			var textColor = (params && params.textColor) || clickedNoteTextColor;

			if (noteClickingDisabled && !wasCalledProgramatically) {
				return false;
			}

			var immediatelyVisible = params && params.immediate;

			var group = this.data("group");

			var circ = group[0];
			var text = group[1];
			var thisString = group.stringNumber;
			var thisFret = group.fretNumber;

			var clickedFrets = notesClickedTracker[thisString];

			var atLeastOneFretWasClicked = clickedFrets.length > 0; // needs plural name

			var fretNumberIndex = -1;

			for (var i = 0; i < clickedFrets.length; i++) {
				if (clickedFrets[i].fret === thisFret) {
					fretNumberIndex = i;
				}
			}
			var clickedFretWasAlreadyClicked = fretNumberIndex !== -1;

			if (!clickedFretWasAlreadyClicked && atLeastOneFretWasClicked && isChordMode) {
				// Go through and unclick all others
				for (var i = 0; i < clickedFrets.length; i++) {
					var alreadyClickedFret = clickedFrets[i].fret;
					var alreadyClickedGroup = ui.allRaphaelNotes[thisString][alreadyClickedFret];

					makeNoteInvisibleAnimated(alreadyClickedGroup);
					alreadyClickedGroup.hover(noteMouseOver, noteMouseOut);
				}

				notesClickedTracker[thisString] = [];
			}

			if (clickedFretWasAlreadyClicked) {
				makeNoteInvisibleAnimated(group);

				group.hover(noteMouseOver, noteMouseOut);
				notesClickedTracker[thisString].splice(fretNumberIndex, 1);
			} else {
				if (immediatelyVisible) {
					makeNoteVisibleImmediate(group, circColor, textColor); // make this a parameter
				} else {
					makeNoteVisibleAnimated(group, circColor, textColor);
				}

				group.unhover(noteMouseOver, noteMouseOut);

				notesClickedTracker[thisString].push({
					fret: thisFret,
					circColor: circColor,
					textColor: textColor
				});
			}

			//if (!wasCalledProgramatically) {
			ui.$fretboardContainer.trigger("noteClicked")
			//}
		}

		function alterGuitarString(stringNumber, newGuitarStringNote) {
		    console.log("altering");
		    
			var i, group, circ, text, newNoteOnThisFret;

			guitarStringNotes[stringNumber] = newGuitarStringNote;

			if (showTuningSquares) {
				ui.allRaphaelTuningSquareNoteLetters[stringNumber].attr("text", newGuitarStringNote.noteLetter);
				ui.allRaphaelTuningSquareNoteOctaves[stringNumber].attr("text", newGuitarStringNote.noteOctave);
			}

			for (i = 0; i <= numFrets; i++) {
				group = ui.allRaphaelNotes[stringNumber][i];
				circ = group[0];
				text = group[1];

				newNoteOnThisFret = {
					noteLetter: getNoteLetterByFretNumber(newGuitarStringNote.noteLetter, i),
					noteOctave: getNoteOctaveByFretNumber(newGuitarStringNote.noteOctave, newGuitarStringNote.noteLetter, i)
				}

				text.attr("text", newNoteOnThisFret.noteLetter);

				group.noteLetter = newNoteOnThisFret.noteLetter;
				group.noteOctave = newNoteOnThisFret.noteOctave;
				group.stringLetter = guitarStringNotes[stringNumber].noteLetter;
				group.stringOctave = guitarStringNotes[stringNumber].noteOctave;
			}

			ui.$fretboardContainer.trigger("tuningChanged");
		}

		function tuningTriangleClick() {
			if (tuningClickingDisabled) {
				return false;
			}

			var triangle = this,
				thisStringNumber = triangle.data("stringNumber"),
				direction = triangle.data("direction"),
				previousGuitarStringNote = guitarStringNotes[thisStringNumber],
				newGuitarStringNoteLetter,
				newGuitarStringNoteOctave,
				equivalentFretNumber = (direction === "right" ? 1 : 11);

			// The 11th fret note is the same as going down one fret, but subtract one from the octave number
			newGuitarStringNoteLetter = getNoteLetterByFretNumber(previousGuitarStringNote.noteLetter, equivalentFretNumber);
			newGuitarStringNoteOctave = getNoteOctaveByFretNumber(previousGuitarStringNote.noteOctave - (direction === "right" ? 0 : 1), previousGuitarStringNote.noteLetter, equivalentFretNumber);

			alterGuitarString(thisStringNumber, {
				noteLetter: newGuitarStringNoteLetter,
				noteOctave: newGuitarStringNoteOctave
			});
		}

		function drawTuningTriangleAndBindEventHandlers(midX, midY, topX, topY, bottomX, bottomY, direction, stringNumber) {
			var tri = paper.path("M" + midX + "," + midY + "L" + topX + "," + topY + "L" + bottomX + "," + bottomY + "z")
				.attr("fill", tuningTriangleColor).attr("cursor", "pointer").data({
					"direction": direction,
					"stringNumber": stringNumber
				});

			ui.allRaphaelTuningTriangles[stringNumber].push(tri);

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
			// of notes above the note that begins an octave (C, whose value is 0).
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

		function setScrollBar() {
			var svgRightPosition = ui.$svg.width() + ui.$svg.position().left;
			var containerRightPosition = ui.$fretboardContainer.width() + ui.$fretboardContainer.position().left;

			if (svgRightPosition > containerRightPosition) {
				ui.$fretboardContainer.css({
					"overflow-x": "scroll"
				});
			} else {
				ui.$fretboardContainer.css({
					"overflow-x": "hidden"
				});
			}

			// Just to avoid random vertical scroll bars
			ui.$fretboardContainer.css({
				"overflow-y": "hidden"
			});
		}

		function calculateStringYCoordinate(stringNumber) {
			return fretboardOrigin[1] + (stringNumber * fretHeight);
		}

		function getBottomFretExtended() {
			return fretboardOrigin[1] + ((guitarStringNotes.length - 1) * fretHeight) + (1 / 4 * fretHeight);
		}

		function getTopFretExtended() {
			return fretboardOrigin[1] - (1 / 4 * fretHeight);
		}

		function getFretLeftXVal(j) {
			return fretboardOrigin[0] + j * (fretWidth);
		}

		function getStringXBegin() {
			return fretboardOrigin[0] + (fretWidth * (1 / 5));
		}

		function getStringXEnd() {
			return fretboardOrigin[0] + (fretWidth * (numFrets + 1));
		}

		function drawOneTimeElements() {
			var topFretExtended = getTopFretExtended(),
				bottomFretExtended = getBottomFretExtended(),
				stringXBegin = getStringXBegin(),
				stringXEnd = getStringXEnd(),
				i, j,
				// Coordinates for the left of the fret and string
				x = getFretLeftXVal(j),
				y = fretboardOrigin[1] + i * (fretHeight),
				// Coordinates for the center of the fret and string
				circX = x + fretWidth * (1 / 2),
				circY = y;

			// Draw the rectangle that represents the guitar body 
			console.log("drawing guitar body");
			ui.body = paper.rect(stringXBegin, topFretExtended, stringXEnd - stringXBegin, bottomFretExtended - topFretExtended).attr({
				"fill": fretboardColor,
				'stroke-opacity': 0
			});

			for (j = 0; j <= numFrets; j++) {
				x = getFretLeftXVal(j);

				circX = x + fretWidth * (1 / 2);
				if (j > 1 && j <= numFrets) {
					console.log("Drawing left fret line");
					ui.fretLeftLines.push(paper.path("M" + x + "," + topFretExtended + "L" + x + "," + bottomFretExtended + "z").attr("stroke", stringColor));
				}

				if (j > 0) {
					console.log("Drawing fret circle");
					drawFretCircle(j, circX, circY, topFretExtended, bottomFretExtended);

					if (j === 1) {
						// Draw a rectangle at the left of the first fret, which represents the nut.
						// + 1 to prevent fret division from appearing right next to it
						console.log("Drawing nut");
						ui.nut = paper.rect(x - (fretWidth / 5) + 1, topFretExtended, (fretWidth / 5), bottomFretExtended - topFretExtended).attr({
							fill: nutColor,
							stroke: nutColor
						});
					}
				}
			}
		}

		function drawGuitarStringAtLocation(i) {
		    console.log("drawing");
		    
			var stringY = calculateStringYCoordinate(i),
				j, x, y, circX, circY, circ, stringLetter, noteLetter,
				stringOctave, noteOctave, text, group,
				squareWidth, squareX, squareY, square, midX, midY, topX, topY, bottomX, bottomY,
				squareNoteText, squareOctaveText, squareOctaveTextX, squareOctaveTextY,
				topFretExtended = getTopFretExtended(),
				bottomFretExtended = getBottomFretExtended(),
				stringXBegin = getStringXBegin(),
				stringXEnd = getStringXEnd();

			ui.stringLines.push(paper.path("M" + stringXBegin + "," + stringY + "L" + stringXEnd + "," + stringY + "z").attr("stroke", stringColor).toFront());

			for (j = 0; j <= numFrets; j++) {
				// Coordinates for the left of the fret and string
				x = getFretLeftXVal(j);
				y = fretboardOrigin[1] + i * (fretHeight);

				// Coordinates for the center of the fret and string
				circX = x + fretWidth * (1 / 2);
				circY = y;

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

				// Store it for tracking
				ui.allRaphaelNotes[i][j] = group;
			}

			x = fretboardOrigin[0] - fretWidth;
			y = fretboardOrigin[1] + i * (fretHeight);

			squareWidth = noteTuningSquareWidth;
			squareX = x + squareWidth / 2 + (showTuningTriangles ? 0 : squareWidth);
			squareY = y - (squareWidth / 2)

			if (showTuningSquares) {
				square = paper.rect(squareX, squareY, squareWidth, squareWidth).attr("fill", tuningSquaresColor);

				ui.allRaphaelTuningSquares[i] = square;

				squareNoteText = paper.text(squareX + squareWidth / 2, squareY + squareWidth / 2, guitarStringNotes[i].noteLetter).attr({
					"font-size": letterFontSize,
					fill: tuningSquaresTextColor
				});

				ui.allRaphaelTuningSquareNoteLetters.push(squareNoteText);

				// Show the octave near the note on the tuning square
				squareOctaveTextX = squareX + (.80 * squareWidth);
				squareOctaveTextY = squareY + (.20 * squareWidth);

				squareOctaveText = paper.text(squareOctaveTextX, squareOctaveTextY, ui.allRaphaelNotes[i][0].stringOctave).attr({
					"font-size": letterFontSize,
					fill: tuningSquaresTextColor
				});

				ui.allRaphaelTuningSquareNoteOctaves.push(squareOctaveText);

				makeTextUnselectable(squareNoteText);
				makeTextUnselectable(squareOctaveText);
			}

			if (showTuningTriangles) {
				// Triangles for changing the string tunings
				midX = squareX + squareWidth * 2;
				midY = squareY + squareWidth / 2;
				topX = midX - squareWidth / 1.5;
				topY = midY - squareWidth / 2;
				bottomX = topX;
				bottomY = midY + squareWidth / 2;

				drawTuningTriangleAndBindEventHandlers(midX, midY, topX, topY, bottomX, bottomY, "right", i);

				midX = squareX - (showTuningSquares ? squareWidth : 0);
				midY = squareY + squareWidth / 2;
				topX = midX + squareWidth / 1.5;
				topY = midY - squareWidth / 2;
				bottomX = topX;
				bottomY = midY + squareWidth / 2;

				drawTuningTriangleAndBindEventHandlers(midX, midY, topX, topY, bottomX, bottomY, "left", i);
			}
		}

		function animateFretboardHeight(cb) {
			var topFretExtended = getTopFretExtended(),
				bottomFretExtended = getBottomFretExtended(),
				newHeight = bottomFretExtended - topFretExtended,
				i, circ,

				svgWidth = fretboardOrigin[0] + (numFrets + 1) * fretWidth + svgWidthBuffer,
			    svgHeight = fretboardOrigin[1] + ((guitarStringNotes.length - 1) * fretHeight) + fretHeight / 2;

			ui.$svg.css({
				"z-index": 1
			}).animate({
				height: svgHeight,
				width: svgWidth
			}, fretboardAnimationSpeed, null, cb);

			for (i = 0; i < ui.fretCircles.length; i++) {
				circ = ui.fretCircles[i];

				circ.animateWith(ui.$svg, null, {
					cy: topFretExtended + newHeight / 2
				}, fretboardAnimationSpeed)

				// Translation
				//circ.translate(0, (topFretExtended + newHeight / 2) - (circ.getBBox().y + fretCircRad));
			}

			ui.body.animateWith(ui.$svg, null, {
				height: newHeight
			}, fretboardAnimationSpeed);
			ui.nut.animateWith(ui.$svg, null, {
				height: newHeight
			}, fretboardAnimationSpeed);

			for (i = 0; i < ui.fretLeftLines.length; i++) {
				// ui.fretLeftLines has no lines for open note and first fret (which is covered by the nut)
				// so the first left line stored is actually for the 2nd fret, so add 2 to i
				var leftXVal = getFretLeftXVal(i + 2);
				// This path could be a function, it's used in the initial draw too
				ui.fretLeftLines[i].animateWith(ui.$svg, null, {
					path: "M" + leftXVal + "," + topFretExtended + "L" + leftXVal + "," + bottomFretExtended + "z"
				}, fretboardAnimationSpeed);
			}
		}

		function doPostDrawFixes() {
			ui.nut.toFront();
			ui.body.toBack();

			for (var i = 0; i < ui.allRaphaelNotes.length; i++) {
				for (var j = 0; j < ui.allRaphaelNotes[i].length; j++) {
					ui.allRaphaelNotes[i][j].toFront();
				}
			}
			
			setScrollBar();
		}

		function drawAndWireUpFretboard() {
			for (var i = 0; i < guitarStringNotes.length; i++) {
				drawGuitarStringAtLocation(i);
			}

			drawOneTimeElements();

			$window.on("load resize", function() {
				setScrollBar();
			});
			
			animateFretboardHeight(doPostDrawFixes);
		}

		function initVariables() {
		    extendedConfig = {};

		    $.extend(extendedConfig, config, settingsCopy);
		    
		    // create paper object (requires Raphael.js)
		    paper = new Raphael($fretboardContainer.attr('id'), '100%', '100%');
		    notesClickedTracker = [];
		    fretboardOrigin = extendedConfig.fretboardOrigin;
		    numFrets = extendedConfig.numFrets;
		    fretWidth = extendedConfig.fretWidth;
		    fretHeight = extendedConfig.fretHeight;
		    isChordMode = extendedConfig.isChordMode;
		    guitarStringNotes = extendedConfig.guitarStringNotes;
		    noteClickingDisabled = extendedConfig.noteClickingDisabled;
		    tuningClickingDisabled = extendedConfig.tuningClickingDisabled;
		    showTuningTriangles = extendedConfig.showTuningTriangles;
		    showTuningSquares = extendedConfig.showTuningSquares;
		    tuningSquaresColor = extendedConfig.tuningSquaresColor;
		    tuningSquaresTextColor = extendedConfig.tuningSquaresTextColor;
		
			validateNumFrets(numFrets);
            validateNotes(guitarStringNotes);

			ui = {
				$fretboardContainer: $fretboardContainer,
				$svg: $fretboardContainer.find("svg"),
				// This will be a 2-d array that holds each group (circle and text) for each guitar string.
				allRaphaelNotes: [],
				// The squares that show the each string's note letter.
				allRaphaelTuningSquares: [],
				allRaphaelTuningSquareNoteLetters: [],
				allRaphaelTuningSquareNoteOctaves: [],
				// Another 2-d array (since there are 2 per guitar string)
				allRaphaelTuningTriangles: [],
				// The rectangle that represents the body of the guitar
				body: null,
				nut: null,
				// The vertical lines that separate frets
				fretLeftLines: [],
				// The circles that you usually see on the 3rd, 5th, 7th, 9th, 12th, etc frets
				fretCircles: [],
				// The guitar strings
				stringLines: []
			}

			//Add inner array for 2d arrays
			for (var i = 0; i < guitarStringNotes.length; i++) {
				notesClickedTracker.push([]);
				ui.allRaphaelNotes.push([]);
				ui.allRaphaelTuningTriangles.push([]);
			}

			clickedNoteCircColor = extendedConfig.clickedNoteCircColor;
			clickedNoteTextColor = extendedConfig.clickedNoteTextColor;
			hoverNoteCircColor = extendedConfig.hoverNoteCircColor;
			hoverNoteTextColor = extendedConfig.hoverNoteTextColor;
			fretboardColor = extendedConfig.fretboardColor;
			stringColor = extendedConfig.stringColor;
			nutColor = extendedConfig.nutColor;
			tuningTriangleColor = extendedConfig.tuningTriangleColor;
			// Only the first octave needs to be specified (0,3,5,7,9)
			fretsToDrawOneCircleOn = extendedConfig.fretsToDrawOneCircleOn;
			opacityAnimateSpeed = extendedConfig.opacityAnimateSpeed;
			fretboardAnimationSpeed = extendedConfig.fretboardAnimationSpeed;
			letterFontSize = extendedConfig.fretHeight / 4;
			noteCircRad = extendedConfig.fretHeight / 2.5;
			fretCircRad = noteCircRad / 3;
			noteTuningSquareWidth = extendedConfig.fretHeight / 1.35;
			svgWidth = 0;
			svgHeight = 0;
			svgWidthBuffer = 0;
			$window = $(window);
		}

		init();
	}
})(jQuery);
