//创建app模块
define('app', ['angular', 'angular-ui-bootstrap', 'angular-ui-router', 'angular-local-storage', 'restangular', 'textAngular', 'ng-tags-input'], 
function(angular){
	'use strict';
	return  angular.module('app', 
	['ui.bootstrap', 'ui.router',  'restangular', 'LocalStorageModule', 'textAngular',  'ngTagsInput']);
});