(function () {
    "use strict";

    window.jQueryFretboard = {};
})();

(function ($) {
    "use strict";

    window.jQueryFretboard.FretboardModel = function (settings, validator) {
        var self = this;
        self.destroy = destroy;
        self.getAllNotes = getAllNotes;
        self.getChordMode = getChordMode;
        self.setChordMode = setChordMode;
        self.getNoteLetters = getNoteLetters;
        self.getClickedNotes = getClickedNotes;
        self.setClickedNotes = setClickedNotes;
        self.clearClickedNotes = clearClickedNotes;
        self.getNoteClickingDisabled = getNoteClickingDisabled;
        self.setNoteClickingDisabled = setNoteClickingDisabled;
        self.getTuning = getTuning;
        self.setTuning = setTuning;
        self.getNumFrets = getNumFrets;
        self.setNumFrets = setNumFrets;
        self.getIntervals = getIntervals;
        self.getRoot = getRoot;
        self.setRoot = setRoot;

        var model = {};

        initializeModel(settings);

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

        function getNoteLetters() {
            return $.extend(true, [], model.noteLetters);
        }

        function getClickedNotes() {
            var clickedNoteGroups = [];

            for (var i = 0; i < model.tuning.length; i++) {
                var clickedNoteGroup = getClickedNoteGroup(i);

                if (!clickedNoteGroup.notes.length) continue;

                clickedNoteGroups.push(clickedNoteGroup);
            }

            return $.extend(true, [], clickedNoteGroups);
        }

        // asUser means to check other settings that might affect which notes can be clicked, such as
        // isChordMode, noteClickingDisabled, etc, as would be done if a user were clicking.
        function setClickedNotes(clickedNoteGroups, asUser) {
            if (asUser && model.noteClickingDisabled) return;

            clickedNoteGroups = $.extend(true, [], clickedNoteGroups);
            validateFrettedNoteGroups(clickedNoteGroups);

            clickedNoteGroups.forEach(function (clickedNoteGroup) {
                clickFrettedNotes(clickedNoteGroup.string, clickedNoteGroup.notes, asUser);
            });
        }

        function clearClickedNotes() {
            model.clickedNotes = jQueryFretboard.utilities.createEmptyArrays(model.tuning.length);
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

            validator.validateTuning(newTuning, model.noteLetters);
            model.tuning = newTuning;

            createAllNotes();
            updateClickedNotesForTuning(oldTuning.length);
        }

        function getNumFrets() {
            return model.numFrets;
        }

        function setNumFrets(newNumFrets) {
            validator.validateNumFrets(newNumFrets);
            model.numFrets = newNumFrets;

            createAllNotes();
            updateClickedNotesForNumFrets();
        }

        function getIntervals() {
            return $.extend(true, [], model.intervals);
        }

        function getRoot() {
            return model.root;
        }

        function setRoot(root) {
            validator.validateRoot(root, model.noteLetters);
            model.root = root;

            createAllNotes();
        }

        function initializeModel(settings) {
            model = {
                allNotes: [],
                clickedNotes: [],
                // The rest get copied from settings
                noteLetters: null,
                tuning: null,
                numFrets: null,
                isChordMode: null,
                noteClickingDisabled: null,
                intervals: null,
                root: null
            };

            validator.validateNoteLetters(settings.noteLetters);
            model.noteLetters = settings.noteLetters;

            validator.validateTuning(settings.tuning, settings.noteLetters);
            model.tuning = settings.tuning;

            validator.validateNumFrets(settings.numFrets);
            model.numFrets = settings.numFrets;

            validator.validateIntervals(settings.intervals, model.noteLetters);
            model.intervals = settings.intervals;

            validator.validateRoot(settings.root, model.noteLetters);
            model.root = settings.root;

            model.isChordMode = settings.isChordMode;
            model.noteClickingDisabled = settings.noteClickingDisabled;

            createAllNotes();
            createClickedNotes();
        }

        function createAllNotes() {
            model.allNotes = model.tuning.map(function (openNote, i) {
                return {
                    string: openNote,
                    notes: createNotesOnString(openNote)
                }
            });
        }

        function createClickedNotes() {
            model.clickedNotes = [];
            jQueryFretboard.utilities.pushMany(model.clickedNotes, jQueryFretboard.utilities.createEmptyArrays(model.tuning.length));
        }

        function createNotesOnString(openNote) {
            var notes = [];

            for (var i = 0; i <= model.numFrets; i++) {
                notes.push(createNote(openNote, i));
            }

            return notes;
        }

        function createNote(openNote, fret) {
            var note = getNoteByFretNumber(openNote, fret);

            note.fret = fret;
            note.interval = getIntervalByLetterAndRoot(note.letter, model.root);

            return note;
        }

        function getClickedNotesOnString(stringIndex) {
            return model.clickedNotes[stringIndex].map(function (fret, i) {
                return model.allNotes[stringIndex].notes[fret];
            });
        }

        function getClickedNoteGroup(stringIndex) {
            return {
                string: model.tuning[stringIndex],
                notes: getClickedNotesOnString(stringIndex)
            };
        }

        // Could be a generic getNoteXNotesAwayFrom function
        function getNoteByFretNumber(stringNote, fret) {
            var noteIndex = model.noteLetters.indexOf(stringNote.letter) + fret;
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
                letter: model.noteLetters[reducedNoteIndex],
                octave: stringNote.octave + numOctavesAboveString
            };
        }

        function getIntervalByLetterAndRoot(letter, root) {
            var letterIndex = model.noteLetters.indexOf(letter);
            var rootIndex = model.noteLetters.indexOf(root);
            var intervalIndex = letterIndex - rootIndex + (letterIndex >= rootIndex ? 0 : 12);

            return model.intervals[intervalIndex];
        }

        function validateFrettedNoteGroups(frettedNoteGroups) {
            frettedNoteGroups.forEach(function (frettedNoteGroup) {
                validateFrettedNoteGroup(frettedNoteGroup);
            });
        }

        function validateFrettedNoteGroup(frettedNoteGroup) {
            frettedNoteGroup.notes.forEach(function (frettedNote) {
                validator.validateFrettedNote(frettedNote, frettedNoteGroup.string, model.tuning, model.numFrets);
            });
        }

        function clickFrettedNotes(string, frettedNotes, asUser) {
            frettedNotes.forEach(function (frettedNote) {
                clickFret(string, frettedNote.fret, asUser);
            });
        }

        function clickFret(string, fret, asUser) {
            for (var i = 0; i < model.tuning.length; i++) {
                if (!jQueryFretboard.utilities.notesAreEqual(model.tuning[i], string)) continue;

                clickFretOnString(i, fret, asUser);

                return;
            }
        }

        function clickFretOnString(stringIndex, fret, asUser) {
            if (asUser) {
                clickFrettedNoteAsUser(stringIndex, fret)
            } else {
                clickFrettedNoteAsAdmin(stringIndex, fret);
            }
        }

        function clickFrettedNoteAsUser(stringIndex, fret) {
            var indexOfClickedFret = getIndexOfClickedFret(stringIndex, fret);
            var fretAlreadyClicked = indexOfClickedFret !== -1;

            if (model.isChordMode) {
                clickFrettedNoteAsUserInChordMode(stringIndex, fret, fretAlreadyClicked)
            } else {
                clickFrettedNoteAsUserInScaleMode(stringIndex, fret, fretAlreadyClicked, indexOfClickedFret);
            }
        }

        function clickFrettedNoteAsAdmin(stringIndex, fret) {
            if (getIndexOfClickedFret(stringIndex, fret) === -1) {
                model.clickedNotes[stringIndex].push(fret);
            }
        }

        function getIndexOfClickedFret(stringIndex, fret) {
            return model.clickedNotes[stringIndex].indexOf(fret);
        }

        function clickFrettedNoteAsUserInChordMode(stringIndex, fret, fretAlreadyClicked) {
            if (fretAlreadyClicked) {
                model.clickedNotes[stringIndex] = [];
            } else {
                model.clickedNotes[stringIndex] = [fret];
            }
        }

        function clickFrettedNoteAsUserInScaleMode(stringIndex, fret, fretAlreadyClicked, indexOfClickedFret) {
            if (fretAlreadyClicked) {
                model.clickedNotes[stringIndex].splice(indexOfClickedFret, 1);
            } else {
                model.clickedNotes[stringIndex].push(fret);
            }
        }

        function updateClickedNotesForTuning(oldTuningLength) {
            var numNewStrings = model.tuning.length - oldTuningLength;

            if (numNewStrings < 0) {
                model.clickedNotes = model.clickedNotes.slice(0, model.tuning.length);
            } else {
                jQueryFretboard.utilities.pushMany(model.clickedNotes, jQueryFretboard.utilities.createEmptyArrays(numNewStrings));
            }
        }

        function updateClickedNotesForNumFrets() {
            model.tuning.forEach(function (openNote, i) {
                filterClickedNotes(i);
            });
        }

        function filterClickedNotes(stringIndex) {
            model.clickedNotes[stringIndex] = model.clickedNotes[stringIndex].filter(function (fret) {
                return fret <= model.numFrets;
            });
        }
    };
})(jQuery);

