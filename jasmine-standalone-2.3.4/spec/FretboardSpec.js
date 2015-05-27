describe("Fretboard", function() {
    var $body = $("body");
    var $fretboardHtml = $("<div class='my-fretboard-js'></div>");
    var fretboardInstance;
    var standardTuning = [{
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
    var numFrets = 15;
    var noteCircles = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
    var noteLetters = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "Ab/G#", "A", "A#/Bb", "B"];
    var animationSpeed = 500;
    var height = 32 * 6;

    beforeEach(function() {
        $body
            .empty()
            .append($fretboardHtml);

        $fretboardHtml.fretboard();

        fretboardInstance = $fretboardHtml.data('fretboard');
    });

    describe("Default configuration", function() {
        it("should have standard tuning", function() {
            expect(fretboardInstance.getTuning()).toEqual(standardTuning);
        });

        it("should have " + numFrets + " frets", function() {
            expect(fretboardInstance.getNumFrets()).toEqual(numFrets);
        });

        it("should be in chord mode", function() {
            expect(fretboardInstance.getChordMode()).toEqual(true);
        });

        it("should have the correct note circles", function() {
            expect(fretboardInstance.getNoteCircles()).toEqual(noteCircles);
        });

        it("should have the correct list of possible note letters", function() {
            expect(fretboardInstance.getAllNoteLetters()).toEqual(noteLetters);
        });

        it("should have note clicking enabled", function() {
            expect(fretboardInstance.getNoteClickingDisabled()).toEqual(false);
        });

        it("should have an animation speed of " + animationSpeed, function() {
            expect(fretboardInstance.getAnimationSpeed()).toEqual(animationSpeed);
        });

        // Won’t work - has zero height in tests
        //it("should have a default height of " + height, function() {
        //    expect(fretboardInstance.getDimensions().height).toEqual(height);
        //});
    });

    afterEach(function() {
        fretboardInstance.destroy();
    });
});