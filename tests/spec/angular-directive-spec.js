"use strict";

describe("Angular fretboard directive", function () {
    var $element;
    var $compile;
    var $rootScope;
    var directiveScope;
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
    var defaultDimensionsFunc = undefined;
    var defaultNotesClickedCallbacks = [];

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
        },
        notes: [{
            fret: 1,
            cssClass: "red"
        }]
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

    var expectedClickedNotes = [{
        string: {
            letter: "E",
            octave: 4
        },
        notes: [{
            letter: "F",
            octave: 4,
            fret: 1,
            intervalInfo: {
                root: customIntervalSettings.root,
                interval: "1"
            },
            // TODO: bind cssClass
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
        it("should overwrite the controller's config properties with the fretboard's default state", function () {
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
            expect($rootScope.config.dimensionsFunc).toEqual(undefined); // TODO: Bind
            expect($rootScope.config.notesClickedCallbacks).toEqual(defaultNotesClickedCallbacks);
        });

        it("should maintain the controller's custom config properties and update the clicked notes with additional information", function () {
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

            expect($rootScope.config.clickedNotes).toEqual(expectedClickedNotes);
        });
    });
});