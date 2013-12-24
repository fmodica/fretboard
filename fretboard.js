app.directive("fretboard", ["$rootScope", function ($rootScope) {
    var fretboardsGeneratedCounter = 0;

    return {
        restrict: "A",
        scope: {
            config: "=fretboardConfig"
        },
        link: function (scope, element, attrs) {
            initialize(scope, element);
        }
    }

    function initialize(scope, element) {
        if (!scope.config) {
            console.log("Error: You must have a config object on your controller, which you expose to the fretboard directive. Even if you just want to use " +
                "default fretboard options, create and expose an empty config object because the fretboard directive places clicked notes and the guitar tuning " +
                "(if it changes) onto the config object so you can access them from your controller. ");
            return;
        }

        // We cannot use ngModel for two-way binding between the model and the jQuery
        // fretboard because ng-model can only bind to one value. We would need multiple
        // elements with multiple ng-models. Instead, we keep two variables for each 
        // model-view pair.
        initializeJQueryFretboard(scope, element);
        fretboardsGeneratedCounter++;
    }

    function initializeJQueryFretboard(scope, element) {
        var domId = getUniqueDomIdForFretboard();

        element.attr("id", domId).fretboard(scope.config);

        var jQueryFretboard = element.data('fretboard');

        element.on("noteClicked", function () {
            console.log("notesClicked event - updating controller");
            scope.config.clickedNotes = jQueryFretboard.getClickedNotes();
        });

        scope.$watch(function () { return scope.config.clickedNotes }, function (newVal, oldVal) {
            if (newVal === oldVal) { return };
            console.log("clickedNotes changed on controller - updating jQuery");
            $rootScope.$safeApply(function () {
                jQueryFretboard.clearClickedNotes();
                for (var i = 0; i < newVal.length; i++) {
                    jQueryFretboard.setClickedNote(newVal[i].stringLetter, newVal[i].stringOctave, newVal[i].fretNumber);
                }
            });
        }, true);

        scope.$watch(function () { return scope.config.guitarStringNotes }, function (newVal, oldVal) {
            if (newVal === oldVal) { return };
            console.log("guitarStringNotes changed on controller - updating jQuery");
            jQueryFretboard.setGuitarStringNotes(newVal);
        }, true);

        element.on("tuningChanged", function () {
            console.log("tuningChanged event - updating controller");
            $rootScope.$safeApply(function () {
                scope.config.clickedNotes = jQueryFretboard.getClickedNotes();
                scope.config.guitarStringNotes = jQueryFretboard.getGuitarStringNotes();
            });

        });

        scope.$watch(function () { return scope.config.placedNotes }, function (newVal, oldVal) {
            jQueryFretboard.clearPlacedNotes();
            for (var i = 0; i < newVal.length; i++) {
                jQueryFretboard.placeNoteOnFretboard(newVal[i].noteLetter, newVal[i].noteOctave, newVal[i].fretNumber);
            }
        }, true);
    }

    function getUniqueDomIdForFretboard() {
        return "fretboardjs-" + fretboardsGeneratedCounter;
    }
}]);
