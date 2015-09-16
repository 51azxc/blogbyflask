myApp.directive('nameUnique', 
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

myApp.directive('passwordMatch', [function(){
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
					/**
					 * This function is added to the list of the $parsers.
					 * It will be executed the DOM (the view value) change.
					 * Array.unshift() put it in the beginning of the list, so
					 * it will be executed before all the other
					 */
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