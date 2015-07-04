"use strict";

angular.isUndefinedOrNull = function (val) {
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

                                $scope.$watch(function() {
                                    return $scope.config && $scope.config.noteClickingDisabled;
                                }, function(newVal, oldVal) {
                                    if (angular.isUndefinedOrNull(newVal)) {
                                        return;
                                    }

                                    ctrl.jQueryFretboard.setNoteClickingDisabled(newVal);
                                });

                                $scope.$watch(function() {
                                    return $scope.config && $scope.config.isChordMode;
                                }, function(newVal, oldVal) {
                                    if (angular.isUndefinedOrNull(newVal)) {
                                        return;
                                    }

                                    ctrl.jQueryFretboard.setChordMode(newVal);
                                });

                                $scope.$watch(function() {
                                    return $scope.config && $scope.config.numFrets;
                                }, function(newVal, oldVal) {
                                    if (angular.isUndefinedOrNull(newVal)) {
                                        return;
                                    }

                                    ctrl.jQueryFretboard.setNumFrets(newVal);
                                });
                            } else {
                                destroy(ctrl);
                            }
                        });

                    }
                ],
                // we create 2 inner directives so they can each have their own ngModel, 
                // which handles two-way data-binding for only one thing 
                template:
                    '<span fretboard-tuning ng-model="config.tuning"></span>' +
                    '<span fretboard-clicked-notes ng-model="config.clickedNotes"></span>'
            }

            function initialize(config, element, ctrl) {
                var domId = getUniqueDomIdForFretboard();
                element.attr("id", domId).fretboard(config);

                ctrl.jQueryFretboardElement = element;
                ctrl.jQueryFretboard = element.data('fretboard');
            }

            function destroy(ctrl) {
                if (ctrl.jQueryFretboard) {
                    ctrl.jQueryFretboard.destroy();
                    ctrl.jQueryFretboard = null;
                    ctrl.jQueryFretboardElement = null;
                }
            }

            function getUniqueDomIdForFretboard() {
                fretboardsGeneratedCounter++;
                return "fretboardjs-" + fretboardsGeneratedCounter;
            }
        }
    ])
// Do not give these inner directives isolate scope or they will won't be able
// to access the config in the fretboard directive's isolate scope
    .directive("fretboardTuning", [
        function() {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function(scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    scope.$watch(function() {
                        return fretboardCtrl.jQueryFretboard;
                    }, function (newVal, oldVal) {
                        if (newVal) {
                            var jQueryFretboard = fretboardCtrl.jQueryFretboard;

                            ngModelCtrl.$render = function() {
                                jQueryFretboard.setTuning(ngModelCtrl.$viewValue);
                            }
                        }
                    });
                }
            }
        }
    ])
    .directive("fretboardClickedNotes", [
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
                    }, function (newVal, oldVal) {
                        if (newVal) {
                            var jQueryFretboardElement = fretboardCtrl.jQueryFretboardElement,
                                jQueryFretboard = fretboardCtrl.jQueryFretboard;

                            // Updating the controller
                            jQueryFretboardElement.on("notesClicked", function() {
                                $rootScope.$safeApply(function() {
                                    ngModelCtrl.$setViewValue(jQueryFretboard.getClickedNotes());
                                });
                            });

                            ngModelCtrl.$render = function() {
                                var newNotes = ngModelCtrl.$viewValue;

                                // will trigger notesCleared event
                                jQueryFretboard.clearClickedNotes();

                                if (!newNotes) {
                                    return;
                                }

                                jQueryFretboard.setClickedNotes(newNotes);
                            }
                        }
                    });
                }
            }
        }
    ]);

