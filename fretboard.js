(function () {
    "use strict";

    window.Fretboard = function (settings) {
        var self = this;
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

        self.destroy = destroy;
        self.getAllNotes = getAllNotes;
        self.getChordMode = getChordMode;
        self.setChordMode = setChordMode;
        self.getAllNoteLetters = getAllNoteLetters;
        self.getClickedNotes = getClickedNotes;
        self.setClickedNotes = setClickedNotes;
        self.getNoteClickingDisabled = getNoteClickingDisabled;
        self.setNoteClickingDisabled = setNoteClickingDisabled;
        self.getTuning = getTuning;
        self.setTuning = setTuning;
        self.getNumFrets = getNumFrets;
        self.setNumFrets = setNumFrets;
        self.clearClickedNotes = clearClickedNotes;
        self.getIntervalSettings = getIntervalSettings;
        self.setIntervalSettings = setIntervalSettings;

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

        function clearClickedNotes() {
            model.clickedNotes = [];

            for (var i = 0; i < model.tuning.length; i++) {
                model.clickedNotes.push([]);
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
})();

(function ($) {
    "use strict";

    window.FretboardHtmlRenderer = function (settings, $element) {
        var self = this,
            $window = $(window),
            settings = $.extend(true, {}, settings),
            fretboardContainerCssClass = "fretboard-container",
            bodyCssClass = "fretboard-body",
            stringContainerCssClass = "string-container",
            stringContainerSelector = "." + stringContainerCssClass,
            noteCssClass = "note",
            noteSelector = "." + noteCssClass,
            letterCssClass = "letter",
            letterSelector = "." + letterCssClass,
            stringCssClass = "string",
            stringSelector = "." + stringCssClass,
            fretLineCssClass = "fret-line",
            fretLineSelector = "." + fretLineCssClass,
            hoverCssClass = "hover",
            clickedCssClass = "clicked",
            clickedSelector = "." + clickedCssClass,
            noteCircleCssClass = "note-circle",
            noteCircleCssSelector = "." + noteCircleCssClass,
            firstCssClass = "first",
            lastCssClass = "last",
            noteDataKey = "noteData",
            $fretboardContainer = $element,
            $fretboardScrollWrapper,
            $fretboardBody,
            timer;

        $fretboardBody = getFretboardBodyEl(settings.allNotes);
        $fretboardScrollWrapper = getFretboardScrollWrapperEl();
        $fretboardContainer
            .addClass(fretboardContainerCssClass)
            .append($fretboardBody)
            .wrap($fretboardScrollWrapper);

        // Animate the fretboard dimensions on resize, but only 
        // on the last resize after X milliseconds
        $window.on("resize", function () {
            clearTimeout(timer);

            timer = setTimeout(function () {
                setDimensions(true, true, true, true, true);
            }, 100);
        });

        setDimensions(false, false, false, false, false);

        self.destroy = function () {
            $fretboardBody.remove();
            $fretboardContainer.unwrap();
            removeContainerCssClasses();
        };

        self.setTuning = function (allNotes) {
            var oldNotes = $.extend(true, [], settings.allNotes),
                newNotes = $.extend(true, [], allNotes),
                newNumFrets = newNotes[0].length - 1,
                tuningLengthDifference = oldNotes.length - newNotes.length,
                $newStringContainer,
                newTuningNote,
                notesOnString,
                i;

            settings.allNotes = newNotes;
            settings.tuning = [];
            // Will need to set the number of frets if this function is converted
            // into a generic function that alters the fretboard
            //settings.numFrets = newNumFrets;

            var $stringContainers = $fretboardContainer.find(stringContainerSelector);

            // Modification/addition of strings
            for (i = 0; i < settings.allNotes.length; i++) {
                notesOnString = newNotes[i];
                newTuningNote = notesOnString[0];
                settings.tuning.push(newTuningNote);

                // If a string exists, alter it
                if (i < oldNotes.length) {
                    alterString($stringContainers.eq(i), i, notesOnString);
                } else {
                    $newStringContainer = getStringContainerEl(notesOnString, i);
                    $newStringContainer
                        .find(stringSelector + ", " + noteSelector)
                        .css({
                            top: $fretboardBody.height()
                        });

                    $fretboardBody.append($newStringContainer);
                }
            }


            // String removal
            for (i = 0; i < tuningLengthDifference; i++) {
                $stringContainers.eq(oldNotes.length - 1 - i).remove();
            }

            setDimensions(true, true, true, true, true);

            // The stringItsOn property of the notes may have changed, so alert the user
            //$fretboardContainer.trigger("notesClicked");
        };

        function alterString($stringContainer, stringNum, notesOnString) {
            var $existingStringContainerNotes = $stringContainer
                .find(noteSelector);
            var $newStringContainerNotes = getStringContainerEl(notesOnString, stringNum)
                .find(noteSelector);

            for (var i = 0; i <= settings.numFrets; i++) {
                // Use the info on the new string's notes to modify the old string's notes
                var $newNote = $newStringContainerNotes.eq(i);

                $existingStringContainerNotes
                    .eq(i)
                    .data(noteDataKey, $newNote.data(noteDataKey))
                    .find(letterSelector)
                    .replaceWith($newNote.find(letterSelector));
            }
        }

        self.setNumFrets = function (allNotes) {
            var newNotes = $.extend(true, [], allNotes),
                newNumFrets = newNotes[0].length - 1,
                oldNotes = $.extend(true, [], settings.allNotes),
                oldNumFrets = oldNotes[0].length - 1,
                fretNumDifference = oldNumFrets - newNumFrets,
                absFretNumDifference = Math.abs(fretNumDifference),
                $stringContainers = $fretboardContainer.find(stringContainerSelector),
                $fretLines = $fretboardContainer.find(fretLineSelector),
                $noteCircles = $fretboardContainer.find(noteCircleCssSelector),
                fretboardBodyWidth = $fretboardBody.width(),
                fretboardBodyHeight = $fretboardBody.height(),
                $noteCircleHash = {},
                noteCircleHash = {},
                $noteCircle,
                noteCircleHeight,
                $stringContainer,
                noteData,
                $note,
                i,
                j,
                fretNum,
                notesOnString;

            settings.allNotes = newNotes;
            settings.numFrets = newNumFrets;

            for (i = 0; i < settings.allNotes.length; i++) {
                $stringContainer = $stringContainers.eq(i);

                // Add or remove absFretNumDifference frets
                for (j = 0; j < absFretNumDifference; j++) {
                    // fretNumDifference will never be 0 or this loop won't be entered
                    if (fretNumDifference > 0) {
                        fretNum = oldNumFrets - j;

                        $stringContainer
                            .find(noteSelector)
                            .eq(fretNum)
                            .remove();

                    } else if (fretNumDifference < 0) {
                        // Add fret
                        fretNum = oldNumFrets + j;
                        noteData = settings.allNotes[i][fretNum];

                        $note = getNoteEl({
                            letter: noteData.letter,
                            octave: noteData.octave,
                            fretIndex: fretNum,
                            stringIndex: i,
                            intervalInfo: noteData.intervalInfo
                        })
                            // Make it come in from the right
                            .css({
                                left: $fretboardBody.width()
                            });

                        $stringContainer.append($note);
                    }
                }
            }

            // Fret lines go inside the body
            for (i = 0; i < absFretNumDifference; i++) {
                // fretNumDifference will never be 0 or this loop won't be entered
                if (fretNumDifference > 0) {
                    $fretLines[fretNum].remove();
                } else if (fretNumDifference < 0) {
                    // Make it come in from the right
                    $fretboardBody.append(
                        getFretLineEl()
                        .css({
                            left: fretboardBodyWidth
                        })
                    );
                }
            }

            $noteCircles.each(function (index, noteCircleEl) {
                $noteCircle = $(noteCircleEl);
                $noteCircleHash[$noteCircle.data("fretNumber")] = $noteCircle;
            });

            settings.noteCircles.forEach(function (fretNum) {
                noteCircleHash[fretNum] = true;
            });

            // Note circles
            for (i = 0; i < absFretNumDifference; i++) {
                if (fretNumDifference > 0) {
                    fretNum = oldNumFrets - i;
                    $noteCircle = $noteCircleHash[fretNum];

                    if ($noteCircle) {
                        $noteCircle.remove();
                    }
                } else if (fretNumDifference < 0) {
                    fretNum = oldNumFrets + (i + 1);

                    if (noteCircleHash[fretNum] === true) {
                        $noteCircle = getNoteCircleEl(fretNum);
                        // Append it first so it gets a height
                        $fretboardBody.append($noteCircle);
                        noteCircleHeight = $noteCircle.outerWidth(true);

                        $noteCircle
                            .css({
                                left: fretboardBodyWidth,
                                top: (fretboardBodyHeight / 2) - (noteCircleHeight / 2)
                            });
                    }
                }
            }

            setDimensions(true, true, true, true, true);
        };

        self.clearClickedNotes = function () {
            // DUPLICATE LOGIC - possibly refactor
            $fretboardContainer
                .find(noteSelector + clickedSelector)
                .removeClass()
                .addClass(noteCssClass)
                .on("mouseenter", noteMouseEnter)
                .on("mouseleave", noteMouseLeave);
        };

        // Will be passed in with just fretNumber and stringItsOn.
        // This method can probably be optimized to not use indexOf
        // and other inefficient search techniques.
        self.setClickedNotes = function (notesToClick) {
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
        };

        self.getClickedNotes = function () {
            // DUPLICATE LOGIC - possibly refactor
            return $fretboardContainer
                .find(noteSelector + clickedSelector);
        };

        self.setNoteMode = function (noteMode) {
            settings.noteMode = noteMode;

            var $strings = $fretboardContainer.find(stringContainerSelector);

            for (var i = 0; i < settings.allNotes.length; i++) {
                $strings.eq(i)
                    .find(noteSelector)
                    .each(function (j) {
                        $(this)
                            .find(letterSelector)
                            .replaceWith(getNoteLetterEl(settings.allNotes[i][j]));
                    });
            }
        };

        self.getNoteMode = function () {
            return settings.noteMode;
        };

        self.getNoteCircles = function () {
            return settings.noteCircles;
        };

        self.getAnimationSpeed = function () {
            return settings.animationSpeed;
        };

        function getFretboardBodyEl(notesOnFretboard) {
            var $fretboardBody = $("<div class='" + bodyCssClass + "'></div>"),
                $stringContainer,
                $fretLine,
                $noteCircle,
                i;

            for (i = 0; i < notesOnFretboard.length; i++) {
                $stringContainer = getStringContainerEl(notesOnFretboard[i], i);
                $fretboardBody.append($stringContainer);
            }

            for (i = 0; i <= settings.numFrets; i++) {
                $fretLine = getFretLineEl();
                $fretboardBody.append($fretLine);
            }

            for (i = 0; i < settings.noteCircles.length; i++) {
                if (settings.noteCircles[i] <= settings.numFrets) {
                    $noteCircle = getNoteCircleEl(settings.noteCircles[i]);
                    $fretboardBody.append($noteCircle);
                }
            }

            return $fretboardBody;
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

        function getNoteEl(note) {
            return $("<div class='" + noteCssClass + "'></div>")
                .on("mouseenter", noteMouseEnter)
                .on("mouseleave", noteMouseLeave)
                .on("click", onNoteClick)
                .append(getNoteLetterEl(note))
                .data(noteDataKey, note);
        }

        function getStringContainerEl(notesOnString, stringIndex) {
            var $stringContainer = $("<div class='" + stringContainerCssClass + "'></div>"),
                openNote = notesOnString[0],
                $note,
                note,
                i;

            for (i = 0; i < notesOnString.length; i++) {
                note = notesOnString[i];

                $note = getNoteEl({
                    letter: note.letter,
                    octave: note.octave,
                    fretIndex: i,
                    stringIndex: stringIndex,
                    intervalInfo: note.intervalInfo
                });

                $stringContainer.append($note);
            }

            $stringContainer.append(getStringEl());

            return $stringContainer;
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

// The jQuery plugin
(function ($) {
    "use strict";

    $.fn.fretboard = function (options) {
        return this.each(function () {
            // Private variables
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
            // The API object that a user interacts with. It also acts as 
            // a "controller", coordinating between the model and renderer
            var api = {};
            // The settings which are the defaults extended with user options
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
                // Even though this info exists in the settings that were passed in,
                // we ask the model for it again in case it was altered
                allNotes: fretboardModel.getAllNotes(),
                tuning: fretboardModel.getTuning(),
                numFrets: fretboardModel.getNumFrets(),

                // renderer should validate its own settings
                noteCircles: settings.noteCircles,
                animationSpeed: settings.animationSpeed,
                dimensionsFunc: getAlteredDimensionsFunc(),
                noteMode: settings.noteMode
            };

            fretboardRenderer = new FretboardHtmlRenderer(fretboardRendererSettings, $element);

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
            api.getAnimationSpeed = getAnimationSpeed;
            api.addNotesClickedListener = addNotesClickedListener;

            $element.on("noteClicked", onUserNoteClick);
            $element.data('fretboard', api);

            // Make a copy of the options that were passed in, just in case the 
            // user modifies that object. Then use it to extend the defaults.
            function extendDefaultsWithUserOptions() {
                $.extend(settings, defaults, $.extend(true, {}, options));
            }

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
                fretboardRenderer.setTuning(fretboardModel.getAllNotes());
                executeOnClickedNotesCallbacks();
            }

            function getNumFrets() {
                return fretboardModel.getNumFrets();
            }

            function setNumFrets(numFrets) {
                fretboardModel.setNumFrets(numFrets);
                fretboardRenderer.setNumFrets(fretboardModel.getAllNotes());
                executeOnClickedNotesCallbacks();
            }

            function getIntervalSettings() {
                return fretboardModel.getIntervalSettings();
            }

            function setIntervalSettings(settings) {
                fretboardModel.setIntervalSettings(settings);
                fretboardRenderer.setTuning(fretboardModel.getAllNotes());
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

            function reattachCSSClassesFromDOM(allNotes, newClickedNotes, $clickedNotes) {
                for (var i = 0; i < newClickedNotes.length; i++) {
                    for (var j = 0; j < $clickedNotes.length; j++) {
                        var $oldNote = $clickedNotes.eq(j);
                        var oldNoteData = $oldNote.data("noteData");
                        var oldNote = allNotes[oldNoteData.stringIndex][oldNoteData.fretIndex];
                        if (notesAreEqual(newClickedNotes[i].stringItsOn, oldNote.stringItsOn) &&
                           newClickedNotes[i].fretNumber === oldNote.fretNumber) {
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
                        if (notesAreEqual(newClickedNotes[i].stringItsOn, clickedNotesWithCssClasses[j].stringItsOn) &&
                            newClickedNotes[i].fretNumber === clickedNotesWithCssClasses[j].fretNumber) {
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
                var $clickedNote = $(clickedNoteEl);
                var $clickedNotes = fretboardRenderer.getClickedNotes();
                var clickedNoteData = $clickedNote.data("noteData");
                var allNotes = fretboardModel.getAllNotes();
                var clickedNote = allNotes[clickedNoteData.stringIndex][clickedNoteData.fretIndex];
                fretboardModel.setClickedNotes([clickedNote], true);
                var newClickedNotes = fretboardModel.getClickedNotes();
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
})(jQuery);