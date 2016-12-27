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
        .directive("dimensionsFunc", ["dataBindingHelper", dimensionsFunc])
        .directive("notesClickedCallbacks", ["dataBindingHelper", notesClickedCallbacks])
        .directive("clickedNotes", ["dataBindingHelper", clickedNotes])
        .factory("dataBindingHelper", ["$rootScope", dataBindingHelper]);

    // Data-binding has to be done carefully, so this service helps each directive:
    //
    // - If a config value is undefined during init, we want to fill that in using
    //   info from the plugin (getFn).
    // 
    // - If a config value is defined during init, it will be rendered during init, 
    //   so we should ignore the first call to ngModelCtrl.$render or it will
    //   render again.
    //
    // - Some options on the config are not "true" config options (e.g. 
    //   clickedNotes), so they will not render during init. Thus they are the 
    //   exception to the above rule and will be rendered on init if defined.
    function dataBindingHelper($rootScope) {
        function bind(ngModelCtrl, getFn, setFn, renderOnInitIfDefined) {
            var isFirst$Render = true;

            ngModelCtrl.$render = $render;

            function $render() {
                if (shouldRender()) {
                    render();
                }

                if (shouldUpdateModel()) {
                    updateModel();
                }

                isFirst$Render = false;
            }

            function shouldRender() {
                return setFn && (!isFirst$Render || (renderOnInitIfDefined && !isUndefinedOrNull(ngModelCtrl.$viewValue)));
            }

            function render() {
                setFn(ngModelCtrl.$viewValue);
            }

            function shouldUpdateModel() {
                return isFirst$Render && isUndefinedOrNull(ngModelCtrl.$viewValue);
            }

            function updateModel() {
                $rootScope.$evalAsync(function () {
                    ngModelCtrl.$setViewValue(getFn());
                });
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
                config: "="
            },
            controller: ["$scope", "$element", fretboardController],
            // The inner directives each have their own ngModel which handle two-way
            // data-binding for a single config property.
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
            "<span ng-if='config' dimensions-func ng-model='config.dimensionsFunc'></span>" +
            "<span ng-if='config' notes-clicked-callbacks ng-model='config.notesClickedCallbacks'></span>" +
            // This must come last so that its $render method is created after all others.
            "<span ng-if='config' clicked-notes ng-model='config.clickedNotes' ng-change='ctrl.invokeNotesClickedCallbacks()'></span>"
        };

        function fretboardController($scope, $element) {
            var ctrl = $scope.ctrl = this;

            $scope.$on("$destroy", destroy);

            $scope.$watch(configWatch, onConfigChange);

            function configWatch() {
                return $scope.config;
            }

            function onConfigChange(newVal, oldVal) {
                if (newVal) {
                    initialize();
                } else {
                    handleUndefinedConfig(oldVal)
                }
            }

            function handleUndefinedConfig(oldConfig) {
                if (isUndefinedOrNull(oldConfig)) {
                    throw new Error("The \"config\" object is not defined. Place it on your scope and pass it into the fretboard directive.")
                }

                destroy();
            }

            function initialize() {
                // When a user clicks a note, we need to ensure that the clicked notes on the
                // parent scope are updated before the clicked note callbacks are invoked. So
                // we delete the clicked note callbacks from the config here so the plugin
                // cannot invoke them. We use ng-model and ng-change on the clicked-notes 
                // directive to invoke the callbacks when the clicked notes have been updated.
                ctrl.invokeNotesClickedCallbacks = invokeNotesClickedCallbacks;
                ctrl.notesClickedCallbacks = $scope.config.notesClickedCallbacks;

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
                if (!ctrl.notesClickedCallbacks) {
                    return;
                }

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

                dataBindingHelper.bind(ngModelCtrl, getFn, setFn);

                function getFn() {
                    return fretboardCtrl.jQueryFretboardApi.getTuning();
                }

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

                dataBindingHelper.bind(ngModelCtrl, getFn, setFn);

                function getFn() {
                    return fretboardCtrl.jQueryFretboardApi.getNumFrets();
                }

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

                dataBindingHelper.bind(ngModelCtrl, getFn, setFn);

                function getFn() {
                    return fretboardCtrl.jQueryFretboardApi.getChordMode();
                }

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

                dataBindingHelper.bind(ngModelCtrl, getFn, setFn);

                function getFn() {
                    return fretboardCtrl.jQueryFretboardApi.getNoteClickingDisabled();
                }

                function setFn($viewValue) {
                    return fretboardCtrl.jQueryFretboardApi.setNoteClickingDisabled($viewValue);
                }
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

                dataBindingHelper.bind(ngModelCtrl, getFn, setFn);

                function getFn() {
                    return fretboardCtrl.jQueryFretboardApi.getNoteMode();
                }

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

                dataBindingHelper.bind(ngModelCtrl, getFn, setFn);

                function getFn() {
                    return fretboardCtrl.jQueryFretboardApi.getIntervalSettings();
                }

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

                dataBindingHelper.bind(ngModelCtrl, getFn, setFn);

                function getFn() {
                    return fretboardCtrl.jQueryFretboardApi.getAnimationSpeed();
                }

                function setFn($viewValue) {
                    fretboardCtrl.jQueryFretboardApi.setAnimationSpeed($viewValue);
                }
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

                dataBindingHelper.bind(ngModelCtrl, getFn);

                function getFn() {
                    return fretboardCtrl.jQueryFretboardApi.getAllNoteLetters();
                }
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

                dataBindingHelper.bind(ngModelCtrl, getFn);

                function getFn() {
                    return fretboardCtrl.jQueryFretboardApi.getNoteCircles();
                };
            }
        };
    }

    function dimensionsFunc(dataBindingHelper) {
        return {
            restrict: "AE",
            require: ["ngModel", "^fretboard"],
            link: function (scope, element, attrs, ctrls) {
                var ngModelCtrl = ctrls[0];
                var fretboardCtrl = ctrls[1];

                dataBindingHelper.bind(ngModelCtrl, getFn, setFn);

                function getFn() {
                    return fretboardCtrl.jQueryFretboardApi.getDimensionsFunc();
                }

                function setFn($viewValue) {
                    return fretboardCtrl.jQueryFretboardApi.setDimensionsFunc($viewValue);
                }
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

                dataBindingHelper.bind(ngModelCtrl, getFn, setFn);

                function getFn() {
                    return [];
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

            dataBindingHelper.bind(ngModelCtrl, getFn, setFn, true);

            function getFn() {
                return fretboardCtrl.jQueryFretboardApi.getClickedNotes();
            }

            function setFn($viewValue) {
                fretboardCtrl.jQueryFretboardApi.clearClickedNotes();
                fretboardCtrl.jQueryFretboardApi.setClickedNotes($viewValue);
                scheduleClickedNotesUpdate();
            };

            function scheduleClickedNotesUpdate() {
                if (isScheduled) return;

                isScheduled = true;

                scope.$evalAsync(function () {
                    // This must run after other aspects of the fretboard (tuning, numFrets, etc.) 
                    // are modified because they could change or remove the clicked notes.
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