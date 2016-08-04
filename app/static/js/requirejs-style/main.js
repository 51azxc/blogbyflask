require.config({
    //配置库路径
	paths: {
		'angular': '/static/bower_components/angular/angular',
		'angular-ui-bootstrap': '/static/bower_components/angular-bootstrap/ui-bootstrap-tpls',
		'angular-ui-router': '/static/bower_components/angular-ui-router/release/angular-ui-router',
		'angular-local-storage': '/static/bower_components/angular-local-storage/dist/angular-local-storage',
		'lodash': '/static/bower_components/lodash/dist/lodash',
		'restangular': '/static/bower_components/restangular/dist/restangular',
		'textAngular-rangy': '/static/bower_components/textAngular/dist/textAngular-rangy.min',
		'textAngular-sanitize': '/static/bower_components/textAngular/dist/textAngular-sanitize',
		'textAngular': '/static/bower_components/textAngular/dist/textAngular',
		'textAngularSetup': '/static/bower_components/textAngular/dist/textAngularSetup',
		'ng-tags-input': '/static/bower_components/ng-tags-input/ng-tags-input'
	},
    //导出全局变量
	shim: {
		'angular': {
			exports: 'angular'
		},
		'angular-ui-bootstrap': {
			deps: ['angular'],
			exports: 'angular-ui-bootstrap'
		},
		'angular-ui-router': {
			deps: ['angular'],
			exports: 'angular-ui-router'
		},
		'angular-local-storage': {
			deps: ['angular'],
			exports: 'angular-local-storage'
		},
		'restangular': {
			deps: ['angular','lodash'],
			exports: 'restangular'
		},
		'textAngular': {
			deps: ['angular', 'textAngular-rangy', 'textAngular-sanitize', 'textAngularSetup'],
			exports: 'textAngular'
		},
		'ng-tags-input': {
			deps: ['angular'],
			exports: 'ng-tags-input'
		}
	}
});

//初始化创建ngApp
require(['angular', 'app', 'router', 'controller', 'service', 'directive'], function(angular) {
    angular.bootstrap(document, ['app']);
});