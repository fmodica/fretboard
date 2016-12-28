"use strict";

// TODO Note mode
// TODO More detailed check of exception messages
// TODO try to add new notes clicked listener
describe("Fretboard jQuery plugin", function () {
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
    var defaultAllNoteLetters = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "Ab/G#", "A", "A#/Bb", "B"];
    var defaultNoteMode = "letter";
    var defaultIntervalSettings = {
        intervals: ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"],
        root: defaultAllNoteLetters[0]
    };
    var defaultAnimationSpeed = 400;
    var defaultNoteCircles = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
    var defaultClickedNotes = [];
    var defaultNotesClickedCallbacks = [];

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
            expect(api.getAllNoteLetters()).toEqual(defaultAllNoteLetters);
            expect(api.getTuning()).toEqual(defaultTuning);
            expect(api.getNumFrets()).toEqual(defaultNumFrets);
            expect(api.getChordMode()).toEqual(defaultIsChordMode);
            expect(api.getNoteClickingDisabled()).toEqual(defaultNoteClickingDisabled);
            expect(api.getNoteMode()).toEqual(defaultNoteMode);
            expect(api.getIntervalSettings()).toEqual(defaultIntervalSettings);
            expect(api.getAnimationSpeed()).toEqual(defaultAnimationSpeed);
            expect(api.getNoteCircles()).toEqual(defaultNoteCircles);
            expect(api.getClickedNotes()).toEqual(defaultClickedNotes);
            expect(api.getNotesClickedCallbacks()).toEqual(defaultNotesClickedCallbacks);
            verifyAllNotesOnFretboard(api.getAllNotes(), defaultTuning, defaultNumFrets, defaultAllNoteLetters);
        });

        it("should throw an exception when allNoteLetters is null", function () {
            expect(function () {
                $fretboard.fretboard({ allNoteLetters: null });
            }).toThrow();
        });

        it("should throw an exception when an item in allNoteLetters is null", function () {
            var noteLettersWithNull = $.extend(true, [], defaultAllNoteLetters);
            noteLettersWithNull[0] = null;

            expect(function () {
                $fretboard.fretboard({ allNoteLetters: noteLettersWithNull });
            }).toThrow();
        });

        it("should throw an exception when allNoteLetters has more than 12 items", function () {
            var noteLettersTooMany = $.extend(true, [], defaultAllNoteLetters);
            noteLettersTooMany.push("X");

            expect(function () {
                $fretboard.fretboard({ allNoteLetters: noteLettersTooMany });
            }).toThrow();
        });

        it("should throw an exception when allNoteLetters has less than 12 items", function () {
            var noteLettersTooFew = $.extend(true, [], defaultAllNoteLetters);
            noteLettersTooFew = noteLettersTooFew.slice(0, 11);

            expect(function () {
                $fretboard.fretboard({ allNoteLetters: noteLettersTooFew });
            }).toThrow();
        });

        it("should throw an exception when allNoteLetters is not unique", function () {
            var nonUniqueNoteLetters = $.extend(true, [], defaultAllNoteLetters);
            nonUniqueNoteLetters[11] = nonUniqueNoteLetters[0];

            expect(function () {
                $fretboard.fretboard({ allNoteLetters: nonUniqueNoteLetters });
            }).toThrow();
        });

        it("should return the correct allNoteLetters", function () {
            var reversedNoteLetters = $.extend(true, [], defaultAllNoteLetters).reverse();
            $fretboard.fretboard({ allNoteLetters: reversedNoteLetters });
            api = $fretboard.data("api");

            expect(api.getAllNoteLetters()).toEqual(reversedNoteLetters);
        });

        it("should throw an exception when the tuning is null", function () {
            expect(function () {
                $fretboard.fretboard({ tuning: null });
            }).toThrow();
        });

        it("should throw an exception when the tuning is empty", function () {
            expect(function () {
                $fretboard.fretboard({ tuning: [] });
            }).toThrow();
        });

        it("should throw an exception when the tuning is not unique", function () {
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

        it("should throw an exception when the tuning contains a letter not in allNoteLetters", function () {
            var tuningWithWrongLetter = $.extend(true, [], defaultTuning);
            tuningWithWrongLetter[0].letter = "C #";

            expect(function () {
                $fretboard.fretboard({ tuning: tuningWithWrongLetter });
            }).toThrow();
        });

        it("should throw an exception when the tuning contains an octave that is not a number", function () {
            var tuningWithWrongOctave = $.extend(true, [], defaultTuning);
            tuningWithWrongOctave[0].octave = "X";

            expect(function () {
                $fretboard.fretboard({ tuning: tuningWithWrongOctave });
            }).toThrow();
        });

        it("should return the correct tuning when they are reversed", function () {
            var reversedTuning = $.extend(true, [], defaultTuning).reverse();
            $fretboard.fretboard({ tuning: reversedTuning });
            api = $fretboard.data("api");

            expect(api.getTuning()).toEqual(reversedTuning);
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
            api = $fretboard.data("api");

            expect(api.getNumFrets()).toEqual(numFrets);
        });

        it("should return the correct chord mode", function () {
            var isChordMode = false;
            $fretboard.fretboard({ isChordMode: isChordMode });
            api = $fretboard.data("api");

            expect(api.getChordMode()).toEqual(isChordMode);
        });

        it("should return the correct noteClickingDisabled", function () {
            var noteClickingDisabled = true;
            $fretboard.fretboard({ noteClickingDisabled: noteClickingDisabled });
            api = $fretboard.data("api");

            expect(api.getNoteClickingDisabled()).toEqual(noteClickingDisabled);
        });

        it("should return the correct note mode", function () {
            var noteMode = "interval";
            $fretboard.fretboard({ noteMode: noteMode });
            api = $fretboard.data("api");

            expect(api.getNoteMode()).toEqual(noteMode);
        });

        it("should throw an exception when note mode is not \"letter\" or \"interval\"", function () {
            var noteMode = "wrong";

            expect(function () {
                $fretboard.fretboard({ noteMode: noteMode });
            }).toThrow();
        });

        it("should return the correct interval settings", function () {
            var intervalSettings = {
                intervals: ["1", "b9", "9", "b3", "3", "11", "#11", "5", "b13", "13", "b7", "7"],
                root: defaultAllNoteLetters[5]
            };
            $fretboard.fretboard({ intervalSettings: intervalSettings });
            api = $fretboard.data("api");

            expect(api.getIntervalSettings()).toEqual(intervalSettings);
        });

        it("should throw an exception when intervalSettings is null", function () {
            expect(function () {
                $fretboard.fretboard({ intervalSettings: null });
            }).toThrow();
        });

        it("should throw an exception when the intervals array in intervalSettings is null", function () {
            var intervalSettings = {
                intervals: null,
                root: defaultAllNoteLetters[5]
            };

            expect(function () {
                $fretboard.fretboard({ intervalSettings: intervalSettings });
            }).toThrow();
        });

        it("should throw an exception when the root in intervalSettings is null", function () {
            var intervalSettings = {
                intervals: ["1", "b9", "9", "b3", "3", "11", "#11", "5", "b13", "13", "b7", "7"],
                root: null
            };

            expect(function () {
                $fretboard.fretboard({ intervalSettings: intervalSettings });
            }).toThrow();
        });

        it("should throw an exception when the root in intervalSettings is not in allNoteLetters", function () {
            var intervalSettings = {
                intervals: ["1", "b9", "9", "b3", "3", "11", "#11", "5", "b13", "13", "b7", "7"],
                root: "Asharp"
            };

            expect(function () {
                $fretboard.fretboard({ intervalSettings: intervalSettings });
            }).toThrow();
        });

        it("should throw an exception when there are more than 12 intervals", function () {
            var intervalSettings = {
                intervals: ["1", "b9", "9", "b3", "3", "11", "#11", "5", "b13", "13", "b7", "7", "8"],
                root: defaultAllNoteLetters[0]
            };

            expect(function () {
                $fretboard.fretboard({ intervalSettings: intervalSettings });
            }).toThrow();
        });

        it("should throw an exception when there are less than 12 intervals", function () {
            var intervalSettings = {
                intervals: ["1", "b9", "9", "b3", "3", "11", "#11", "5", "b13", "13", "b7"],
                root: defaultAllNoteLetters[0]
            };

            expect(function () {
                $fretboard.fretboard({ intervalSettings: intervalSettings });
            }).toThrow();
        });

        it("should throw an exception when the intervals are not unique", function () {
            var intervalSettings = {
                intervals: ["1", "b9", "9", "b3", "3", "11", "#11", "5", "b13", "13", "13"],
                root: defaultAllNoteLetters[0]
            };

            expect(function () {
                $fretboard.fretboard({ intervalSettings: intervalSettings });
            }).toThrow();
        });

        it("should return the correct animation speed", function () {
            var animationSpeed = 0;
            $fretboard.fretboard({ animationSpeed: animationSpeed });
            api = $fretboard.data("api");

            expect(api.getAnimationSpeed()).toEqual(animationSpeed);
        });

        it("should return the correct note circles", function () {
            var noteCircles = [0, 6, 12];
            $fretboard.fretboard({ noteCircles: noteCircles });
            api = $fretboard.data("api");

            expect(api.getNoteCircles()).toEqual(noteCircles);
        });

        it("should call the dimensionsFunc callback", function (done) {
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

        it("should call the onClickedNotesChange callbacks when clicking notes as a user", function () {
            var tempObj = {
                func1: function () { },
                func2: function () { }
            };
            spyOn(tempObj, 'func1').and.callThrough();
            spyOn(tempObj, 'func2').and.callThrough();
            var config = {
                notesClickedCallbacks: [tempObj.func1, tempObj.func2]
            };
            $fretboard.fretboard(config);
            api = $fretboard.data("api");
            api.setClickedNotes([], true);

            expect(tempObj.func1).toHaveBeenCalled();
            expect(tempObj.func2).toHaveBeenCalled();
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

        var expectedIntervalInfo = { root: "C" };

        var expectedClickedChordFromFretboard = $.extend(true, [], cMaj7ChordForStandardTuning);

        // The notes come back from the plugin with some more information.
        expectedClickedChordFromFretboard[0].notes[0].letter = "G";
        expectedClickedChordFromFretboard[0].notes[0].octave = 4;
        expectedClickedChordFromFretboard[0].notes[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedChordFromFretboard[0].notes[0].intervalInfo.interval = "5";

        expectedClickedChordFromFretboard[1].notes[0].letter = "E";
        expectedClickedChordFromFretboard[1].notes[0].octave = 4;
        expectedClickedChordFromFretboard[1].notes[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedChordFromFretboard[1].notes[0].intervalInfo.interval = "3";

        expectedClickedChordFromFretboard[2].notes[0].letter = "B";
        expectedClickedChordFromFretboard[2].notes[0].octave = 3;
        expectedClickedChordFromFretboard[2].notes[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedChordFromFretboard[2].notes[0].intervalInfo.interval = "7";

        expectedClickedChordFromFretboard[3].notes[0].letter = "G";
        expectedClickedChordFromFretboard[3].notes[0].octave = 3;
        expectedClickedChordFromFretboard[3].notes[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedChordFromFretboard[3].notes[0].intervalInfo.interval = "5";

        expectedClickedChordFromFretboard[4].notes[0].letter = "C";
        expectedClickedChordFromFretboard[4].notes[0].octave = 3;
        expectedClickedChordFromFretboard[4].notes[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedChordFromFretboard[4].notes[0].intervalInfo.interval = "1";

        expectedClickedChordFromFretboard[5].notes[0].letter = "G";
        expectedClickedChordFromFretboard[5].notes[0].octave = 2;
        expectedClickedChordFromFretboard[5].notes[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedChordFromFretboard[5].notes[0].intervalInfo.interval = "5";

        var expectedClickedChordFromFretboardForStandardATuning = $.extend(true, [], bFlatMaj7ChordForStandardATuning);

        expectedClickedChordFromFretboardForStandardATuning[0].notes[0].letter = "F";
        expectedClickedChordFromFretboardForStandardATuning[0].notes[0].octave = 4;
        expectedClickedChordFromFretboardForStandardATuning[0].notes[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedChordFromFretboardForStandardATuning[0].notes[0].intervalInfo.interval = "4";

        expectedClickedChordFromFretboardForStandardATuning[1].notes[0].letter = "D";
        expectedClickedChordFromFretboardForStandardATuning[1].notes[0].octave = 4;
        expectedClickedChordFromFretboardForStandardATuning[1].notes[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedChordFromFretboardForStandardATuning[1].notes[0].intervalInfo.interval = "2";

        expectedClickedChordFromFretboardForStandardATuning[2].notes[0].letter = "A";
        expectedClickedChordFromFretboardForStandardATuning[2].notes[0].octave = 3;
        expectedClickedChordFromFretboardForStandardATuning[2].notes[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedChordFromFretboardForStandardATuning[2].notes[0].intervalInfo.interval = "6";

        expectedClickedChordFromFretboardForStandardATuning[3].notes[0].letter = "F";
        expectedClickedChordFromFretboardForStandardATuning[3].notes[0].octave = 3;
        expectedClickedChordFromFretboardForStandardATuning[3].notes[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedChordFromFretboardForStandardATuning[3].notes[0].intervalInfo.interval = "4";

        expectedClickedChordFromFretboardForStandardATuning[4].notes[0].letter = "A#/Bb";
        expectedClickedChordFromFretboardForStandardATuning[4].notes[0].octave = 2;
        expectedClickedChordFromFretboardForStandardATuning[4].notes[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedChordFromFretboardForStandardATuning[4].notes[0].intervalInfo.interval = "b7";

        expectedClickedChordFromFretboardForStandardATuning[5].notes[0].letter = "F";
        expectedClickedChordFromFretboardForStandardATuning[5].notes[0].octave = 2;
        expectedClickedChordFromFretboardForStandardATuning[5].notes[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedChordFromFretboardForStandardATuning[5].notes[0].intervalInfo.interval = "4";

        var expectedClickedScaleFromFretboard = $.extend(true, [], scale);

        expectedClickedScaleFromFretboard[0].notes[0].letter = "G";
        expectedClickedScaleFromFretboard[0].notes[0].octave = 4;
        expectedClickedScaleFromFretboard[0].notes[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedScaleFromFretboard[0].notes[0].intervalInfo.interval = "5";

        expectedClickedScaleFromFretboard[0].notes[1].letter = "Ab/G#";
        expectedClickedScaleFromFretboard[0].notes[1].octave = 4;
        expectedClickedScaleFromFretboard[0].notes[1].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedScaleFromFretboard[0].notes[1].intervalInfo.interval = "b6";

        expectedClickedScaleFromFretboard[0].notes[2].letter = "A#/Bb";
        expectedClickedScaleFromFretboard[0].notes[2].octave = 4;
        expectedClickedScaleFromFretboard[0].notes[2].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedScaleFromFretboard[0].notes[2].intervalInfo.interval = "b7";

        expectedClickedScaleFromFretboard[1].notes[0].letter = "D";
        expectedClickedScaleFromFretboard[1].notes[0].octave = 4;
        expectedClickedScaleFromFretboard[1].notes[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedScaleFromFretboard[1].notes[0].intervalInfo.interval = "2";

        expectedClickedScaleFromFretboard[1].notes[1].letter = "D#/Eb";
        expectedClickedScaleFromFretboard[1].notes[1].octave = 4;
        expectedClickedScaleFromFretboard[1].notes[1].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedScaleFromFretboard[1].notes[1].intervalInfo.interval = "b3";

        expectedClickedScaleFromFretboard[1].notes[2].letter = "F";
        expectedClickedScaleFromFretboard[1].notes[2].octave = 4;
        expectedClickedScaleFromFretboard[1].notes[2].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedScaleFromFretboard[1].notes[2].intervalInfo.interval = "4";

        expectedClickedScaleFromFretboard[2].notes[0].letter = "C";
        expectedClickedScaleFromFretboard[2].notes[0].octave = 4;
        expectedClickedScaleFromFretboard[2].notes[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
        expectedClickedScaleFromFretboard[2].notes[0].intervalInfo.interval = "1";

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

        it("should return the correct tuning and notes when the tuning is changed", function () {
            api.setTuning(standardATuning);

            expect(api.getTuning()).toEqual(standardATuning);
            verifyAllNotesOnFretboard(api.getAllNotes(), standardATuning, defaultNumFrets, defaultAllNoteLetters);
        });

        it("should return the correct number of frets and notes when the fret number is increased", function () {
            var increase = defaultNumFrets + 12;
            api.setNumFrets(increase);

            expect(api.getNumFrets()).toEqual(increase);
            verifyAllNotesOnFretboard(api.getAllNotes(), defaultTuning, increase, defaultAllNoteLetters);
        });

        it("should return the correct number of frets and notes when the fret number is decreased", function () {
            var decrease = defaultNumFrets - 12;
            api.setNumFrets(decrease);

            expect(api.getNumFrets()).toEqual(decrease);
            verifyAllNotesOnFretboard(api.getAllNotes(), defaultTuning, decrease, defaultAllNoteLetters);
        });

        it("should return the correct clicked notes when notes are clicked and they all exist on the fretboard", function () {
            api.setClickedNotes(cMaj7ChordForStandardTuning);

            expect(api.getClickedNotes()).toEqual(expectedClickedChordFromFretboard);
        });

        it("should return the correct clicked notes when cleared", function () {
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

        it("should throw an exception when clicked notes are out of the fret range", function () {
            var outOfRangeChord = $.extend(true, [], cMaj7ChordForStandardTuning);

            outOfRangeChord[0].notes[0].fret = -1;
            outOfRangeChord[1].notes[0].fret = defaultNumFrets + 1;

            expect(function () {
                api.setClickedNotes(outOfRangeChord);
            }).toThrow();
        });

        it("should return the correct clicked notes when notes are clicked and the number of strings is decreased", function () {
            api.setClickedNotes(cMaj7ChordForStandardTuning);
            api.setTuning(defaultTuning.slice(0, 1));

            expect(api.getClickedNotes()).toEqual(expectedClickedChordFromFretboard.slice(0, 1));
        });

        it("should return the correct clicked notes when notes are clicked and the number of strings is increased", function () {
            api.setClickedNotes(cMaj7ChordForStandardTuning);
            api.setTuning(standardEightStringTuning);

            expect(api.getClickedNotes()).toEqual(expectedClickedChordFromFretboard);
        });

        it("should return the correct clicked notes when notes are clicked and the number of frets is decreased", function () {
            api.setClickedNotes(cMaj7ChordForStandardTuning);
            api.setNumFrets(3);

            var filteredClickedChord = [];

            for (var i = 0; i < expectedClickedChordFromFretboard.length; i++) {
                var filteredNotes = expectedClickedChordFromFretboard[i].notes.filter(function (note) {
                    return note.fret <= 3;
                });

                if (filteredNotes.length) {
                    filteredClickedChord.push({
                        string: expectedClickedChordFromFretboard[i].string,
                        notes: filteredNotes
                    });
                }
            }

            expect(api.getClickedNotes()).toEqual(filteredClickedChord);
        });

        it("should return the correct clicked notes when notes are clicked and the number of frets is increased", function () {
            api.setClickedNotes(cMaj7ChordForStandardTuning);
            api.setNumFrets(defaultNumFrets + 1);

            expect(api.getClickedNotes()).toEqual(expectedClickedChordFromFretboard);
        });

        it("should return the correct clicked notes when notes are clicked and each note of the tuning is changed", function () {
            api.setClickedNotes(cMaj7ChordForStandardTuning);
            api.setTuning(standardATuning);

            expect(api.getClickedNotes()).toEqual(expectedClickedChordFromFretboardForStandardATuning);
        });

        it("should return the correct clicked notes when chord mode is true and notes are clicked as a user", function () {
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

        it("should return the correct clicked notes when chord mode is true and notes are clicked as an admin", function () {
            api.setChordMode(true);
            api.setClickedNotes(scale, false);

            expect(api.getClickedNotes()).toEqual(expectedClickedScaleFromFretboard);
        });

        it("should return the correct clicked notes when chord mode is false and notes are clicked as a user", function () {
            api.setChordMode(false);
            api.setClickedNotes(scale, true);

            expect(api.getClickedNotes()).toEqual(expectedClickedScaleFromFretboard);
        });

        it("should return the correct clicked notes when chord mode is false and notes are clicked as an admin", function () {
            api.setChordMode(false);
            api.setClickedNotes(scale, true);

            expect(api.getClickedNotes()).toEqual(expectedClickedScaleFromFretboard);
        });
    });

    // It would be best to create each note by hand for verification, but this should do for now.
    function verifyAllNotesOnFretboard(allNotesToVerify, tuning, numFrets, allNoteLetters) {
        expect(allNotesToVerify.length).toEqual(tuning.length);

        for (var i = 0; i < allNotesToVerify.length; i++) {
            expect(allNotesToVerify[i].notes.length).toEqual(numFrets + 1);
            verifyNotesOnString(allNotesToVerify[i], tuning[i], allNoteLetters);
        }
    }

    function verifyNotesOnString(stringToVerify, tuningNote, allNoteLetters) {
        expect(stringToVerify.string).toEqual(tuningNote);

        for (var i = 0; i < stringToVerify.notes.length; i++) {
            var currentNote = stringToVerify.notes[i];
            var currentNoteLetterIndex = allNoteLetters.indexOf(currentNote.letter);

            expect(currentNote.fret).toEqual(i);

            if (i === 0) {
                expect(currentNote.letter).toEqual(tuningNote.letter);
                expect(currentNote.octave).toEqual(tuningNote.octave);
                expect(currentNoteLetterIndex).not.toEqual(-1);
            } else {
                var lastNote = stringToVerify.notes[i - 1];
                var lastNoteIndex = allNoteLetters.indexOf(lastNote.letter);

                expect(currentNoteLetterIndex).toEqual(lastNoteIndex === 11 ? 0 : lastNoteIndex + 1);
                expect(currentNote.octave).toEqual(lastNoteIndex === 11 ? lastNote.octave + 1 : lastNote.octave);
            }
        }
    }
});