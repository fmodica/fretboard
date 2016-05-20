(function ($) {
    "use strict";

    window.Fretboard = function (settings) {
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

        var model = {
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

        // notesToClick = [{
        //     stringItsOn: {
        //         letter,
        //         octave,
        //     },
        //     fretNumber
        // }]
        //
        // takeSettingsIntoAccount means to check other settings that might affect
        // which notes can be clicked, such as isChordMode, noteClickingDisabled, etc.
        function setClickedNotes(notesToClick, takeSettingsIntoAccount) {
            if (!notesToClick || (takeSettingsIntoAccount && model.noteClickingDisabled)) {
                return;
            }

            var notesToClick = $.extend(true, [], notesToClick);

            for (var i = 0; i < notesToClick.length; i++) {
                if (notesToClick[i].fretNumber < 0 || notesToClick[i].fretNumber > model.numFrets || !notesToClick[i].stringItsOn) {
                    throw "Cannot click note: " + notesToClick[i];
                }

                var stringFound = false;

                for (var j = 0; j < model.tuning.length; j++) {
                    if (!notesAreEqual(model.tuning[j], notesToClick[i].stringItsOn)) {
                        continue;
                    }

                    stringFound = true;

                    var indexOfClickedFret = model.clickedNotes[j].indexOf(notesToClick[i].fretNumber);
                    var fretAlreadyClicked = indexOfClickedFret !== -1;

                    if (takeSettingsIntoAccount) {
                        if (model.isChordMode) {
                            model.clickedNotes[j] = [];

                            if (!fretAlreadyClicked) {
                                model.clickedNotes[j].push(notesToClick[i].fretNumber);
                            }
                        } else {
                            if (!fretAlreadyClicked) {
                                model.clickedNotes[j].push(notesToClick[i].fretNumber)
                            } else {
                                model.clickedNotes[j].splice(indexOfClickedFret, 1);
                            }
                        }
                    } else {
                        if (!fretAlreadyClicked) {
                            model.clickedNotes[j].push(notesToClick[i].fretNumber);
                        }
                    }
                }

                if (!stringFound) {
                    throw "Tried to click note " + notesToClick[i] + " but could not find string " + notesToClick[i].stringItsOn;
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
            var tuningLengthDifference = oldTuning.length - newTuning.length;

            validateTuning(newTuning, model.allNoteLetters);
            model.tuning = newTuning;

            model.allNotes = [];

            for (var i = 0; i < newTuning.length; i++) {
                model.allNotes[i] = calculateNotesOnString(model.tuning[i]);
            }

            if (tuningLengthDifference > 0) {
                model.clickedNotes = model.clickedNotes.slice(0, model.tuning.length);
            } else if (tuningLengthDifference < 0) {
                for (i = 0; i < (-1 * tuningLengthDifference) ; i++) {
                    model.clickedNotes.push([]);
                }
            }
        }

        function getNumFrets() {
            return model.numFrets;
        }

        function setNumFrets(newNumFrets) {
            validateNumFrets(newNumFrets);
            model.numFrets = newNumFrets;

            for (var i = 0; i < model.tuning.length; i++) {
                model.allNotes[i] = calculateNotesOnString(model.tuning[i]);
                model.clickedNotes[i] = model.clickedNotes[i].filter(function (fretNumber) {
                    return fretNumber <= model.numFrets;
                });
            }
        }

        function getIntervalSettings() {
            return $.extend(true, {}, model.intervalSettings);
        }

        function setIntervalSettings(intervalSettings) {
            // validateIntervalSettings
            model.intervalSettings = $.extend(true, {}, intervalSettings);

            for (var i = 0; i < model.tuning.length; i++) {
                model.allNotes[i] = calculateNotesOnString(model.tuning[i]);
            }
        }

        // Utility functions
        function initializeModel(settings) {
            validateAllNoteLetters(settings.allNoteLetters);
            model.allNoteLetters = settings.allNoteLetters;

            validateTuning(settings.tuning, settings.allNoteLetters);
            model.tuning = settings.tuning;

            validateNumFrets(settings.numFrets);
            model.numFrets = settings.numFrets;

            model.isChordMode = settings.isChordMode;
            model.noteClickingDisabled = settings.noteClickingDisabled;
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

                note.fretNumber = i;
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
        function getNoteByFretNumber(stringNote, fretNumber) {
            var noteIndex = model.allNoteLetters.indexOf(stringNote.letter) + fretNumber,
                numOctavesAboveString = Math.floor(noteIndex / 12),

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
                reducedNoteIndex = noteIndex - (12 * numOctavesAboveString);

            return {
                letter: model.allNoteLetters[reducedNoteIndex],
                octave: stringNote.octave + numOctavesAboveString
            };
        }

        function getIntervalByLetterAndRoot(letter, root) {
            var letterIndex = model.allNoteLetters.indexOf(letter);
            var rootIndex = model.allNoteLetters.indexOf(root);

            // Duplicate message logic here and in validation function
            if (letterIndex === -1) {
                throw "note letter \"" + letter + "\" is not in the allNoteLetters array: " + model.allNoteLetters;
            }

            if (rootIndex === -1) {
                throw "note letter \"" + root + "\" is not in the allNoteLetters array: " + model.allNoteLetters;
            }

            var intervalIndex = letterIndex - rootIndex + (letterIndex >= rootIndex ? 0 : 12);

            return model.intervalSettings.intervals[intervalIndex];
        }

        function validateAllNoteLetters(allNoteLetters) {
            if (!allNoteLetters) {
                throw "allNoteLetters does not exist: " + allNoteLetters;
            }

            if (allNoteLetters.length !== 12) {
                throw "allNoteLetters is not valid because there must be exactly 12 letters in the array: " + allNoteLetters;
            }

            // 12 unique letters
            var hash = {};

            for (var i = 0; i < allNoteLetters.length; i++) {
                if (!allNoteLetters[i]) {
                    throw "allNoteLetters is not valid because one note did not exist: " + allNoteLetters;
                }

                hash[allNoteLetters[i]] = true;
            }

            if (Object.keys(hash).length !== 12) {
                throw "allNoteLetters is not valid because there must be 12 unique letters in the array: " + allNoteLetters;
            }
        }

        function validateTuning(tuning, allNoteLetters) {
            if (!tuning) {
                throw "tuning does not exist: " + tuning;
            }

            if (!tuning.length) {
                throw "tuning must have at least one note: " + tuning;
            }

            var hash = {};

            for (var i = 0; i < tuning.length; i++) {
                // Check for octave integer
                if (!tuning[i]) {
                    throw "tuning is not valid because one note did not exist: " + tuning;
                }

                if (allNoteLetters.indexOf(tuning[i].letter) === -1) {
                    throw "tuning is not valid because the note letter: \"" + tuning[i].letter + "\" is not in the allNoteLetters array: " + allNoteLetters;
                }

                var key = tuning[i].letter + tuning[i].octave;

                if (hash[key]) {
                    throw "tuning is not valid because each note must be unique: " + tuning;
                }

                hash[key] = true;
            }
        }

        function validateNumFrets(numFrets) {
            if (numFrets <= 0) {
                throw "numFrets must be a positive number: " + numFrets;
            }
        }

        // Need validateIntervalSettings

        function notesAreEqual(note1, note2) {
            return note1.letter === note2.letter && note1.octave === note2.octave;
        }
    };
})(jQuery);

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

        var $window = $(window);
        var settings = $.extend(true, {}, settings);
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

        $fretboardBody = getFretboardBodyEl();
        $fretboardContainer
            .addClass(fretboardContainerCssClass)
            .append($fretboardBody)
            .wrap(getFretboardScrollWrapperEl());
        alterFretboard(settings.allNotes);
        setDimensions(false, false, false, false, false);

        // Animate the fretboard dimensions on resize, but only
        // on the last resize after X milliseconds
        $window.on("resize", function () {
            clearTimeout(timer);
            timer = setTimeout(function () {
                setDimensions(true, true, true, true, true);
            }, 100);
        });

        function destroy() {
            $fretboardBody.remove();
            $fretboardContainer.unwrap();
            removeContainerCssClasses();
        }

        function getClickedNotes() {
            // DUPLICATE LOGIC - possibly refactor
            return $fretboardContainer.find(noteSelector + clickedSelector);
        }

        // Will be passed in with just fretNumber and stringItsOn.
        // This method can probably be optimized to not use indexOf
        // and other inefficient search techniques.
        function setClickedNotes(notesToClick) {
            var notesToClick = $.extend(true, [], notesToClick),
                i,
                j,
                tuningNote,
                noteToClick,
                stringItsOn,
                $stringContainer,
                $note;

            if (!notesToClick) {
                return;
            }

            // For each note that needs to be clicked check its stringItsOn
            // property to see if it matches a note object in the tuning array.
            // If it does, get the index of the matched note in the tuning array
            // and find the corresponding $stringContainer and click its
            // note.
            for (i = 0; i < notesToClick.length; i++) {
                noteToClick = notesToClick[i];
                stringItsOn = noteToClick && noteToClick.stringItsOn;

                if (noteToClick.fretNumber < 0 || noteToClick.fretNumber > settings.numFrets || !stringItsOn) {
                    continue;
                }

                for (j = 0; j < settings.tuning.length; j++) {
                    tuningNote = settings.tuning[j];

                    if (!notesAreEqual(tuningNote, stringItsOn)) {
                        continue;
                    }

                    $stringContainer = $fretboardContainer
                        .find(stringContainerSelector)
                        .eq(j);

                    $note = $stringContainer
                        .find(noteSelector)
                        .eq(noteToClick.fretNumber);

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
            return settings.noteMode;
        }

        function setNoteMode(noteMode) {
            settings.noteMode = noteMode;
            alterFretboard(settings.allNotes);
        }

        function getNoteCircles() {
            return settings.noteCircles;
        }

        function getAnimationSpeed() {
            return settings.animationSpeed;
        }

        function alterFretboard(allNotes) {
            var oldNotes = $.extend(true, [], settings.allNotes);
            var newNotes = $.extend(true, [], allNotes);
            var oldNumFrets = oldNotes[0].length - 1;
            var newNumFrets = newNotes[0].length - 1;
            var fretboardBodyWidth = $fretboardBody.width();
            var fretboardBodyHeight = $fretboardBody.height();

            settings.allNotes = newNotes;
            settings.numFrets = newNumFrets;
            settings.tuning = [];

            for (var i = 0; i < settings.allNotes.length; i++) {
                settings.tuning.push(settings.allNotes[i][0]);
            }

            alterStrings(oldNotes, newNotes, oldNumFrets, fretboardBodyHeight);
            alterFretLines(oldNumFrets, fretboardBodyWidth);
            alterNoteCircles(oldNumFrets, fretboardBodyWidth, fretboardBodyHeight);
        }

        function alterStrings(oldNotes, newNotes, oldNumFrets, fretboardBodyHeight) {
            var stringsToIterateOver = Math.max(oldNotes.length, newNotes.length);
            var $stringContainers = $fretboardContainer.find(stringContainerSelector);
            var fretsToIterateOver = Math.max(oldNumFrets, settings.numFrets);

            for (var i = 0; i < stringsToIterateOver; i++) {
                var $stringContainer = $stringContainers.eq(i);

                // If a string should be there
                if (i < settings.tuning.length) {
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
                        if (j <= settings.numFrets) {
                            var note = settings.allNotes[i][j];
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
            var fretsToIterateOver = Math.max(oldNumFrets, settings.numFrets);
            var $fretLines = $fretboardContainer.find(fretLineSelector);

            for (var i = 0; i <= fretsToIterateOver; i++) {
                var $fretLine = $fretLines.eq(i);
                // If a fret is there
                if (i <= settings.numFrets) {
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
            var fretsToIterateOver = Math.max(oldNumFrets, settings.numFrets);
            var $existingNoteCircles = $fretboardContainer.find(noteCircleCssSelector);
            var $existingNoteCirclesHash = {};
            var noteCirclesThatShouldExistHash = {};

            for (var i = 0; i < $existingNoteCircles.length; i++) {
                var $noteCircle = $existingNoteCircles.eq(i);
                $existingNoteCirclesHash[$noteCircle.data("fretNumber")] = $noteCircle;
            }

            for (var i = 0; i < settings.noteCircles.length; i++) {
                noteCirclesThatShouldExistHash[settings.noteCircles[i]] = true;
            }

            for (var i = 0; i <= fretsToIterateOver; i++) {
                // If a fret is there
                if (i <= settings.numFrets) {
                    // If a note circle should be there
                    if (noteCirclesThatShouldExistHash[i]) {
                        // And it is not there
                        if (!$existingNoteCirclesHash[i]) {
                            // Create it
                            var $noteCircle = getNoteCircleEl(i);
                            // Append it first so it gets a height
                            $fretboardBody.append($noteCircle);
                            $noteCircle
                                .css({
                                    left: fretboardBodyWidth,
                                    top: (fretboardBodyHeight / 2) - ($noteCircle.outerWidth(true) / 2)
                                });
                        }
                    } else {
                        // A note circle should not be there
                        // If a note circle is there
                        if ($existingNoteCirclesHash[i]) {
                            // Remove it
                            $existingNoteCirclesHash[i].remove();
                        }
                    }

                } else {
                    // A fret is not there
                    // If a note circle is there
                    if ($existingNoteCirclesHash[i]) {
                        // Remove it
                        $existingNoteCirclesHash[i].remove();
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
            $fretboardBody
                .animate({
                    height: fretboardBodyHeight,
                    width: fretboardBodyWidth
                }, {
                    duration: fretboardBodyShouldBeAnimated ? settings.animationSpeed : 0,
                    queue: false
                });
        }

        function animateFretLines(fretWidth, fretHeight, fretLinesShouldBeAnimated) {
            var $fretLines = $fretboardContainer.find(fretLineSelector);

            $fretLines.removeClass(firstCssClass).removeClass(lastCssClass)
                .each(function (fretNum, fretLineEl) {
                    var fretLeftVal = fretNum * fretWidth,
                        $fretLine = $(fretLineEl);

                    if (fretNum === 0) {
                        $fretLine.addClass(firstCssClass);
                    } else if (fretNum === settings.numFrets) {
                        $fretLine.addClass(lastCssClass);
                    }

                    $fretLine.animate({
                        left: fretLeftVal + fretWidth - ($fretLine.outerWidth(true) / 2),
                        height: fretHeight
                    }, {
                        duration: fretLinesShouldBeAnimated ? settings.animationSpeed : 0,
                        queue: false
                    });
                });
        }

        function animateStringContainers(fretWidth, fretHeight, stringContainersShouldBeAnimated, notesShouldBeAnimated) {
            var $stringContainers = $fretboardContainer.find(stringContainerSelector),
                firstStringDistanceFromTop = fretHeight / 4,
                extraSpaceDueToFirstStringDistanceFromTop = fretHeight - (firstStringDistanceFromTop * 2),
                extraSpacePerStringDueToFirstStringDistanceFromTop = extraSpaceDueToFirstStringDistanceFromTop / (settings.tuning.length - 1);

            $stringContainers.removeClass(firstCssClass + " " + lastCssClass)
                .each(function (stringNum, stringContainerEl) {
                    var $stringContainer = $(stringContainerEl),
                        $string = $stringContainer.find(stringSelector),
                        fretTopVal = (stringNum * fretHeight) + firstStringDistanceFromTop + (stringNum * extraSpacePerStringDueToFirstStringDistanceFromTop);

                    if (stringNum === 0) {
                        $stringContainer.addClass(firstCssClass);
                    } else if (stringNum === settings.tuning.length - 1) {
                        $stringContainer.addClass(lastCssClass);
                    }

                    // Set the string position across the note, taking into account the string's thickness
                    $string.animate({
                        top: fretTopVal - ($string.outerHeight(true) / 2)
                    }, {
                        duration: stringContainersShouldBeAnimated ? settings.animationSpeed : 0,
                        queue: false
                    });

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
                        noteTopVal = fretTopVal - ($note.outerHeight(true) / 2);

                    $note.animate({
                        left: noteLeftVal,
                        top: noteTopVal
                    }, {
                        duration: notesShouldBeAnimated ? settings.animationSpeed : 0,
                        queue: false
                    });
                });
        }

        function animateNoteCircles(fretboardBodyWidth, fretboardBodyHeight, fretWidth, noteCirclesShouldBeAnimated) {
            var $noteCircles = $fretboardBody.find(noteCircleCssSelector);

            $noteCircles.each(function (index, noteCircleEl) {
                var $noteCircle = $(noteCircleEl),
                    // Some duplication here with the note animation
                    fretLeftVal = $noteCircle.data("fretNumber") * fretWidth;

                $noteCircle.animate({
                    top: (fretboardBodyHeight / 2) - ($noteCircle.outerHeight(true) / 2),
                    left: fretLeftVal + ((fretWidth / 2) - ($noteCircle.outerWidth(true) / 2))
                }, {
                    duration: noteCirclesShouldBeAnimated ? settings.animationSpeed : 0,
                    queue: false
                });
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
                .data('fretNumber', fretNum);
        }

        function getNoteLetterEl(note) {
            // Need to validate noteMode earlier up
            var text = settings.noteMode === 'interval' ? note.intervalInfo.interval : note.letter;

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
            var dimensions,
                fretboardBodyHeight,
                fretboardBodyWidth,
                fretWidth,
                fretHeight;

            // Add the CSS classes that state the number of strings and frets,
            // and then get the height/width of the fretboard container because
            // the new CSS classes might change the height/width.
            removeContainerCssClasses();

            $fretboardContainer
                .addClass(fretboardContainerCssClass)
                .addClass("strings-" + settings.tuning.length)
                .addClass("frets-" + settings.numFrets);

            dimensions = settings.dimensionsFunc($fretboardContainer, $fretboardBody, settings);
            fretboardBodyHeight = dimensions.height;
            fretboardBodyWidth = dimensions.width;
            fretWidth = fretboardBodyWidth / (settings.numFrets + 1);
            fretHeight = fretboardBodyHeight / settings.tuning.length;

            animateFretboardBody(fretboardBodyWidth, fretboardBodyHeight, fretboardBodyShouldBeAnimated);
            animateFretLines(fretWidth, fretboardBodyHeight, fretLinesShouldBeAnimated);
            animateStringContainers(fretWidth, fretHeight, stringContainersShouldBeAnimated, notesShouldBeAnimated);
            animateNoteCircles(fretboardBodyWidth, fretboardBodyHeight, fretWidth, noteCirclesShouldBeAnimated);
        }

        function notesAreEqual(note1, note2) {
            return note1.letter === note2.letter && note1.octave === note2.octave;
        }
    };
})(jQuery);

// This is the jQuery plugin. It instantiates the fretboard model and
// fretboard renderer and coordinates interactions between them. It
// contains an API which the user can get:
// var fretboardInstance = $(".my-fretboard-js").data('fretboard');
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
            var defaultTuning = [{
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

            extendDefaultsWithUserOptions();

            var modelSettings = {
                allNoteLetters: settings.allNoteLetters,
                tuning: settings.tuning,
                numFrets: settings.numFrets,
                isChordMode: settings.isChordMode,
                noteClickingDisabled: settings.noteClickingDisabled,
                intervalSettings: settings.intervalSettings
            };

            fretboardModel = new Fretboard(modelSettings);

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

            $element.on("noteClicked", onUserNoteClick);
            $element.data('fretboard', api);

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
                executeOnClickedNotesCallbacks();
            }

            function clearClickedNotes() {
                fretboardModel.clearClickedNotes();
                fretboardRenderer.clearClickedNotes();
                executeOnClickedNotesCallbacks();
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
                executeOnClickedNotesCallbacks();
            }

            function getNumFrets() {
                return fretboardModel.getNumFrets();
            }

            function setNumFrets(numFrets) {
                fretboardModel.setNumFrets(numFrets);
                fretboardRenderer.alterFretboard(fretboardModel.getAllNotes());
                fretboardRenderer.animate(true, true, true, true, true);
                executeOnClickedNotesCallbacks();
            }

            function getIntervalSettings() {
                return fretboardModel.getIntervalSettings();
            }

            function setIntervalSettings(settings) {
                fretboardModel.setIntervalSettings(settings);
                fretboardRenderer.alterFretboard(fretboardModel.getAllNotes());
                executeOnClickedNotesCallbacks();
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

            function addNotesClickedListener(callback) {
                if (!callback) {
                    return;
                }

                settings.onClickedNotesChange.push(callback);
            }

            // Makes a copy of the options that were passed in, just in case the
            // user modifies that object. Then use it to extend the defaults.
            function extendDefaultsWithUserOptions() {
                $.extend(settings, defaults, $.extend(true, {}, options));
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
        return notesAreEqual(note1.stringItsOn, note2.stringItsOn) && note1.fretNumber === note2.fretNumber;
    }
})(jQuery);