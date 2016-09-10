// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
    Object.keys = (function () {
        'use strict';
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
            dontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
            ],
            dontEnumsLength = dontEnums.length;

        return function (obj) {
            if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
                throw new TypeError('Object.keys called on non-object');
            }

            var result = [], prop, i;

            for (prop in obj) {
                if (hasOwnProperty.call(obj, prop)) {
                    result.push(prop);
                }
            }

            if (hasDontEnumBug) {
                for (i = 0; i < dontEnumsLength; i++) {
                    if (hasOwnProperty.call(obj, dontEnums[i])) {
                        result.push(dontEnums[i]);
                    }
                }
            }
            return result;
        };
    }());
}

(function ($) {
    "use strict";

    window.FretboardModel = function (settings) {
        var self = this;
        self.destroy = destroy;
        self.getAllNotes = getAllNotes;
        self.getChordMode = getChordMode;
        self.setChordMode = setChordMode;
        self.getAllNoteLetters = getAllNoteLetters;
        self.getClickedNotes = getClickedNotes;
        self.setClickedNotes = setClickedNotes;
        self.clearClickedNotes = clearClickedNotes;
        self.getNoteClickingDisabled = getNoteClickingDisabled;
        self.setNoteClickingDisabled = setNoteClickingDisabled;
        self.getTuning = getTuning;
        self.setTuning = setTuning;
        self.getNumFrets = getNumFrets;
        self.setNumFrets = setNumFrets;
        self.getIntervalSettings = getIntervalSettings;
        self.setIntervalSettings = setIntervalSettings;

        var model = {};
        var validator = new FretboardValidator();

        initialize(settings);

        function destroy() {
            model = null;
        }

        function getAllNotes() {
            return $.extend(true, [], model.allNotes);
        }

        function getChordMode() {
            return model.isChordMode;
        }

        function setChordMode(isChordMode) {
            model.isChordMode = isChordMode;
        }

        function getAllNoteLetters() {
            return model.allNoteLetters;
        }

        function getClickedNotes() {
            var clickedNotes = [];

            for (var i = 0; i < model.allNotes.length; i++) {
                for (var j = 0; j < model.clickedNotes[i].length; j++) {
                    clickedNotes.push(model.allNotes[i][model.clickedNotes[i][j]]);
                }
            }

            return $.extend(true, [], clickedNotes);
        }

        // takeSettingsIntoAccount means to check other settings that might affect
        // which notes can be clicked, such as isChordMode, noteClickingDisabled, etc.
        function setClickedNotes(frettedNotesToClick, takeSettingsIntoAccount) {
            if (!frettedNotesToClick || (takeSettingsIntoAccount && model.noteClickingDisabled)) {
                return;
            }

            frettedNotesToClick = $.extend(true, [], frettedNotesToClick);

            for (var i = 0; i < frettedNotesToClick.length; i++) {
                validator.validateFrettedNote(frettedNotesToClick[i], model.tuning, model.numFrets);
            }

            for (var i = 0; i < frettedNotesToClick.length; i++) {
                clickNote(frettedNotesToClick[i], takeSettingsIntoAccount);
            }
        }

        function clickNote(note, takeSettingsIntoAccount) {
            for (var i = 0; i < model.tuning.length; i++) {
                if (!notesAreEqual(model.tuning[i], note.stringItsOn)) {
                    continue;
                }

                clickNoteOnString(note, i, takeSettingsIntoAccount);
            }
        }

        function clickNoteOnString(note, stringIndex, takeSettingsIntoAccount) {
            var indexOfClickedFret = model.clickedNotes[stringIndex].indexOf(note.fret);
            var fretAlreadyClicked = indexOfClickedFret !== -1;

            if (takeSettingsIntoAccount) {
                if (model.isChordMode) {
                    model.clickedNotes[stringIndex] = [];

                    if (!fretAlreadyClicked) {
                        model.clickedNotes[stringIndex].push(note.fret);
                    }
                } else {
                    if (!fretAlreadyClicked) {
                        model.clickedNotes[stringIndex].push(note.fret)
                    } else {
                        model.clickedNotes[stringIndex].splice(indexOfClickedFret, 1);
                    }
                }
            } else {
                if (!fretAlreadyClicked) {
                    model.clickedNotes[stringIndex].push(note.fret);
                }
            }
        }

        function clearClickedNotes() {
            model.clickedNotes = [];

            for (var i = 0; i < model.tuning.length; i++) {
                model.clickedNotes.push([]);
            }
        }

        function getNoteClickingDisabled() {
            return model.noteClickingDisabled;
        }

        function setNoteClickingDisabled(isDisabled) {
            model.noteClickingDisabled = isDisabled;
        }

        function getTuning() {
            return $.extend(true, [], model.tuning);
        }

        function setTuning(newTuning) {
            var newTuning = $.extend(true, [], newTuning);
            var oldTuning = $.extend(true, [], model.tuning);

            validator.validateTuning(newTuning, model.allNoteLetters);
            model.tuning = newTuning;

            model.allNotes = [];

            for (var i = 0; i < newTuning.length; i++) {
                model.allNotes[i] = calculateNotesOnString(model.tuning[i]);
            }

            if (model.tuning.length <= oldTuning.length) {
                model.clickedNotes = model.clickedNotes.slice(0, model.tuning.length);
            } else {
                for (var i = 0; i < (model.tuning.length - oldTuning.length) ; i++) {
                    model.clickedNotes.push([]);
                }
            }
        }

        function getNumFrets() {
            return model.numFrets;
        }

        function setNumFrets(newNumFrets) {
            validator.validateNumFrets(newNumFrets);
            model.numFrets = newNumFrets;

            for (var i = 0; i < model.tuning.length; i++) {
                model.allNotes[i] = calculateNotesOnString(model.tuning[i]);
                model.clickedNotes[i] = model.clickedNotes[i].filter(function (fret) {
                    return fret <= model.numFrets;
                });
            }
        }

        function getIntervalSettings() {
            return $.extend(true, {}, model.intervalSettings);
        }

        function setIntervalSettings(intervalSettings) {
            validator.validateIntervalSettings(intervalSettings, model.allNoteLetters);
            model.intervalSettings = $.extend(true, {}, intervalSettings);

            for (var i = 0; i < model.tuning.length; i++) {
                model.allNotes[i] = calculateNotesOnString(model.tuning[i]);
            }
        }

        // Utility functions
        function initialize(settings) {
            model = {
                allNotes: [],
                clickedNotes: [],
                // The rest get copied from settings
                allNoteLetters: null,
                tuning: null,
                numFrets: null,
                isChordMode: null,
                noteClickingDisabled: null,
                intervalSettings: null
            };

            validator.validateAllNoteLetters(settings.allNoteLetters);
            model.allNoteLetters = settings.allNoteLetters;
            validator.validateTuning(settings.tuning, settings.allNoteLetters);
            model.tuning = settings.tuning;
            validator.validateNumFrets(settings.numFrets);
            model.numFrets = settings.numFrets;
            model.isChordMode = settings.isChordMode;
            model.noteClickingDisabled = settings.noteClickingDisabled;
            validator.validateIntervalSettings(settings.intervalSettings, model.allNoteLetters);
            model.intervalSettings = settings.intervalSettings;

            for (var i = 0; i < model.tuning.length; i++) {
                model.allNotes.push(calculateNotesOnString(model.tuning[i]));
                model.clickedNotes.push([]);
            }
        }

        function calculateNotesOnString(openNote) {
            var notes = [];

            for (var i = 0; i <= model.numFrets; i++) {
                var note = getNoteByFretNumber(openNote, i);

                note.fret = i;
                note.stringItsOn = openNote;
                note.intervalInfo = getIntervalInfo(note.letter);

                notes.push(note);
            }

            return notes;
        }

        function getIntervalInfo(letter) {
            return {
                interval: getIntervalByLetterAndRoot(letter, model.intervalSettings.root),
                root: model.intervalSettings.root
            };
        }

        // Could be a generic getNoteXNotesAwayFrom function
        function getNoteByFretNumber(stringNote, fret) {
            var noteIndex = model.allNoteLetters.indexOf(stringNote.letter) + fret;
            var numOctavesAboveString = Math.floor(noteIndex / 12);

            // If noteIndex is <= 11, the note on this fret is in the same octave
            // as the string's note. After 11, the octave increments. We need to
            // know how many times the octave has incremented, which is
            // noteIndex / 12 floored, and use that to get noteIndex down
            // to something between 0 and 11.

            // Example: If our string has note F4, the letter F is at index 5. If
            // our fret number is 22 our noteIndex is 27, which means the octave has
            // incremented twice (once after 12, the other after 24) and we get that
            // number by doing 27 / 12 floored. So we must reduce 27 by two octaves
            // to get it below 12. Thus it becomes 27 - (12 * 2) = 3, which is note Eb.
            var reducedNoteIndex = noteIndex - (12 * numOctavesAboveString);

            return {
                letter: model.allNoteLetters[reducedNoteIndex],
                octave: stringNote.octave + numOctavesAboveString
            };
        }

        function getIntervalByLetterAndRoot(letter, root) {
            var letterIndex = model.allNoteLetters.indexOf(letter);
            var rootIndex = model.allNoteLetters.indexOf(root);
            var intervalIndex = letterIndex - rootIndex + (letterIndex >= rootIndex ? 0 : 12);

            return model.intervalSettings.intervals[intervalIndex];
        }

        function notesAreEqual(note1, note2) {
            return note1.letter === note2.letter && note1.octave === note2.octave;
        }
    };
})(jQuery);

