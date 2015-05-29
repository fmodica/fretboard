"use strict";

describe("Fretboard", function() {
    var $fretboard;
    var fretboardInstance;
    var eightStringTuning;
    var standardTuning;
    var numFrets;
    var noteCircles;
    var noteLetters;
    var animationSpeed;

    beforeEach(function() {
        setFixtures("<div class='my-fretboard-js'></div>");
        $fretboard = $(".my-fretboard-js");
        $fretboard.fretboard();
        fretboardInstance = $fretboard.data('fretboard');
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
    });

    afterEach(function() {
        fretboardInstance.destroy();
    });

    describe("Default configuration", function() {
        it("should have standard tuning", function() {
            expect(fretboardInstance.getTuning()).toEqual(standardTuning);
        });

        it("should have the right number of frets", function() {
            expect(fretboardInstance.getNumFrets()).toEqual(numFrets);
        });

        it("should be in chord mode", function() {
            expect(fretboardInstance.getChordMode()).toEqual(true);
        });

        it("should have the correct note circles", function() {
            expect(fretboardInstance.getNoteCircles()).toEqual(noteCircles);
        });

        it("should have the correct list of possible note letters", function() {
            expect(fretboardInstance.getAllNoteLetters()).toEqual(noteLetters);
        });

        it("should have note clicking enabled", function() {
            expect(fretboardInstance.getNoteClickingDisabled()).toEqual(false);
        });

        it("should have the correct animation speed", function() {
            expect(fretboardInstance.getAnimationSpeed()).toEqual(animationSpeed);
        });

        it("should have the correct height (fill its container)", function() {
            expect(fretboardInstance.getDimensions().height).toEqual($fretboard.height());
        });

        it("should have no clicked notes", function() {
            expect(fretboardInstance.getClickedNotes()).toEqual([]);
        });

        it("should have the correct notes", function() {
            var allNotes = fretboardInstance.getAllNotes();

            for (var i = 0; i < allNotes.length; i++) {
                var currentString = allNotes[i];
                var currentTuningNote = standardTuning[i];

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
        });
    });

    describe("Changing the fretboard's dimensions", function() {
        it("should have the correct fret number when the fret number is increased", function() {
            var increase = numFrets + 10;

            fretboardInstance.setNumFrets(increase);

            expect(fretboardInstance.getNumFrets()).toEqual(increase);
        });
    });

    describe("Clicking notes", function() {
        var clickedNotes;
        var expectedClickedNotes;
        var lowestClickedFret;

        beforeEach(function() {
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
            // so add that to the comparison array so they match the original
            // clicked notes.
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

        it("should show the correct clicked notes when notes are clicked on each string and all of those notes exist on the fretboard", function() {
            fretboardInstance.setClickedNotes(clickedNotes);

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes);
        });

        it("should show the correct clicked notes when notes are clicked on strings that don't exist", function() {
            fretboardInstance.setTuning(standardTuning.slice(0,1));
            fretboardInstance.setClickedNotes(clickedNotes);

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes.slice(0,1));
        });

        it("should show the correct clicked notes when notes are clicked on each string and some are out of the fret range", function() {
            clickedNotes[0].fretNumber = -1;
            clickedNotes[1].fretNumber = numFrets + 1;
            fretboardInstance.setClickedNotes(clickedNotes);

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes.slice(2, expectedClickedNotes.length));
        });

        it("should show the correct clicked notes when notes are clicked on each string and the number of strings is decreased", function() {
            fretboardInstance.setClickedNotes(clickedNotes);
            fretboardInstance.setTuning(standardTuning.slice(0,1));

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes.slice(0,1));
        });

        it("should show the correct clicked notes when notes are clicked on each string and the number of strings is increased", function() {
            fretboardInstance.setClickedNotes(clickedNotes);
            fretboardInstance.setTuning(eightStringTuning);

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes);
        });

        it("should show the correct clicked notes when notes are clicked on each string and the number of frets is decreased", function() {
            fretboardInstance.setClickedNotes(clickedNotes);
            fretboardInstance.setNumFrets(lowestClickedFret);

            expectedClickedNotes = expectedClickedNotes.filter(function(note) {
                return note.fretNumber === lowestClickedFret;
            });

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes);
        });

        it("should show the correct clicked notes when notes are clicked on each string and the number of frets is increased", function() {
            fretboardInstance.setClickedNotes(clickedNotes);
            fretboardInstance.setNumFrets(numFrets + 1);

            expect(fretboardInstance.getClickedNotes()).toEqual(expectedClickedNotes);
        });
    });
});