(function () {
    "use strict";

    window.jQueryFretboard.FretboardValidator = function () {
        var self = this;

        self.validateNote = validateNote;
        self.validateFrettedNote = validateFrettedNote;
        self.validateNoteLetters = validateNoteLetters;
        self.validateTuning = validateTuning;
        self.validateNumFrets = validateNumFrets;
        self.validateIntervals = validateIntervals;
        self.validateRoot = validateRoot;
        self.validateNoteMode = validateNoteMode;

        function validateNote(note, noteLetters) {
            if (!note) {
                throw new Error("Note is not valid: " + objectToString(note));
            }

            if (noteLetters.indexOf(note.letter) === -1) {
                throw new Error("Note " + objectToString(note) + " is not in alNoteLetters: " + objectToString(noteLetters));
            }

            if (!isNumeric(note.octave)) {
                throw new Error("Octave is not a number: " + objectToString(note));
            }
        }

        function validateFrettedNote(note, string, tuning, numFrets) {
            if (!note) {
                throw new Error("Note is not valid: " + objectToString(note));
            }

            if (!isNumeric(note.fret)) {
                throw new Error("Fret is not a number: " + objectToString(note));
            }

            if (note.fret < 0 || note.fret > numFrets) {
                throw new Error("Fret is out of range: " + objectToString(note));
            }

            var stringFound = false;

            for (var i = 0; i < tuning.length; i++) {
                if (jQueryFretboard.utilities.notesAreEqual(tuning[i], string)) {
                    stringFound = true;
                    break;
                }
            }

            if (!stringFound) {
                throw new Error("The note: " + objectToString(note) + " belongs to the string: " + objectToString(string) + " that does not exist in the tuning: " + objectToString(tuning));
            }
        }

        function validateNumFrets(numFrets) {
            if (!isNumeric(numFrets)) {
                throw new Error("numFrets is not a number: " + numFrets);
            }

            if (numFrets <= 0) {
                throw new Error("numFrets is not a positive number: " + numFrets);
            }
        }

        function validateNoteLetters(noteLetters) {
            if (!noteLetters) {
                throw new Error("noteLetters is not valid: " + objectToString(noteLetters));
            }

            // 12 unique letters
            var hash = {};

            noteLetters.forEach(function (noteLetter) {
                if (!noteLetter) {
                    throw new Error("The letter " + noteLetter + " in noteLetters: " + objectToString(noteLetters) + " is not valid");
                }

                hash[noteLetter] = true;
            });

            if (Object.keys(hash).length !== 12) {
                throw new Error("There must be 12 unique letters in noteLetters: " + objectToString(noteLetters));
            }
        }

        function validateTuning(tuning, noteLetters) {
            if (!tuning) {
                throw new Error("Tuning is not valid: " + objectToString(tuning));
            }

            if (!tuning.length) {
                throw new Error("Tuning must have at least one note: " + objectToString(tuning));
            }

            var hash = {};

            tuning.forEach(function (openNote) {
                validateNote(openNote, noteLetters);

                var key = objectToString({
                    letter: openNote.letter,
                    octave: openNote.octave
                });

                hash[key] = true;
            });

            if (Object.keys(hash).length !== tuning.length) {
                throw new Error("Tuning must contain unique notes: " + objectToString(tuning));
            }
        }

        function validateIntervals(intervals, noteLetters) {
            if (!intervals) {
                throw new Error("intervals is not valid: " + objectToString(intervals));
            }

            var hash = {};

            intervals.forEach(function (interval, i) {
                hash[interval] = true;
            });

            if (Object.keys(hash).length !== 12) {
                throw new Error("There must be 12 unique intervals: " + objectToString(intervals));
            }
        }

        function validateRoot(root, noteLetters) {
            if (noteLetters.indexOf(root) === -1) {
                throw new Error("The root: " + root + " is not in noteLetters: " + objectToString(noteLetters));
            }
        }

        function validateNoteMode(noteMode) {
            if (!(noteMode === "letter" || noteMode === "interval")) {
                throw new Error("Note mode must be \"letter\" or \"interval\": " + objectToString(noteMode));
            }
        }

        function isNumeric(n) {
            return typeof (n) === "number" && isFinite(n);
        }

        function objectToString(obj) {
            return JSON.stringify(obj);
        }
    };
})();

