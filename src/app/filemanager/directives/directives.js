(function(angular) {
    'use strict';
    var app = angular.module('dctmNgFileManager');

    app.directive('ngFile', ['$parse', function($parse) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var model = $parse(attrs.ngFile);
                var modelSetter = model.assign;

                element.bind('change', function() {
                    scope.$apply(function() {
                        modelSetter(scope, element[0].files);
                    });
                });
            }
        };
    }]);

    app.directive('ngRightClick', ['$parse', function($parse) {
        return function(scope, element, attrs) {
            console.log(attrs.ngRightClick)

/*
scope is an AngularJS scope object.
element is the jqLite-wrapped element that this directive matches.
attrs is a hash object with key-value pairs of normalized attribute names and their corresponding attribute values.
*/
            var fn = $parse(attrs.ngRightClick);
            element.bind('contextmenu', function(event) {
                console.log('RIGHT CLICK2');
                scope.$apply(function() {
                    event.preventDefault();
                    fn(scope, {$event: event});
                });
            });
        };
    }]);
    
})(angular);
