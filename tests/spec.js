"use strict";

// TODO Note mode, interval settings (clicked notes)
describe("Fretboard jQuery plugin", function () {
    var defaultNoteLetters = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "Ab/G#", "A", "A#/Bb", "B"];
    var defaultTuning = [
        {
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
        }
    ];
    var defaultNumFrets = 15;
    var defaultIsChordMode = true;
    var defaultNoteClickingDisabled = false;
    var defaultNoteMode = "letter";
    var defaultIntervals = ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"];
    var defaultRoot = defaultNoteLetters[0];
    var defaultAnimationSpeed = 400;
    var defaultNoteCircles = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
    var defaultDimensionsFuncType = typeof function () { };
    var defaultClickedNotes = [];
    var defaultNotesClickedCallbackType = typeof function () { };

    var cMaj7ChordForStandardTuning = [{
        string: {
            letter: "E",
            octave: 4
        },
        notes: [{
            fret: 3
        }]
    }, {
        string: {
            letter: "B",
            octave: 3
        },
        notes: [{
            fret: 5
        }]
    }, {
        string: {
            letter: "G",
            octave: 3
        },
        notes: [{
            fret: 4
        }]
    }, {
        string: {
            letter: "D",
            octave: 3
        },
        notes: [{
            fret: 5
        }]
    }, {
        string: {
            letter: "A",
            octave: 2
        },
        notes: [{
            fret: 3
        }]
    }, {
        string: {
            letter: "E",
            octave: 2
        },
        notes: [{
            fret: 3
        }]
    }];

    describe("Configuration", function () {
        var $fretboard;
        var api;

        beforeEach(function () {
            $fretboard = $("<div class='my-fretboard-js'></div>");
            $fretboard.fretboard();
            api = $fretboard.data("api");
        });

        afterEach(function () {
            api.destroy();
        });

        it("should return the correct default configuration", function () {
            expect(api.getNoteLetters()).toEqual(defaultNoteLetters);
            expect(api.getTuning()).toEqual(defaultTuning);
            expect(api.getNumFrets()).toEqual(defaultNumFrets);
            expect(api.getChordMode()).toEqual(defaultIsChordMode);
            expect(api.getNoteClickingDisabled()).toEqual(defaultNoteClickingDisabled);
            expect(api.getNoteMode()).toEqual(defaultNoteMode);
            expect(api.getIntervals()).toEqual(defaultIntervals);
            expect(api.getRoot()).toEqual(defaultRoot);
            expect(api.getAnimationSpeed()).toEqual(defaultAnimationSpeed);
            expect(api.getNoteCircles()).toEqual(defaultNoteCircles);
            expect(typeof api.getDimensionsFunc()).toEqual(defaultDimensionsFuncType);
            expect(typeof api.getNotesClickedCallback()).toEqual(defaultNotesClickedCallbackType);

            verifyAllNotesOnFretboard(api.getAllNotes(), defaultTuning, defaultNumFrets, defaultNoteLetters);
            expect(api.getClickedNotes()).toEqual(defaultClickedNotes);
        });

        it("should return the correct custom noteLetters", function () {
            var reversedNoteLetters = $.extend(true, [], defaultNoteLetters).reverse();

            $fretboard.fretboard({ noteLetters: reversedNoteLetters });
            api = $fretboard.data("api");

            expect(api.getNoteLetters()).toEqual(reversedNoteLetters);
        });

        it("should throw an exception when noteLetters is null", function () {
            expect(function () {
                $fretboard.fretboard({ noteLetters: null });
            }).toThrow();
        });

        it("should throw an exception when an item in noteLetters is null", function () {
            var noteLettersWithNull = $.extend(true, [], defaultNoteLetters);

            noteLettersWithNull[0] = null;

            expect(function () {
                $fretboard.fretboard({ noteLetters: noteLettersWithNull });
            }).toThrow();
        });

        it("should throw an exception when noteLetters has more than 12 items", function () {
            var noteLettersTooMany = $.extend(true, [], defaultNoteLetters);

            noteLettersTooMany.push("X");

            expect(function () {
                $fretboard.fretboard({ noteLetters: noteLettersTooMany });
            }).toThrow();
        });

        it("should throw an exception when noteLetters has less than 12 items", function () {
            var noteLettersTooFew = $.extend(true, [], defaultNoteLetters);

            noteLettersTooFew = noteLettersTooFew.slice(0, 11);

            expect(function () {
                $fretboard.fretboard({ noteLetters: noteLettersTooFew });
            }).toThrow();
        });

        it("should throw an exception when noteLetters is not unique", function () {
            var nonUniqueNoteLetters = $.extend(true, [], defaultNoteLetters);

            nonUniqueNoteLetters[11] = nonUniqueNoteLetters[0];

            expect(function () {
                $fretboard.fretboard({ noteLetters: nonUniqueNoteLetters });
            }).toThrow();
        });

        it("should return the correct custom tuning and getAllNotes", function () {
            var reversedTuning = $.extend(true, [], defaultTuning).reverse();

            $fretboard.fretboard({ tuning: reversedTuning });
            api = $fretboard.data("api");

            expect(api.getTuning()).toEqual(reversedTuning);
            verifyAllNotesOnFretboard(api.getAllNotes(), reversedTuning, defaultNumFrets, defaultNoteLetters);
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
            var nonUniqueTuning = $.extend(true, [], defaultTuning);

            nonUniqueTuning[5] = nonUniqueTuning[0];

            expect(function () {
                $fretboard.fretboard({ tuning: nonUniqueTuning });
            }).toThrow();
        });

        it("should throw an exception when an item in tuning is null", function () {
            var tuningWithNull = $.extend(true, [], defaultTuning);

            tuningWithNull[0] = null;

            expect(function () {
                $fretboard.fretboard({ tuning: tuningWithNull });
            }).toThrow();
        });

        it("should throw an exception when tuning contains a letter not in noteLetters", function () {
            var tuningWithWrongLetter = $.extend(true, [], defaultTuning);

            tuningWithWrongLetter[0].letter = "C #";

            expect(function () {
                $fretboard.fretboard({ tuning: tuningWithWrongLetter });
            }).toThrow();
        });

        it("should throw an exception when tuning contains an octave that is not a number", function () {
            var tuningWithWrongOctave = $.extend(true, [], defaultTuning);

            tuningWithWrongOctave[0].octave = "X";

            expect(function () {
                $fretboard.fretboard({ tuning: tuningWithWrongOctave });
            }).toThrow();
        });

        it("should return the correct custom numFrets", function () {
            var numFrets = 24;

            $fretboard.fretboard({ numFrets: numFrets });
            api = $fretboard.data("api");

            expect(api.getNumFrets()).toEqual(numFrets);
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

        it("should return the correct custom chord mode", function () {
            var isChordMode = !defaultIsChordMode;

            $fretboard.fretboard({ isChordMode: isChordMode });
            api = $fretboard.data("api");

            expect(api.getChordMode()).toEqual(isChordMode);
        });

        it("should return the correct custom noteClickingDisabled", function () {
            var noteClickingDisabled = !noteClickingDisabled;

            $fretboard.fretboard({ noteClickingDisabled: noteClickingDisabled });
            api = $fretboard.data("api");

            expect(api.getNoteClickingDisabled()).toEqual(noteClickingDisabled);
        });

        it("should return the correct custom noteMode", function () {
            var noteMode = "interval";

            $fretboard.fretboard({ noteMode: noteMode });
            api = $fretboard.data("api");

            expect(api.getNoteMode()).toEqual(noteMode);
        });

        it("should throw an exception when noteMode is not \"letter\" or \"interval\"", function () {
            var noteMode = "wrong";

            expect(function () {
                $fretboard.fretboard({ noteMode: noteMode });
            }).toThrow();
        });

        it("should return the correct custom intervals", function () {
            var intervals = ["1", "b9", "9", "b3", "3", "11", "#11", "5", "b13", "13", "b7", "7"];
            var root = defaultNoteLetters[5];

            $fretboard.fretboard({ intervals: intervals });
            api = $fretboard.data("api");

            expect(api.getIntervals()).toEqual(intervals);
        });

        it("should return the correct custom root", function () {
            var root = defaultNoteLetters[5];

            $fretboard.fretboard({ root: root });
            api = $fretboard.data("api");

            expect(api.getRoot()).toEqual(root);
        });

        it("should throw an exception when the intervals array is null", function () {
            expect(function () {
                $fretboard.fretboard({ intervals: null });
            }).toThrow();
        });

        it("should throw an exception when the root is null", function () {
            expect(function () {
                $fretboard.fretboard({ root: null });
            }).toThrow();
        });

        it("should throw an exception when the root is not in noteLetters", function () {
            expect(function () {
                $fretboard.fretboard({ root: "Asharp" });
            }).toThrow();
        });

        it("should throw an exception when there are more than 12 intervals", function () {
            var intervals = ["1", "b9", "9", "b3", "3", "11", "#11", "5", "b13", "13", "b7", "7", "8"];

            expect(function () {
                $fretboard.fretboard({ intervals: intervals });
            }).toThrow();
        });

        it("should throw an exception when there are less than 12 intervals", function () {
            var intervals = ["1", "b9", "9", "b3", "3", "11", "#11", "5", "b13", "13", "b7"];

            expect(function () {
                $fretboard.fretboard({ intervals: intervals });
            }).toThrow();
        });

        it("should throw an exception when the intervals are not unique", function () {
            var intervals = ["1", "b9", "9", "b3", "3", "11", "#11", "5", "b13", "13", "13"];

            expect(function () {
                $fretboard.fretboard({ intervals: intervals });
            }).toThrow();
        });

        it("should return the correct custom animationSpeed", function () {
            var animationSpeed = defaultAnimationSpeed - 100;

            $fretboard.fretboard({ animationSpeed: animationSpeed });
            api = $fretboard.data("api");

            expect(api.getAnimationSpeed()).toEqual(animationSpeed);
        });

        it("should return the correct custom noteCircles", function () {
            var noteCircles = [0, 6, 12];

            $fretboard.fretboard({ noteCircles: noteCircles });
            api = $fretboard.data("api");

            expect(api.getNoteCircles()).toEqual(noteCircles);
        });

        it("should call the custom dimensionsFunc callback", function (done) {
            var config = {
                dimensionsFunc: function () { return {}; }
            };

            spyOn(config, 'dimensionsFunc').and.callThrough();

            $fretboard.fretboard(config);
            api = $fretboard.data("api");

            var numFrets = 24;

            api.setNumFrets(numFrets);

            // Drawing is async (after a setTimeout)
            setTimeout(function () {
                expect(config.dimensionsFunc).toHaveBeenCalled();
                done();
            });
        });

        it("should call the custom notesClickedCallback function when clicking notes as a user", function () {
            var tempObj = {
                func1: function () { }
            };

            spyOn(tempObj, 'func1').and.callThrough();

            var config = {
                notesClickedCallback: tempObj.func1
            };

            $fretboard.fretboard(config);
            api = $fretboard.data("api");

            api.setClickedNotes([], true);

            expect(tempObj.func1).toHaveBeenCalled();
        });

        it("should not return any clickedNotes when they are on the config", function () {
            var config = {
                clickedNotes: cMaj7ChordForStandardTuning
            };

            $fretboard.fretboard(config);
            api = $fretboard.data("api");

            expect(api.getClickedNotes()).toEqual([]);
        });
    });

    describe("API", function () {
        var standardEightStringTuning = $.extend(true, [], defaultTuning);

        standardEightStringTuning.push(
            {
                letter: "B",
                octave: 1
            }, {
                letter: "F#/Gb",
                octave: 1
            }
        );

        var standardATuning = [{
            letter: "D",
            octave: 4
        }, {
            letter: "A",
            octave: 3
        }, {
            letter: "F",
            octave: 3
        }, {
            letter: "C",
            octave: 3
        }, {
            letter: "G",
            octave: 2
        }, {
            letter: "D",
            octave: 2
        }, {
            letter: "A",
            octave: 1
        }];

        var bFlatMaj7ChordForStandardATuning = [{
            string: {
                letter: "D",
                octave: 4
            },
            notes: [{
                fret: 3
            }]
        }, {
            string: {
                letter: "A",
                octave: 3
            },
            notes: [{
                fret: 5
            }]
        }, {
            string: {
                letter: "F",
                octave: 3
            },
            notes: [{
                fret: 4
            }]
        }, {
            string: {
                letter: "C",
                octave: 3
            },
            notes: [{
                fret: 5
            }]
        }, {
            string: {
                letter: "G",
                octave: 2
            },
            notes: [{
                fret: 3
            }]
        }, {
            string: {
                letter: "D",
                octave: 2
            },
            notes: [{
                fret: 3
            }]
        }];

        var scale = [{
            string: {
                letter: "E",
                octave: 4
            },
            notes: [{
                fret: 3
            }, {
                fret: 4
            }, {
                fret: 6
            }]
        }, {
            string: {
                letter: "B",
                octave: 3
            },
            notes: [{
                fret: 3
            }, {
                fret: 4
            }, {
                fret: 6
            }]
        }, {
            string: {
                letter: "G",
                octave: 3
            },
            notes: [{
                fret: 5
            }]
        }];

        var expectedClickedChordFromFretboard = $.extend(true, [], cMaj7ChordForStandardTuning);

        // The notes come back from the plugin with some more information.
        expectedClickedChordFromFretboard[0].notes[0].letter = "G";
        expectedClickedChordFromFretboard[0].notes[0].octave = 4;
        expectedClickedChordFromFretboard[0].notes[0].interval = "5";

        expectedClickedChordFromFretboard[1].notes[0].letter = "E";
        expectedClickedChordFromFretboard[1].notes[0].octave = 4;
        expectedClickedChordFromFretboard[1].notes[0].interval = "3";

        expectedClickedChordFromFretboard[2].notes[0].letter = "B";
        expectedClickedChordFromFretboard[2].notes[0].octave = 3;
        expectedClickedChordFromFretboard[2].notes[0].interval = "7";

        expectedClickedChordFromFretboard[3].notes[0].letter = "G";
        expectedClickedChordFromFretboard[3].notes[0].octave = 3;
        expectedClickedChordFromFretboard[3].notes[0].interval = "5";

        expectedClickedChordFromFretboard[4].notes[0].letter = "C";
        expectedClickedChordFromFretboard[4].notes[0].octave = 3;
        expectedClickedChordFromFretboard[4].notes[0].interval = "1";

        expectedClickedChordFromFretboard[5].notes[0].letter = "G";
        expectedClickedChordFromFretboard[5].notes[0].octave = 2;
        expectedClickedChordFromFretboard[5].notes[0].interval = "5";

        var expectedClickedChordFromFretboardForStandardATuning = $.extend(true, [], bFlatMaj7ChordForStandardATuning);

        expectedClickedChordFromFretboardForStandardATuning[0].notes[0].letter = "F";
        expectedClickedChordFromFretboardForStandardATuning[0].notes[0].octave = 4;
        expectedClickedChordFromFretboardForStandardATuning[0].notes[0].interval = "4";

        expectedClickedChordFromFretboardForStandardATuning[1].notes[0].letter = "D";
        expectedClickedChordFromFretboardForStandardATuning[1].notes[0].octave = 4;
        expectedClickedChordFromFretboardForStandardATuning[1].notes[0].interval = "2";

        expectedClickedChordFromFretboardForStandardATuning[2].notes[0].letter = "A";
        expectedClickedChordFromFretboardForStandardATuning[2].notes[0].octave = 3;
        expectedClickedChordFromFretboardForStandardATuning[2].notes[0].interval = "6";

        expectedClickedChordFromFretboardForStandardATuning[3].notes[0].letter = "F";
        expectedClickedChordFromFretboardForStandardATuning[3].notes[0].octave = 3;
        expectedClickedChordFromFretboardForStandardATuning[3].notes[0].interval = "4";

        expectedClickedChordFromFretboardForStandardATuning[4].notes[0].letter = "A#/Bb";
        expectedClickedChordFromFretboardForStandardATuning[4].notes[0].octave = 2;
        expectedClickedChordFromFretboardForStandardATuning[4].notes[0].interval = "b7";

        expectedClickedChordFromFretboardForStandardATuning[5].notes[0].letter = "F";
        expectedClickedChordFromFretboardForStandardATuning[5].notes[0].octave = 2;
        expectedClickedChordFromFretboardForStandardATuning[5].notes[0].interval = "4";

        var expectedClickedScaleFromFretboard = $.extend(true, [], scale);

        expectedClickedScaleFromFretboard[0].notes[0].letter = "G";
        expectedClickedScaleFromFretboard[0].notes[0].octave = 4;
        expectedClickedScaleFromFretboard[0].notes[0].interval = "5";

        expectedClickedScaleFromFretboard[0].notes[1].letter = "Ab/G#";
        expectedClickedScaleFromFretboard[0].notes[1].octave = 4;
        expectedClickedScaleFromFretboard[0].notes[1].interval = "b6";

        expectedClickedScaleFromFretboard[0].notes[2].letter = "A#/Bb";
        expectedClickedScaleFromFretboard[0].notes[2].octave = 4;
        expectedClickedScaleFromFretboard[0].notes[2].interval = "b7";

        expectedClickedScaleFromFretboard[1].notes[0].letter = "D";
        expectedClickedScaleFromFretboard[1].notes[0].octave = 4;
        expectedClickedScaleFromFretboard[1].notes[0].interval = "2";

        expectedClickedScaleFromFretboard[1].notes[1].letter = "D#/Eb";
        expectedClickedScaleFromFretboard[1].notes[1].octave = 4;
        expectedClickedScaleFromFretboard[1].notes[1].interval = "b3";

        expectedClickedScaleFromFretboard[1].notes[2].letter = "F";
        expectedClickedScaleFromFretboard[1].notes[2].octave = 4;
        expectedClickedScaleFromFretboard[1].notes[2].interval = "4";

        expectedClickedScaleFromFretboard[2].notes[0].letter = "C";
        expectedClickedScaleFromFretboard[2].notes[0].octave = 4;
        expectedClickedScaleFromFretboard[2].notes[0].interval = "1";

        var $fretboard;
        var api;

        beforeEach(function () {
            $fretboard = $("<div class='my-fretboard-js'></div>");
            $fretboard.fretboard();
            api = $fretboard.data("api");
        });

        afterEach(function () {
            api.destroy();
        });

        it("should return the correct tuning and getAllNotes when the tuning is changed", function () {
            api.setTuning(standardATuning);

            expect(api.getTuning()).toEqual(standardATuning);
            verifyAllNotesOnFretboard(api.getAllNotes(), standardATuning, defaultNumFrets, defaultNoteLetters);
        });

        it("should throw an exception when the new tuning is null", function () {
            expect(function () {
                api.setTuning(null);
            }).toThrow();
        });

        it("should throw an exception when tuning is empty", function () {
            expect(function () {
                api.setTuning([]);
            }).toThrow();
        });

        it("should throw an exception when tuning is not unique", function () {
            var nonUniqueTuning = $.extend(true, [], defaultTuning);

            nonUniqueTuning[5] = nonUniqueTuning[0];

            expect(function () {
                api.setTuning(nonUniqueTuning);
            }).toThrow();
        });

        it("should throw an exception when an item in tuning is null", function () {
            var tuningWithNull = $.extend(true, [], defaultTuning);

            tuningWithNull[0] = null;

            expect(function () {
                api.setTuning(tuningWithNull);
            }).toThrow();
        });

        it("should throw an exception when tuning contains a letter not in noteLetters", function () {
            var tuningWithWrongLetter = $.extend(true, [], defaultTuning);

            tuningWithWrongLetter[0].letter = "C #";

            expect(function () {
                api.setTuning(tuningWithWrongLetter);
            }).toThrow();
        });

        it("should throw an exception when tuning contains an octave that is not a number", function () {
            var tuningWithWrongOctave = $.extend(true, [], defaultTuning);

            tuningWithWrongOctave[0].octave = "X";

            expect(function () {
                api.setTuning(tuningWithWrongOctave);
            }).toThrow();
        });

        it("should return the correct numFrets and getAllNotes when numFrets is changed (increased)", function () {
            var increase = defaultNumFrets + 12;

            api.setNumFrets(increase);

            expect(api.getNumFrets()).toEqual(increase);
            verifyAllNotesOnFretboard(api.getAllNotes(), defaultTuning, increase, defaultNoteLetters);
        });

        it("should return the correct numFrets and getAllNotes when numFrets is changed (decreased)", function () {
            var decrease = defaultNumFrets - 12;

            api.setNumFrets(decrease);

            expect(api.getNumFrets()).toEqual(decrease);
            verifyAllNotesOnFretboard(api.getAllNotes(), defaultTuning, decrease, defaultNoteLetters);
        });

        it("should throw an exception when numFrets is 0", function () {
            expect(function () {
                api.setNumFrets(0);
            }).toThrow();
        });

        it("should throw an exception when numFrets is less than 0", function () {
            expect(function () {
                api.setNumFrets(-24);
            }).toThrow();
        });

        it("should throw an exception when numFrets is not a number", function () {
            expect(function () {
                api.setNumFrets("X");
            }).toThrow();
        });

        it("should return the correct isChordMode when it is changed", function () {
            var isChordMode = !defaultIsChordMode;

            api.setChordMode(isChordMode);

            expect(api.getChordMode()).toEqual(isChordMode);
        });

        it("should return the correct noteClickingDisabled when it is changed", function () {
            var noteClickingDisabled = !defaultNoteClickingDisabled;

            api.setChordMode(noteClickingDisabled);

            expect(api.getChordMode()).toEqual(noteClickingDisabled);
        });

        it("should return the correct noteMode when it is changed", function () {
            var noteMode = "interval";

            api.setNoteMode(noteMode);

            expect(api.getNoteMode()).toEqual(noteMode);
        });

        it("should throw an exception when noteMode is not \"letter\" or \"interval\"", function () {
            var noteMode = "wrong";

            expect(function () {
                api.setNoteMode(noteMode);
            }).toThrow();
        });

        it("should return the correct root when it is changed", function () {
            api.setRoot(defaultNoteLetters[5]);

            expect(api.getRoot()).toEqual(defaultNoteLetters[5]);
        });

        it("should throw an exception when the root is null", function () {
            expect(function () {
                api.setRoot(null);
            }).toThrow();
        });

        it("should return the correct clickedNotes when notes are clicked and they all exist on the fretboard", function () {
            api.setClickedNotes(cMaj7ChordForStandardTuning);

            expect(api.getClickedNotes()).toEqual(expectedClickedChordFromFretboard);
        });

        it("should return the correct clickedNotes when cleared", function () {
            api.setClickedNotes(cMaj7ChordForStandardTuning);
            api.clearClickedNotes();

            expect(api.getClickedNotes()).toEqual([]);
        });

        it("should throw an exception when notes are clicked on strings that don't exist", function () {
            api.setTuning(defaultTuning.slice(0, 1));

            expect(function () {
                api.setClickedNotes(cMaj7ChordForStandardTuning);
            }).toThrow();
        });

        it("should throw an exception when clickedNotes are out of the fret range", function () {
            var outOfRangeChord = $.extend(true, [], cMaj7ChordForStandardTuning);

            outOfRangeChord[0].notes[0].fret = -1;
            outOfRangeChord[1].notes[0].fret = defaultNumFrets + 1;

            expect(function () {
                api.setClickedNotes(outOfRangeChord);
            }).toThrow();
        });

        it("should return the correct clickedNotes when notes are clicked and the number of strings is decreased", function () {
            api.setClickedNotes(cMaj7ChordForStandardTuning);
            api.setTuning(defaultTuning.slice(0, 1));

            expect(api.getClickedNotes()).toEqual(expectedClickedChordFromFretboard.slice(0, 1));
        });

        it("should return the correct clickedNotes when notes are clicked and the number of strings is increased", function () {
            api.setClickedNotes(cMaj7ChordForStandardTuning);
            api.setTuning(standardEightStringTuning);

            expect(api.getClickedNotes()).toEqual(expectedClickedChordFromFretboard);
        });

        it("should return the correct clickedNotes when notes are clicked and the number of frets is decreased", function () {
            api.setClickedNotes(cMaj7ChordForStandardTuning);
            api.setNumFrets(3);

            var filteredClickedChord = [
                expectedClickedChordFromFretboard[0],
                expectedClickedChordFromFretboard[4],
                expectedClickedChordFromFretboard[5],
            ];

            expect(api.getClickedNotes()).toEqual(filteredClickedChord);
        });

        it("should return the correct clickedNotes when notes are clicked and the number of frets is increased", function () {
            api.setClickedNotes(cMaj7ChordForStandardTuning);
            api.setNumFrets(defaultNumFrets + 1);

            expect(api.getClickedNotes()).toEqual(expectedClickedChordFromFretboard);
        });

        it("should return the correct clickedNotes when notes are clicked and each note of the tuning is changed", function () {
            api.setClickedNotes(cMaj7ChordForStandardTuning);
            api.setTuning(standardATuning);

            expect(api.getClickedNotes()).toEqual(expectedClickedChordFromFretboardForStandardATuning);
        });

        it("should return the correct clickedNotes when chord mode is true and notes are clicked as a user", function () {
            api.setChordMode(true);
            api.setClickedNotes(scale, true);

            expectedClickedChordFromFretboard = [{
                string: expectedClickedScaleFromFretboard[0].string,
                notes: [expectedClickedScaleFromFretboard[0].notes[2]]
            }, {
                string: expectedClickedScaleFromFretboard[1].string,
                notes: [expectedClickedScaleFromFretboard[1].notes[2]]
            }, {
                string: expectedClickedScaleFromFretboard[2].string,
                notes: [expectedClickedScaleFromFretboard[2].notes[0]]
            }]

            expect(api.getClickedNotes()).toEqual(expectedClickedChordFromFretboard);
        });

        it("should return the correct clickedNotes when chord mode is true and notes are clicked as an admin", function () {
            api.setChordMode(true);
            api.setClickedNotes(scale, false);

            expect(api.getClickedNotes()).toEqual(expectedClickedScaleFromFretboard);
        });

        it("should return the correct clickedNotes when chord mode is false and notes are clicked as a user", function () {
            api.setChordMode(false);
            api.setClickedNotes(scale, true);

            expect(api.getClickedNotes()).toEqual(expectedClickedScaleFromFretboard);
        });

        it("should return the correct clickedNotes when chord mode is false and notes are clicked as an admin", function () {
            api.setChordMode(false);
            api.setClickedNotes(scale, true);

            expect(api.getClickedNotes()).toEqual(expectedClickedScaleFromFretboard);
        });
    });

    // It would be best to create each note by hand for verification, but this should do for now.
    function verifyAllNotesOnFretboard(allNotesToVerify, tuning, numFrets, noteLetters) {
        expect(allNotesToVerify.length).toEqual(tuning.length);

        for (var i = 0; i < allNotesToVerify.length; i++) {
            expect(allNotesToVerify[i].notes.length).toEqual(numFrets + 1);
            verifyNotesOnString(allNotesToVerify[i], tuning[i], noteLetters);
        }
    }

    function verifyNotesOnString(stringToVerify, tuningNote, noteLetters) {
        expect(stringToVerify.string).toEqual(tuningNote);

        for (var i = 0; i < stringToVerify.notes.length; i++) {
            var currentNote = stringToVerify.notes[i];
            var currentNoteLetterIndex = noteLetters.indexOf(currentNote.letter);

            expect(currentNote.fret).toEqual(i);

            if (i === 0) {
                expect(currentNote.letter).toEqual(tuningNote.letter);
                expect(currentNote.octave).toEqual(tuningNote.octave);
                expect(currentNoteLetterIndex).not.toEqual(-1);
            } else {
                var lastNote = stringToVerify.notes[i - 1];
                var lastNoteIndex = noteLetters.indexOf(lastNote.letter);

                expect(currentNoteLetterIndex).toEqual(lastNoteIndex === 11 ? 0 : lastNoteIndex + 1);
                expect(currentNote.octave).toEqual(lastNoteIndex === 11 ? lastNote.octave + 1 : lastNote.octave);
            }
        }
    }
});