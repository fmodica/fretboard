describe("Fretboard", function() {
  var $body = $("body");
  var $fretboardHtml = $("<div class='my-fretboard-js'></div>");
  var fretboardInstance;
  var standardTuning = [
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

  describe("Default configuration", function() {
    beforeEach(function() {
      $body
        .empty()
        .append($fretboardHtml);

      $fretboardHtml.fretboard();

      fretboardInstance = $fretboardHtml.data('fretboard');
    });

    it("should have standard tuning", function() {
        expect(fretboardInstance.getTuning()).toEqual(standardTuning);
    });

    afterEach(function() {
        fretboardInstance.destroy();
    });
  });

});
