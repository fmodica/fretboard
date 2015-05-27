"use strict";

describe("Fretboard", function() {
    var $fretboard;
    var fretboardInstance;

    beforeEach(function() {
        setFixtures("<div class='my-fretboard-js'></div>");

        $fretboard = $(".my-fretboard-js");
        $fretboard.fretboard();
        fretboardInstance = $fretboard.data('fretboard');
    });

    describe("Default configuration", function() {
        var standardTuning = [{
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
        }];
        var numFrets = 15;
        var noteCircles = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
        var noteLetters = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "Ab/G#", "A", "A#/Bb", "B"];
        var animationSpeed = 500;
        
        it("should have standard tuning", function() {
            expect(fretboardInstance.getTuning()).toEqual(standardTuning);
        });

        it("should have " + numFrets + " frets", function() {
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

        it("should have an animation speed of " + animationSpeed, function() {
            expect(fretboardInstance.getAnimationSpeed()).toEqual(animationSpeed);
        });

        it("should have the correct height (fill its container)", function() {
            var height = $fretboard.height();

            expect(fretboardInstance.getDimensions().height).toEqual(height);
        });
    });

    describe("Clicking notes", function() {
        var cMaj7Notes = [{
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

        it("should show the correct clicked Notes ", function() {
            fretboardInstance.setClickedNotes(cMaj7Notes);

            var expectedClickedNotes = $.extend(true, [], cMaj7Notes);

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

            var clickedNotes = fretboardInstance.getClickedNotes();

            expect(clickedNotes).toEqual(expectedClickedNotes);
        });

    });

    afterEach(function() {
        fretboardInstance.destroy();
    });
});