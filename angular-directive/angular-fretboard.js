(function () {
    "use strict";

    angular.module("angularFretboard", [])
        .directive("fretboard", fretboard)
        .directive("tuning", ["dataBindingHelper", tuning])
        .directive("numFrets", ["dataBindingHelper", numFrets])
        .directive("isChordMode", ["dataBindingHelper", isChordMode])
        .directive("noteClickingDisabled", ["dataBindingHelper", noteClickingDisabled])
        .directive("noteMode", ["dataBindingHelper", noteMode])
        .directive("intervalSettings", ["dataBindingHelper", intervalSettings])
        .directive("allNoteLetters", ["dataBindingHelper", allNoteLetters])
        .directive("animationSpeed", ["dataBindingHelper", animationSpeed])
        .directive("noteCircles", ["dataBindingHelper", noteCircles])
        .directive("notesClickedCallbacks", ["dataBindingHelper", notesClickedCallbacks])
        .directive("clickedNotes", ["dataBindingHelper", clickedNotes])
        .factory("dataBindingHelper", ["$rootScope", dataBindingHelper]);

    function dataBindingHelper($rootScope) {
        function bind(ngModelCtrl, getFn, setFn, renderFirst) {
            var isFirst = true;

            ngModelCtrl.$render = render;

            function render() {
                if (shouldCallRender()) {
                    setFn(ngModelCtrl.$viewValue);
                }

                $rootScope.$evalAsync(function () {
                    ngModelCtrl.$setViewValue(getFn());
                });
            }

            function shouldCallRender() {
                return !isFirst || (renderFirst && !isUndefinedOrNull(ngModelCtrl.$viewValue));
            }
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
            // The inner directives each have their own ngModel which handle 
            // two-way data-binding for a single config property.
            template:
            "<span ng-if='config' tuning ng-model='config.tuning'></span>" +
            "<span ng-if='config' num-frets ng-model='config.numFrets'></span>" +
            "<span ng-if='config' is-chord-mode ng-model='config.isChordMode'></span>" +
            "<span ng-if='config' note-clicking-disabled ng-model='config.noteClickingDisabled'></span>" +
            "<span ng-if='config' note-mode ng-model='config.noteMode'></span>" +
            "<span ng-if='config' interval-settings ng-model='config.intervalSettings'></span>" +
            "<span ng-if='config' all-note-letters ng-model='config.allNoteLetters'></span>" +
            "<span ng-if='config' animation-speed ng-model='config.animationSpeed'></span>" +
            "<span ng-if='config' note-circles ng-model='config.noteCircles'></span>" +
            "<span ng-if='config' notes-clicked-callbacks ng-model='config.notesClickedCallbacks'></span>" +
            // This must come last so that its $render method is created after all others.
            "<span ng-if='config' clicked-notes ng-model='config.clickedNotes' ng-change='ctrl.invokeNotesClickedCallbacks()'></span>"
        };

        function fretboardController($scope, $element) {
            var ctrl = $scope.ctrl = this;

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
                ctrl.invokeNotesClickedCallbacks = invokeNotesClickedCallbacks;

                // When a user clicks a note, we need to ensure that the clicked notes
                // on the parent scope are updated before the clicked note callbacks 
                // are invoked. So we delete the clicked note callbacks from the 
                // config here so the plugin cannot invoke them. We use ng-model on 
                // the clicked-notes directive to invoke the callbacks when the 
                // clicked notes have been updated.
                ctrl.notesClickedCallbacks = $scope.config.notesClickedCallbacks || [];

                var configCopy = angular.copy($scope.config);
                delete configCopy.notesClickedCallbacks;
                $element.fretboard(configCopy);

                ctrl.jQueryFretboardApi = $element.data("api");
            }

            function destroy() {
                if (ctrl.jQueryFretboardApi) {
                    ctrl.jQueryFretboardApi.destroy();
                    ctrl.jQueryFretboardApi = null;
                }
            }

            function invokeNotesClickedCallbacks() {
                for (var i = 0; i < ctrl.notesClickedCallbacks.length; i++) {
                    ctrl.notesClickedCallbacks[i]();
                }
            }
        }
    }

    function tuning(dataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                dataBindingHelper.bind(
                    ngModelCtrl,
                    fretboardCtrl.jQueryFretboardApi.getTuning,
                    setFn
                );

                function setFn($viewValue) {
                    fretboardCtrl.jQueryFretboardApi.setTuning($viewValue);
                    fretboardCtrl.scheduleClickedNotesUpdate();
                }
            }
        };
    }

    function numFrets(dataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                dataBindingHelper.bind(
                    ngModelCtrl,
                    fretboardCtrl.jQueryFretboardApi.getNumFrets,
                    setFn
                );

                function setFn($viewValue) {
                    fretboardCtrl.jQueryFretboardApi.setNumFrets($viewValue);
                    fretboardCtrl.scheduleClickedNotesUpdate();
                }
            }
        };
    }

    function isChordMode(dataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                dataBindingHelper.bind(
                    ngModelCtrl,
                    fretboardCtrl.jQueryFretboardApi.getChordMode,
                    setFn
                );

                function setFn($viewValue) {
                    fretboardCtrl.jQueryFretboardApi.setChordMode($viewValue);
                    fretboardCtrl.scheduleClickedNotesUpdate();
                }
            }
        };
    }

    function noteClickingDisabled(dataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                dataBindingHelper.bind(
                    ngModelCtrl,
                    fretboardCtrl.jQueryFretboardApi.getNoteClickingDisabled,
                    fretboardCtrl.jQueryFretboardApi.setNoteClickingDisabled
                );
            }
        };
    }

    function noteMode(dataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                dataBindingHelper.bind(
                    ngModelCtrl,
                    fretboardCtrl.jQueryFretboardApi.getNoteMode,
                    setFn
                );

                function setFn($viewValue) {
                    fretboardCtrl.jQueryFretboardApi.setNoteMode($viewValue);
                    fretboardCtrl.scheduleClickedNotesUpdate();
                }
            }
        };
    }

    function intervalSettings(dataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                dataBindingHelper.bind(
                    ngModelCtrl,
                    fretboardCtrl.jQueryFretboardApi.getIntervalSettings,
                    setFn
                );

                function setFn($viewValue) {
                    fretboardCtrl.jQueryFretboardApi.setIntervalSettings($viewValue);
                    fretboardCtrl.scheduleClickedNotesUpdate();
                }

            }
        };
    }

    function animationSpeed(dataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                dataBindingHelper.bind(
                    ngModelCtrl,
                    fretboardCtrl.jQueryFretboardApi.getAnimationSpeed
                );
            }
        };
    }

    function allNoteLetters(dataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                dataBindingHelper.bind(
                    ngModelCtrl,
                    fretboardCtrl.jQueryFretboardApi.getAllNoteLetters
                );
            }
        };
    }

    function noteCircles(dataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                dataBindingHelper.bind(
                    ngModelCtrl,
                    fretboardCtrl.jQueryFretboardApi.getNoteCircles
                );
            }
        };
    }

    function notesClickedCallbacks(dataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                dataBindingHelper.bind(
                    ngModelCtrl,
                    getFn,
                    setFn
                );

                function getFn() {
                    return fretboardCtrl.notesClickedCallbacks;
                }

                function setFn($viewValue) {
                    fretboardCtrl.notesClickedCallbacks = $viewValue;
                }
            }
        };
    }

    function clickedNotes(dataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: clickedNotesLinkFn
        };

        function clickedNotesLinkFn(scope, element, attrs, ctrls) {
            var ngModelCtrl = ctrls[0];
            var fretboardCtrl = ctrls[1];
            var isScheduled = false;

            fretboardCtrl.scheduleClickedNotesUpdate = scheduleClickedNotesUpdate;
            fretboardCtrl.jQueryFretboardApi.addNotesClickedCallback(scheduleClickedNotesUpdate);

            dataBindingHelper.bind(
                ngModelCtrl,
                fretboardCtrl.jQueryFretboardApi.getClickedNotes,
                setFn,
                true
            );

            function setFn($viewValue) {
                fretboardCtrl.jQueryFretboardApi.clearClickedNotes();
                fretboardCtrl.jQueryFretboardApi.setClickedNotes($viewValue);
                scheduleClickedNotesUpdate();
            };

            function scheduleClickedNotesUpdate() {
                if (isScheduled) return;

                isScheduled = true;

                scope.$evalAsync(function () {
                    // This must run after other aspects of the fretboard are modified
                    // (tuning, numFrets, clickedNotes) ensuring that all other 
                    // properties (tuning, numFrets, etc.) are updated before 
                    // clickedNotes are updated.
                    ngModelCtrl.$setViewValue(fretboardCtrl.jQueryFretboardApi.getClickedNotes());
                    isScheduled = false;
                });
            }
        }
    }

    function isUndefinedOrNull(val) {
        return angular.isUndefined(val) || val === null;
    }
})();