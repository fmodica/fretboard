"use strict";

// TODO Pass in different/bad config values
// TODO Note mode
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
    var noteCircles = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
    var defaultAllNoteLetters = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "Ab/G#", "A", "A#/Bb", "B"];
    var defaultIntervalSettings = {
        intervals: ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"],
        root: defaultAllNoteLetters[0]
    };
    var defaultNoteMode = "letter"; // or "interval"
    var defaultNumFrets = 15;
    var defaultAnimationSpeed = 400;
    var $fretboard;
    var api;

    beforeEach(function () {
        $fretboard = $("<div class='my-fretboard-js'></div>");
    });

    afterEach(function () {
        api.destroy();
    });

    describe("Default configuration", function () {
        beforeEach(function () {
            $fretboard.fretboard();
            api = $fretboard.data("api");
        });

        // Configuration properties
        it("should return the correct allNoteLetters", function () {
            expect(api.getAllNoteLetters()).toEqual(defaultAllNoteLetters);
        });

        it("should return standard tuning", function () {
            expect(api.getTuning()).toEqual(standardTuning);
        });

        it("should return " + defaultNumFrets + " frets", function () {
            expect(api.getNumFrets()).toEqual(defaultNumFrets);
        });

        it("should return chord mode true", function () {
            expect(api.getChordMode()).toEqual(true);
        });

        it("should return noteClickingDisabled false", function () {
            expect(api.getNoteClickingDisabled()).toEqual(false);
        });

        it("should return the correct note mode", function () {
            expect(api.getNoteMode()).toEqual(defaultNoteMode);
        });

        it("should return the correct interval settings", function () {
            expect(api.getIntervalSettings()).toEqual(defaultIntervalSettings);
        });

        it("should return animation speed " + defaultAnimationSpeed, function () {
            expect(api.getAnimationSpeed()).toEqual(defaultAnimationSpeed);
        });

        it("should return the correct circles", function () {
            expect(api.getNoteCircles()).toEqual(noteCircles);
        });

        // Additional
        it("should return no clicked notes", function () {
            expect(api.getClickedNotes()).toEqual([]);
        });

        it("should return the correct notes for the whole fretboard: ", function () {
            verifyAllNotesOnFretboard(api.getAllNotes(), standardTuning, defaultNumFrets, defaultAllNoteLetters);
        });
    });

    describe("Custom configuration", function () {
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

        it("should throw an exception when the tuning contains a letter not in allNoteLetters", function () {
            var tuningWithWrongLetter = $.extend(true, [], standardTuning);
            tuningWithWrongLetter[0].letter = "C #";

            expect(function () {
                $fretboard.fretboard({ tuning: tuningWithWrongLetter });
            }).toThrow();
        });

        it("should throw an exception when the tuning contains an octave that is not a number", function () {
            var tuningWithWrongOctave = $.extend(true, [], standardTuning);
            tuningWithWrongOctave[0].octave = "X";

            expect(function () {
                $fretboard.fretboard({ tuning: tuningWithWrongOctave });
            }).toThrow();
        });

        it("should return the correct tuning when they are reversed", function () {
            var reversedTuning = $.extend(true, [], standardTuning).reverse();
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
                onClickedNotesChange: [tempObj.func1, tempObj.func2]
            };
            $fretboard.fretboard(config);
            api = $fretboard.data("api");
            api.setClickedNotes([], true);

            expect(tempObj.func1).toHaveBeenCalled();
            expect(tempObj.func2).toHaveBeenCalled();
        });
    });

    describe("Changing the fretboard's dimensions", function () {
        beforeEach(function () {
            $fretboard.fretboard();
            api = $fretboard.data("api");
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
            verifyAllNotesOnFretboard(api.getAllNotes(), standardTuning, increase, defaultAllNoteLetters);
        });

        it("should return the correct number of frets and notes when the fret number is decreased", function () {
            var decrease = defaultNumFrets - 12;
            api.setNumFrets(decrease);

            expect(api.getNumFrets()).toEqual(decrease);
            verifyAllNotesOnFretboard(api.getAllNotes(), standardTuning, decrease, defaultAllNoteLetters);
        });
    });

    describe("Clicking notes programatically", function () {
        var clickedChord;
        var clickedScale;
        var clickedChordForStandardATuning;
        var expectedClickedChord;
        var expectedClickedChordForStandardATuning;
        var expectedClickedScale;
        var expectedIntervalInfo = {
            root: "C"
        };

        beforeEach(function () {
            $fretboard.fretboard();
            api = $fretboard.data("api");

            clickedChord = [{
                stringItsOn: {
                    letter: "E",
                    octave: 4
                },
                fret: 3
            }, {
                stringItsOn: {
                    letter: "B",
                    octave: 3
                },
                fret: 5,
            }, {
                stringItsOn: {
                    letter: "G",
                    octave: 3
                },
                fret: 4
            }, {
                stringItsOn: {
                    letter: "D",
                    octave: 3
                },
                fret: 5
            }, {
                stringItsOn: {
                    letter: "A",
                    octave: 2
                },
                fret: 3
            }, {
                stringItsOn: {
                    letter: "E",
                    octave: 2
                },
                fret: 3
            }];

            clickedChordForStandardATuning = [{
                stringItsOn: {
                    letter: "D",
                    octave: 4
                },
                fret: 3
            }, {
                stringItsOn: {
                    letter: "A",
                    octave: 3
                },
                fret: 5,
            }, {
                stringItsOn: {
                    letter: "F",
                    octave: 3
                },
                fret: 4
            }, {
                stringItsOn: {
                    letter: "C",
                    octave: 3
                },
                fret: 5
            }, {
                stringItsOn: {
                    letter: "G",
                    octave: 2
                },
                fret: 3
            }, {
                stringItsOn: {
                    letter: "D",
                    octave: 2
                },
                fret: 3
            }];

            clickedScale = [{
                stringItsOn: {
                    letter: "E",
                    octave: 4
                },
                fret: 3
            }, {
                stringItsOn: {
                    letter: "E",
                    octave: 4
                },
                fret: 4
            }, {
                stringItsOn: {
                    letter: "E",
                    octave: 4
                },
                fret: 6
            }, {
                stringItsOn: {
                    letter: "B",
                    octave: 3
                },
                fret: 3
            }, {
                stringItsOn: {
                    letter: "B",
                    octave: 3
                },
                fret: 4
            }, {
                stringItsOn: {
                    letter: "B",
                    octave: 3
                },
                fret: 6
            }, {
                stringItsOn: {
                    letter: "G",
                    octave: 3
                },
                fret: 5
            }];

            expectedClickedChord = $.extend(true, [], clickedChord);
            expectedClickedChordForStandardATuning = $.extend(true, [], clickedChordForStandardATuning);
            expectedClickedScale = $.extend(true, [], clickedScale);

            // The notes come back from the plugin with some more information, 
            // so add that to the comparison array so they match.
            expectedClickedChord[0].letter = "G";
            expectedClickedChord[0].octave = 4;
            expectedClickedChord[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedChord[0].intervalInfo.interval = "5";
            expectedClickedChord[1].letter = "E";
            expectedClickedChord[1].octave = 4;
            expectedClickedChord[1].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedChord[1].intervalInfo.interval = "3";
            expectedClickedChord[2].letter = "B";
            expectedClickedChord[2].octave = 3;
            expectedClickedChord[2].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedChord[2].intervalInfo.interval = "7";
            expectedClickedChord[3].letter = "G";
            expectedClickedChord[3].octave = 3;
            expectedClickedChord[3].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedChord[3].intervalInfo.interval = "5";
            expectedClickedChord[4].letter = "C";
            expectedClickedChord[4].octave = 3;
            expectedClickedChord[4].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedChord[4].intervalInfo.interval = "1";
            expectedClickedChord[5].letter = "G";
            expectedClickedChord[5].octave = 2;
            expectedClickedChord[5].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedChord[5].intervalInfo.interval = "5";

            expectedClickedChordForStandardATuning[0].letter = "F";
            expectedClickedChordForStandardATuning[0].octave = 4;
            expectedClickedChordForStandardATuning[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedChordForStandardATuning[0].intervalInfo.interval = "4";
            expectedClickedChordForStandardATuning[1].letter = "D";
            expectedClickedChordForStandardATuning[1].octave = 4;
            expectedClickedChordForStandardATuning[1].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedChordForStandardATuning[1].intervalInfo.interval = "2";
            expectedClickedChordForStandardATuning[2].letter = "A";
            expectedClickedChordForStandardATuning[2].octave = 3;
            expectedClickedChordForStandardATuning[2].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedChordForStandardATuning[2].intervalInfo.interval = "6";
            expectedClickedChordForStandardATuning[3].letter = "F";
            expectedClickedChordForStandardATuning[3].octave = 3;
            expectedClickedChordForStandardATuning[3].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedChordForStandardATuning[3].intervalInfo.interval = "4";
            expectedClickedChordForStandardATuning[4].letter = "A#/Bb";
            expectedClickedChordForStandardATuning[4].octave = 2;
            expectedClickedChordForStandardATuning[4].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedChordForStandardATuning[4].intervalInfo.interval = "b7";
            expectedClickedChordForStandardATuning[5].letter = "F";
            expectedClickedChordForStandardATuning[5].octave = 2;
            expectedClickedChordForStandardATuning[5].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedChordForStandardATuning[5].intervalInfo.interval = "4";

            expectedClickedScale[0].letter = "G";
            expectedClickedScale[0].octave = 4;
            expectedClickedScale[0].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedScale[0].intervalInfo.interval = "5";
            expectedClickedScale[1].letter = "Ab/G#";
            expectedClickedScale[1].octave = 4;
            expectedClickedScale[1].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedScale[1].intervalInfo.interval = "b6";
            expectedClickedScale[2].letter = "A#/Bb";
            expectedClickedScale[2].octave = 4;
            expectedClickedScale[2].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedScale[2].intervalInfo.interval = "b7";
            expectedClickedScale[3].letter = "D";
            expectedClickedScale[3].octave = 4;
            expectedClickedScale[3].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedScale[3].intervalInfo.interval = "2";
            expectedClickedScale[4].letter = "D#/Eb";
            expectedClickedScale[4].octave = 4;
            expectedClickedScale[4].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedScale[4].intervalInfo.interval = "b3";
            expectedClickedScale[5].letter = "F";
            expectedClickedScale[5].octave = 4;
            expectedClickedScale[5].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedScale[5].intervalInfo.interval = "4";
            expectedClickedScale[6].letter = "C";
            expectedClickedScale[6].octave = 4;
            expectedClickedScale[6].intervalInfo = $.extend(true, {}, expectedIntervalInfo);
            expectedClickedScale[6].intervalInfo.interval = "1";
        });

        it("should return the correct clicked notes when notes are clicked and they all exist on the fretboard", function () {
            api.setClickedNotes(clickedChord);

            expect(api.getClickedNotes()).toEqual(expectedClickedChord);
        });

        it("should return the correct clicked notes when cleared", function () {
            api.setClickedNotes(clickedChord);
            api.clearClickedNotes();

            expect(api.getClickedNotes()).toEqual([]);
        });

        it("should throw an exception when notes are clicked on strings that don't exist", function () {
            api.setTuning(standardTuning.slice(0, 1));

            expect(function () {
                api.setClickedNotes(clickedChord);
            }).toThrow();
        });

        it("should throw an exception when clicked notes are out of the fret range", function () {
            clickedChord[0].fret = -1;
            clickedChord[1].fret = defaultNumFrets + 1;

            expect(function () {
                api.setClickedNotes(clickedChord);
            }).toThrow();
        });

        it("should return the correct clicked notes when notes are clicked and the number of strings is decreased", function () {
            api.setClickedNotes(clickedChord);
            api.setTuning(standardTuning.slice(0, 1));

            expect(api.getClickedNotes()).toEqual(expectedClickedChord.slice(0, 1));
        });

        it("should return the correct clicked notes when notes are clicked and the number of strings is increased", function () {
            api.setClickedNotes(clickedChord);
            api.setTuning(eightStringTuning);

            expect(api.getClickedNotes()).toEqual(expectedClickedChord);
        });

        it("should return the correct clicked notes when notes are clicked and the number of frets is decreased", function () {
            api.setClickedNotes(clickedChord);
            api.setNumFrets(3);
            expectedClickedChord = expectedClickedChord.filter(function (note) {
                return note.fret === 3;
            });

            expect(api.getClickedNotes()).toEqual(expectedClickedChord);
        });

        it("should return the correct clicked notes when notes are clicked and the number of frets is increased", function () {
            api.setClickedNotes(clickedChord);
            api.setNumFrets(defaultNumFrets + 1);

            expect(api.getClickedNotes()).toEqual(expectedClickedChord);
        });

        it("should return the correct clicked notes when notes are clicked and each note of the tuning is changed", function () {
            api.setClickedNotes(clickedChord);
            api.setTuning(standardATuning);

            expect(api.getClickedNotes()).toEqual(expectedClickedChordForStandardATuning);
        });

        it("should return the correct clicked notes when chord mode is true and notes are clicked as a user", function () {
            api.setChordMode(true);
            api.setClickedNotes(clickedScale, true);
            expectedClickedChord = [expectedClickedScale[2], expectedClickedScale[5], expectedClickedScale[6]];

            expect(api.getClickedNotes()).toEqual(expectedClickedChord);
        });

        it("should return the correct clicked notes when chord mode is true and notes are clicked as an admin", function () {
            api.setChordMode(true);
            api.setClickedNotes(clickedScale, false);

            expect(api.getClickedNotes()).toEqual(expectedClickedScale);
        });

        it("should return the correct clicked notes when chord mode is false and notes are clicked as a user", function () {
            api.setChordMode(false);
            api.setClickedNotes(clickedScale, true);

            expect(api.getClickedNotes()).toEqual(expectedClickedScale);
        });

        it("should return the correct clicked notes when chord mode is false and notes are clicked as an admin", function () {
            api.setChordMode(false);
            api.setClickedNotes(clickedScale, true);

            expect(api.getClickedNotes()).toEqual(expectedClickedScale);
        });
    });

    // It would be best to create each note by hand for verification, but this should do for now.
    function verifyAllNotesOnFretboard(allNotesToVerify, tuning, numFrets, allNoteLetters) {
        expect(allNotesToVerify.length).toEqual(tuning.length);

        for (var i = 0; i < allNotesToVerify.length; i++) {

            expect(allNotesToVerify[i].length).toEqual(numFrets + 1);
            verifyNotesOnString(allNotesToVerify[i], tuning[i], allNoteLetters);
        }
    }

    function verifyNotesOnString(stringToVerify, tuningNote, allNoteLetters) {
        for (var i = 0; i < stringToVerify.length; i++) {
            var currentNote = stringToVerify[i];
            var currentNoteLetterIndex = allNoteLetters.indexOf(currentNote.letter);

            expect(currentNote.fret).toEqual(i);
            expect(currentNote.stringItsOn).toEqual(tuningNote);

            if (i === 0) {
                expect(currentNote.letter).toEqual(tuningNote.letter);
                expect(currentNote.octave).toEqual(tuningNote.octave);
                expect(currentNoteLetterIndex).not.toEqual(-1);
            } else {
                var lastNote = stringToVerify[i - 1];
                var lastNoteIndex = allNoteLetters.indexOf(lastNote.letter);

                expect(currentNoteLetterIndex).toEqual(lastNoteIndex === 11 ? 0 : lastNoteIndex + 1);
                expect(currentNote.octave).toEqual(lastNoteIndex === 11 ? lastNote.octave + 1 : lastNote.octave);
            }
        }
    }
});