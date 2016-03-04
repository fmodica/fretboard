(function () {
    "use strict";

    window.Fretboard = function (settings) {
        var self = this,
            model = {
                allNotes: [],
                clickedNotes: []
            };

        validate();
        initializeNotes();

        self.destroy = function () {
            model = null;
        };

        self.getAllNotes = function () {
            return model.allNotes;
        };

        self.setChordMode = function (isChordMode) {
            settings.isChordMode = isChordMode;
        };

        self.getChordMode = function () {
            return settings.isChordMode;
        };

        self.getAllNoteLetters = function () {
            return settings.allNoteLetters;
        };

        self.getClickedNotes = function () {
            var clickedNotes = [],
                notesOnString,
                clickedFretsOnString,
                //clickedNotesOnString,
                i,
                j;

            for (i = 0; i < model.allNotes.length; i++) {
                notesOnString = model.allNotes[i];
                clickedFretsOnString = model.clickedNotes[i];
                //clickedNotesOnString = [];

                for (j = 0; j < clickedFretsOnString.length; j++) {
                    //clickedNotesOnString.push(notesOnString[clickedFretsOnString[j]])
                    clickedNotes.push(notesOnString[clickedFretsOnString[j]]);
                }

                //clickedNotes.push(clickedNotesOnString);
            }

            return clickedNotes;
        };

        self.setNoteClickingDisabled = function (isDisabled) {
            settings.noteClickingDisabled = isDisabled;
        };

        self.getNoteClickingDisabled = function () {
            return settings.noteClickingDisabled;
        };

        self.setTuning = function (newTuning) {
            var newTuning = $.extend(true, [], newTuning),
                oldTuning = $.extend(true, [], settings.tuning),
                tuningLengthDifference = oldTuning.length - newTuning.length,
                newTuningNote,
                oldTuningNote,
                notesOnString,
                i;

            settings.tuning = newTuning;
            validateTuning();

            model.allNotes = [];

            for (i = 0; i < newTuning.length; i++) {
                newTuningNote = settings.tuning[i];
                notesOnString = getNotesOnString(newTuningNote);
                model.allNotes[i] = notesOnString;
            }

            if (tuningLengthDifference > 0) {
                model.clickedNotes = model.clickedNotes.slice(0, newTuning.length);
            } else if (tuningLengthDifference < 0) {
                for (i = 0; i < Math.abs(tuningLengthDifference) ; i++) {
                    model.clickedNotes.push([]);
                }
            }
        };

        self.getTuning = function () {
            return settings.tuning;
        };

        self.setNumFrets = function (newNumFrets) {
            var i,
                openNote,
                notesOnString;

            settings.numFrets = newNumFrets;

            validateNumFrets();

            for (i = 0; i < settings.tuning.length; i++) {
                openNote = settings.tuning[i];
                notesOnString = getNotesOnString(openNote);
                model.allNotes[i] = notesOnString;
                model.clickedNotes[i] = model.clickedNotes[i].filter(function (fretNumber) {
                    return fretNumber <= settings.numFrets;
                });
            }
        };

        self.getNumFrets = function () {
            return settings.numFrets;
        };

        self.clearClickedNotes = function () {
            var i;

            model.clickedNotes = [];

            for (i = 0; i < settings.tuning.length; i++) {
                model.clickedNotes.push([]);
            }
        };

        // Will be passed in with just fretNumber and stringItsOn.
        // This method can probably be optimized to not use indexOf
        // and other inefficient search techniques.
        self.setClickedNotes = function (notesToClick, takeSettingsIntoAccount) {
            var notesToClick = $.extend(true, [], notesToClick),
                i,
                j,
                tuningNote,
                noteToClick,
                stringItsOn,
                $stringContainer,
                $note;

            if (!notesToClick || (takeSettingsIntoAccount && settings.noteClickingDisabled)) {
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

                    var clickedNotesOnString = model.clickedNotes[j];
                    var index = clickedNotesOnString.indexOf(noteToClick.fretNumber);

                    if (takeSettingsIntoAccount) {
                        if (settings.isChordMode) {
                            clickedNotesOnString.splice(0, clickedNotesOnString.length);

                            if (index === -1) {
                                clickedNotesOnString.push(noteToClick.fretNumber);
                            }
                        } else {
                            if (index === -1) {
                                clickedNotesOnString.push(noteToClick.fretNumber)
                            } else {
                                clickedNotesOnString.splice(index, 1);
                            }
                        }

                        continue;
                    }

                    // If note is found we're done. Otherwise add it.
                    if (index === -1) {
                        clickedNotesOnString.push(noteToClick.fretNumber);
                    }
                }
            }
        };

        self.getNoteMode = function () {
            return settings.noteMode;
        };

        self.getIntervalSettings = function () {
            return settings.intervalSettings;
        };

        self.setNoteMode = function (noteMode) {
            var notes,
                note,
                i,
                j;

            settings.noteMode = noteMode;

            for (i = 0; i < model.allNotes.length; i++) {
                notes = model.allNotes[i];

                for (j = 0; j < notes.length; j++) {
                    note = notes[j];

                    if (settings.noteMode === 'interval') {
                        note.intervalInfo = {
                            interval: getIntervalByLetterAndRoot(note.letter, settings.intervalSettings.root),
                            root: settings.intervalSettings.root
                        }
                    } else {
                        note.intervalInfo = null;
                    }
                }
            }
        };

        self.getNoteCircles = function () {
            return settings.noteCircles;
        };

        self.getAnimationSpeed = function () {
            return settings.animationSpeed;
        };

        function initializeNotes() {
            var openNote,
                notesOnString,
                i;

            for (i = 0; i < settings.tuning.length; i++) {
                openNote = settings.tuning[i];
                notesOnString = getNotesOnString(openNote);
                model.allNotes.push(notesOnString);
                model.clickedNotes.push([]);
            }

        }
        function getNotesOnString(openNote) {
            var notes = [],
                note,
                i;

            for (i = 0; i <= settings.numFrets; i++) {
                note = getNoteByFretNumber(openNote, i);
                notes.push({
                    letter: note.letter,
                    octave: note.octave,
                    fretNumber: i,
                    stringItsOn: openNote
                });
            }

            return notes;
        }

        // Could be a generic getNoteXNotesAwayFrom function
        function getNoteByFretNumber(stringNote, fretNumber) {
            var noteIndex = settings.allNoteLetters.indexOf(stringNote.letter) + fretNumber,
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
                letter: settings.allNoteLetters[reducedNoteIndex],
                octave: stringNote.octave + numOctavesAboveString
            };
        }

        // Renderer should not know how to calculate intervals
        function getIntervalByLetterAndRoot(letter, root) {
            var letterIndex = settings.allNoteLetters.indexOf(letter);
            var rootIndex = settings.allNoteLetters.indexOf(root);

            // Duplicate message logic here and in validation function
            if (letterIndex === -1) {
                throw "note letter \"" + letter + "\" is not in the allNoteLetters array: " + settings.allNoteLetters;
            }

            if (rootIndex === -1) {
                throw "note letter \"" + root + "\" is not in the allNoteLetters array: " + settings.allNoteLetters;
            }

            var intervalIndex = letterIndex - rootIndex + (letterIndex >= rootIndex ? 0 : 12);

            return settings.intervalSettings.intervals[intervalIndex];
        }

        function validate() {
            validateAllNoteLetters();
            validateTuning();
            validateNumFrets();
        }

        function validateAllNoteLetters() {
            var hash = {};

            if (settings.allNoteLetters.length !== 12) {
                throw "allNoteLetters is not valid because there must be exactly 12 letters in the array: " + settings.allNoteLetters;
            }

            // Uniqueness
            settings.allNoteLetters.forEach(function (noteLetter) {
                hash[noteLetter] = noteLetter;
            });

            if (Object.keys(hash).length !== 12) {
                throw "allNoteLetters is not valid because there must be 12 unique letters in the array: " + allNoteLetters;
            }
        }

        function validateTuning() {
            var tuningNoteLetter;

            if (!settings.tuning.length) {
                throw "tuning must have at least one note: " + settings.tuning;
            }

            for (var i = 0; i < settings.tuning.length; i++) {
                tuningNoteLetter = settings.tuning[i].letter;

                if (settings.allNoteLetters.indexOf(tuningNoteLetter) === -1) {
                    throw "tuning is not valid because the note letter \"" + tuningNoteLetter + "\" is not in the allNoteLetters array: " + allNoteLetters;
                }
            }
        }

        function validateNumFrets() {
            if (settings.numFrets <= 0) {
                throw "numFrets must be a positive number";
            }
        }

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

        self.setChordMode = function (isChordMode) {
            settings.isChordMode = isChordMode;
        };

        self.setNoteClickingDisabled = function (isDisabled) {
            settings.noteClickingDisabled = isDisabled;
        };

        self.setTuning = function (allNotes) {
            var $stringContainers = $fretboardContainer.find(stringContainerSelector),
                oldNotes = $.extend(true, [], settings.allNotes),
                newNotes = $.extend(true, [], allNotes),
                newNumFrets = newNotes[0].length - 1,
                tuningLengthDifference = oldNotes.length - newNotes.length,
                $newStringContainer,
                newTuningNote,
                oldTuningNote,
                notesOnString,
                i;

            settings.allNotes = newNotes;
            settings.tuning = [];
            // Will need to set the number of frets if this function is converted
            // into a generic function that alters the fretboard
            //settings.numFrets = newNumFrets;

            // Modification/addition of strings
            for (i = 0; i < settings.allNotes.length; i++) {
                notesOnString = newNotes[i];
                newTuningNote = notesOnString[0];
                settings.tuning.push(newTuningNote);

                // If a string exists, alter it if the new open note is different than the old
                if (i < oldNotes.length) {
                    oldTuningNote = oldNotes[i][0];

                    if (!notesAreEqual(newTuningNote, oldTuningNote)) {
                        alterString(i, notesOnString);
                    }
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

        function alterString(stringNum, notesOnString) {
            var $newStringContainer = getStringContainerEl(notesOnString, stringNum),
                $newStringContainerNotes = $newStringContainer.find(noteSelector),
                $existingStringContainerNotes = $stringContainers.eq(stringNum).find(noteSelector),
                $existingNote,
                i,
                newNoteData;

            for (i = 0; i <= settings.numFrets; i++) {
                // Use the info on the new string to modify the old string
                newNoteData = $newStringContainerNotes.eq(i).data(noteDataKey);
                $existingNote = $existingStringContainerNotes.eq(i);

                $existingNote
                    .data(noteDataKey, newNoteData)
                    .find(letterSelector)
                    .text(newNoteData.letter);
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
                            stringIndex: i
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

        // Should there be one method that takes allNotes and changes the fretboard?
        self.setNoteText = function (allNotes) {
            var $strings = $fretboardContainer.find(stringContainerSelector),
                $notesOnString,
                $letter,
                notesOnString,
                i,
                j;

            settings.allNotes = allNotes;

            for (i = 0; i < settings.allNotes.length; i++) {
                notesOnString = settings.allNotes[i];
                $notesOnString = $strings.eq(i).find(noteSelector);

                $notesOnString.each(function (j) {
                    var note = notesOnString[j];
                    var $letter = getNoteLetterEl((note.intervalInfo && note.intervalInfo.interval) || note.letter);

                    $(this).find(letterSelector).replaceWith($letter);
                });
            }
        };

        self.redraw = function () {
            setDimensions(true, true, true, true, true);
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

        function getNoteLetterEl(text) {
            return $("<div class='" + letterCssClass + "'>" + text + "</div>");
        }

        function getNoteEl(note) {
            return $("<div class='" + noteCssClass + "'></div>")
                .on("mouseenter", noteMouseEnter)
                .on("mouseleave", noteMouseLeave)
                .on("click", onNoteClick)
                .append(getNoteLetterEl((note.intervalInfo && note.intervalInfo.interval) || note.letter))
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
                    stringIndex: stringIndex
                });

                $stringContainer.append($note);
            }

            $stringContainer.append(getStringEl());

            return $stringContainer;
        }

        function onNoteClick() {
            var $clickedNote = $(this),
                noteData = $clickedNote.data(noteDataKey);

            $fretboardContainer.trigger("noteClicked", noteData);
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
        // The plugin will be called like this:
        // $('.fretboard-container').fretboard({ ... });
        // Iterate over each element in the jQuery 
        // collection, initializing a fretboard.   
        return this.each(function () {
            var $element = $(this),
                // Acts like a controller
                api = {},
                settings = {},
                // The value for C needs to be first
                defaultNoteLetters = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "Ab/G#", "A", "A#/Bb", "B"],
                defaultTuning = [{
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
                }],
                defaultNoteCircles = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24],
                defaultIntervalSettings = {
                    intervals: ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'],
                    root: defaultNoteLetters[0]
                },
                defaultNoteMode = 'letter', // or 'interval'
                // Take up the container's height and width by default
                defaultDimensionsFunc = function ($fretboardContainer, $fretboardBody, settings) {
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
                },
                defaults = {
                    allNoteLetters: defaultNoteLetters,
                    tuning: defaultTuning,
                    numFrets: 15,
                    isChordMode: true,
                    noteClickingDisabled: false,
                    noteMode: defaultNoteMode,
                    intervalSettings: defaultIntervalSettings,
                    animationSpeed: 500, // ms
                    dimensionsFunc: defaultDimensionsFunc,
                    noteCircles: defaultNoteCircles,
                    onFretboardChange: function () { }
                },
                fretboardModel,
                renderer;

            // Make a copy of the options that were passed in, just in case the 
            // user modifies that object. Then extend it with the defaults.
            $.extend(settings, defaults, $.extend(true, {}, options));

            if (settings.dimensionsFunc !== defaultDimensionsFunc) {
                var oldFunc = settings.dimensionsFunc;
                var newFunc = function ($fretboardContainer, $fretboardBody, settings) {
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

                settings.dimensionsFunc = newFunc;
            }

            // Doesn't need all the settings
            fretboardModel = new Fretboard(settings);
            settings.allNotes = fretboardModel.getAllNotes();
            // Doesn't need all the settings

            renderer = new FretboardHtmlRenderer(settings, $element);

            api.destroy = function () {
                fretboardModel.destroy();
                renderer.destroy();
            };

            api.getAllNotes = function () {
                return fretboardModel.getAllNotes();
            };

            api.getNoteCircles = function () {
                return fretboardModel.getNoteCircles();
            };

            api.setChordMode = function (isChordMode) {
                fretboardModel.setChordMode(isChordMode);
                renderer.setChordMode(fretboardModel.getChordMode());
            };

            api.getChordMode = function () {
                return fretboardModel.getChordMode();
            };

            api.getAllNoteLetters = function () {
                return fretboardModel.getAllNoteLetters();
            };

            api.getAnimationSpeed = function () {
                return fretboardModel.getAnimationSpeed();
            };

            api.getClickedNotes = function () {
                return fretboardModel.getClickedNotes();
            };

            api.setNoteClickingDisabled = function (isDisabled) {
                fretboardModel.setNoteClickingDisabled(isDisabled);
                renderer.setNoteClickingDisabled(fretboardModel.getNoteClickingDisabled());
            };

            api.getNoteClickingDisabled = function () {
                return fretboardModel.getNoteClickingDisabled();
            };

            api.getDimensions = function () {
                return renderer.getDimensions();
            };

            api.setTuning = function (tuning) {
                fretboardModel.setTuning(tuning);
                renderer.setTuning(fretboardModel.getAllNotes());
                settings.onFretboardChange();
            };

            api.getTuning = function () {
                return fretboardModel.getTuning();
            };

            api.setNumFrets = function (numFrets) {
                fretboardModel.setNumFrets(numFrets);
                renderer.setNumFrets(fretboardModel.getAllNotes());
                settings.onFretboardChange();
            };

            api.getNumFrets = function () {
                return fretboardModel.getNumFrets();
            };

            api.clearClickedNotes = function () {
                fretboardModel.clearClickedNotes();
                renderer.clearClickedNotes();
                settings.onFretboardChange();
            };

            api.setClickedNotes = function (clickedNotes) {
                fretboardModel.setClickedNotes(clickedNotes);
                renderer.setClickedNotes(fretboardModel.getClickedNotes());
                settings.onFretboardChange();
            };

            api.setNoteMode = function (noteMode) {
                fretboardModel.setNoteMode(noteMode);
                renderer.setNoteText(fretboardModel.getAllNotes());
                settings.onFretboardChange();
            };

            api.getNoteMode = function () {
                return fretboardModel.getNoteMode();
            };

            api.getIntervalSettings = function () {
                return fretboardModel.getIntervalSettings();
            };

            // Could do setIntervalSettings, setNoteLetters

            api.redraw = function () {
                renderer.redraw();
            };

            $element.on("noteClicked", function (e, noteData) {
                var allNotes = fretboardModel.getAllNotes(),
                    note = allNotes[noteData.stringIndex][noteData.fretIndex];

                fretboardModel.setClickedNotes([note], true);
                renderer.clearClickedNotes();
                renderer.setClickedNotes(fretboardModel.getClickedNotes());
                settings.onFretboardChange();
            });

            // on noteClicked event, need to tell the model
            // whether it was called programatically or via event
            // (needs to know whether other notes disappear)

            $element.data('fretboard', api);
        });
    };
})(jQuery);