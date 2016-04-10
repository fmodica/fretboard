"use strict";

// TODO Pass in different/bad config values
// TODO change the tuning to have completely different letters (check the notes, and the clicked notes letter/octave and stringItsOn properties)
// TODO Scale and chord mode tests
// TODO Programmatic notes in chord mode should not remove other notes
// TODO Note mode
// TODO Change the tuning to the same tuning
// TODO Change the fret number to the same fret number
// TODO More detailed check of exception messages
// TODO try to add new notes clicked listener
describe("Fretboard", function () {
    var eightStringTuning = [{
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
    }, {
        letter: "B",
        octave: 1
    }, {
        letter: "F#/Gb",
        octave: 1
    }];
    var standardTuning = $.extend(true, [], eightStringTuning).slice(0, 6);
    var noteCircles = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
    var defaultNoteLetters = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "Ab/G#", "A", "A#/Bb", "B"];
    var defaultIntervalSettings = {
        intervals: ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'],
        root: defaultNoteLetters[0]
    };
    var defaultNoteMode = 'letter'; // or 'interval'
    var checkCorrectNotesFunc = function (tuning, numFrets, noteLetters) {
        var allNotes = fretboardInstance.getAllNotes();

        expect(allNotes.length).toEqual(tuning.length);

        for (var i = 0; i < allNotes.length; i++) {
            var currentString = allNotes[i];
            var currentTuningNote = tuning[i];

            expect(currentString.length).toEqual(numFrets + 1);

            for (var j = 0; j < currentString.length; j++) {
                var currentNote = currentString[j];
                var currentNoteLetterIndex = noteLetters.indexOf(currentNote.letter);

                expect(currentNoteLetterIndex).not.toEqual(-1);
                expect(currentNote.fretNumber).toEqual(j);
                expect(currentNote.stringItsOn).toEqual(currentTuningNote);

                if (j === 0) {
                    expect(currentNote.letter).toEqual(currentTuningNote.letter);
                    expect(currentNote.octave).toEqual(currentTuningNote.octave);
                } else {
                    var lastNote = currentString[j - 1];
                    var lastNoteIndex = noteLetters.indexOf(lastNote.letter);
                    var expectedLastNoteIndex = (currentNoteLetterIndex === 0 ? 11 : currentNoteLetterIndex - 1);
                    var expectedLastNoteOctave = (currentNoteLetterIndex === 0 ? currentNote.octave - 1 : currentNote.octave);

                    expect(lastNoteIndex).toEqual(expectedLastNoteIndex);
                    expect(lastNote.octave).toEqual(expectedLastNoteOctave);
                }
            }
        }
    };
    var defaultNumFrets = 15;
    var defaultAnimationSpeed = 500;
    var $fretboard;
    var fretboardInstance;

    beforeEach(function () {
        setFixtures("<div class='my-fretboard-js'></div>");
        $fretboard = $(".my-fretboard-js");
    });

    afterEach(function () {
        fretboardInstance.destroy();
    });

    describe("Default configuration", function () {
        beforeEach(function () {
            $fretboard.fretboard();
            fretboardInstance = $fretboard.data('fretboard');
        });

        // Configuration properties
        it("should return the correct allNoteLetters", function () {
            expect(fretboardInstance.getAllNoteLetters()).toEqual(defaultNoteLetters);
        });

        it("should return standard tuning", function () {
            expect(fretboardInstance.getTuning()).toEqual(standardTuning);
        });

        it("should return " + defaultNumFrets + " frets", function () {
            expect(fretboardInstance.getNumFrets()).toEqual(defaultNumFrets);
        });

        it("should return chord mode true", function () {
            expect(fretboardInstance.getChordMode()).toEqual(true);
        });

        it("should return note-clicking-disabled false", function () {
            expect(fretboardInstance.getNoteClickingDisabled()).toEqual(false);
        });

        it("should return the correct note mode", function () {
            expect(fretboardInstance.getNoteMode()).toEqual(defaultNoteMode);
        });

        it("should return the correct interval settings", function () {
            expect(fretboardInstance.getIntervalSettings()).toEqual(defaultIntervalSettings);
        });

        it("should return animation speed " + defaultAnimationSpeed, function () {
            expect(fretboardInstance.getAnimationSpeed()).toEqual(defaultAnimationSpeed);
        });

        it("should return the correct circles", function () {
            expect(fretboardInstance.getNoteCircles()).toEqual(noteCircles);
        });

        // Test dimensionsFunc and onClickedNotesChange funcs?

        // Additional
        it("should return no clicked notes", function () {
            expect(fretboardInstance.getClickedNotes()).toEqual([]);
        });

        it("should return the correct notes for the whole fretboard", function () {
            checkCorrectNotesFunc(standardTuning, defaultNumFrets, defaultNoteLetters);
        });
    });

    describe("Custom configuration", function () {
        it("should throw an exception when allNoteLetters is null", function () {
            expect(function () {
                $fretboard.fretboard({ allNoteLetters: null });
            }).toThrow();
        });

        it("should throw an exception when an item in allNoteLetters is null", function () {
            var noteLettersWithNull = $.extend(true, [], defaultNoteLetters);
            noteLettersWithNull[0] = null;
            expect(function () {
                $fretboard.fretboard({ allNoteLetters: noteLettersWithNull });
            }).toThrow();
        });

        it("should throw an exception when allNoteLetters has more than 12 items", function () {
            var noteLettersTooMany = $.extend(true, [], defaultNoteLetters);
            noteLettersTooMany.push("X");
            expect(function () {
                $fretboard.fretboard({ allNoteLetters: noteLettersTooMany });
            }).toThrow();
        });

        it("should throw an exception when allNoteLetters has less than 12 items", function () {
            var noteLettersTooFew = $.extend(true, [], defaultNoteLetters);
            noteLettersTooFew = noteLettersTooFew.slice(0, 11);
            expect(function () {
                $fretboard.fretboard({ allNoteLetters: noteLettersTooFew });
            }).toThrow();
        });

        it("should throw an exception when allNoteLetters is not unique", function () {
            var nonUniqueNoteLetters = $.extend(true, [], defaultNoteLetters);
            nonUniqueNoteLetters[11] = nonUniqueNoteLetters[0];
            expect(function () {
                $fretboard.fretboard({ allNoteLetters: nonUniqueNoteLetters });
            }).toThrow();
        });

        it("should return the correct allNoteLetters when they are reversed", function () {
            var reversedNoteLetters = $.extend(true, [], defaultNoteLetters).reverse();
            $fretboard.fretboard({ allNoteLetters: reversedNoteLetters });
            fretboardInstance = $fretboard.data('fretboard');
            expect(fretboardInstance.getAllNoteLetters()).toEqual(reversedNoteLetters);
        });

        it("should throw an exception when tuning is null", function () {
            expect(function () {
                $fretboard.fretboard({ tuning: null });
            }).toThrow();
        });

        it("should throw an exception when tuning is empty", function () {
            expect(function () {
                $fretboard.fretboard({ tuning: [] });
            }).toThrow();
        });

        it("should throw an exception when tuning is not unique", function () {
            var nonUniqueTuning = $.extend(true, [], standardTuning);
            nonUniqueTuning[5] = nonUniqueTuning[0];
            expect(function () {
                $fretboard.fretboard({ tuning: nonUniqueTuning });
            }).toThrow();
        });

        it("should throw an exception when an item in tuning is null", function () {
            var tuningWithNull = $.extend(true, [], standardTuning);
            tuningWithNull[0] = null;
            expect(function () {
                $fretboard.fretboard({ tuning: tuningWithNull });
            }).toThrow();
        });

        it("should throw an exception when tuning contains a letter not in allNoteLetters", function () {
            var tuningWithWrongLetter = $.extend(true, [], standardTuning);
            tuningWithWrongLetter[0].letter = "C #";
            expect(function () {
                $fretboard.fretboard({ tuning: tuningWithWrongLetter });
            }).toThrow();
        });

        it("should throw an exception when tuning contains an octave that is not a number", function () {
            var tuningWithWrongOctave = $.extend(true, [], standardTuning);
            tuningWithWrongOctave[0].octave = "X";
            expect(function () {
                $fretboard.fretboard({ tuning: tuningWithWrongOctave });
            }).toThrow();
        });

        it("should throw an exception when numFrets is 0", function () {
            expect(function () {
                $fretboard.fretboard({ numFrets: 0 });
            }).toThrow();
        });

        it("should throw an exception when numFrets is less than 0", function () {
            expect(function () {
                $fretboard.fretboard({ numFrets: -24 });
            }).toThrow();
        });

        it("should throw an exception when numFrets is not a number", function () {
            expect(function () {
                $fretboard.fretboard({ numFrets: "X" });
            }).toThrow();
        });

        it("should return the correct number of frets when numFrets is nonzero", function () {
            var numFrets = 24;
            $fretboard.fretboard({ numFrets: numFrets });
            fretboardInstance = $fretboard.data('fretboard');
            expect(fretboardInstance.getNumFrets()).toEqual(numFrets);
        });
    });

    describe("Changing the fretboard's dimensions", function () {
        beforeEach(function () {
            $fretboard.fretboard();
            fretboardInstance = $fretboard.data('fretboard');
        });

        it("should return the correct number of frets when the fret number is increased", function () {
            var increase = defaultNumFrets + 12;

            fretboardInstance.setNumFrets(increase);

            expect(fretboardInstance.getNumFrets()).toEqual(increase);
        });

        it("should return the correct notes when the fret number is increased", function () {
            var increase = defaultNumFrets + 12;
            var allNotes = fretboardInstance.getAllNotes();

            fretboardInstance.setNumFrets(increase);

            checkCorrectNotesFunc(standardTuning, increase, defaultNoteLetters);
        });

        it("should return the correct number of frets when the fret number is decreased", function () {
            var decrease = defaultNumFrets - 12;

            fretboardInstance.setNumFrets(decrease);

            expect(fretboardInstance.getNumFrets()).toEqual(decrease);
        });

        it("should return the correct notes when the fret number is decreased", function () {
            var decrease = defaultNumFrets - 12;
            var allNotes = fretboardInstance.getAllNotes();

            fretboardInstance.setNumFrets(decrease);

            checkCorrectNotesFunc(standardTuning, decrease, defaultNoteLetters);
        });
    });

    describe("Clicking notes programatically", function () {
        var clickedNotes;
        var expectedClickedNotes;
        var expectedIntervalInfo = {
            root: defaultIntervalSettings.root
        };
        var lowestClickedFret;

        beforeEach(function () {
            $fretboard.fretboard();
            fretboardInstance = $fretboard.data('fretboard');

            clickedNotes = [{
                stringItsOn: {
                    letter: "E",
                    octave: 4
                },
                fretNumber: 3
            }, {
                stringItsOn: {
                    letter: "B",
                    octave: 3
                },
                fretNumber: 5,
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
            }, {
                stringItsOn: {
                    letter: "E",
                    octave: 2
                },
                fretNumber: 3
            }];

            expectedClickedNotes = $.extend(true, [], clickedNotes);

            // The notes come back from the plugin with some more information, 
            // so add that to the comparison array so they match.
            expectedClickedNotes[0].letter = "G";
            expectedClickedNotes[0].octave = 4;
            expectedClickedNotes[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedNotes[0].intervalInfo.interval = "5";
            expectedClickedNotes[1].letter = "E";
            expectedClickedNotes[1].octave = 4;
            expectedClickedNotes[1].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedNotes[1].intervalInfo.interval = "3";
            expectedClickedNotes[2].letter = "B";
            expectedClickedNotes[2].octave = 3;
            expectedClickedNotes[2].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedNotes[2].intervalInfo.interval = "7";
            expectedClickedNotes[3].letter = "G";
            expectedClickedNotes[3].octave = 3;
            expectedClickedNotes[3].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedNotes[3].intervalInfo.interval = "5";
            expectedClickedNotes[4].letter = "C";
            expectedClickedNotes[4].octave = 3;
            expectedClickedNotes[4].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedNotes[4].intervalInfo.interval = "1";
            expectedClickedNotes[5].letter = "G";
            expectedClickedNotes[5].octave = 2;
            expectedClickedNotes[5].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedNotes[5].intervalInfo.interval = "5";

            lowestClickedFret = 3;
        });

        it("should return the correct clicked notes when notes are clicked on each string and all of those notes exist on the fretboard", function () {
            fretboardInstance.setClickedNotes(clickedNotes);

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes);
        });

        it("should throw an exception when some notes are clicked on strings that don't exist", function () {
            fretboardInstance.setTuning(standardTuning.slice(0, 1));
            expect(function () {
                fretboardInstance.setClickedNotes(clickedNotes);
            }).toThrow();
        });

        it("should return the correct clicked notes when notes are clicked on each string and some are out of the fret range", function () {
            clickedNotes[0].fretNumber = -1;
            clickedNotes[1].fretNumber = defaultNumFrets + 1;
            expect(function () {
                fretboardInstance.setClickedNotes(clickedNotes);
            }).toThrow();
        });

        it("should return the correct clicked notes when notes are clicked on each string, all of those notes exist on the fretboard, and the number of strings is decreased", function () {
            fretboardInstance.setClickedNotes(clickedNotes);
            fretboardInstance.setTuning(standardTuning.slice(0, 1));

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes.slice(0, 1));
        });

        it("should return the correct clicked notes when notes are clicked on each string, all of those notes exist on the fretboard, and the number of strings is increased", function () {
            fretboardInstance.setClickedNotes(clickedNotes);
            fretboardInstance.setTuning(eightStringTuning);

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes);
        });

        it("should return the correct clicked notes when notes are clicked on each string, all of those notes exist on the fretboard, and the number of frets is decreased", function () {
            fretboardInstance.setClickedNotes(clickedNotes);
            fretboardInstance.setNumFrets(lowestClickedFret);

            expectedClickedNotes = expectedClickedNotes.filter(function (note) {
                return note.fretNumber === lowestClickedFret;
            });

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes);
        });

        it("should return the correct clicked notes when notes are clicked on each string, all of those notes exist on the fretboard, and the number of frets is increased", function () {
            fretboardInstance.setClickedNotes(clickedNotes);
            fretboardInstance.setNumFrets(defaultNumFrets + 1);

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes);
        });
    });
});