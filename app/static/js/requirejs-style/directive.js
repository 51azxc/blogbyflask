define(['app'], function(app) {
    'use strict';
    app.directive('nameUnique', 
        ['$http', '$timeout', function($http, $timeout){
            var checking = null;
            return {
                require: 'ngModel',
                link: function(scope, elem,attrs, ctrl){
                    scope.$watch(attrs.ngModel, function(newVal){
                        if(!checking){
                            checking = $timeout(function(){
                                $http.post('/check', {'name': newVal ? newVal:''}).then(
                                    function(response){
                                        ctrl.$setValidity('unique', response.data.isUnique == '0');
                                        checking = null;
                                    }, function(error){
                                        checking = null;
                                    }
                                );
                            }, 500);
                        }
                    });
                }
            };
    }]);

    app.directive('passwordMatch', [function(){
        return {
            restrict: 'A',
            scope: { 
                passwordMatch: '=' 
            },
            require: 'ngModel',
            link: function(scope, elem, attrs, ctrl){
                scope.$watch(function(){
                    var combined;
                    if(scope.passwordMatch || ctrl.$viewValue){
                        combined = scope.passwordMatch + '_' + ctrl.$viewValue;
                    }
                    return combined;
                }, function(value){
                    if(value){
                        ctrl.$parsers.unshift(function(viewValue){
                            var origin = scope.passwordMatch;
                            if (origin != viewValue){
                                ctrl.$setValidity('match', false);
                                return undefined;
                            }else{
                                ctrl.$setValidity('match', true);
                                return viewValue;
                            }
                        });
                    }
                });
            }
        };
    }]);
});