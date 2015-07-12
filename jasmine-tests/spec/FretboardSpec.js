"use strict";

// TODO Pass in different config values
// TODO Pass in bad config values
// TODO change the tuning to have completely different letters (check the notes, and the clicked notes letter/octave and stringItsOn properties)
// TODO Scale and chord mode tests
// TODO Programmatic notes in chord mode should not remove other notes

describe("Fretboard", function() {
    var $fretboard;
    var fretboardInstance;
    var eightStringTuning;
    var standardTuning;
    var numFrets;
    var noteCircles;
    var noteLetters;
    var animationSpeed;
    var checkCorrectNotesFunc;

    beforeEach(function() {
        setFixtures("<div class='my-fretboard-js'></div>");
        $fretboard = $(".my-fretboard-js");
        numFrets = 15;
        noteCircles = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
        noteLetters = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "Ab/G#", "A", "A#/Bb", "B"];
        animationSpeed = 500;
        eightStringTuning = [{
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

        standardTuning = $.extend(true, [], eightStringTuning).slice(0, 6);

        checkCorrectNotesFunc = function(tuning, numFrets) {
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
    });

    afterEach(function() {
        fretboardInstance.destroy();
    });

    describe("Default configuration", function() {
        beforeEach(function() {
            $fretboard.fretboard();
            fretboardInstance = $fretboard.data('fretboard');
        });

        it("should return standard tuning", function() {
            expect(fretboardInstance.getTuning()).toEqual(standardTuning);
        });

        it("should return the correct number of frets", function() {
            expect(fretboardInstance.getNumFrets()).toEqual(numFrets);
        });

        it("should return the correct chord mode", function() {
            expect(fretboardInstance.getChordMode()).toEqual(true);
        });

        it("should return the correct circles", function() {
            expect(fretboardInstance.getNoteCircles()).toEqual(noteCircles);
        });

        it("should return the correct list of possible note letters", function() {
            expect(fretboardInstance.getAllNoteLetters()).toEqual(noteLetters);
        });

        it("should return the correct note-clicking-enabled value", function() {
            expect(fretboardInstance.getNoteClickingDisabled()).toEqual(false);
        });

        it("should return the correct animation speed", function() {
            expect(fretboardInstance.getAnimationSpeed()).toEqual(animationSpeed);
        });

        it("should return the correct height (fill its container)", function() {
            expect(fretboardInstance.getDimensions().height).toEqual($fretboard.height());
        });

        it("should return no clicked notes", function() {
            expect(fretboardInstance.getClickedNotes()).toEqual([]);
        });

        it("should return the correct notes", function() {
            checkCorrectNotesFunc(standardTuning, numFrets);
        });
    });

    describe("Custom configuration", function() {
        it("should return the correct list of possible note letters when reversed", function() {
            noteLetters.reverse();

            $fretboard.fretboard({ allNoteLetters : noteLetters });
            fretboardInstance = $fretboard.data('fretboard');

            expect(fretboardInstance.getAllNoteLetters()).toEqual(noteLetters);
        });

        it("should throw an exception when there are more than 12 notes", function() {
            noteLetters.push("X");

            expect(function() {
                $fretboard.fretboard({ allNoteLetters : noteLetters });
            }).toThrow();
        });

        it("should throw an exception when there are 12 notes and one is not unique", function() {
            noteLetters[11] = "C";

            expect(function() {
                $fretboard.fretboard({ allNoteLetters : noteLetters });
            }).toThrow();
        });
    });

    describe("Changing the fretboard's dimensions", function() {
        beforeEach(function() {
            $fretboard.fretboard();
            fretboardInstance = $fretboard.data('fretboard');
        });

        it("should return the correct number of frets when the fret number is increased", function() {
            var increase = numFrets + 12;
            
            fretboardInstance.setNumFrets(increase);

            expect(fretboardInstance.getNumFrets()).toEqual(increase);
        });

        it("should return the correct notes when the fret number is increased", function() {
            var increase = numFrets + 12;
            var allNotes = fretboardInstance.getAllNotes();

            fretboardInstance.setNumFrets(increase);

            checkCorrectNotesFunc(standardTuning, increase);
        });

        it("should return the correct number of frets when the fret number is decreased", function() {
            var decrease = numFrets - 12;
            
            fretboardInstance.setNumFrets(decrease);

            expect(fretboardInstance.getNumFrets()).toEqual(decrease);
        });

        it("should return the correct notes when the fret number is decreased", function() {
            var decrease = numFrets - 12;
            var allNotes = fretboardInstance.getAllNotes();

            fretboardInstance.setNumFrets(decrease);

            checkCorrectNotesFunc(standardTuning, decrease);
        });
    });

    describe("Clicking notes programatically", function() {
        var clickedNotes;
        var expectedClickedNotes;
        var lowestClickedFret;

        beforeEach(function() {
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
            expectedClickedNotes[1].letter = "E";
            expectedClickedNotes[1].octave = 4;
            expectedClickedNotes[2].letter = "B";
            expectedClickedNotes[2].octave = 3;
            expectedClickedNotes[3].letter = "G";
            expectedClickedNotes[3].octave = 3;
            expectedClickedNotes[4].letter = "C";
            expectedClickedNotes[4].octave = 3;
            expectedClickedNotes[5].letter = "G";
            expectedClickedNotes[5].octave = 2;

            lowestClickedFret = 3;
        });

        it("should return the correct clicked notes when notes are clicked on each string and all of those notes exist on the fretboard", function() {
            fretboardInstance.setClickedNotes(clickedNotes);

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes);
        });

        it("should return the correct clicked notes when some notes are clicked on strings that don't exist", function() {
            fretboardInstance.setTuning(standardTuning.slice(0,1));
            fretboardInstance.setClickedNotes(clickedNotes);

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes.slice(0,1));
        });

        it("should return the correct clicked notes when notes are clicked on each string and some are out of the fret range", function() {
            clickedNotes[0].fretNumber = -1;
            clickedNotes[1].fretNumber = numFrets + 1;
            fretboardInstance.setClickedNotes(clickedNotes);

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes.slice(2, expectedClickedNotes.length));
        });

        it("should return the correct clicked notes when notes are clicked on each string, all of those notes exist on the fretboard, and the number of strings is decreased", function() {
            fretboardInstance.setClickedNotes(clickedNotes);
            fretboardInstance.setTuning(standardTuning.slice(0,1));

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes.slice(0,1));
        });

        it("should return the correct clicked notes when notes are clicked on each string, all of those notes exist on the fretboard, and the number of strings is increased", function() {
            fretboardInstance.setClickedNotes(clickedNotes);
            fretboardInstance.setTuning(eightStringTuning);

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes);
        });

        it("should return the correct clicked notes when notes are clicked on each string, all of those notes exist on the fretboard, and the number of frets is decreased", function() {
            fretboardInstance.setClickedNotes(clickedNotes);
            fretboardInstance.setNumFrets(lowestClickedFret);

            expectedClickedNotes = expectedClickedNotes.filter(function(note) {
                return note.fretNumber === lowestClickedFret;
            });

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes);
        });

        it("should return the correct clicked notes when notes are clicked on each string, all of those notes exist on the fretboard, and the number of frets is increased", function() {
            fretboardInstance.setClickedNotes(clickedNotes);
            fretboardInstance.setNumFrets(numFrets + 1);

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes);
        });
    });
});