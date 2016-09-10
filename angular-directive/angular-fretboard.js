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
                controller: ["$scope", "$element", "$rootScope", function ($scope, $element, $rootScope) {
                    var ctrl = this;
                    ctrl.innerDirectiveChanged = false;

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
                        var configCopy = angular.copy($scope.config);
                        delete configCopy.onClickedNotesChange;

                        $element.attr("id", getUniqueDomIdForFretboard()).fretboard(configCopy);
                        ctrl.jQueryFretboardApi = $element.data('api');
                    }

                    function destroy() {
                        if (ctrl.jQueryFretboardApi) {
                            ctrl.jQueryFretboardApi.destroy();
                            ctrl.jQueryFretboardApi = null;
                        }
                    }

                    function getUniqueDomIdForFretboard() {
                        return "fretboardjs-" + ++fretboardsGeneratedCounter;
                    }
                }],
                // The inner directives each have their own ngModel which handle two-way data-binding for a single config property.
                template:
                    '<span ng-if="config" fretboard-tuning ng-model="config.tuning"></span>' +
                    '<span ng-if="config" fretboard-num-frets ng-model="config.numFrets"></span>' +
                    '<span ng-if="config" fretboard-is-chord-mode ng-model="config.isChordMode"></span>' +
                    '<span ng-if="config" fretboard-note-clicking-is-disabled ng-model="config.noteClickingDisabled"></span>' +
                    '<span ng-if="config" fretboard-note-mode ng-model="config.noteMode"></span>' +
                    '<span ng-if="config" fretboard-interval-settings ng-model="config.intervalSettings"></span>' +
                    '<span ng-if="config" fretboard-all-note-letters ng-model="config.allNoteLetters"></span>' +
                    '<span ng-if="config" fretboard-animation-speed ng-model="config.animationSpeed"></span>' +
                    '<span ng-if="config" fretboard-note-circle-list ng-model="config.noteCircleList"></span>' +
                    '<span ng-if="config" fretboard-clicked-notes ng-model="config.clickedNotes"></span>'

            }
        }])
        .directive("fretboardTuning", ["$rootScope", function ($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1],
                        isFirst = true;

                    ngModelCtrl.$render = function () {
                        if (isUndefinedOrNull(ngModelCtrl.$viewValue) && isFirst) {
                            $rootScope.$safeApply(function () {
                                ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboardApi.getTuning());
                            });
                            isFirst = false;
                        } else {
                            fretboardCtrl.innerDirectiveChanged = true;
                            fretboardCtrl.jQueryFretboardApi.setTuning(ngModelCtrl.$viewValue);
                        }
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
                        fretboardCtrl = ctrls[1],
                        isFirst = true;

                    ngModelCtrl.$render = function () {
                        if (isUndefinedOrNull(ngModelCtrl.$viewValue) && isFirst) {
                            $rootScope.$safeApply(function () {
                                ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboardApi.getNumFrets());
                            });
                            isFirst = false;
                        } else {
                            fretboardCtrl.innerDirectiveChanged = true;
                            fretboardCtrl.jQueryFretboardApi.setNumFrets(ngModelCtrl.$viewValue);
                        }
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
                        fretboardCtrl = ctrls[1],
                        isFirst = true;

                    ngModelCtrl.$render = function () {
                        if (isUndefinedOrNull(ngModelCtrl.$viewValue) && isFirst) {
                            $rootScope.$safeApply(function () {
                                ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboardApi.getChordMode());
                            });
                            isFirst = false;
                        } else {
                            fretboardCtrl.jQueryFretboardApi.setChordMode(ngModelCtrl.$viewValue);
                            fretboardCtrl.innerDirectiveChanged = true;
                        }
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
                        fretboardCtrl = ctrls[1],
                        isFirst = true;

                    ngModelCtrl.$render = function () {
                        if (isUndefinedOrNull(ngModelCtrl.$viewValue) && isFirst) {
                            $rootScope.$safeApply(function () {
                                ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboardApi.getNoteClickingDisabled());
                            });
                            isFirst = false;
                        } else {
                            fretboardCtrl.jQueryFretboardApi.setNoteClickingDisabled(ngModelCtrl.$viewValue);
                            fretboardCtrl.innerDirectiveChanged = true;
                        }
                    };
                }
            }
        }])
        .directive("fretboardNoteMode", ["$rootScope", function ($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1],
                        isFirst = true;

                    ngModelCtrl.$render = function () {
                        if (isUndefinedOrNull(ngModelCtrl.$viewValue) && isFirst) {
                            $rootScope.$safeApply(function () {
                                ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboardApi.getNoteMode());
                            });
                            isFirst = false;
                        } else {
                            fretboardCtrl.jQueryFretboardApi.setNoteMode(ngModelCtrl.$viewValue);
                            fretboardCtrl.innerDirectiveChanged = true;
                        }
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
                        fretboardCtrl = ctrls[1],
                        isFirst = true;

                    ngModelCtrl.$render = function () {
                        if (isUndefinedOrNull(ngModelCtrl.$viewValue) && isFirst) {
                            $rootScope.$safeApply(function () {
                                ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboardApi.getIntervalSettings());
                            });
                            isFirst = false;
                        } else {
                            fretboardCtrl.jQueryFretboardApi.setIntervalSettings(ngModelCtrl.$viewValue);
                            fretboardCtrl.innerDirectiveChanged = true;
                        }
                    };
                }
            }
        }])
        .directive("fretboardAllNoteLetters", ["$rootScope", function ($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    $rootScope.$safeApply(function () {
                        ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboardApi.getAllNoteLetters());
                    });
                }
            }
        }])
        .directive("fretboardAnimationSpeed", ["$rootScope", function ($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    $rootScope.$safeApply(function () {
                        ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboardApi.getAnimationSpeed());
                    });
                }
            }
        }])
        .directive("fretboardNoteCircleList", ["$rootScope", function ($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1];

                    $rootScope.$safeApply(function () {
                        ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboardApi.getNoteCircles());
                    });
                }
            }
        }])
        .directive("fretboardClickedNotes", ["$rootScope", function ($rootScope) {
            return {
                restrict: "AE",
                require: ["ngModel", "^fretboard"],
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0],
                        fretboardCtrl = ctrls[1],
                        isFirst = true;

                    // Set the callbacks in the correct order so the parent scope is always up to date.
                    fretboardCtrl.jQueryFretboardApi.addNotesClickedListener(function () {
                        $rootScope.$safeApply(function () {
                            ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboardApi.getClickedNotes());
                        });
                    });

                    if (fretboardCtrl.originalOnClickedNotesChange) {
                        for (var i = 0; i < fretboardCtrl.originalOnClickedNotesChange.length; i++) {
                            (function (i) {
                                fretboardCtrl.jQueryFretboardApi.addNotesClickedListener(function () {
                                    $rootScope.$safeApply(function () {
                                        fretboardCtrl.originalOnClickedNotesChange[i]();
                                    });
                                });
                            })(i);
                        }
                    }

                    ngModelCtrl.$render = function () {
                        var clickedNotes = ngModelCtrl.$viewValue || [];
                        fretboardCtrl.jQueryFretboardApi.clearClickedNotes();
                        fretboardCtrl.jQueryFretboardApi.setClickedNotes(clickedNotes);
                        // The jQuery plugin has more information about the notes (letter, intervalInfo)
                        // so we push the clickedNotes that have more info onto the controller.
                        $rootScope.$safeApply(function () {
                            ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboardApi.getClickedNotes());
                        });
                    };

                    scope.$watch(function () {
                        return fretboardCtrl.innerDirectiveChanged;
                    }, function (newVal, oldVal) {
                        if (newVal) {
                            $rootScope.$safeApply(function () {
                                ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboardApi.getClickedNotes());
                                fretboardCtrl.innerDirectiveChanged = false;
                            });
                        }
                    });
                }
            }
        }]);

    function isUndefinedOrNull(val) {
        return angular.isUndefined(val) || val === null;
    }
})();