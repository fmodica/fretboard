(function($) {
    "use strict";

    window.Fretboard = function(options, $element) {
        var self = this,
            $window = $(window),
            fretboardContainerCssClass = "fretboard-container",
            bodyCssClass = "fretboard-body",
            bodySelector = "." + bodyCssClass,
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
            // The value for C needs to be first
            DEFAULT_NOTE_LETTERS = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "Ab/G#", "A", "A#/Bb", "B"],
            DEFAULT_TUNING = [{
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
            // Take up the container's height and width by default
            DEFAULT_DIMENSIONS_FUNC = function($fretboardContainer, $fretboardBody) {
                var winWidth = $window.width(),
                    containerWidth = $fretboardContainer.width(),
                    containerHeight = $fretboardContainer.height(),
                    fretboardBodyWidthDiff = $fretboardBody.outerWidth(true) - $fretboardBody.width(),
                    fretboardBodyHeightDiff = $fretboardBody.outerHeight(true) - $fretboardBody.height(),
                    newBodyWidth,
                    newBodyHeight;
                    
                newBodyWidth = containerWidth - fretboardBodyWidthDiff; 
                newBodyHeight = containerHeight - fretboardBodyHeightDiff;
                    
                return {
                    width: newBodyWidth,
                    height: newBodyHeight
                }
            },
            defaults = {
                allNoteLetters: DEFAULT_NOTE_LETTERS,
                tuning: DEFAULT_TUNING,
                numFrets: 15,
                isChordMode: true,
                noteClickingDisabled: false,
                dimensionsFunc: DEFAULT_DIMENSIONS_FUNC,
                animationSpeed: 500
            },
            settings = {},
            $fretboardScrollWrapper,
            $fretboardBody;
            
        // Make a copy of the options that were passed in, just in case the 
        // user modifies that object. Then extend it with the defaults.
        $.extend(settings, defaults, $.extend(true, [], options));
        
        console.log("Settings: ");
        console.log(settings);

        validate();
        init();

        function init() {
            var numStrings = settings.tuning.length,
                numFrets = settings.numFrets,
                timer;
                
            // Set the instance variable
            $fretboardBody = getFretboardBodyEl(); 
            $fretboardScrollWrapper = $("<div class='fretboard-scroll-wrapper'></div>");
            
            $element
                .addClass(fretboardContainerCssClass)    
                .append($fretboardBody)
                .wrap($fretboardScrollWrapper);
            
            setDimensions(false, false, false, false, false);
            
            // Animate the fretboard dimensions on resize, but only 
            // on the last resize after X milliseconds
            $window.on("resize",function() {
                clearTimeout(timer);

                timer = setTimeout(function() {
                    setDimensions(true, true, true, true, true);
                }, 100);
            });
        }
        
        self.setChordMode = function(isChordMode) {
            settings.isChordMode = isChordMode;
        }
        
        self.getClickedNotes = function() {
            var clickedNotes = [];
            
            $element
                .find(noteSelector + clickedSelector)
                .each(function() {
                    clickedNotes.push($(this).data('noteData'));
                });
                
            return clickedNotes;
        }
        
        self.setNoteClickingDisabled = function(isDisabled) {
            settings.noteClickingDisabled = isDisabled;
        }
        
        self.setTuning = function(newTuning) {
            var numFrets = settings.numFrets,
                $stringContainers = $element.find(stringContainerSelector),
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
           
            settings.tuning = newTuning;
            
            // Modification/addition of strings
            for (i = 0; i < newTuningLength; i++) {
                newTuningNote = newTuning[i];
                oldTuningNote = oldTuning[i];
                $newStringContainer = getStringContainerEl(newTuningNote);
                
                // If a string exists, alter it if the new open note is different than the old
                if (i < oldTuningLength) {
                    if (!notesAreEqual(newTuningNote, oldTuningNote)) {
                        console.log("altering");
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
                    } else {
                        console.log("notes are the same");
                    }
                } else {
                    // Add new string
                    console.log("adding");
                    
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
                    console.log("removing");
                    $($stringContainers[oldTuningLength - 1 - i]).remove();
                }
            }
            
            setDimensions(true, true, true, true, true);
        }
        
        self.setNumFrets = function(newNumFrets) {
            var tuning = settings.tuning,
                oldNumFrets = settings.numFrets,
                numStrings = tuning.length,
                fretNumDifference = oldNumFrets - newNumFrets,
                absFretNumDifference = Math.abs(fretNumDifference),
                $stringContainers = $element.find(stringContainerSelector),
                $stringContainer,
                $fretLines = $element.find(fretLineSelector),
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
                    // fretNumDifferene will never be 0 or this loop won't be entered
                    if (fretNumDifference > 0) {
                        // Remove fret
                        fretNum = oldNumFrets - j;
                        $stringContainer.find(noteSelector)[fretNum].remove();
                        
                    } else if (fretNumDifference < 0) { 
                        // Add fret
                        fretNum = oldNumFrets + (j + 1);
                        noteData = getNoteByFretNumber(openNote, fretNum);
                        
                        $note = getNoteEl({
                            letter : noteData.letter,
                            octave: noteData.octave,
                            fretNumber: fretNum,
                            stringItsOn: openNote
                        })
                        // Make it come in from the right
                        .css({
                            left: $fretboardBody.width()
                        })
                        
                        $stringContainer.append($note);
                    }
                }
            }
            
            // Fret lines go inside the body
            for (j = 0; j < absFretNumDifference; j++) {
                // fretNumDifference will never be 0 or this loop won't be entered
                if (fretNumDifference > 0) {
                    $fretLines[fretNum].remove();
                } else if (fretNumDifference < 0) {
                    // Make it come in from the right
                    $fretboardBody.append(
                        getFretLineEl()
                        .css({
                            left: $fretboardBody.width()
                        })
                    );
                }
            }
            
            setDimensions(true, true, true, true, true);
        }
        
        self.clearClickedNotes = function() {
            debugger;
            // This logic is in multiple places - possibly refactor
            $element
                .find(noteSelector + clickedSelector)
                .removeClass(clickedCssClass)
                .removeClass(hoverCssClass)
                .on("mouseenter", noteMouseEnter)
                .on("mouseleave", noteMouseLeave);
                
            $element.trigger("notesCleared");
        }
        
        self.setClickedNotes = function(notesToClick) {
            var notesToClick = $.extend(true, [], notesToClick),
                notesToClickLength = notesToClick.length, 
                tuning = settings.tuning,
                tuningLength = tuning.length,
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
            // If it does, get the of the matched note in the tuning array and 
            // get the find the corresponding $stringContainer and click its 
            // note.
            
            for (i = 0; i < notesToClickLength; i++) {
                noteToClick = notesToClick[i];
                stringItsOn = noteToClick && noteToClick.stringItsOn;
                
                if (!stringItsOn) {
                    continue;
                }
                
                for (j = 0; j < tuningLength; j++) {
                    tuningNote = tuning[j];
                    
                    if (notesAreEqual(tuningNote, stringItsOn)) {
                        $stringContainer = $($element.find(stringContainerSelector)[j]);
                        $note = $($stringContainer.find(noteSelector)[noteToClick.fretNumber]);
                        
                        if (!$note.hasClass(clickedCssClass)) {
                            // Make it behave the same as if you hovered over and clicked it
                            $note.trigger("mouseover").trigger("click");
                        }
                    }
                }   
            }
            
            $element.trigger("notesClicked");
        }
        
        self.redraw = function() {
            setDimensions(true, true, true, true, true);
        }
        
        function notesAreEqual(note1, note2) {
            return note1.letter === note2.letter && note1.octave === note2.octave;
        }
        
        function getFretboardBodyEl() {
            var numStrings = settings.tuning.length,
                numFrets = settings.numFrets,
                $fretboardBody = $("<div class='" + bodyCssClass + "'></div>"),
                $stringContainer,
                $fretLine,
                openNote,
                i;
                
            for (i = 0; i < numStrings; i++) {
                openNote = settings.tuning[i];
                $stringContainer = getStringContainerEl(openNote);
                $fretboardBody.append($stringContainer);
            }
            
            for (i = 0; i <= numFrets; i++) {
                $fretLine = getFretLineEl();
                $fretboardBody.append($fretLine);
            }
            
            return $fretboardBody;
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
                    letter : noteData.letter,
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
                    
                    if (settings.noteClickingDisabled) {
                        return;
                    }
                    
                    if($clickedNote.hasClass(clickedCssClass)) {
                        $clickedNote
                            .removeClass(clickedCssClass)
                            .removeClass(hoverCssClass)
                            .on("mouseenter", noteMouseEnter)
                            .on("mouseleave", noteMouseLeave);
                    } else {
                        $clickedNote
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
                                        .removeClass(clickedCssClass)
                                        .removeClass(hoverCssClass)
                                        .on("mouseenter", noteMouseEnter)
                                        .on("mouseleave", noteMouseLeave);
                                }
                            });
                            
                    }
                    
                    $element.trigger("notesClicked");
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
        function setDimensions(animateBodyBool, animateNotesBool, animateFretLinesBool, animateStringContainersBool, animateStringNotesBool) {
            var numFrets = settings.numFrets,
                numStrings = settings.tuning.length,
                defaultDimensions = DEFAULT_DIMENSIONS_FUNC($element, $fretboardBody),
                dimensions = settings.dimensionsFunc($element, $fretboardBody),
                fretboardBodyHeight = dimensions.height || defaultDimensions.height,
                fretboardBodyWidth = dimensions.width || defaultDimensions.width,
                fretWidth = fretboardBodyWidth / (numFrets + 1),
                fretHeight = fretboardBodyHeight / numStrings;
            
            animateFretboardBody(fretboardBodyWidth, fretboardBodyHeight, animateBodyBool);
            animateFretLines(fretWidth, fretboardBodyHeight, animateFretLinesBool);
            animateStringContainers(fretWidth, fretHeight, animateStringContainersBool, animateStringNotesBool);
            
            $element.trigger("dimensionsSet");
        }
        
        function animateFretboardBody(fretboardBodyWidth, fretboardBodyHeight, animate) {
            var numStrings = settings.tuning.length,
                numFrets = settings.numFrets,
                fretboardBodyRightPosition,
                fretboardContainerRightPosition;
                
            $fretboardBody
                .removeClass()
                .addClass(bodyCssClass)
                .addClass("strings-" + numStrings)
                .addClass("frets-" + numFrets)
                .animate({
                    height: fretboardBodyHeight,
                    width: fretboardBodyWidth
                }, { 
                    duration: animate ? settings.animationSpeed : 0, 
                    queue: false, 
                    complete: function() {
                        // Don't put "true" in outerWidth
                        fretboardBodyRightPosition = $fretboardBody.offset().left + $fretboardBody.outerWidth();
                        fretboardContainerRightPosition = $element.offset().left + $element.outerWidth();
                    }
                });
        }
        
        function animateFretLines(fretWidth, fretHeight, animate) { 
            var $fretLines = $element.find(fretLineSelector),
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
            var $stringContainers = $element.find(stringContainerSelector),
                numStrings = settings.tuning.length;
            
            $stringContainers.removeClass("first").removeClass("last")
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
                        $fretLine;
                        
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
                        fretTopVal = stringNum * fretHeight;
                        noteLeftVal = fretLeftVal + ((fretWidth / 2) - (noteWidth / 2));
                        noteTopVal = fretTopVal + ((fretHeight / 2)  - (noteHeight / 2));
                        
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
                        top: noteTopVal + (noteHeight / 2)  - ($string.outerHeight() / 2)
                    }, {
                        duration: animateContainer ? settings.animationSpeed : 0, 
                        queue: false 
                    });
                });
        
        }
        
        function getNoteByFretNumber(stringNote, fretNumber) {
            var fretOffset = settings.allNoteLetters.indexOf(stringNote.letter) + fretNumber,
                numOctavesAboveString = Math.floor(fretOffset / 12);
                
                // Reduce the index by the correct amount to get it below 12
                fretOffset = fretOffset - (12 * numOctavesAboveString);

            return { 
                letter: settings.allNoteLetters[fretOffset],
                octave: stringNote.octave + numOctavesAboveString
            }
        }
        
        function noteMouseEnter(e) {
            $(this).addClass(hoverCssClass);
        }
        
        function noteMouseLeave(e) {
            $(this).removeClass(hoverCssClass);
        }

        function validate() {
            validateAllNoteLetters();
        }

        function validateAllNoteLetters() {
            if (settings.allNoteLetters.length !== 12) {
                throw "allNoteLetters is not valid: " + settings.allNoteLetters;
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
            if ($element.data('fretboard')) return;

            fretboard = new Fretboard(options, $element);

            $element.data('fretboard', fretboard);
        });
    };
})(jQuery);
