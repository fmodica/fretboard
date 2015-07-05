(function($) {
    "use strict";

    window.Fretboard = function(options, $element) {
        var self = this,
            $window = $(window),
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
            // The value for C needs to be first
            DEFAULT_NOTE_LETTERS = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "Ab/G#", "A", "A#/Bb", "B"],
            DEFAULT_TUNING = [
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
            ],
            // Take up the container's height and width by default
            DEFAULT_DIMENSIONS_FUNC = function($fretboardContainer, $fretboardBody) {
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
            defaultNoteCircleList = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24],
            defaults = {
                allNoteLetters: DEFAULT_NOTE_LETTERS,
                tuning: DEFAULT_TUNING,
                numFrets: 15,
                isChordMode: true,
                noteClickingDisabled: false,
                dimensionsFunc: DEFAULT_DIMENSIONS_FUNC,
                animationSpeed: 500,
                noteCircleList: defaultNoteCircleList
            },
            settings = {},
            $fretboardScrollWrapper,
            $fretboardContainer = $element,
            $fretboardBody;

        // Make a copy of the options that were passed in, just in case the 
        // user modifies that object. Then extend it with the defaults.
        $.extend(settings, defaults, $.extend(true, [], options));

        validate();
        init();

        function init() {
            var timer;

            // Set the instance variable
            $fretboardBody = getFretboardBodyEl();
            $fretboardScrollWrapper = $("<div class='fretboard-scroll-wrapper'></div>");

            $fretboardContainer
                .addClass(fretboardContainerCssClass)
                .append($fretboardBody)
                .wrap($fretboardScrollWrapper);

            setDimensions(false, false, false, false, false);

            // Animate the fretboard dimensions on resize, but only 
            // on the last resize after X milliseconds
            $window.on("resize", function() {
                clearTimeout(timer);

                timer = setTimeout(function() {
                    setDimensions(true, true, true, true, true);
                }, 100);
            });
        }

        self.getAllNotes = function() {
            var allNotes = [];

            $fretboardContainer
                .find(stringContainerSelector)
                .each(function() {
                    var notesOnString = [];

                    $(this)
                        .find(noteSelector)
                        .each(function() {
                            notesOnString.push($(this).data('noteData'));
                        });

                    allNotes.push(notesOnString);
                });

            return allNotes;
        };

        self.destroy = function() {
            $fretboardBody.remove();
            $fretboardContainer.unwrap();
            removeContainerCssClasses();
        };

        self.setChordMode = function(isChordMode) {
            settings.isChordMode = isChordMode;
        };

        self.getChordMode = function() {
            return settings.isChordMode;
        };

        self.getNoteCircles = function() {
            return settings.noteCircleList;
        };

        self.getAllNoteLetters = function() {
            return settings.allNoteLetters;
        };

        self.getAnimationSpeed = function() {
            return settings.animationSpeed;
        };

        self.getClickedNotes = function() {
            var clickedNotes = [];

            $fretboardContainer
                .find(noteSelector + clickedSelector)
                .each(function() {
                    clickedNotes.push($(this).data('noteData'));
                });

            return clickedNotes;
        };

        self.setNoteClickingDisabled = function(isDisabled) {
            settings.noteClickingDisabled = isDisabled;
        };

        self.getNoteClickingDisabled = function() {
            return settings.noteClickingDisabled;
        };

        self.getDimensions = function() {
            return settings.dimensionsFunc($fretboardContainer, $fretboardBody);
        };

        self.setTuning = function(newTuning) {
            var numFrets = settings.numFrets,
                $stringContainers = $fretboardContainer.find(stringContainerSelector),
                newTuning = $.extend(true, [], newTuning),
                newTuningLength = newTuning.length,
                oldTuning = $.extend(true, [], settings.tuning),
                oldTuningLength = oldTuning.length,
                tuningLengthDifference = oldTuningLength - newTuningLength,
                newTuningNote,
                oldTuningNote,
                $newStringContainer,
                $newStringContainerNotes,
                $existingStringContainerNotes,
                newNoteData,
                $existingNote,
                i,
                j;

            if (!newTuning || !newTuning.length) {
                return;
            }

            settings.tuning = newTuning;

            validateTuning();

            // Modification/addition of strings
            for (i = 0; i < newTuningLength; i++) {
                newTuningNote = newTuning[i];
                oldTuningNote = oldTuning[i];
                $newStringContainer = getStringContainerEl(newTuningNote);

                // If a string exists, alter it if the new open note is different than the old
                if (i < oldTuningLength) {
                    if (!notesAreEqual(newTuningNote, oldTuningNote)) {
                        // Create a new string but don't add it to the DOM. Just use its info
                        // to modify the string already in the DOM.
                        $newStringContainerNotes = $newStringContainer.find(noteSelector);
                        $existingStringContainerNotes = $($stringContainers[i]).find(noteSelector);

                        for (j = 0; j <= numFrets; j++) {
                            newNoteData = $($newStringContainerNotes[j]).data('noteData');
                            $existingNote = $($existingStringContainerNotes[j]);

                            $existingNote
                                .data('noteData', newNoteData)
                                .find(letterSelector)
                                .text(newNoteData.letter);
                        }
                    }
                } else {
                    // Add new string

                    // Make the string and notes come in from the bottom
                    $newStringContainer
                        .find(stringSelector + ", " + noteSelector)
                        .css({
                            top: $fretboardBody.height()
                        });


                    $fretboardBody.append($newStringContainer);
                }
            }

            // Removal of strings
            if (tuningLengthDifference > 0) {
                for (i = 0; i < tuningLengthDifference; i++) {
                    $($stringContainers[oldTuningLength - 1 - i]).remove();
                }
            }

            setDimensions(true, true, true, true, true);

            // The stringItsOn property of the notes may have changed, so alert the user
            $fretboardContainer.trigger("notesClicked");
        };

        self.getTuning = function() {
            return settings.tuning;
        };

        self.setNumFrets = function(newNumFrets) {
            var tuning = settings.tuning,
                oldNumFrets = settings.numFrets,
                numStrings = tuning.length,
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
                openNote,
                $note,
                i,
                j,
                fretNum;

            settings.numFrets = newNumFrets;

            for (i = 0; i < numStrings; i++) {
                $stringContainer = $($stringContainers[i]);
                openNote = tuning[i];

                // Add or remove absFretNumDifference frets
                for (j = 0; j < absFretNumDifference; j++) {
                    // fretNumDifference will never be 0 or this loop won't be entered
                    if (fretNumDifference > 0) {
                        // Remove fret
                        fretNum = oldNumFrets - j;
                        $stringContainer.find(noteSelector)[fretNum].remove();

                    } else if (fretNumDifference < 0) {
                        // Add fret
                        fretNum = oldNumFrets + (j + 1);
                        noteData = getNoteByFretNumber(openNote, fretNum);

                        $note = getNoteEl({
                                letter: noteData.letter,
                                octave: noteData.octave,
                                fretNumber: fretNum,
                                stringItsOn: openNote
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

            $noteCircles.each(function(index, noteCircleEl) {
                $noteCircle = $(noteCircleEl);
                $noteCircleHash[$noteCircle.data("fretNumber")] = $noteCircle;
            });

            settings.noteCircleList.forEach(function(fretNum) {
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

        self.getNumFrets = function() {
            return settings.numFrets;
        };

        self.clearClickedNotes = function() {
            // DUPLICATE LOGIC - possibly refactor
            $fretboardContainer
                .find(noteSelector + clickedSelector)
                .removeClass()
                .addClass(noteCssClass)
                .on("mouseenter", noteMouseEnter)
                .on("mouseleave", noteMouseLeave);
        };

        self.setClickedNotes = function(notesToClick) {
            var notesToClick = $.extend(true, [], notesToClick),
                i,
                j,
                tuningNote,
                noteToClick,
                stringItsOn,
                $stringContainer,
                $note;

            if (notesToClick) {
                // For each note that needs to be clicked check its stringItsOn
                // property to see if it matches a note object in the tuning array.
                // If it does, get the of the matched note in the tuning array and 
                // get the find the corresponding $stringContainer and click its 
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

                        $stringContainer = $fretboardContainer.find(stringContainerSelector).eq(j);
                        $note = $stringContainer.find(noteSelector).eq(noteToClick.fretNumber);

                        if ($note.hasClass(clickedCssClass)) {
                            return;
                        }

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
        };

        self.redraw = function() {
            setDimensions(true, true, true, true, true);
        };

        function notesAreEqual(note1, note2) {
            return note1.letter === note2.letter && note1.octave === note2.octave;
        }

        function getFretboardBodyEl() {
            var noteCircleList = settings.noteCircleList,
                $fretboardBody = $("<div class='" + bodyCssClass + "'></div>"),
                $stringContainer,
                $fretLine,
                $noteCircle,
                openNote,
                i;

            for (i = 0; i < settings.tuning.length; i++) {
                openNote = settings.tuning[i];
                $stringContainer = getStringContainerEl(openNote);
                $fretboardBody.append($stringContainer);
            }

            for (i = 0; i <= settings.numFrets; i++) {
                $fretLine = getFretLineEl();
                $fretboardBody.append($fretLine);
            }

            for (i = 0; i < noteCircleList.length; i++) {
                if (noteCircleList[i] <= settings.numFrets) {
                    $noteCircle = getNoteCircleEl(noteCircleList[i]);
                    $fretboardBody.append($noteCircle);
                }
            }

            return $fretboardBody;
        }

        function getNoteCircleEl(fretNum) {
            return $("<div class='" + noteCircleCssClass + "'></div>")
                .data('fretNumber', fretNum);
        }

        function getStringContainerEl(openNote) {
            var $stringContainer = $("<div class='" + stringContainerCssClass + "'></div>"),
                numFrets = settings.numFrets,
                $note,
                noteData,
                i;

            for (i = 0; i <= numFrets; i++) {
                noteData = getNoteByFretNumber(openNote, i);

                $note = getNoteEl({
                    letter: noteData.letter,
                    octave: noteData.octave,
                    fretNumber: i,
                    stringItsOn: openNote
                });

                $stringContainer.append($note);
            }

            $stringContainer.append(getStringEl());

            return $stringContainer;
        }

        function getStringEl() {
            return $("<div class='" + stringCssClass + "'></div>");
        }

        function getNoteEl(noteData) {
            var $note,
                $letter;

            $letter = getLetterEl(noteData.letter);

            $note = $("<div class='" + noteCssClass + "'></div>")
                .on("mouseenter", noteMouseEnter)
                .on("mouseleave", noteMouseLeave)
                .on("click", function() {
                    var $clickedNote = $(this);

                    if (!settings.noteClickingDisabled) {
                        if ($clickedNote.hasClass(clickedCssClass)) {
                            $clickedNote
                                .removeClass()
                                .addClass(noteCssClass)
                                .on("mouseenter", noteMouseEnter)
                                .on("mouseleave", noteMouseLeave);
                        } else {
                            $clickedNote
                                .removeClass()
                                .addClass(noteCssClass)
                                .addClass(hoverCssClass)
                                .addClass(clickedCssClass)
                                .off("mouseenter", noteMouseEnter)
                                .off("mouseleave", noteMouseLeave);
                        }

                        // If we're in chord mode then get rid of all of the
                        // other clicked notes
                        if (settings.isChordMode) {
                            $clickedNote
                                .closest(stringContainerSelector)
                                .find(noteSelector + clickedSelector)
                                .each(function() {
                                    var $otherNote = $(this);

                                    // Compare the actual DOM elements (the jQuery wrappers 
                                    // will have different references)
                                    if ($clickedNote[0] !== $otherNote[0]) {
                                        $otherNote
                                            .removeClass()
                                            .addClass(noteCssClass)
                                            .on("mouseenter", noteMouseEnter)
                                            .on("mouseleave", noteMouseLeave);
                                    }
                                });
                        }
                    }

                    $fretboardContainer.trigger("notesClicked");
                })
                .append($letter)
                .data('noteData', noteData);

            return $note;
        }

        function getLetterEl(letter) {
            return $("<div class='" + letterCssClass + "'>" + letter + "</div>");
        }

        function getFretLineEl() {
            return $("<div class='" + fretLineCssClass + "'></div>");
        }

        // Absolutely position all of the inner elements, and animate their positioning if requested
        function setDimensions(animateBodyBool, animateFretLinesBool, animateStringContainersBool, animateStringNotesBool, animateNoteCirclesBool) {
            var numFrets = settings.numFrets,
                numStrings = settings.tuning.length,
                defaultDimensions,
                dimensions,
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
                .addClass("strings-" + numStrings)
                .addClass("frets-" + numFrets);

            defaultDimensions = DEFAULT_DIMENSIONS_FUNC($fretboardContainer, $fretboardBody);
            dimensions = settings.dimensionsFunc($fretboardContainer, $fretboardBody);
            fretboardBodyHeight = dimensions.height || defaultDimensions.height;
            fretboardBodyWidth = dimensions.width || defaultDimensions.width;
            fretWidth = fretboardBodyWidth / (numFrets + 1);
            fretHeight = fretboardBodyHeight / numStrings;
            animateFretboardBody(fretboardBodyWidth, fretboardBodyHeight, animateBodyBool);
            animateFretLines(fretWidth, fretboardBodyHeight, animateFretLinesBool);
            animateStringContainers(fretWidth, fretHeight, animateStringContainersBool, animateStringNotesBool);
            animateNoteCircles(fretboardBodyWidth, fretboardBodyHeight, fretWidth, animateNoteCirclesBool);

            $fretboardContainer.trigger("dimensionsSet");
        }

        // The user may have added some of their own classes so only remove the ones we know about.
        function removeContainerCssClasses() {
            $fretboardContainer
                .removeClass(function(index, css) {
                    return (css.match(/(^|\s)strings-\S+/g) || []).join(' ');
                })
                .removeClass(function(index, css) {
                    return (css.match(/(^|\s)frets-\S+/g) || []).join(' ');
                })
                .removeClass(fretboardContainerCssClass);
        }

        function animateFretboardBody(fretboardBodyWidth, fretboardBodyHeight, animate) {
            $fretboardBody
                .animate({
                    height: fretboardBodyHeight,
                    width: fretboardBodyWidth
                }, {
                    duration: animate ? settings.animationSpeed : 0,
                    queue: false
                });
        }

        function animateFretLines(fretWidth, fretHeight, animate) {
            var $fretLines = $fretboardContainer.find(fretLineSelector),
                numFrets = settings.numFrets;

            $fretLines.removeClass("first").removeClass("last")
                .each(function(fretNum, fretLineEl) {
                    var fretLeftVal = fretNum * fretWidth,
                        $fretLine = $(fretLineEl);

                    // Not really the responsibility of this function
                    if (fretNum === 0) {
                        $fretLine.addClass("first");
                    } else if (fretNum === numFrets) {
                        $fretLine.addClass("last");
                    }

                    $fretLine.animate({
                        left: fretLeftVal + fretWidth - ($fretLine.outerWidth(true) / 2),
                        height: fretHeight
                    }, {
                        duration: animate ? settings.animationSpeed : 0,
                        queue: false
                    });
                });
        }

        function animateStringContainers(fretWidth, fretHeight, animateContainer, animateNotes) {
            var $stringContainers = $fretboardContainer.find(stringContainerSelector),
                numStrings = settings.tuning.length;

            $stringContainers.removeClass("first last")
                .each(function(stringNum, stringContainerEl) {
                    var $stringContainer,
                        $string,
                        $notes,
                        $note,
                        noteWidth,
                        noteHeight,
                        fretLeftVal,
                        fretTopVal,
                        noteLeftVal,
                        noteTopVal,
                        firstStringDistanceFromTop = fretHeight / 4,
                        extraSpaceDueToFirstStringDistanceFromTop = fretHeight - (firstStringDistanceFromTop * 2),
                        extraSpacePerStringDueToFirstStringDistanceFromTop = (extraSpaceDueToFirstStringDistanceFromTop) /  (numStrings - 1);


                    $stringContainer = $(stringContainerEl);

                    if (stringNum === 0) {
                        $stringContainer.addClass("first");
                    } else if (stringNum === numStrings - 1) {
                        $stringContainer.addClass("last");
                    }

                    $string = $stringContainer.find(stringSelector);
                    $notes = $stringContainer.find(noteSelector);

                    $notes.each(function(fretNum, noteEl) {
                        $note = $(noteEl);
                        noteWidth = $note.outerWidth(true);
                        noteHeight = $note.outerHeight(true);

                        fretLeftVal = fretNum * fretWidth;
                        fretTopVal = (stringNum * fretHeight) + firstStringDistanceFromTop + (stringNum * extraSpacePerStringDueToFirstStringDistanceFromTop);
                        noteLeftVal = fretLeftVal + ((fretWidth / 2) - (noteWidth / 2));
                        noteTopVal = fretTopVal - (noteHeight / 2);

                        $note.animate({
                            left: noteLeftVal,
                            top: noteTopVal
                        }, {
                            duration: animateNotes ? settings.animationSpeed : 0,
                            queue: false
                        });
                    });

                    // Set the string position across the note, taking into account the string's thickness
                    $string.animate({
                        top: fretTopVal - ($string.outerHeight(true) / 2)
                    }, {
                        duration: animateContainer ? settings.animationSpeed : 0,
                        queue: false
                    });
                });
        }

        function animateNoteCircles(fretboardBodyWidth, fretboardBodyHeight, fretWidth, animate) {
            var $noteCircles = $fretboardBody.find(noteCircleCssSelector);

            $noteCircles.each(function(index, noteCircleEl) {
                var $noteCircle = $(noteCircleEl),
                    noteCircleHeight = $noteCircle.outerHeight(true),
                    noteCircleWidth = $noteCircle.outerWidth(true),
                    fretNum = $noteCircle.data("fretNumber"),
                    // Some duplication here with the note animation
                    fretLeftVal = fretNum * fretWidth,
                    noteCircleLeftVal = fretLeftVal + ((fretWidth / 2) - (noteCircleWidth / 2)),
                    noteCircleTopVal = (fretboardBodyHeight / 2) - (noteCircleHeight / 2);

                $noteCircle.animate({
                    top: noteCircleTopVal,
                    left: noteCircleLeftVal
                }, {
                    duration: animate ? settings.animationSpeed : 0,
                    queue: false
                });
            });
        }

        function getNoteByFretNumber(stringNote, fretNumber) {
            var noteIndex = settings.allNoteLetters.indexOf(stringNote.letter) + fretNumber,
                numOctavesAboveString = Math.floor(noteIndex / 12),
                reducedNoteIndex;

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

        function noteMouseEnter(e) {
            $(this).addClass(hoverCssClass);
        }

        function noteMouseLeave(e) {
            $(this).removeClass(hoverCssClass);
        }

        function validate() {
            validateAllNoteLetters();
            validateTuning();
        }

        function validateAllNoteLetters() {
            var allNoteLetters = settings.allNoteLetters;

            if (allNoteLetters.length !== 12) {
                throw "allNoteLetters is not valid because there must be exactly 12 letters in the array: " + allNoteLetters;
            }
        }

        function validateTuning() {
            var tuning = settings.tuning,
                tuningLength = tuning.length,
                allNoteLetters = settings.allNoteLetters,
                tuningNote,
                tuningNoteLetter,
                i;

            for (i = 0; i < tuningLength; i++) {
                tuningNote = tuning[i];
                tuningNoteLetter = tuningNote.letter;

                if (allNoteLetters.indexOf(tuningNoteLetter) === -1) {
                    throw "tuning is not valid because the note letter \"" + tuningNoteLetter + "\" is not in the allNoteLetters array: " + allNoteLetters;
                }
            }
        }
    };
})(jQuery);

if (!Array.isArray) {
    Array.isArray = function(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

// The jQuery plugin
(function($) {
    "use strict";

    $.fn.fretboard = function(options) {
        // The plugin will be called like this:
        // $('.fretboard-container').fretboard({ ... });
        // Iterate over each element in the jQuery 
        // collection, initializing a fretboard.   
        return this.each(function() {
            var $element = $(this),
                fretboard;

            // Return early if this element already has a plugin instance.
            // Otherwise, place a fretboard object on the element's data
            // if ($element.data('fretboard')) {
            //    return;
            // }

            fretboard = new Fretboard(options, $element);

            $element.data('fretboard', fretboard);
        });
    };
})(jQuery);
