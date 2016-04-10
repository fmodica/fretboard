"use strict";

angular.isUndefinedOrNull = function(val) {
    return angular.isUndefined(val) || val === null;
};

angular.module("angularFretboard", ['Scope.safeApply'])
    .directive("fretboard", [
        function() {
            var fretboardsGeneratedCounter = 0;

            return {
                restrict: "AE",
                scope: {
                    config: "=fretboardConfig"
                },
                // The controller code is run before the scopes of other directives which
                // need access to it, so create the jQuery fretboard here
                controller: [
                    "$scope", "$element", "$attrs",
                    function($scope, $element, $attrs) {
                        var ctrl = this;

                        $scope.$on('$destroy', function() {
                            destroy(ctrl);
                        });

                        $scope.$watch(function() {
                            return $scope.config;
                        }, function(newVal, oldVal) {
                            if (newVal) {
                                initialize($scope.config, $element, ctrl);
                            } else {
                                destroy(ctrl);
                            }
                        });
                    }
                ],
                // The inner directives each have their own ngModel which handle two-way data-binding for only one thing 
                template: '<span fretboard-clicked-notes ng-model="config.clickedNotes"></span>' +
                    '<span fretboard-tuning ng-model="config.tuning"></span>' +
                    '<span fretboard-num-frets ng-model="config.numFrets"></span>' +
                    '<span fretboard-is-chord-mode ng-model="config.isChordMode"></span>' +
                    '<span fretboard-note-clicking-is-disabled ng-model="config.noteClickingDisabled"></span>' +
                    '<span fretboard-note-mode ng-model="config.noteMode"></span>' +
                    '<span fretboard-interval-settings ng-model="config.intervalSettings"></span>'
            }

            function initialize(config, element, ctrl) {
                element.attr("id", getUniqueDomIdForFretboard()).fretboard(config);
                ctrl.jQueryFretboard = element.data('fretboard');
            }

            function destroy(ctrl) {
                if (ctrl.jQueryFretboard) {
                    ctrl.jQueryFretboard.destroy();
                    ctrl.jQueryFretboard = null;
                }
            }

            function getUniqueDomIdForFretboard() {
                return "fretboardjs-" + ++fretboardsGeneratedCounter;
            }
        }
    ])
    // Do not give these inner directives isolate scope or they will won't be able
    // to access the config in the fretboard directive's isolate scope
    .directive("fretboardClickedNotes", [
        "$rootScope",
        function($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function(scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    scope.ng = ngModelCtrl.$viewValue;

                    scope.$watch(function() {
                        return fretboardCtrl.jQueryFretboard;
                    }, function() {
                        if (!fretboardCtrl.jQueryFretboard) {
                            return;
                        }

                        fretboardCtrl.jQueryFretboard.addNotesClickedListener(function() {
                            $rootScope.$safeApply(function() {
                                ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboard.getClickedNotes());
                            });
                        });

                        ngModelCtrl.$render = function () {
                            fretboardCtrl.jQueryFretboard.clearClickedNotes();
                            fretboardCtrl.jQueryFretboard.setClickedNotes(ngModelCtrl.$viewValue);
                        };
                    });
                }
            }
        }
    ])
    .directive("fretboardTuning", [
        "$rootScope",
        function($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function(scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    scope.$watch(function() {
                        return fretboardCtrl.jQueryFretboard;
                    }, function() {
                        if (!fretboardCtrl.jQueryFretboard) {
                            return;
                        }

                        ngModelCtrl.$render = function() {
                            fretboardCtrl.jQueryFretboard.setTuning(ngModelCtrl.$viewValue);
                        };
                    });
                }
            }
        }
    ])
    .directive("fretboardNumFrets", [
        "$rootScope",
        function($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function(scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    scope.$watch(function() {
                        return fretboardCtrl.jQueryFretboard;
                    }, function() {
                        if (!fretboardCtrl.jQueryFretboard) {
                            return;
                        }

                        ngModelCtrl.$render = function() {
                            fretboardCtrl.jQueryFretboard.setNumFrets(ngModelCtrl.$viewValue);
                        };
                    });
                }
            }
        }
    ])
    .directive("fretboardIsChordMode", [
        "$rootScope",
        function($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function(scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    scope.$watch(function() {
                        return fretboardCtrl.jQueryFretboard;
                    }, function() {
                        if (!fretboardCtrl.jQueryFretboard) {
                            return;
                        }

                        ngModelCtrl.$render = function() {
                            fretboardCtrl.jQueryFretboard.setChordMode(ngModelCtrl.$viewValue);
                        };
                    });
                }
            }
        }
    ])
    .directive("fretboardNoteClickingIsDisabled", [
        "$rootScope",
        function($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function(scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    scope.$watch(function() {
                        return fretboardCtrl.jQueryFretboard;
                    }, function() {
                        if (!fretboardCtrl.jQueryFretboard) {
                            return;
                        }

                        ngModelCtrl.$render = function() {
                            fretboardCtrl.jQueryFretboard.setNoteClickingDisabled(ngModelCtrl.$viewValue);
                        };
                    });
                }
            }
        }
    ])
    .directive("fretboardNoteMode", [
        "$rootScope",
        function($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function(scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    scope.$watch(function() {
                        return fretboardCtrl.jQueryFretboard;
                    }, function() {
                        if (!fretboardCtrl.jQueryFretboard) {
                            return;
                        }

                        ngModelCtrl.$render = function() {
                            fretboardCtrl.jQueryFretboard.setNoteMode(ngModelCtrl.$viewValue);
                        };
                    });
                }
            }
        }
    ])
    .directive("fretboardIntervalSettings", [
        "$rootScope",
        function($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function(scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    scope.$watch(function() {
                        return fretboardCtrl.jQueryFretboard;
                    }, function() {
                        if (!fretboardCtrl.jQueryFretboard) {
                            return;
                        }

                        ngModelCtrl.$render = function() {
                            fretboardCtrl.jQueryFretboard.setIntervalSettings(ngModelCtrl.$viewValue);
                        };
                    });
                }
            }
        }
    ]);