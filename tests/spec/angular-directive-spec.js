"use strict";

describe("Angular fretboard directive", function () {
    var $element;
    var $compile;
    var $rootScope;

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
    var defaultAllNoteLetters = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "Ab/G#", "A", "A#/Bb", "B"];
    var defaultNoteMode = "letter";
    var defaultIntervalSettings = {
        intervals: ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"],
        root: defaultNoteLetters[0]
    };
    var defaultAnimationSpeed = 400;
    var defaultNoteCircles = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
    var defaultClickedNotes = [];
    var defaultNotesClickedCallbacks = [];

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

    beforeEach(angular.mock.module('angularFretboard'));

    beforeEach(inject(function (_$compile_, _$rootScope_) {
        $element = angular.element("<div fretboard config='config'></div>");
        $compile = _$compile_;
        $rootScope = _$rootScope_;
    }));

    afterEach(function () {
        $rootScope.config = null;
    });

    describe("Configuration", function () {
        it("should overwrite the controller's undefuned config properties with the fretboard's default state", function () {
            $rootScope.config = {};

            $compile($element)($rootScope);
            $rootScope.$digest();

            expect($rootScope.config.tuning).toEqual(defaultTuning);
            expect($rootScope.config.numFrets).toEqual(defaultNumFrets);
            expect($rootScope.config.isChordMode).toEqual(defaultIsChordMode);
            expect($rootScope.config.noteClickingDisabled).toEqual(defaultNoteClickingDisabled);
            expect($rootScope.config.allNoteLetters).toEqual(defaultAllNoteLetters);
            expect($rootScope.config.noteMode).toEqual(defaultNoteMode);
            expect($rootScope.config.intervalSettings).toEqual(defaultIntervalSettings);
            expect($rootScope.config.animationSpeed).toEqual(defaultAnimationSpeed);
            expect($rootScope.config.noteCircles).toEqual(defaultNoteCircles);
            expect($rootScope.config.clickedNotes).toEqual(defaultClickedNotes);
            expect(typeof $rootScope.config.dimensionsFunc).toEqual("function");
            expect($rootScope.config.notesClickedCallbacks).toEqual(defaultNotesClickedCallbacks);
        });

        it("should not overwrite the controller's defined config properties, but should update the clicked notes with additional information", function () {
            var customTuning = defaultTuning.slice(0, defaultTuning.length - 1);
            var customNumFrets = defaultNumFrets - 1;
            var customIsChordMode = !defaultIsChordMode;
            var customNoteClickingDisabled = !defaultNoteClickingDisabled;
            var customAllNoteLetters = angular.copy(defaultAllNoteLetters);
            customAllNoteLetters[0] = "New letter"
            var customNoteMode = "letter";
            var customIntervalSettings = angular.copy(defaultIntervalSettings);
            customIntervalSettings.root = "F";
            var customAnimationSpeed = 0;
            var customNoteCircles = defaultNoteCircles.slice(0, defaultNoteCircles.length - 1);
            var customClickedNotes = [{
                string: {
                    letter: "E",
                    octave: 4
                }, notes: [
                    {
                        fret: 1,
                        cssClass: "red"
                    }
                ]
            }];
            var customDimensionsFunc = function () { return {}; };
            var customNotesClickedCallbacks = [function () { }, function () { }];

            var customConfig = {
                tuning: customTuning,
                numFrets: customNumFrets,
                isChordMode: customIsChordMode,
                noteClickingDisabled: customNoteClickingDisabled,
                allNoteLetters: customAllNoteLetters,
                noteMode: customNoteMode,
                intervalSettings: customIntervalSettings,
                animationSpeed: customAnimationSpeed,
                noteCircles: customNoteCircles,
                clickedNotes: customClickedNotes,
                dimensionsFunc: customDimensionsFunc,
                notesClickedCallbacks: customNotesClickedCallbacks
            };

            var expectedCustomClickedNotes = [{
                string: {
                    letter: "E",
                    octave: 4
                },
                notes: [{
                    letter: "F",
                    octave: 4,
                    fret: 1,
                    intervalInfo: {
                        root: "F",
                        interval: "1"
                    },
                    // TODO: bind cssClass
                }]
            }];

            $rootScope.config = customConfig;

            $compile($element)($rootScope);
            $rootScope.$digest();

            expect($rootScope.config.tuning).toEqual(customTuning);
            expect($rootScope.config.numFrets).toEqual(customNumFrets);
            expect($rootScope.config.isChordMode).toEqual(customIsChordMode);
            expect($rootScope.config.noteClickingDisabled).toEqual(customNoteClickingDisabled);
            expect($rootScope.config.allNoteLetters).toEqual(customAllNoteLetters);
            expect($rootScope.config.noteMode).toEqual(customNoteMode);
            expect($rootScope.config.intervalSettings).toEqual(customIntervalSettings);
            expect($rootScope.config.animationSpeed).toEqual(customAnimationSpeed);
            expect($rootScope.config.noteCircles).toEqual(customNoteCircles);
            expect($rootScope.config.dimensionsFunc).toEqual(customDimensionsFunc);
            expect($rootScope.config.notesClickedCallbacks).toEqual(customNotesClickedCallbacks);

            expect($rootScope.config.clickedNotes).toEqual(expectedCustomClickedNotes);
        });

        it("should change the tuning, number of frets, and interval settings before updating clicked notes", function () {
            var bFlatMaj7ChordForStandardATuningCopy = angular.copy(bFlatMaj7ChordForStandardATuning);

            // Just the notes at or below the 3rd fret.
            var expectedBFlatMaj7ChordFromFretboardForStandardATuning = [
                bFlatMaj7ChordForStandardATuningCopy[0],
                bFlatMaj7ChordForStandardATuningCopy[4],
                bFlatMaj7ChordForStandardATuningCopy[5]
            ];

            expectedBFlatMaj7ChordFromFretboardForStandardATuning[0].notes[0].letter = "F";
            expectedBFlatMaj7ChordFromFretboardForStandardATuning[0].notes[0].octave = 4;
            expectedBFlatMaj7ChordFromFretboardForStandardATuning[0].notes[0].intervalInfo = {
                root: "C#/Db",
                interval: "Major third"
            };

            expectedBFlatMaj7ChordFromFretboardForStandardATuning[1].notes[0].letter = "A#/Bb";
            expectedBFlatMaj7ChordFromFretboardForStandardATuning[1].notes[0].octave = 2;
            expectedBFlatMaj7ChordFromFretboardForStandardATuning[1].notes[0].intervalInfo = {
                root: "C#/Db",
                interval: "6"
            };

            expectedBFlatMaj7ChordFromFretboardForStandardATuning[2].notes[0].letter = "F";
            expectedBFlatMaj7ChordFromFretboardForStandardATuning[2].notes[0].octave = 2;
            expectedBFlatMaj7ChordFromFretboardForStandardATuning[2].notes[0].intervalInfo = {
                root: "C#/Db",
                interval: "Major third"
            };

            $rootScope.config = {
                clickedNotes: cMaj7ChordForStandardTuning
            };

            $compile($element)($rootScope);
            $rootScope.$digest();

            $rootScope.config.tuning = standardATuning;
            $rootScope.config.numFrets = 3;
            $rootScope.config.intervalSettings = angular.copy(defaultIntervalSettings);
            $rootScope.config.intervalSettings.root = "C#/Db";
            $rootScope.config.intervalSettings.intervals[4] = "Major third"

            $rootScope.$digest();

            expect($rootScope.config.clickedNotes).toEqual(expectedBFlatMaj7ChordFromFretboardForStandardATuning);
        });
    });
});