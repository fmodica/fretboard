(function () {
    "use strict";

    angular.module("angularFretboard", ['Scope.safeApply'])
        .directive("fretboard", [function () {
            var fretboardsGeneratedCounter = 0;

            return {
                restrict: "AE",
                scope: {
                    config: "=fretboardConfig"
                },
                controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {
                    var ctrl = this;

                    $scope.$on('$destroy', function () {
                        destroy(ctrl);
                    });

                    $scope.$watch(function () {
                        return $scope.config;
                    }, function (newVal, oldVal) {
                        if (newVal) {
                            initialize($scope, $element, ctrl);
                        } else {
                            destroy(ctrl);
                        }
                    });

                    function initialize() {
                        // The fretboardClickedNotes directive is responsible for updating the parent scope
                        // with new clicked notes. If callbacks from the original config fire before the parent
                        // scope is updated, then the clicked notes on the parent scope won't be up to date.
                        // So we delete the callbacks from the config now and let the fretboardClickedNotes
                        // directive create them later in the right order.
                        ctrl.originalOnClickedNotesChange = $scope.config.onClickedNotesChange;
                        delete $scope.config.onClickedNotesChange;

                        $element.attr("id", getUniqueDomIdForFretboard()).fretboard($scope.config);
                        ctrl.jQueryFretboard = $element.data('fretboard');
                    }

                    function destroy() {
                        if (ctrl.jQueryFretboard) {
                            ctrl.jQueryFretboard.destroy();
                            ctrl.jQueryFretboard = null;
                        }
                    }

                    function getUniqueDomIdForFretboard() {
                        return "fretboardjs-" + ++fretboardsGeneratedCounter;
                    }
                }],
                // The inner directives each have their own ngModel which handle two-way data-binding for only one thing 
                template:
                    '<span ng-if="config" fretboard-clicked-notes ng-model="config.clickedNotes"></span>' +
                    '<span ng-if="config" fretboard-tuning ng-model="config.tuning"></span>' +
                    '<span ng-if="config" fretboard-num-frets ng-model="config.numFrets"></span>' +
                    '<span ng-if="config" fretboard-is-chord-mode ng-model="config.isChordMode"></span>' +
                    '<span ng-if="config" fretboard-note-clicking-is-disabled ng-model="config.noteClickingDisabled"></span>' +
                    '<span ng-if="config" fretboard-note-mode ng-model="config.noteMode"></span>' +
                    '<span ng-if="config" fretboard-interval-settings ng-model="config.intervalSettings"></span>'
            }
        }])
        .directive("fretboardClickedNotes", ["$rootScope", function ($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    // Set the callbacks in the correct order so the parent scope is always up to date.
                    fretboardCtrl.jQueryFretboard.addNotesClickedListener(function () {
                        $rootScope.$safeApply(function () {
                            ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboard.getClickedNotes());
                        });
                    });

                    if (fretboardCtrl.originalOnClickedNotesChange) {
                        for (var i = 0; i < fretboardCtrl.originalOnClickedNotesChange.length; i++) {
                            (function (i) {
                                fretboardCtrl.jQueryFretboard.addNotesClickedListener(function () {
                                    $rootScope.$safeApply(function () {
                                        fretboardCtrl.originalOnClickedNotesChange[i]();
                                    });
                                });
                            })(i);
                        }
                    }

                    ngModelCtrl.$render = function () {
                        if (isUndefinedOrNull(ngModelCtrl.$viewValue)) return;

                        // Store the $viewValue because the call to clearClickedNotes will clear it out
                        var clickedNotes = ngModelCtrl.$viewValue;
                        fretboardCtrl.jQueryFretboard.clearClickedNotes();
                        fretboardCtrl.jQueryFretboard.setClickedNotes(clickedNotes);
                    };
                }
            }
        }])
        .directive("fretboardTuning", ["$rootScope", function ($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    ngModelCtrl.$render = function () {
                        if (isUndefinedOrNull(ngModelCtrl.$viewValue)) return;

                        fretboardCtrl.jQueryFretboard.setTuning(ngModelCtrl.$viewValue);
                    };
                }
            }
        }])
        .directive("fretboardNumFrets", ["$rootScope", function ($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    ngModelCtrl.$render = function () {
                        if (isUndefinedOrNull(ngModelCtrl.$viewValue)) return;

                        fretboardCtrl.jQueryFretboard.setNumFrets(ngModelCtrl.$viewValue);
                    };
                }
            }
        }])
        .directive("fretboardIsChordMode", ["$rootScope", function ($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    ngModelCtrl.$render = function () {
                        if (isUndefinedOrNull(ngModelCtrl.$viewValue)) return;

                        fretboardCtrl.jQueryFretboard.setChordMode(ngModelCtrl.$viewValue);
                    };
                }
            }
        }])
        .directive("fretboardNoteClickingIsDisabled", ["$rootScope", function ($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    ngModelCtrl.$render = function () {
                        if (isUndefinedOrNull(ngModelCtrl.$viewValue)) return;

                        fretboardCtrl.jQueryFretboard.setNoteClickingDisabled(ngModelCtrl.$viewValue);
                    };
                }
            }
        }])
        .directive("fretboardNoteMode", ["$rootScope", function ($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function (scope, element, attrs, ctrls) {
                    ;  var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    ngModelCtrl.$render = function () {
                        if (isUndefinedOrNull(ngModelCtrl.$viewValue)) return;

                        fretboardCtrl.jQueryFretboard.setNoteMode(ngModelCtrl.$viewValue);
                    };
                }
            }
        }])
        .directive("fretboardIntervalSettings", ["$rootScope", function ($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    ngModelCtrl.$render = function () {
                        if (isUndefinedOrNull(ngModelCtrl.$viewValue)) return;

                        fretboardCtrl.jQueryFretboard.setIntervalSettings(ngModelCtrl.$viewValue);
                    };
                }
            }
        }]);

    function isUndefinedOrNull(val) {
        return angular.isUndefined(val) || val === null;
    }
})();