(function ($) {
    "use strict";

    window.jQueryFretboard.FretboardHtmlRenderer = function (settings, $element, validator) {
        var self = this;
        self.destroy = $destroy;
        self.syncFretboard = $syncFretboard;
        self.getClickedNotes = $getClickedNotes;
        self.setClickedNotes = $setClickedNotes;
        self.clearClickedNotes = $clearClickedNotes;
        self.setNoteClickingDisabled = setNoteClickingDisabled;
        self.getNoteMode = getNoteMode;
        self.setNoteMode = $setNoteMode;
        self.getNoteCircles = getNoteCircles;
        self.getAnimationSpeed = getAnimationSpeed;
        self.getDimensionsFunc = getDimensionsFunc;
        self.redrawPositions = $redrawPositions;

        var model = $.extend(true, {}, settings);
        var fretboardContainerCssClass = "fretboard-container";
        var fretboardScrollWrapperCssClass = "fretboard-scroll-wrapper";
        var bodyCssClass = "fretboard-body";
        var stringContainerContainerCssClass = "string-container-container";
        var stringContainerContainerSelector = "." + stringContainerContainerCssClass;
        var fretLineContainerCssClass = "fret-line-container";
        var fretLineContainerSelector = "." + fretLineContainerCssClass;
        var noteCircleContainerCssClass = "note-circle-container";
        var noteCircleContainerSelector = "." + noteCircleContainerCssClass;
        var stringContainerCssClass = "string-container";
        var stringContainerSelector = "." + stringContainerCssClass;
        var noteCssClass = "note";
        var noteSelector = "." + noteCssClass;
        var noteDisplayCssClass = "note-display";
        var noteDisplaySelector = "." + noteDisplayCssClass;
        var stringCssClass = "string";
        var stringSelector = "." + stringCssClass;
        var fretLineCssClass = "fret-line";
        var fretLineSelector = "." + fretLineCssClass;
        var hoverCssClass = "hover";
        var clickedCssClass = "clicked";
        var clickedSelector = "." + clickedCssClass;
        var clickedNoteSelector = clickedSelector + noteSelector;
        var noteCircleCssClass = "note-circle";
        var noteCircleCssSelector = "." + noteCircleCssClass;
        var firstCssClass = "first";
        var lastCssClass = "last";
        var isDisabledCssClass = "is-disabled";
        var noteDataKey = "noteData";
        var $window = $(window);
        var $fretboardContainer = $element;
        var $fretboardBody = null;
        var timer = null;

        $createFretboard();

        function $destroy() {
            $fretboardBody.remove();
            $fretboardContainer.unwrap();
            $removeContainerCssClasses();
            $window.off("resize", $onResize);
        }

        function $syncFretboard(allNotes) {
            var oldNumStrings = model.allNotes.length;
            var oldNumFrets = model.allNotes[0].notes.length - 1;
            var newNotes = $.extend(true, [], allNotes);
            var fretboardBodyWidth = $fretboardBody.width();
            var fretboardBodyHeight = $fretboardBody.height();

            model.allNotes = newNotes;
            model.numFrets = newNotes[0].notes.length - 1;

            createTuning();

            $syncStringContainers($getStringContainerContainer(), $getStringContainers(), oldNumStrings, oldNumFrets, fretboardBodyHeight);
            $syncFretLines($getFretLineContainer(), $getFretLines(), oldNumFrets, fretboardBodyWidth);
            $syncNoteCircles($getNoteCircleContainer(), $getNoteCircles(), oldNumFrets, fretboardBodyWidth, fretboardBodyHeight);
        }

        function $getClickedNotes() {
            return {
                $elements: $fretboardContainer.find(clickedNoteSelector),
                model: model.clickedNotes
            };
        }

        function $setClickedNotes(clickedNoteGroups) {
            model.clickedNotes = $.extend(true, [], clickedNoteGroups);

            model.clickedNotes.forEach(function (noteGroup) {
                $clickNoteGroup(noteGroup);
            });
        }

        function $clickNoteGroup(noteGroup) {
            noteGroup.notes.forEach(function (notes) {
                $clickNote($getStringContainers(), noteGroup.string, notes);
            });
        }

        function $clearClickedNotes() {
            $getClickedNotes()
                .$elements
                .removeClass()
                .addClass(noteCssClass);
        }

        function setNoteClickingDisabled(isDisabled) {
            model.noteClickingDisabled = isDisabled;
        }

        function getNoteMode() {
            return model.noteMode;
        }

        function $setNoteMode(noteMode) {
            validator.validateNoteMode(noteMode);
            model.noteMode = noteMode;
            $syncFretboard(model.allNotes);
        }

        function getNoteCircles() {
            return model.noteCircles;
        }

        function getAnimationSpeed() {
            return model.animationSpeed;
        }

        function getDimensionsFunc() {
            return model.dimensionsFunc;
        }

        function $redrawPositions(shouldBeAnimated, onPreRender) {
            // Add the CSS classes that state the number of strings and frets,
            // and then get the height/width of the fretboard container because
            // the new CSS classes might change the height/width.
            $removeContainerCssClasses();

            $fretboardContainer
                .addClass(fretboardContainerCssClass)
                .addClass("strings-" + model.tuning.length)
                .addClass("frets-" + model.numFrets);

            if (model.noteClickingDisabled) {
                $fretboardContainer.addClass(isDisabledCssClass);
            } else {
                $fretboardContainer.removeClass(isDisabledCssClass);
            }

            setTimeout(function () {
                $postTimeoutRedraw(shouldBeAnimated, onPreRender);
            });
        }

        function $postTimeoutRedraw(shouldBeAnimated, onPreRender) {
            if (onPreRender) {
                onPreRender();
            }

            var dimensions = model.dimensionsFunc($fretboardContainer, $fretboardBody, model);
            var fretboardBodyHeight = dimensions.height;
            var fretboardBodyWidth = dimensions.width;
            var fretWidth = fretboardBodyWidth / (model.numFrets + 1);
            var position = {
                height: dimensions.isDefaultHeight ? "" : "initial",
                width: dimensions.isDefaultWidth ? "" : "initial"
            };

            $setPosition($fretboardContainer, position, false);
            $positionFretboardBody(fretboardBodyWidth, fretboardBodyHeight, shouldBeAnimated);
            $positionFretLines(fretWidth, shouldBeAnimated);
            $positionStringContainers(fretboardBodyHeight, fretWidth, shouldBeAnimated, shouldBeAnimated);
            $positionNoteCircles(fretboardBodyHeight, fretWidth, shouldBeAnimated);
        }

        function $createFretboard() {
            validator.validateNoteMode(model.noteMode);

            $fretboardBody = $createFretboardBody()
                .hide()
                .append($createStringContainerContainer())
                .append($createFretLineContainer())
                .append($createNoteCircleContainer());

            $fretboardContainer
                .addClass(fretboardContainerCssClass)
                .append($fretboardBody)
                .wrap($createScrollWrapper());

            $syncFretboard(model.allNotes);
            $redrawPositions(false, $onInitialPreRender);
            $setupRedrawOnResize();
        }

        function $onInitialPreRender() {
            $fretboardBody.show();
        }

        function $clickNote($stringContainers, string, frettedNote) {
            for (var i = 0; i < model.tuning.length; i++) {
                if (!jQueryFretboard.utilities.notesAreEqual(model.tuning[i], string)) continue;

                $clickFretOnString($stringContainers.eq(i), frettedNote.fret, frettedNote.cssClass);

                return;
            }
        }

        function $clickFretOnString($stringContainer, fret, customCssClass) {
            $getNote($stringContainer, fret)
                .removeClass() // Remove any custom css
                .addClass(noteCssClass)
                .addClass(hoverCssClass)
                .addClass(clickedCssClass)
                .addClass(customCssClass);
        }

        function $getNote($stringContainer, fret) {
            return $stringContainer
                .find(noteSelector)
                .eq(fret);
        }

        function $setupRedrawOnResize() {
            $window.on("resize", $onResize);
        }

        function $onResize() {
            // Animate the fretboard dimensions on resize, but only
            // on the last resize after X milliseconds.
            clearTimeout(timer);

            timer = setTimeout(function () {
                $redrawPositions(true, null);
            }, 100);
        }

        function $getStringContainerContainer() {
            return $fretboardContainer.find(stringContainerContainerSelector);
        }

        function $getStringContainers() {
            return $fretboardContainer.find(stringContainerSelector);
        }

        function $syncStringContainers($stringContainerContainer, $stringContainers, numOldNotes, oldNumFrets, fretboardBodyHeight) {
            var maxStrings = Math.max(numOldNotes, model.allNotes.length);
            var maxFrets = Math.max(oldNumFrets, model.numFrets);

            for (var i = 0; i < maxStrings; i++) {
                $syncStringContainer($stringContainerContainer, $stringContainers, i, maxFrets, fretboardBodyHeight);
            }
        }

        function $syncStringContainer($stringContainerContainer, $stringContainers, stringIndex, frets, fretboardBodyHeight) {
            if (stringIndex < model.tuning.length) {
                $addOrEditStringContainer($stringContainerContainer, $stringContainers, stringIndex, frets, fretboardBodyHeight);
            } else {
                $stringContainers.eq(stringIndex).remove();
            }
        }

        function $addOrEditStringContainer($stringContainerContainer, $stringContainers, stringIndex, frets, fretboardBodyHeight) {
            var $stringContainer = null;

            if (!$stringContainers.eq(stringIndex).length) {
                var $string = $createString();
                $setPosition($string, { top: fretboardBodyHeight }, false);

                $stringContainer = $createStringContainer().append($string);
                $stringContainerContainer.append($stringContainer);
            } else {
                $stringContainer = $stringContainers.eq(stringIndex);
            }

            $syncNotes($stringContainer, stringIndex, frets);
        }

        function $syncNotes($stringContainer, stringIndex, frets) {
            for (var i = 0; i <= frets; i++) {
                $syncNote($stringContainer, stringIndex, i);
            }
        }

        function $syncNote($stringContainer, stringIndex, fret) {
            if (fret <= model.numFrets) {
                $addOrEditNote($stringContainer, stringIndex, fret);
            } else {
                $getNote($stringContainer, fret).remove();
            }
        }

        function $addOrEditNote($stringContainer, stringIndex, fret) {
            var note = model.allNotes[stringIndex].notes[fret];
            var newNoteData = {
                letter: note.letter,
                octave: note.octave,
                fret: fret,
                stringIndex: stringIndex,
                interval: note.interval,
                noteMode: model.noteMode
            };
            var $note = $getNote($stringContainer, fret);

            if ($note.length) {
                $editNote($note, newNoteData);
            } else {
                $stringContainer.append($createNote(newNoteData, true));
            }
        }

        // Will not change any CSS currently on the note
        function $editNote($oldNote, newNoteData) {
            if (noteDataAreEqual($oldNote.data(noteDataKey), newNoteData)) return;

            // Creating a new note and replacing the old one is expensive.
            // So we just replace the note data and letter/interval.
            var $newNote = $createNote(newNoteData, false);

            $oldNote.find(noteDisplaySelector).text($newNote.find(noteDisplaySelector).text());
            $oldNote.data(noteDataKey, newNoteData);
        }

        function $getFretLineContainer() {
            return $fretboardContainer.find(fretLineContainerSelector);
        }

        function $getFretLines() {
            return $fretboardContainer.find(fretLineSelector);
        }

        function $getFretLine(fret) {
            return $getFretLines().eq(fret);
        }

        function $syncFretLines($fretLineContainer, $fretLines, oldNumFrets, fretboardBodyWidth) {
            var maxFrets = Math.max(oldNumFrets, model.numFrets);

            for (var i = 0; i <= maxFrets; i++) {
                $syncFretLine($fretLineContainer, $fretLines, i, fretboardBodyWidth);
            }
        }

        function $syncFretLine($fretLineContainer, $fretLines, fret, fretboardBodyWidth) {
            if (fret <= model.numFrets) {
                $addOrEditFretLine($fretLineContainer, $fretLines, fret, fretboardBodyWidth);
            } else {
                $fretLines.eq(fret).remove();
            }
        }

        function $addOrEditFretLine($fretLineContainer, $fretLines, fret, fretboardBodyWidth) {
            if ($fretLines.eq(fret).length) return;

            var $fretLine = $createFretLine();

            $setPosition($fretLine, { left: fretboardBodyWidth }, false);
            $fretLineContainer.append($fretLine);
        }

        function $getNoteCircleContainer() {
            return $fretboardContainer.find(noteCircleContainerSelector);
        }

        function $getNoteCircles() {
            return $fretboardContainer.find(noteCircleCssSelector);
        }

        function $syncNoteCircles($noteCircleContainer, $noteCircles, oldNumFrets, fretboardBodyWidth, fretboardBodyHeight) {
            var maxFrets = Math.max(oldNumFrets, model.numFrets);
            // We will be iterating over each fret to add/remove note circles.
            // A hash will allow us to easily map a fret number to note circles.
            var noteCirclesHash = getNoteCirclesHash();
            var noteCirclesThatShouldExistHash = getNoteCirclesThatShouldExistHash();

            for (var i = 0; i <= maxFrets; i++) {
                $syncNoteCircle($noteCircleContainer, i, noteCirclesHash, noteCirclesThatShouldExistHash, fretboardBodyWidth, fretboardBodyHeight);
            }
        }

        function $syncNoteCircle($noteCircleContainer, fret, noteCirclesHash, noteCirclesThatShouldExistHash, fretboardBodyWidth, fretboardBodyHeight) {
            if (fret <= model.numFrets) {
                $updateNoteCircleOnExistingFret($noteCircleContainer, fret, noteCirclesHash, noteCirclesThatShouldExistHash, fretboardBodyWidth, fretboardBodyHeight);
            } else {
                $removeNoteCircles(fret, noteCirclesHash);
            }
        }

        function $updateNoteCircleOnExistingFret($noteCircleContainer, fret, noteCirclesHash, noteCirclesThatShouldExistHash, fretboardBodyWidth, fretboardBodyHeight) {
            if (noteCirclesThatShouldExistHash[fret]) {
                $addNoteCircles($noteCircleContainer, fret, noteCirclesHash, fretboardBodyWidth, fretboardBodyHeight);
            } else {
                $removeNoteCircles(fret, noteCirclesHash);
            }
        }

        function $addNoteCircles($noteCircleContainer, fret, noteCirclesHash, fretboardBodyWidth, fretboardBodyHeight) {
            if (noteCirclesHash[fret]) return;

            if (needsDoubleNoteCircle(fret)) {
                $appendNoteCircle($noteCircleContainer, fret, fretboardBodyWidth, fretboardBodyHeight, "top");
                $appendNoteCircle($noteCircleContainer, fret, fretboardBodyWidth, fretboardBodyHeight, "bottom");
            } else {
                $appendNoteCircle($noteCircleContainer, fret, fretboardBodyWidth, fretboardBodyHeight);
            }
        }

        function $appendNoteCircle($noteCircleContainer, fret, fretboardBodyWidth, fretboardBodyHeight, type) {
            var $noteCircle = $createNoteCircle(fret);
            var position = { left: fretboardBodyWidth };

            // Append first so it gets a height
            $noteCircleContainer.append($noteCircle);

            if (type === "top") {
                position.top = getDoubleNoteCircleTopValue(fretboardBodyHeight, true) - ($noteCircle.outerHeight(true) / 2);
            } else if (type === "bottom") {
                position.top = getDoubleNoteCircleTopValue(fretboardBodyHeight, false) - ($noteCircle.outerHeight(true) / 2);
            } else {
                position.top = getMiddleNoteCircleTopValue(fretboardBodyHeight) - ($noteCircle.outerHeight(true) / 2);
            }

            $setPosition($noteCircle, position, false);
        }

        function $removeNoteCircles(fret, hash) {
            if (!hash[fret]) return;

            hash[fret].forEach(function ($noteCircle) {
                $noteCircle.remove();
            });

            delete hash[fret];
        }

        // The user may have added some of their own classes, so only remove the ones we know about.
        function $removeContainerCssClasses() {
            $fretboardContainer
                .removeClass(fretboardContainerCssClass)
                .removeClass(isDisabledCssClass)
                .removeClass(function (index, css) {
                    return getStringFollowedByNumber(css, "strings-");
                })
                .removeClass(function (index, css) {
                    return getStringFollowedByNumber(css, "frets-");
                })
        }

        function getStringFollowedByNumber(stringToSearch, stringToFind) {
            var regex = new RegExp(stringToFind + "[0-9]+");
            var match = stringToSearch.match(regex);

            return match ? match[0] : null;
        }

        function $positionFretboardBody(fretboardBodyWidth, fretboardBodyHeight, shouldBeAnimated) {
            var position = {
                height: fretboardBodyHeight,
                width: fretboardBodyWidth
            };

            $setPosition($fretboardBody, position, shouldBeAnimated);
        }

        function $positionFretLines(fretWidth, shouldBeAnimated) {
            $getFretLines()
                .removeClass(firstCssClass)
                .removeClass(lastCssClass)
                .each(function (fret, fretLine) {
                    $positionFretLine(fret, $(fretLine), fretWidth, shouldBeAnimated);
                });
        }

        function $positionFretLine(fret, $fretLine, fretWidth, shouldBeAnimated) {
            var fretLeftVal = fret * fretWidth;

            if (fret === 0) {
                $fretLine.addClass(firstCssClass);
            } else if (fret === model.numFrets) {
                $fretLine.addClass(lastCssClass);
            }

            var position = {
                left: fretLeftVal + fretWidth - ($fretLine.outerWidth(true) / 2)
            };

            $setPosition($fretLine, position, shouldBeAnimated);
        }

        function $positionStringContainers(fretboardBodyHeight, fretWidth, stringContainersShouldBeAnimated, notesShouldBeAnimated) {
            var firstStringDistanceFromTop = fretboardBodyHeight / (model.tuning.length * 4);
            var fretHeight = (fretboardBodyHeight - firstStringDistanceFromTop * 2) / (model.tuning.length - 1);

            $getStringContainers()
                .removeClass(firstCssClass)
                .removeClass(lastCssClass)
                .each(function (stringIndex, stringContainer) {
                    $positionStringContainer(stringIndex, $(stringContainer), fretWidth, fretHeight, firstStringDistanceFromTop, stringContainersShouldBeAnimated, notesShouldBeAnimated);
                });
        }

        function $positionStringContainer(stringIndex, $stringContainer, fretWidth, fretHeight, firstStringDistanceFromTop, stringContainersShouldBeAnimated, notesShouldBeAnimated) {
            var $string = $stringContainer.find(stringSelector);
            var fretTopVal = firstStringDistanceFromTop + (stringIndex * fretHeight);

            if (stringIndex === 0) {
                $stringContainer.addClass(firstCssClass);
            } else if (stringIndex === model.tuning.length - 1) {
                $stringContainer.addClass(lastCssClass);
            }

            var position = {
                top: fretTopVal - ($string.outerHeight(true) / 2)
            }

            $setPosition($string, position, stringContainersShouldBeAnimated);
            $positionNotes($stringContainer, fretTopVal, fretWidth, notesShouldBeAnimated);
        }

        function $positionNotes($stringContainer, fretTopVal, fretWidth, shouldBeAnimated) {
            $stringContainer
                .find(noteSelector)
                .each(function (fret, note) {
                    $positionNote(fret, $(note), fretTopVal, fretWidth, shouldBeAnimated);
                });
        }

        function $positionNote(fret, $note, fretTopVal, fretWidth, shouldBeAnimated) {
            var fretLeftVal = fret * fretWidth;
            var noteLeftVal = fretLeftVal + ((fretWidth / 2) - ($note.outerWidth(true) / 2));
            var noteTopVal = fretTopVal - ($note.outerHeight(true) / 2);
            var position = {
                left: noteLeftVal,
                top: noteTopVal
            };

            $setPosition($note, position, shouldBeAnimated);
        }

        function $positionNoteCircles(fretboardBodyHeight, fretWidth, shouldBeAnimated) {
            var $existingNoteCircles = getNoteCirclesHash();

            Object.keys($existingNoteCircles).forEach(function (fret) {
                $positionNoteCirclesForFret($existingNoteCircles[fret], fret, fretboardBodyHeight, fretWidth, shouldBeAnimated);
            });
        }

        function $positionNoteCirclesForFret($noteCircles, fret, fretboardBodyHeight, fretWidth, shouldBeAnimated) {
            if ($noteCircles.length === 2) {
                $positionoDoubleNoteCirclesForFret($noteCircles, fret, fretboardBodyHeight, fretWidth, shouldBeAnimated);
            } else {
                $positionSingleNoteCircleForFret($noteCircles[0], fret, fretboardBodyHeight, fretWidth, shouldBeAnimated);
            }
        }

        function $positionSingleNoteCircleForFret($noteCircle, fret, fretboardBodyHeight, fretWidth, shouldBeAnimated) {
            var position = {
                top: getMiddleNoteCircleTopValue(fretboardBodyHeight) - ($noteCircle.outerHeight(true) / 2),
                left: (fret * fretWidth) + ((fretWidth / 2) - ($noteCircle.outerWidth(true) / 2))
            };

            $setPosition($noteCircle, position, shouldBeAnimated);
        }

        function $positionoDoubleNoteCirclesForFret($noteCircles, fret, fretboardBodyHeight, fretWidth, shouldBeAnimated) {
            var position1 = {
                top: getDoubleNoteCircleTopValue(fretboardBodyHeight, true) - ($noteCircles[0].outerHeight(true) / 2),
                left: (fret * fretWidth) + ((fretWidth / 2) - ($noteCircles[0].outerWidth(true) / 2))
            };
            var position2 = {
                top: getDoubleNoteCircleTopValue(fretboardBodyHeight, false) - ($noteCircles[1].outerHeight(true) / 2),
                left: (fret * fretWidth) + ((fretWidth / 2) - ($noteCircles[1].outerWidth(true) / 2))
            };

            $setPosition($noteCircles[0], position1, shouldBeAnimated);
            $setPosition($noteCircles[1], position2, shouldBeAnimated);
        }

        function $noteMouseEnter() {
            var $this = $(this);

            if (!$this.hasClass(clickedCssClass)) {
                $this.addClass(hoverCssClass);
            }
        }

        function $noteMouseLeave() {
            var $this = $(this);

            if (!$this.hasClass(clickedCssClass)) {
                $(this).removeClass(hoverCssClass);
            }
        }

        function $createDiv(cssClass) {
            return $("<div class='" + cssClass + "'></div>");
        }

        function $createFretboardBody() {
            return $fretboardBody = $createDiv(bodyCssClass);
        }

        function $createStringContainerContainer() {
            return $createDiv(stringContainerContainerCssClass);
        }

        function $createFretLineContainer() {
            return $createDiv(fretLineContainerCssClass);
        }

        function $createNoteCircleContainer() {
            return $createDiv(noteCircleContainerCssClass);
        }

        function $createString() {
            return $createDiv(stringCssClass);
        }

        function $createStringContainer() {
            return $createDiv(stringContainerCssClass);
        }

        function $createScrollWrapper() {
            return $createDiv(fretboardScrollWrapperCssClass);
        }

        function $createNoteCircle(fret) {
            return $createDiv(noteCircleCssClass).data("fret", fret);
        }

        function $createFretLine() {
            return $createDiv(fretLineCssClass);
        }

        function $createNoteLetter(note) {
            // Need to validate noteMode earlier up
            var text = model.noteMode === "interval" ? note.interval : note.letter;

            return $createDiv(noteDisplayCssClass).text(text);
        }

        function $createNote(noteData, withHandlers) {
            var $note = $createDiv(noteCssClass)
                .append($createNoteLetter(noteData))
                .data(noteDataKey, noteData);

            if (withHandlers) {
                $note.on("mouseenter", $noteMouseEnter)
                    .on("mouseleave", $noteMouseLeave)
                    .on("click", $onNoteClick);
            }

            return $note;
        }

        function $onNoteClick() {
            if (!model.noteClickingDisabled) {
                $fretboardContainer.trigger("noteClicked", this);
            }
        }

        function $setPosition($element, position, shouldBeAnimated) {
            var isVisible = $element.css("display") !== "none" && $element.css("opacity") > 0;

            if (isVisible && shouldBeAnimated) {
                $element.animate(position, {
                    duration: model.animationSpeed,
                    queue: false
                });
            } else {
                $element.css(position);
            }
        }

        function getFirstStringDistanceFromTop(fretboardBodyHeight) {
            return fretboardBodyHeight / (model.tuning.length * 4);
        }

        function getFretHeight(fretboardBodyHeight) {
            return (fretboardBodyHeight - (getFirstStringDistanceFromTop(fretboardBodyHeight) * 2)) / (model.tuning.length - 1);
        }

        function needsDoubleNoteCircle(fret) {
            return fret % 12 === 0;
        }

        function getNoteCirclesThatShouldExistHash() {
            var hash = {};

            model.noteCircles.forEach(function (fret) {
                hash[fret] = true;
            });

            return hash;
        }

        function getNoteCirclesHash() {
            var hash = {};

            $getNoteCircles().each(function () {
                var $noteCircle = $(this);
                var fret = $noteCircle.data("fret");

                if (!hash[fret]) {
                    hash[fret] = [];
                }

                hash[fret].push($noteCircle);
            });

            return hash;
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

        function createTuning() {
            model.tuning = model.allNotes.map(function (note) {
                return note.string;
            });
        }

        function noteDataAreEqual(note1, note2) {
            return jQueryFretboard.utilities.notesAreEqual(note1, note2) &&
                note1.fret === note2.fret &&
                note1.noteMode === note2.noteMode &&
                note1.interval === note2.interval;
        }
    };
})(jQuery);

// This is the jQuery plugin. It instantiates the fretboard model and
// fretboard renderer and coordinates interactions between them. It
// contains an API which the user can get:
// var api = $(".my-fretboard-js").data("api");
(function ($) {
    "use strict";

    $.fn.fretboard = function (options) {
        return this.each(function () {
            var api = {};
            api.destroy = destroy;
            api.getAllNotes = getAllNotes;
            api.getChordMode = getChordMode;
            api.setChordMode = setChordMode;
            api.getNoteLetters = getNoteLetters;
            api.getClickedNotes = getClickedNotes;
            api.setClickedNotes = setClickedNotes;
            api.clearClickedNotes = clearClickedNotes;
            api.getNoteClickingDisabled = getNoteClickingDisabled;
            api.setNoteClickingDisabled = setNoteClickingDisabled;
            api.getTuning = getTuning;
            api.setTuning = setTuning;
            api.getNumFrets = getNumFrets;
            api.setNumFrets = setNumFrets;
            api.getIntervals = getIntervals;
            api.getRoot = getRoot;
            api.setRoot = setRoot;
            api.getNoteMode = getNoteMode;
            api.setNoteMode = setNoteMode;
            api.getNoteCircles = getNoteCircles;
            api.getAnimationSpeed = getAnimationSpeed;
            api.getNotesClickedCallback = getNotesClickedCallback;
            api.getDimensionsFunc = getDimensionsFunc;

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
            var defaultIntervals = ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"];
            var defaultRoot = defaultNoteLetters[0];
            var defaultNoteMode = "letter"; // or "interval"
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
                noteLetters: defaultNoteLetters,
                tuning: defaultTuning,
                numFrets: 15,
                isChordMode: true,
                noteClickingDisabled: false,
                noteMode: defaultNoteMode,
                intervals: defaultIntervals,
                root: defaultRoot,
                animationSpeed: 400, // ms
                noteCircles: defaultNoteCircles,
                dimensionsFunc: defaultDimensionsFunc,
                notesClickedCallback: function () { }
            };
            // These settings will have the defaults extended with user options.
            var settings = {};
            var validator = new jQueryFretboard.FretboardValidator();
            var noteDataKey = "noteData";
            var fretboardModel;
            var fretboardRenderer;

            extendDefaultsWithUserOptions(options);
            createFretboardModel();
            createFretboardRenderer();

            $element.on("noteClicked", onUserNoteClick);
            $element.data("api", api);

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

            function getNoteLetters() {
                return fretboardModel.getNoteLetters();
            }

            function getClickedNotes() {
                return fretboardModel.getClickedNotes();
            }

            function setClickedNotes(clickedNoteGroupsWithCssClasses, asUser) {
                clickedNoteGroupsWithCssClasses = $.extend(true, [], clickedNoteGroupsWithCssClasses);

                fretboardModel.setClickedNotes(clickedNoteGroupsWithCssClasses, asUser);

                var clickedNoteGroups = fretboardModel.getClickedNotes();
                var $clickedNoteGroups = fretboardRenderer.getClickedNotes().$elements;
                var allNotes = fretboardModel.getAllNotes();

                reattachCssFromExistingDomNotesOntoAllNewModelNotes(allNotes, clickedNoteGroups, $clickedNoteGroups);
                reattachCssFromAllNewModelNotes(clickedNoteGroups, clickedNoteGroupsWithCssClasses);

                fretboardRenderer.clearClickedNotes();
                fretboardRenderer.setClickedNotes(clickedNoteGroups);

                if (asUser) {
                    settings.notesClickedCallback();
                }
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
                fretboardRenderer.setNoteClickingDisabled(isDisabled);
                fretboardRenderer.redrawPositions(true, null);
            }

            function getTuning() {
                return fretboardModel.getTuning();
            }

            function setTuning(tuning) {
                fretboardModel.setTuning(tuning);
                fretboardRenderer.syncFretboard(fretboardModel.getAllNotes());
                fretboardRenderer.redrawPositions(true, null);
            }

            function getNumFrets() {
                return fretboardModel.getNumFrets();
            }

            function setNumFrets(numFrets) {
                fretboardModel.setNumFrets(numFrets);
                fretboardRenderer.syncFretboard(fretboardModel.getAllNotes());
                fretboardRenderer.redrawPositions(true, null);
            }

            function getIntervals() {
                return fretboardModel.getIntervals();
            }

            function getRoot() {
                return fretboardModel.getRoot();
            }

            function setRoot(root) {
                fretboardModel.setRoot(root);
                fretboardRenderer.syncFretboard(fretboardModel.getAllNotes());
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

            function getNotesClickedCallback() {
                return settings.notesClickedCallback;
            }

            function getDimensionsFunc() {
                return fretboardRenderer.getDimensionsFunc();
            }

            function createFretboardModel() {
                var modelSettings = {
                    noteLetters: settings.noteLetters,
                    tuning: settings.tuning,
                    numFrets: settings.numFrets,
                    isChordMode: settings.isChordMode,
                    noteClickingDisabled: settings.noteClickingDisabled,
                    intervals: settings.intervals,
                    root: settings.root
                };

                fretboardModel = new jQueryFretboard.FretboardModel(modelSettings, validator);
            }

            function createFretboardRenderer() {
                var fretboardRendererSettings = {
                    // Even though this info exists in the user settings that were passed in,
                    // we ask the model for it again to stick with the convention that the
                    // model is always asked for data in case it alters the data.
                    allNotes: fretboardModel.getAllNotes(),
                    tuning: fretboardModel.getTuning(),
                    numFrets: fretboardModel.getNumFrets(),
                    noteClickingDisabled: fretboardModel.getNoteClickingDisabled(),
                    clickedNotes: fretboardModel.getClickedNotes(),

                    // TODO: the renderer should validate its own settings
                    noteCircles: settings.noteCircles,
                    animationSpeed: settings.animationSpeed,
                    dimensionsFunc: createCompleteDimensionsFunc(settings.dimensionsFunc),
                    noteMode: settings.noteMode
                };

                fretboardRenderer = new jQueryFretboard.FretboardHtmlRenderer(fretboardRendererSettings, $element, validator);
            }

            function extendDefaultsWithUserOptions(userOptions) {
                $.extend(settings, defaults, $.extend(true, {}, userOptions));
            }

            // Create a function that returns whatever properties (width/height) the given 
            // function does not return.
            function createCompleteDimensionsFunc(fn) {
                return function ($fretboardContainer, $fretboardBody, model) {
                    var defaultDimensions = defaultDimensionsFunc($fretboardContainer, $fretboardBody, model);
                    var defaultWidth = defaultDimensions.width;
                    var defaultHeight = defaultDimensions.height;
                    var dimensions = fn === defaultDimensionsFunc ? defaultDimensions : fn($fretboardContainer, $fretboardBody, model);
                    var width = dimensions.width;
                    var height = dimensions.height;

                    return {
                        isDefaultWidth: !width,
                        width: width || defaultWidth,
                        isDefaultHeight: !height,
                        height: height || defaultHeight
                    };
                };
            }

            function reattachCssFromExistingDomNotesOntoAllNewModelNotes(allNewModelNotes, newModelNotes, $existingNotes) {
                newModelNotes.forEach(function (newModelNoteGroup) {
                    reattachCssFromExistingDomNotesOntoNewModelNotes(allNewModelNotes, newModelNoteGroup.notes, newModelNoteGroup.string, $existingNotes);
                });
            }

            function reattachCssFromExistingDomNotesOntoNewModelNotes(allNewModelNotes, newModelNotesOnString, string, $existingNotes) {
                newModelNotesOnString.forEach(function (newModelNoteOnString) {
                    reattachCssFromExistingDomNotesOntoNewModelNote(allNewModelNotes, newModelNoteOnString, string, $existingNotes);
                });
            }

            function reattachCssFromExistingDomNotesOntoNewModelNote(allNewModelNotes, newModelNote, string, $existingNotes) {
                for (var i = 0; i < $existingNotes.length; i++) {
                    var $existingNote = $existingNotes.eq(i);
                    var existingNoteData = $existingNote.data(noteDataKey);
                    var existingModelNote = allNewModelNotes[existingNoteData.stringIndex].notes[existingNoteData.fret];
                    var existingModelString = allNewModelNotes[existingNoteData.stringIndex].string;

                    if (!jQueryFretboard.utilities.frettedNotesAreEqual(newModelNote, string, existingModelNote, existingModelString)) continue;

                    newModelNote.cssClass = $existingNote.attr("class");

                    return;
                }
            }

            function reattachCssFromAllNewModelNotes(newModelNotesWithoutCss, newModelNotesWithCss) {
                newModelNotesWithoutCss.forEach(function (newModelNoteWithoutCss) {
                    reattachCssFromNewModelNotes(newModelNoteWithoutCss.notes, newModelNoteWithoutCss.string, newModelNotesWithCss);
                });
            }

            function reattachCssFromNewModelNotes(newModelNotesWithoutCss, string, newModelNotesWithCss) {
                newModelNotesWithoutCss.forEach(function (newModelNoteWithoutCss) {
                    reattachCssFromNewModelNote(newModelNoteWithoutCss, string, newModelNotesWithCss);
                });
            }

            function reattachCssFromNewModelNote(newModelNoteWithoutCss, string, newModelNotesWithCss) {
                var modelNoteFound = findModelNote(newModelNoteWithoutCss, string, newModelNotesWithCss);

                if (modelNoteFound) {
                    newModelNoteWithoutCss.cssClass = modelNoteFound.cssClass;
                }
            }

            function findModelNote(modelNoteToFind, string, modelNotesToSearch) {
                for (var i = 0; i < modelNotesToSearch.length; i++) {
                    var found = findFrettedNote(modelNoteToFind, string, modelNotesToSearch[i].notes, modelNotesToSearch[i].string);

                    if (found) return found;
                }

                return null;
            }

            function findFrettedNote(noteToFind, stringForNoteToFind, notesToSearch, stringForNotesToSearch) {
                for (var i = 0; i < notesToSearch.length; i++) {
                    if (jQueryFretboard.utilities.frettedNotesAreEqual(noteToFind, stringForNoteToFind, notesToSearch[i], stringForNotesToSearch)) {
                        return notesToSearch[i];
                    }
                }

                return null;
            }

            function onUserNoteClick(e, clickedNoteDomEl) {
                // Ask the model what notes should be clicked after this event
                // because things like chord-mode could mean other notes are
                // removed in addition to this one being added.
                var allNotes = fretboardModel.getAllNotes();
                var $clickedNote = $(clickedNoteDomEl);
                var clickedNoteData = $clickedNote.data(noteDataKey);

                fretboardModel.setClickedNotes([{
                    string: allNotes[clickedNoteData.stringIndex].string,
                    notes: [allNotes[clickedNoteData.stringIndex].notes[clickedNoteData.fret]]
                }], true);

                var newClickedNoteGroupsFromModel = fretboardModel.getClickedNotes();

                // The model will not know of CSS classes so we reattach the
                // ones that were already there.
                reattachCssFromExistingDomNotesOntoAllNewModelNotes(allNotes, newClickedNoteGroupsFromModel, fretboardRenderer.getClickedNotes().$elements)

                fretboardRenderer.clearClickedNotes();
                fretboardRenderer.setClickedNotes(newClickedNoteGroupsFromModel);

                settings.notesClickedCallback();
            }
        });
    };
})(jQuery);

(function () {
    "use strict";

    window.jQueryFretboard.utilities = {
        notesAreEqual: notesAreEqual,
        frettedNotesAreEqual: frettedNotesAreEqual,
        pushMany: pushMany,
        createEmptyArrays: createEmptyArrays
    };

    function notesAreEqual(note1, note2) {
        return note1.letter === note2.letter && note1.octave === note2.octave;
    }

    function frettedNotesAreEqual(note1, string1, note2, string2) {
        return notesAreEqual(string1, string2) && note1.fret === note2.fret;
    }

    function pushMany(arr, arrToAdd) {
        Array.prototype.push.apply(arr, arrToAdd);
    }

    function createEmptyArrays(num) {
        var arrs = [];

        for (var i = 0; i < num; i++) {
            arrs.push([]);
        }

        return arrs;
    }
})();