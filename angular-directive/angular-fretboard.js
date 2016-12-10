(function () {
    "use strict";

    angular.module("angularFretboard", [])
        .directive("fretboard", fretboard)
        .directive("tuning", ["twoWayDataBindingHelper", tuning])
        .directive("numFrets", ["twoWayDataBindingHelper", numFrets])
        .directive("isChordMode", ["twoWayDataBindingHelper", isChordMode])
        .directive("noteClickingDisabled", ["twoWayDataBindingHelper", noteClickingDisabled])
        .directive("noteMode", ["twoWayDataBindingHelper", noteMode])
        .directive("intervalSettings", ["twoWayDataBindingHelper", intervalSettings])
        .directive("allNoteLetters", allNoteLetters)
        .directive("animationSpeed", animationSpeed)
        .directive("noteCircleList", noteCircleList)
        .directive("clickedNotes", clickedNotes)
        .factory("twoWayDataBindingHelper", twoWayDataBindingHelper);

    function twoWayDataBindingHelper() {
        function bind(ngModelCtrl, viewValueFn, fretboardCtrl, renderFn, scope) {
            var isFirst = true;

            ngModelCtrl.$render = render;

            function render() {
                if (isFirst) {
                    if (isUndefinedOrNull(ngModelCtrl.$viewValue)) {
                        scope.$evalAsync(function () {
                            ngModelCtrl.$setViewValue(viewValueFn());
                        });
                    }
                    isFirst = false;
                } else {
                    scope.$evalAsync(function () {
                        fretboardCtrl.clickedNotesModelNeedsUpdate = true;
                    });
                    renderFn(ngModelCtrl.$viewValue);
                }
            };
        }

        return {
            bind: bind
        };
    }

    function fretboard() {
        return {
            restrict: "AE",
            scope: {
                config: "=fretboardConfig"
            },
            controller: ["$scope", "$element", fretboardController],
            // The inner directives each have their own ngModel which handle two-way data-binding for a single config property.
            template:
            "<span ng-if='config' tuning ng-model='config.tuning'></span>" +
            "<span ng-if='config' num-frets ng-model='config.numFrets'></span>" +
            "<span ng-if='config' is-chord-mode ng-model='config.isChordMode'></span>" +
            "<span ng-if='config' note-clicking-disabled ng-model='config.noteClickingDisabled'></span>" +
            "<span ng-if='config' note-mode ng-model='config.noteMode'></span>" +
            "<span ng-if='config' interval-settings ng-model='config.intervalSettings'></span>" +
            "<span ng-if='config' all-note-letters ng-model='config.allNoteLetters'></span>" +
            "<span ng-if='config' animation-speed ng-model='config.animationSpeed'></span>" +
            "<span ng-if='config' note-circle-list ng-model='config.noteCircleList'></span>" +
            "<span ng-if='config' clicked-notes ng-model='config.clickedNotes'></span>"
        }

        function fretboardController($scope, $element) {
            var ctrl = this;
            ctrl.clickedNotesModelNeedsUpdate = false;

            $scope.$on("$destroy", function () {
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
                // When a user clicks a note, we need to ensure that the clicked notes on the parent 
                // scope are updated before the clicked note callbacks are invoked. So we delete the 
                // clicked note callbacks from the config here so the plugin cannot invoke them. We 
                // hand the callbacks to the clickedNotes directive, which will first update 
                // the clicked notes on the parent scope and then invoke the callbacks.
                ctrl.onClickedNotesChange = $scope.config.onClickedNotesChange;

                var configCopy = angular.copy($scope.config);
                delete configCopy.onClickedNotesChange;
                $element.fretboard(configCopy);

                ctrl.jQueryFretboardApi = $element.data("api");
            }

            function destroy() {
                if (ctrl.jQueryFretboardApi) {
                    ctrl.jQueryFretboardApi.destroy();
                    ctrl.jQueryFretboardApi = null;
                }
            }
        }
    }

    function tuning(twoWayDataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                twoWayDataBindingHelper.bind(
                    ngModelCtrl,
                    fretboardCtrl.jQueryFretboardApi.getTuning,
                    fretboardCtrl,
                    fretboardCtrl.jQueryFretboardApi.setTuning,
                    scope
                );
            }
        }
    }

    function numFrets(twoWayDataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                twoWayDataBindingHelper.bind(
                    ngModelCtrl,
                    fretboardCtrl.jQueryFretboardApi.getNumFrets,
                    fretboardCtrl,
                    fretboardCtrl.jQueryFretboardApi.setNumFrets,
                    scope
                );
            }
        }
    }

    function isChordMode(twoWayDataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                twoWayDataBindingHelper.bind(
                    ngModelCtrl,
                    fretboardCtrl.jQueryFretboardApi.getChordMode,
                    fretboardCtrl,
                    fretboardCtrl.jQueryFretboardApi.setChordMode,
                    scope
                );
            }
        }
    }

    function noteClickingDisabled(twoWayDataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                twoWayDataBindingHelper.bind(
                    ngModelCtrl,
                    fretboardCtrl.jQueryFretboardApi.getNoteClickingDisabled,
                    fretboardCtrl,
                    fretboardCtrl.jQueryFretboardApi.setNoteClickingDisabled,
                    scope
                );
            }
        }
    }

    function noteMode(twoWayDataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                twoWayDataBindingHelper.bind(
                    ngModelCtrl,
                    fretboardCtrl.jQueryFretboardApi.getNoteMode,
                    fretboardCtrl,
                    fretboardCtrl.jQueryFretboardApi.setNoteMode,
                    scope
                );
            }
        }
    }

    function intervalSettings(twoWayDataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                twoWayDataBindingHelper.bind(
                    ngModelCtrl,
                    fretboardCtrl.jQueryFretboardApi.getIntervalSettings,
                    fretboardCtrl,
                    fretboardCtrl.jQueryFretboardApi.setIntervalSettings,
                    scope
                );
            }
        }
    }

    function animationSpeed() {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                scope.$evalAsync(function () {
                    ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboardApi.getAnimationSpeed());
                });
            }
        }
    }

    function allNoteLetters() {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                scope.$evalAsync(function () {
                    ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboardApi.getAllNoteLetters());
                });
            }
        }
    }

    function noteCircleList() {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                scope.$evalAsync(function () {
                    ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboardApi.getNoteCircles());
                });
            }
        }
    }

    function clickedNotes() {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: clickedNotesLinkFn
        }

        function clickedNotesLinkFn(scope, element, attrs, ctrls) {
            var ngModelCtrl = ctrls[0];
            var fretboardCtrl = ctrls[1];

            fretboardCtrl.jQueryFretboardApi.addNotesClickedListener(function () {
                scope.$evalAsync(function () {
                    fretboardCtrl.clickedNotesModelNeedsUpdate = true;
                });
            });

            ngModelCtrl.$render = function () {
                var clickedNotes = ngModelCtrl.$viewValue || [];

                fretboardCtrl.jQueryFretboardApi.clearClickedNotes();
                fretboardCtrl.jQueryFretboardApi.setClickedNotes(clickedNotes);

                scope.$evalAsync(function () {
                    fretboardCtrl.clickedNotesModelNeedsUpdate = true;
                });
            };

            scope.$watch(function () {
                return fretboardCtrl.clickedNotesModelNeedsUpdate;
            }, function (newVal, oldVal) {
                if (!newVal) return;

                scope.$evalAsync(function () {
                    fretboardCtrl.clickedNotesModelNeedsUpdate = false;
                    // Set the callbacks in the correct order so the parent scope is always up to date.
                    // First the new clicked notes get pushed up.
                    ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboardApi.getClickedNotes());
                    // Then we invoke the callbacks.
                    invokeFns(fretboardCtrl.onClickedNotesChange);
                });
            });
        }

        function invokeFns(fns) {
            if (!fns) return;

            for (var i = 0; i < fns.length; i++) {
                if (!angular.isFunction(fns[i])) continue;

                fns[i]();
            }
        }
    }

    function isUndefinedOrNull(val) {
        return angular.isUndefined(val) || val === null;
    }
})();