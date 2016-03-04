"use strict";

angular.isUndefinedOrNull = function (val) {
    return angular.isUndefined(val) || val === null;
};

angular.module("angularFretboard", ['Scope.safeApply'])
    .directive("fretboard", [
        function () {
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
                    function ($scope, $element, $attrs) {
                        var ctrl = this;

                        $scope.$on('$destroy', function () {
                            destroy(ctrl);
                        });

                        $scope.$watch(function () {
                            return $scope.config;
                        }, function (newVal, oldVal) {
                            if (newVal) {
                                initialize($scope.config, $element, ctrl);

                                $scope.$watch(function () {
                                    return $scope.config && $scope.config.noteClickingDisabled;
                                }, function (newVal, oldVal) {
                                    if (angular.isUndefinedOrNull(newVal)) {
                                        return;
                                    }

                                    ctrl.jQueryFretboard.setNoteClickingDisabled(newVal);
                                });

                                $scope.$watch(function () {
                                    return $scope.config && $scope.config.isChordMode;
                                }, function (newVal, oldVal) {
                                    if (angular.isUndefinedOrNull(newVal)) {
                                        return;
                                    }

                                    ctrl.jQueryFretboard.setChordMode(newVal);
                                });

                                $scope.$watch(function () {
                                    return $scope.config && $scope.config.numFrets;
                                }, function (newVal, oldVal) {
                                    if (angular.isUndefinedOrNull(newVal)) {
                                        return;
                                    }

                                    ctrl.jQueryFretboard.setNumFrets(newVal);
                                });

                                $scope.$watch(function () {
                                    return $scope.config && $scope.config.noteMode;
                                }, function (newVal, oldVal) {
                                    if (angular.isUndefinedOrNull(newVal)) {
                                        return;
                                    }

                                    ctrl.jQueryFretboard.setNoteMode(newVal);
                                });

                                $scope.$watch(function () {
                                    return $scope.config && $scope.config.tuning;
                                }, function (newVal, oldVal) {
                                    if (angular.isUndefinedOrNull(newVal)) {
                                        return;
                                    }

                                    ctrl.jQueryFretboard.setTuning(newVal);
                                });

                                // If we ever do setIntervalSettings, setNoteLetters, etc. it could go here
                            } else {
                                destroy(ctrl);
                            }
                        });

                    }
                ],
                // we create inner directives so they can each have their own ngModel, 
                // which handles two-way data-binding for only one thing 
                template:
                    '<span fretboard-clicked-notes ng-model="config.clickedNotes"></span>'
            }

            function initialize(config, element, ctrl) {
                var domId = getUniqueDomIdForFretboard();
                element.attr("id", domId).fretboard(config);

                //ctrl.jQueryFretboardElement = element;
                ctrl.jQueryFretboard = element.data('fretboard');
            }

            function destroy(ctrl) {
                if (ctrl.jQueryFretboard) {
                    ctrl.jQueryFretboard.destroy();
                    ctrl.jQueryFretboard = null;
                    //ctrl.jQueryFretboardElement = null;
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
    .directive("fretboardClickedNotes", [
        "$rootScope",
        function ($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    scope.$watch(function () {
                        return fretboardCtrl.jQueryFretboard;
                    }, function (newVal, oldVal) {
                        if (newVal) {
                            // var  jQueryFretboardElement = fretboardCtrl.jQueryFretboardElement,
                            var jQueryFretboard = fretboardCtrl.jQueryFretboard;

                            // Updating the controller
                            //jQueryFretboardElement.on("noteClicked", function () {
                            //    $rootScope.$safeApply(function () {
                            //        ngModelCtrl.$setViewValue(jQueryFretboard.getClickedNotes());
                            //    });
                            

                            ngModelCtrl.$render = function () {
                                var newNotes = ngModelCtrl.$viewValue;

                                jQueryFretboard.clearClickedNotes();

                                if (!newNotes) {
                                    return;
                                }

                                jQueryFretboard.setClickedNotes(newNotes);

                                // Updating the controller, in case some notes we are trying
                                // to set don't actually get set
                                $rootScope.$safeApply(function () {
                                    ngModelCtrl.$setViewValue(jQueryFretboard.getClickedNotes());
                                });
                            }
                        }
                    });
                }
            }
        }
    