(function () {
    "use strict";

    window.FretboardValidator = function () {
        var self = this;

        self.validateNote = validateNote;
        self.validateFrettedNote = validateFrettedNote;
        self.validateAllNoteLetters = validateAllNoteLetters;
        self.validateTuning = validateTuning;
        self.validateNumFrets = validateNumFrets;
        self.validateIntervalSettings = validateIntervalSettings;

        function validateNote(note, allNoteLetters) {
            if (!note) {
                throw new Error("Note does not exist: " + objectToString(note));
            }

            if (allNoteLetters.indexOf(note.letter) === -1) {
                throw new Error("Note " + objectToString(note) + " is not in the All Note Letters array " + objectToString(allNoteLetters));
            }

            if (!isNumeric(note.octave)) {
                throw new Error("Octave is not a number: " + objectToString(note));
            }
        }

        // Fretted notes just have stringItsOn and fret properties for now
        function validateFrettedNote(note, tuning, numFrets) {
            if (!note) {
                throw new Error("Note does not exist: " + objectToString(note));
            }

            if (!isNumeric(note.fret)) {
                throw new Error("Fret number is not a number: " + objectToString(note));
            }

            if (note.fret < 0 || note.fret > numFrets) {
                throw new Error("Fret number is out of range: " + objectToString(note));
            }

            var stringFound = false;

            for (var i = 0; i < tuning.length; i++) {
                if (notesAreEqual(tuning[i], note.stringItsOn)) {
                    stringFound = true;
                    break;
                }
            }

            if (!stringFound) {
                throw new Error("String " + objectToString(note.stringItsOn) + " that the note " + objectToString(note) + " is on does not exist in the tuning " + objectToString(tuning));
            }
        }

        function validateNumFrets(numFrets) {
            if (!isNumeric(numFrets)) {
                throw new Error("Number of frets is not a number: " + numFrets);
            }

            if (numFrets <= 0) {
                throw new Error("Number of frets is not a positive number: " + numFrets);
            }
        }

        function validateAllNoteLetters(allNoteLetters) {
            if (!allNoteLetters) {
                throw new Error("All Note Letters array does not exist: " + objectToString(allNoteLetters));
            }

            // 12 unique letters
            var hash = {};

            for (var i = 0; i < allNoteLetters.length; i++) {
                if (!allNoteLetters[i]) {
                    throw new Error("Letter " + allNoteLetters[i] + " in All Note Letters array " + objectToString(allNoteLetters) + " does not exist");
                }

                hash[allNoteLetters[i]] = true;
            }

            if (Object.keys(hash).length !== 12) {
                throw new Error("There must be 12 unique letters in the All Note Letters array: " + objectToString(allNoteLetters));
            }
        }

        function validateTuning(tuning, allNoteLetters) {
            if (!tuning) {
                throw new Error("Tuning does not exist: " + objectToString(tuning));
            }

            if (!tuning.length) {
                throw new Error("Tuning must have at least one note: " + objectToString(tuning));
            }

            var hash = {};

            for (var i = 0; i < tuning.length; i++) {
                validateNote(tuning[i], allNoteLetters);

                var key = objectToString({
                    letter: tuning[i].letter,
                    octave: tuning[i].octave
                });

                hash[key] = true;
            }

            if (Object.keys(hash).length !== tuning.length) {
                throw new Error("Tuning must contain unique notes: " + objectToString(tuning));
            }
        }

        function validateIntervalSettings(intervalSettings, allNoteLetters) {
            if (!intervalSettings) {
                throw new Error("Interval settings do not exist: " + objectToString(intervalSettings));
            }

            if (allNoteLetters.indexOf(intervalSettings.root) === -1) {
                throw new Error("Interval settings root " + objectToString(intervalSettings) + " is not in the All Note Letters array " + objectToString(allNoteLetters));
            }

            if (!intervalSettings.intervals) {
                throw new Error("Interval settings intervals do not exist: " + objectToString(intervalSettings));
            }

            var hash = {};

            for (var i = 0; i < intervalSettings.intervals.length; i++) {
                hash[intervalSettings.intervals[i]] = true;
            }

            if (Object.keys(hash).length !== 12) {
                throw new Error("There must be 12 unique intervals in the Interval settings intervals array: " + objectToString(intervalSettings));
            }
        }

        function isNumeric(n) {
            return typeof (n) === "number" && !isNaN(n) && isFinite(n);
        }

        function notesAreEqual(note1, note2) {
            return note1.letter === note2.letter && note1.octave === note2.octave;
        }

        function objectToString(obj) {
            return JSON.stringify(obj);
        }
    };
})();

(function ($) {
    "use strict";

    window.FretboardHtmlRenderer = function (settings, $element) {
        var self = this;
        self.destroy = destroy;
        self.alterFretboard = alterFretboard;
        self.getClickedNotes = getClickedNotes;
        self.setClickedNotes = setClickedNotes;
        self.clearClickedNotes = clearClickedNotes;
        self.getNoteMode = getNoteMode;
        self.setNoteMode = setNoteMode;
        self.getNoteCircles = getNoteCircles;
        // self.setNoteCircles = setNoteCircles; // implement
        self.getAnimationSpeed = getAnimationSpeed;
        // self.setAnimationSpeed = setAnimationSpeed; // implement
        self.animate = setDimensions;

        var model = $.extend(true, {}, settings);
        var $window = $(window);
        var fretboardContainerCssClass = "fretboard-container";
        var bodyCssClass = "fretboard-body";
        var stringContainerCssClass = "string-container";
        var stringContainerSelector = "." + stringContainerCssClass;
        var noteCssClass = "note";
        var noteSelector = "." + noteCssClass;
        var letterCssClass = "letter";
        var letterSelector = "." + letterCssClass;
        var stringCssClass = "string";
        var stringSelector = "." + stringCssClass;
        var fretLineCssClass = "fret-line";
        var fretLineSelector = "." + fretLineCssClass;
        var hoverCssClass = "hover";
        var clickedCssClass = "clicked";
        var clickedSelector = "." + clickedCssClass;
        var noteCircleCssClass = "note-circle";
        var noteCircleCssSelector = "." + noteCircleCssClass;
        var firstCssClass = "first";
        var lastCssClass = "last";
        var noteDataKey = "noteData";
        var $fretboardContainer = $element;
        var $fretboardBody;
        var timer;

        createFretboard();

        function destroy() {
            $fretboardBody.remove();
            $fretboardContainer.unwrap();
            removeContainerCssClasses();
        }

        function getClickedNotes() {
            // DUPLICATE LOGIC - possibly refactor
            return $fretboardContainer.find(noteSelector + clickedSelector);
        }

        // Will be passed in with just fret and stringItsOn.
        // This method can probably be optimized to not use indexOf
        // and other inefficient search techniques.
        function setClickedNotes(notesToClick) {
            var notesToClick = $.extend(true, [], notesToClick);

            if (!notesToClick) {
                return;
            }

            // For each note that needs to be clicked check its stringItsOn
            // property to see if it matches a note object in the tuning array.
            // If it does, get the index of the matched note in the tuning array
            // and find the corresponding $stringContainer and click its
            // note.
            for (var i = 0; i < notesToClick.length; i++) {
                var noteToClick = notesToClick[i];
                var stringItsOn = noteToClick && noteToClick.stringItsOn;

                if (noteToClick.fret < 0 || noteToClick.fret > model.numFrets || !stringItsOn) {
                    continue;
                }

                for (var j = 0; j < model.tuning.length; j++) {
                    var tuningNote = model.tuning[j];

                    if (!notesAreEqual(tuningNote, stringItsOn)) {
                        continue;
                    }

                    var $stringContainer = $fretboardContainer
                        .find(stringContainerSelector)
                        .eq(j);

                    var $note = $stringContainer
                        .find(noteSelector)
                        .eq(noteToClick.fret);

                    // Make it behave the same as if you hovered over and clicked it.
                    // SOME DUPLICATE LOGIC - possibly refactor
                    $note
                        .removeClass()
                        .addClass(noteCssClass)
                        .addClass(hoverCssClass)
                        .addClass(clickedCssClass)
                        .addClass(noteToClick.cssClass)
                        .off("mouseenter", noteMouseEnter)
                        .off("mouseleave", noteMouseLeave);
                }
            }
        }

        function clearClickedNotes() {
            // DUPLICATE LOGIC - possibly refactor
            $fretboardContainer
                .find(noteSelector + clickedSelector)
                .removeClass()
                .addClass(noteCssClass)
                .on("mouseenter", noteMouseEnter)
                .on("mouseleave", noteMouseLeave);
        }

        function getNoteMode() {
            return model.noteMode;
        }

        function setNoteMode(noteMode) {
            model.noteMode = noteMode;
            alterFretboard(model.allNotes);
        }

        function getNoteCircles() {
            return model.noteCircles;
        }

        function getAnimationSpeed() {
            return model.animationSpeed;
        }

        function createFretboard() {
            $fretboardBody = getFretboardBodyEl();
            $fretboardContainer
                .addClass(fretboardContainerCssClass)
                .append($fretboardBody)
                .wrap(getFretboardScrollWrapperEl());
            alterFretboard(model.allNotes);
            setDimensions(false, false, false, false, false);
            setupRedrawOnResize();
        }

        function setupRedrawOnResize() {
            // Animate the fretboard dimensions on resize, but only
            // on the last resize after X milliseconds
            $window.on("resize", function () {
                clearTimeout(timer);
                timer = setTimeout(function () {
                    setDimensions(true, true, true, true, true);
                }, 100);
            });
        }

        function alterFretboard(allNotes) {
            var oldNotes = $.extend(true, [], model.allNotes);
            var newNotes = $.extend(true, [], allNotes);
            var oldNumFrets = oldNotes[0].length - 1;
            var newNumFrets = newNotes[0].length - 1;
            var fretboardBodyWidth = $fretboardBody.width();
            var fretboardBodyHeight = $fretboardBody.height();

            model.allNotes = newNotes;
            model.numFrets = newNumFrets;
            model.tuning = [];

            for (var i = 0; i < model.allNotes.length; i++) {
                model.tuning.push(model.allNotes[i][0]);
            }

            alterStrings(oldNotes, oldNumFrets, fretboardBodyHeight);
            alterFretLines(oldNumFrets, fretboardBodyWidth);
            alterNoteCircles(oldNumFrets, fretboardBodyWidth, fretboardBodyHeight);
        }

        function alterStrings(oldNotes, oldNumFrets, fretboardBodyHeight) {
            var stringsToIterateOver = Math.max(oldNotes.length, model.allNotes.length);
            var $stringContainers = $fretboardContainer.find(stringContainerSelector);
            var fretsToIterateOver = Math.max(oldNumFrets, model.numFrets);

            for (var i = 0; i < stringsToIterateOver; i++) {
                var $stringContainer = $stringContainers.eq(i);

                // If a string should be there
                if (i < model.tuning.length) {
                    // And a string is not there
                    if (!$stringContainer.length) {
                        // Add a string
                        $stringContainer = getStringContainerEl();
                        $stringContainer.append(getStringEl().css({
                            top: fretboardBodyHeight
                        }));
                        $fretboardBody.append($stringContainer);
                    }

                    // Alter the string (create or edit notes)
                    for (var j = 0; j <= fretsToIterateOver; j++) {
                        var $note = $stringContainer
                            .find(noteSelector)
                            .eq(j);

                        // If a note should be there
                        if (j <= model.numFrets) {
                            var note = model.allNotes[i][j];
                            var noteData = {
                                letter: note.letter,
                                octave: note.octave,
                                fretIndex: j,
                                stringIndex: i,
                                intervalInfo: note.intervalInfo
                            };
                            var $newNote = getNoteEl(noteData);

                            // And a note is there
                            if ($note.length) {
                                // Edit the note
                                var cssClasses = $note.attr("class");
                                $newNote
                                    .addClass(cssClasses)
                                    .css({
                                        top: $note.position().top,
                                        left: $note.position().left,
                                    });
                                $note.replaceWith($newNote);
                            } else {
                                $stringContainer.append($newNote);
                            }
                        } else {
                            // A note should not be there
                            // If a note is there
                            if ($note.length) {
                                // Remove it
                                $note.remove();
                            }
                        }
                    }
                } else {
                    // A string should not be there
                    // If a string is there
                    if ($stringContainer.length) {
                        // Remove it
                        $stringContainer.remove();
                    }
                }
            }
        }

        function alterFretLines(oldNumFrets, fretboardBodyWidth) {
            var fretsToIterateOver = Math.max(oldNumFrets, model.numFrets);
            var $fretLines = $fretboardContainer.find(fretLineSelector);

            for (var i = 0; i <= fretsToIterateOver; i++) {
                var $fretLine = $fretLines.eq(i);
                // If a fret is there
                if (i <= model.numFrets) {
                    // And a fret line is not there
                    if (!$fretLine.length) {
                        // Make it come in from the right
                        $fretboardBody.append(
                            getFretLineEl()
                                .css({
                                    left: fretboardBodyWidth
                                })
                        );
                    }
                } else {
                    // A fret is not there
                    // If a fret line is there
                    if ($fretLine.length) {
                        // Remove it
                        $fretLine.remove();
                    }
                }
            }
        }

        function alterNoteCircles(oldNumFrets, fretboardBodyWidth, fretboardBodyHeight) {
            var fretsToIterateOver = Math.max(oldNumFrets, model.numFrets);
            var $existingNoteCircles = $fretboardContainer.find(noteCircleCssSelector);
            var $existingNoteCirclesHash = {};
            var noteCirclesThatShouldExistHash = {};

            for (var i = 0; i < $existingNoteCircles.length; i++) {
                var $noteCircle = $existingNoteCircles.eq(i);
                var fret = $noteCircle.data("fret");

                if (!$existingNoteCirclesHash[fret]) {
                    $existingNoteCirclesHash[fret] = [];
                }

                $existingNoteCirclesHash[fret].push($noteCircle);
            }

            for (var i = 0; i < model.noteCircles.length; i++) {
                noteCirclesThatShouldExistHash[model.noteCircles[i]] = true;
            }

            for (var i = 0; i <= fretsToIterateOver; i++) {
                // If a fret is there
                if (i <= model.numFrets) {
                    // If a note circle should be there
                    if (noteCirclesThatShouldExistHash[i]) {
                        var isMultipleOfTwelve = i % 12 === 0;
                        var circlesExist = $existingNoteCirclesHash[i] && $existingNoteCirclesHash[i].length;
                        // And it is not there
                        if (!circlesExist) {
                            // Create it
                            if (isMultipleOfTwelve) {
                                var $noteCircle1 = getNoteCircleEl(i);
                                var $noteCircle2 = getNoteCircleEl(i);
                                // Append them first so they get a height
                                $fretboardBody.append($noteCircle1);
                                $fretboardBody.append($noteCircle2);
                                $noteCircle1.css({
                                    top: getDoubleNoteCircleTopValue(fretboardBodyHeight, true) - ($noteCircle1.outerHeight(true) / 2),
                                    left: fretboardBodyWidth
                                });
                                $noteCircle2.css({
                                    top: getDoubleNoteCircleTopValue(fretboardBodyHeight, false) - ($noteCircle2.outerHeight(true) / 2),
                                    left: fretboardBodyWidth
                                });
                            } else {
                                var $noteCircle = getNoteCircleEl(i);
                                // Append it first so it gets a height
                                $fretboardBody.append($noteCircle);
                                $noteCircle.css({
                                    top: getMiddleNoteCircleTopValue(fretboardBodyHeight) - ($noteCircle.outerHeight(true) / 2),
                                    left: fretboardBodyWidth
                                });
                            }
                        }
                    } else {
                        // A note circle should not be there
                        // If a note circle is there
                        if ($existingNoteCirclesHash[i]) {
                            // Remove it
                            for (var j = 0; j < $existingNoteCirclesHash[i].length; j++) {
                                $existingNoteCirclesHash[i][j].remove();
                            }
                        }
                    }
                } else {
                    // A fret is not there
                    // If a note circle is there
                    if ($existingNoteCirclesHash[i]) {
                        // Remove it
                        for (var j = 0; j < $existingNoteCirclesHash[i].length; j++) {
                            $existingNoteCirclesHash[i][j].remove();
                        }
                    }
                }
            }
        }

        function getFretboardBodyEl() {
            return $fretboardBody = $("<div class='" + bodyCssClass + "'></div>");
        }

        // The user may have added some of their own classes so only remove the ones we know about.
        function removeContainerCssClasses() {
            $fretboardContainer
                .removeClass(function (index, css) {
                    return (css.match(/(^|\s)strings-\S+/g) || []).join(' ');
                })
                .removeClass(function (index, css) {
                    return (css.match(/(^|\s)frets-\S+/g) || []).join(' ');
                })
                .removeClass(fretboardContainerCssClass);
        }

        function animateFretboardBody(fretboardBodyWidth, fretboardBodyHeight, fretboardBodyShouldBeAnimated) {
            var position = {
                height: fretboardBodyHeight,
                width: fretboardBodyWidth
            };

            animateProperties($fretboardBody, position, fretboardBodyShouldBeAnimated);
        }

        function animateFretLines(fretWidth, fretLinesShouldBeAnimated) {
            var $fretLines = $fretboardContainer.find(fretLineSelector);

            $fretLines.removeClass(firstCssClass).removeClass(lastCssClass)
                .each(function (fretNum, fretLineEl) {
                    var fretLeftVal = fretNum * fretWidth,
                        $fretLine = $(fretLineEl);

                    if (fretNum === 0) {
                        $fretLine.addClass(firstCssClass);
                    } else if (fretNum === model.numFrets) {
                        $fretLine.addClass(lastCssClass);
                    }

                    var position = {
                        left: fretLeftVal + fretWidth - ($fretLine.outerWidth(true) / 2)
                    };

                    animateProperties($fretLine, position, fretLinesShouldBeAnimated);
                });
        }

        function animateStringContainers(fretboardBodyHeight, fretWidth, stringContainersShouldBeAnimated, notesShouldBeAnimated) {
            var $stringContainers = $fretboardContainer.find(stringContainerSelector);
            var firstStringDistanceFromTop = fretboardBodyHeight / (model.tuning.length * 4);
            var fretHeight = (fretboardBodyHeight - firstStringDistanceFromTop * 2) / (model.tuning.length - 1);

            $stringContainers.removeClass(firstCssClass + " " + lastCssClass)
                .each(function (stringNum, stringContainerEl) {
                    var $stringContainer = $(stringContainerEl),
                        $string = $stringContainer.find(stringSelector),
                        fretTopVal = firstStringDistanceFromTop + (stringNum * fretHeight);

                    if (stringNum === 0) {
                        $stringContainer.addClass(firstCssClass);
                    } else if (stringNum === model.tuning.length - 1) {
                        $stringContainer.addClass(lastCssClass);
                    }

                    var position = {
                        top: fretTopVal - ($string.outerHeight(true) / 2)
                    }

                    animateProperties($string, position, stringContainersShouldBeAnimated);
                    animateNotes($stringContainer, fretTopVal, fretWidth, notesShouldBeAnimated)
                });
        }

        function animateNotes($stringContainer, fretTopVal, fretWidth, notesShouldBeAnimated) {
            $stringContainer
                .find(noteSelector)
                .each(function (fretNum, noteEl) {
                    var $note = $(noteEl),
                        fretLeftVal = fretNum * fretWidth,
                        noteLeftVal = fretLeftVal + ((fretWidth / 2) - ($note.outerWidth(true) / 2)),
                        noteTopVal = fretTopVal - ($note.outerHeight(true) / 2),
                        position = {
                            left: noteLeftVal,
                            top: noteTopVal
                        };

                    animateProperties($note, position, notesShouldBeAnimated);
                });
        }

        function animateNoteCircles(fretboardBodyWidth, fretboardBodyHeight, fretWidth, noteCirclesShouldBeAnimated) {
            var $existingNoteCircles = $fretboardBody.find(noteCircleCssSelector);
            var $existingNoteCirclesHash = {};

            for (var i = 0; i < $existingNoteCircles.length; i++) {
                var $noteCircle = $existingNoteCircles.eq(i);
                var fret = $noteCircle.data("fret");

                if (!$existingNoteCirclesHash[fret]) {
                    $existingNoteCirclesHash[fret] = [];
                }

                $existingNoteCirclesHash[fret].push($noteCircle);
            }

            Object.keys($existingNoteCirclesHash).forEach(function (fret) {
                var $noteCircles = $existingNoteCirclesHash[fret];

                if ($noteCircles.length === 2) {
                    var position = {
                        top: getDoubleNoteCircleTopValue(fretboardBodyHeight, true) - ($noteCircles[0].outerHeight(true) / 2),
                        left: (fret * fretWidth) + ((fretWidth / 2) - ($noteCircles[0].outerWidth(true) / 2))
                    };
                    animateProperties($noteCircles[0], position, noteCirclesShouldBeAnimated);
                    var position = {
                        top: getDoubleNoteCircleTopValue(fretboardBodyHeight, false) - ($noteCircle.outerHeight(true) / 2),
                        left: (fret * fretWidth) + ((fretWidth / 2) - ($noteCircle.outerWidth(true) / 2))
                    };
                    animateProperties($noteCircles[1], position, noteCirclesShouldBeAnimated);
                } else {
                    var position = {
                        top: getMiddleNoteCircleTopValue(fretboardBodyHeight) - ($noteCircle.outerHeight(true) / 2),
                        left: (fret * fretWidth) + ((fretWidth / 2) - ($noteCircle.outerWidth(true) / 2))
                    };
                    animateProperties($noteCircles[0], position, noteCirclesShouldBeAnimated);
                }
            });
        }

        function noteMouseEnter(e) {
            $(this).addClass(hoverCssClass);
        }

        function noteMouseLeave(e) {
            $(this).removeClass(hoverCssClass);
        }

        function getStringEl() {
            return $("<div class='" + stringCssClass + "'></div>");
        }

        function getFretboardScrollWrapperEl() {
            return $("<div class='fretboard-scroll-wrapper'></div>");
        }

        function getNoteCircleEl(fretNum) {
            return $("<div class='" + noteCircleCssClass + "'></div>")
                .data('fret', fretNum);
        }

        function getNoteLetterEl(note) {
            // Need to validate noteMode earlier up
            var text = model.noteMode === 'interval' ? note.intervalInfo.interval : note.letter;

            return $("<div class='" + letterCssClass + "'>" + text + "</div>");
        }

        function getNoteEl(noteData) {
            return $("<div class='" + noteCssClass + "'></div>")
                .on("mouseenter", noteMouseEnter)
                .on("mouseleave", noteMouseLeave)
                .on("click", onNoteClick)
                .append(getNoteLetterEl(noteData))
                .data(noteDataKey, noteData);
        }

        function getStringContainerEl() {
            return $("<div class='" + stringContainerCssClass + "'></div>");
        }

        function onNoteClick() {
            $fretboardContainer.trigger("noteClicked", this);
        }

        function getFretLineEl() {
            return $("<div class='" + fretLineCssClass + "'></div>");
        }

        // Absolutely position all of the inner elements, and animate their positioning if requested
        function setDimensions(fretboardBodyShouldBeAnimated, fretLinesShouldBeAnimated, stringContainersShouldBeAnimated, notesShouldBeAnimated, noteCirclesShouldBeAnimated) {
            // Add the CSS classes that state the number of strings and frets,
            // and then get the height/width of the fretboard container because
            // the new CSS classes might change the height/width.
            removeContainerCssClasses();

            $fretboardContainer
                .addClass(fretboardContainerCssClass)
                .addClass("strings-" + model.tuning.length)
                .addClass("frets-" + model.numFrets);

            var dimensions = model.dimensionsFunc($fretboardContainer, $fretboardBody, model);
            var fretboardBodyHeight = dimensions.height;
            var fretboardBodyWidth = dimensions.width;
            var fretWidth = fretboardBodyWidth / (model.numFrets + 1);

            animateFretboardBody(fretboardBodyWidth, fretboardBodyHeight, fretboardBodyShouldBeAnimated);
            animateFretLines(fretWidth, fretLinesShouldBeAnimated);
            animateStringContainers(fretboardBodyHeight, fretWidth, stringContainersShouldBeAnimated, notesShouldBeAnimated);
            animateNoteCircles(fretboardBodyWidth, fretboardBodyHeight, fretWidth, noteCirclesShouldBeAnimated);
        }

        function notesAreEqual(note1, note2) {
            return note1.letter === note2.letter && note1.octave === note2.octave;
        }

        function getFirstStringDistanceFromTop(fretboardBodyHeight) {
            return fretboardBodyHeight / (model.tuning.length * 4);
        }

        function getFretHeight(fretboardBodyHeight) {
            return (fretboardBodyHeight - (getFirstStringDistanceFromTop(fretboardBodyHeight) * 2)) / (model.tuning.length - 1);
        }

        function getFretHeightFactorForNoteCircle() {
            var maxStringNumForBaseline = 4;
            var increment = 0.5;
            var offsetAtWhichToIncrement = 2;

            if (model.tuning.length <= maxStringNumForBaseline) {
                return increment;
            }

            var numberOfIncrements = Math.ceil((model.tuning.length - maxStringNumForBaseline) / offsetAtWhichToIncrement);

            return increment + (numberOfIncrements * increment);
        }

        function getMiddleNoteCircleTopValue(fretboardBodyHeight) {
            return fretboardBodyHeight / 2;
        }

        function getDoubleNoteCircleTopValue(fretboardBodyHeight, isTopCircle) {
            if (isTopCircle) {
                return getFirstStringDistanceFromTop(fretboardBodyHeight) + getFretHeightFactorForNoteCircle() * getFretHeight(fretboardBodyHeight);
            }

            return fretboardBodyHeight - getFretHeightFactorForNoteCircle() * getFretHeight(fretboardBodyHeight) - getFirstStringDistanceFromTop(fretboardBodyHeight);
        }

        function animateProperties($element, properties, shouldBeAnimated) {
            var isVisible = $element.css("display") !== "none" && $element.css("opacity") > 0;

            if (isVisible && shouldBeAnimated) {
                $element.animate(properties, {
                    duration: model.animationSpeed,
                    queue: false
                });
            } else {
                $element.css(properties);
            }
        }
    };
})(jQuery);

// This is the jQuery plugin. It instantiates the fretboard model and
// fretboard renderer and coordinates interactions between them. It
// contains an API which the user can get:
// var api = $(".my-fretboard-js").data('api');
(function ($) {
    "use strict";

    $.fn.fretboard = function (options) {
        return this.each(function () {
            var api = {};
            api.destroy = destroy;
            api.getAllNotes = getAllNotes;
            api.getChordMode = getChordMode;
            api.setChordMode = setChordMode;
            api.getAllNoteLetters = getAllNoteLetters;
            api.getClickedNotes = getClickedNotes;
            api.setClickedNotes = setClickedNotes;
            api.clearClickedNotes = clearClickedNotes;
            api.getNoteClickingDisabled = getNoteClickingDisabled;
            api.setNoteClickingDisabled = setNoteClickingDisabled;
            api.getTuning = getTuning;
            api.setTuning = setTuning;
            api.getNumFrets = getNumFrets;
            api.setNumFrets = setNumFrets;
            api.getIntervalSettings = getIntervalSettings;
            api.setIntervalSettings = setIntervalSettings;
            api.getNoteMode = getNoteMode;
            api.setNoteMode = setNoteMode;
            api.getNoteCircles = getNoteCircles;
            // self.setNoteCircles = setNoteCircles; // implement
            api.getAnimationSpeed = getAnimationSpeed;
            // self.setAnimationSpeed = setAnimationSpeed; // implement
            api.addNotesClickedListener = addNotesClickedListener;
            // api.removeNotesClickedListener = removeNotesClickedListener; // implement

            var $element = $(this);
            // The value at which the octave is incremented needs to be first
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
            var defaultNoteCircles = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
            var defaultIntervalSettings = {
                intervals: ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'],
                root: defaultNoteLetters[0]
            };
            var defaultNoteMode = 'letter'; // or 'interval'
            // Take up the container's height and width by default
            var defaultDimensionsFunc = function ($fretboardContainer, $fretboardBody, settings) {
                var containerWidth = $fretboardContainer.width(),
                    containerHeight = $fretboardContainer.height(),
                    fretboardBodyWidthDiff = $fretboardBody.outerWidth(true) - $fretboardBody.width(),
                    fretboardBodyHeightDiff = $fretboardBody.outerHeight(true) - $fretboardBody.height(),
                    newBodyWidth = containerWidth - fretboardBodyWidthDiff,
                    newBodyHeight = containerHeight - fretboardBodyHeightDiff;

                return {
                    width: newBodyWidth,
                    height: newBodyHeight
                };
            };
            var defaults = {
                allNoteLetters: defaultNoteLetters,
                tuning: defaultTuning,
                numFrets: 15,
                isChordMode: true,
                noteClickingDisabled: false,
                noteMode: defaultNoteMode,
                intervalSettings: defaultIntervalSettings,
                animationSpeed: 400, // ms
                noteCircles: defaultNoteCircles,
                dimensionsFunc: defaultDimensionsFunc,
                onClickedNotesChange: []
            };
            // These settings will have the defaults extended with user options
            var settings = {};
            var fretboardModel;
            var fretboardRenderer;

            extendDefaultsWithUserOptions(options);
            createFretboardModel();
            createFretboardRenderer();

            $element.on("noteClicked", onUserNoteClick);
            $element.data('api', api);

            function destroy() {
                fretboardModel.destroy();
                fretboardRenderer.destroy();
            }

            function getAllNotes() {
                return fretboardModel.getAllNotes();
            }

            function getChordMode() {
                return fretboardModel.getChordMode();
            }

            function setChordMode(isChordMode) {
                fretboardModel.setChordMode(isChordMode);
            }

            function getAllNoteLetters() {
                return fretboardModel.getAllNoteLetters();
            }

            function getClickedNotes() {
                return fretboardModel.getClickedNotes();
            }

            function setClickedNotes(clickedNotes) {
                var clickedNotesWithCssClasses = $.extend(true, [], clickedNotes);
                fretboardModel.setClickedNotes(clickedNotes);
                var newClickedNotes = fretboardModel.getClickedNotes();
                var $clickedNotes = fretboardRenderer.getClickedNotes();
                var allNotes = fretboardModel.getAllNotes();
                reattachCSSClassesFromDOM(allNotes, newClickedNotes, $clickedNotes);
                reattachCSSClassesFromUser(newClickedNotes, clickedNotesWithCssClasses);
                fretboardRenderer.setClickedNotes(newClickedNotes);
            }

            function clearClickedNotes() {
                fretboardModel.clearClickedNotes();
                fretboardRenderer.clearClickedNotes();
            }

            function getNoteClickingDisabled() {
                return fretboardModel.getNoteClickingDisabled();
            }

            function setNoteClickingDisabled(isDisabled) {
                fretboardModel.setNoteClickingDisabled(isDisabled);
            }

            function getTuning() {
                return fretboardModel.getTuning();
            }

            function setTuning(tuning) {
                fretboardModel.setTuning(tuning);
                fretboardRenderer.alterFretboard(fretboardModel.getAllNotes());
                fretboardRenderer.animate(true, true, true, true, true);
            }

            function getNumFrets() {
                return fretboardModel.getNumFrets();
            }

            function setNumFrets(numFrets) {
                fretboardModel.setNumFrets(numFrets);
                fretboardRenderer.alterFretboard(fretboardModel.getAllNotes());
                fretboardRenderer.animate(true, true, true, true, true);
            }

            function getIntervalSettings() {
                return fretboardModel.getIntervalSettings();
            }

            function setIntervalSettings(settings) {
                fretboardModel.setIntervalSettings(settings);
                fretboardRenderer.alterFretboard(fretboardModel.getAllNotes());
            }

            function getNoteMode() {
                return fretboardRenderer.getNoteMode();
            }

            function setNoteMode(noteMode) {
                fretboardRenderer.setNoteMode(noteMode);
            }

            function getNoteCircles() {
                return fretboardRenderer.getNoteCircles();
            }

            function getAnimationSpeed() {
                return fretboardRenderer.getAnimationSpeed();
            }

            function createFretboardModel() {
                var modelSettings = {
                    allNoteLetters: settings.allNoteLetters,
                    tuning: settings.tuning,
                    numFrets: settings.numFrets,
                    isChordMode: settings.isChordMode,
                    noteClickingDisabled: settings.noteClickingDisabled,
                    intervalSettings: settings.intervalSettings
                };

                fretboardModel = new FretboardModel(modelSettings);
            }

            function createFretboardRenderer() {
                var fretboardRendererSettings = {
                    // Even though this info exists in the user settings that were passed in,
                    // we ask the model for it again to stick with the convention that the
                    // model is always asked for data in case it alters the data.
                    allNotes: fretboardModel.getAllNotes(),
                    tuning: fretboardModel.getTuning(),
                    numFrets: fretboardModel.getNumFrets(),

                    // TODO: the renderer should validate its own settings
                    noteCircles: settings.noteCircles,
                    animationSpeed: settings.animationSpeed,
                    dimensionsFunc: getAlteredDimensionsFunc(),
                    noteMode: settings.noteMode
                };

                fretboardRenderer = new FretboardHtmlRenderer(fretboardRendererSettings, $element);
            }

            function addNotesClickedListener(callback) {
                if (!callback) {
                    return;
                }

                settings.onClickedNotesChange.push(callback);
            }

            // Makes a copy of the options that were passed in, just in case the
            // user modifies that object. Then use it to extend the defaults.
            function extendDefaultsWithUserOptions(userOptions) {
                $.extend(settings, defaults, $.extend(true, {}, userOptions));
            }

            // Create a new function that returns whatever properties (width/height)
            // the user-defined function does not return.
            function getAlteredDimensionsFunc() {
                if (settings.dimensionsFunc !== defaultDimensionsFunc) {
                    var oldFunc = settings.dimensionsFunc;

                    return function ($fretboardContainer, $fretboardBody, settings) {
                        var dimensions = oldFunc($fretboardContainer, $fretboardBody, settings),
                            width = dimensions.width,
                            height = dimensions.height,
                            defaultDimensions = defaultDimensionsFunc($fretboardContainer, $fretboardBody, settings),
                            defaultWidth = defaultDimensions.width,
                            defaultHeight = defaultDimensions.height;

                        return {
                            width: width || defaultWidth,
                            height: height || defaultHeight
                        };
                    };
                }

                return settings.dimensionsFunc;
            }

            function reattachCSSClassesFromDOM(allNotes, newClickedNotes, $clickedNotes) {
                for (var i = 0; i < newClickedNotes.length; i++) {
                    for (var j = 0; j < $clickedNotes.length; j++) {
                        var $oldNote = $clickedNotes.eq(j);
                        var oldNoteData = $oldNote.data("noteData");
                        var oldNote = allNotes[oldNoteData.stringIndex][oldNoteData.fretIndex];
                        if (frettedNotesAreEqual(newClickedNotes[i], oldNote)) {
                            var cssClasses = $oldNote.attr("class");
                            newClickedNotes[i].cssClass = cssClasses;

                            break;
                        }
                    }
                }
            }

            function reattachCSSClassesFromUser(newClickedNotes, clickedNotesWithCssClasses) {
                for (var i = 0; i < newClickedNotes.length; i++) {
                    for (var j = 0; j < clickedNotesWithCssClasses.length; j++) {
                        if (frettedNotesAreEqual(newClickedNotes[i], clickedNotesWithCssClasses[j])) {
                            newClickedNotes[i].cssClass = clickedNotesWithCssClasses[j].cssClass;

                            break;
                        }
                    }
                }
            }

            function executeOnClickedNotesCallbacks() {
                for (var i = 0; i < settings.onClickedNotesChange.length; i++) {
                    settings.onClickedNotesChange[i]();
                }
            }

            function onUserNoteClick(e, clickedNoteEl) {
                // Ask the model what notes should be clicked after this event
                // because things like chord-mode could mean other notes are
                // removed in addition to this one being added.
                var $clickedNote = $(clickedNoteEl);
                var clickedNoteData = $clickedNote.data("noteData");
                var allNotes = fretboardModel.getAllNotes();
                var clickedNote = allNotes[clickedNoteData.stringIndex][clickedNoteData.fretIndex];
                fretboardModel.setClickedNotes([clickedNote], true);
                var newClickedNotes = fretboardModel.getClickedNotes();

                // The model will not know of CSS classes so we reattach the
                // ones that were already there.
                var $clickedNotes = fretboardRenderer.getClickedNotes();
                reattachCSSClassesFromDOM(allNotes, newClickedNotes, $clickedNotes)

                fretboardRenderer.clearClickedNotes();
                fretboardRenderer.setClickedNotes(newClickedNotes);
                executeOnClickedNotesCallbacks();
            }
        });
    };

    function notesAreEqual(note1, note2) {
        return note1.letter === note2.letter && note1.octave === note2.octave;
    }

    function frettedNotesAreEqual(note1, note2) {
        return notesAreEqual(note1.stringItsOn, note2.stringItsOn) && note1.fret === note2.fret;
    }
})(jQuery);