define(['app'], function(app){
	return app.run(['$rootScope', '$location', '$state', '$stateParams', 'AuthService', 'Restangular',
		function($rootScope, $location, $state, $stateParams, AuthService, Restangular){
			$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
				if (toState.data.requireLogin && AuthService.isAuth() === false) {
					$location.path('/');
					$rootScope.$broadcast('token timeout');
				};
			});
			Restangular.addFullRequestInterceptor(function(headers, params, element, httpConfig){
				if(!headers){
					headers = { 'Authorization': 'Basic ' + btoa(AuthService.getToken() + ':unused') };
				}
				headers['Authorization'] = 'Basic ' + btoa(AuthService.getToken() + ':unused');
				return { headers: headers };
			});
			Restangular.setErrorInterceptor(function(response, deferred, responseHandler){
				if (response.status == 401) {
					AuthService.logout();
					$location.path('/');
					alert('token invalid,please sign in');
					$rootScope.$broadcast('token timeout');
					return false;
				}
				return true;
			});
		}])
		.config(function($stateProvider, $urlRouterProvider){
			$urlRouterProvider.otherwise('/');
			$stateProvider
				.state('home',{
					url: '/',
					templateUrl: '/static/partials/blog.list.html',
					controller: 'blogAllListCtrl',
					data: { requireLogin: false }
				})
				.state('logout',{
					url: '/logout',
					controller: 'logoutCtrl',
					data: { requireLogin: true }
				})
				.state('me',{
					url: '/me',
					templateUrl: '/static/partials/user.html',
					controller: 'userCtrl',
					data: { requireLogin: true }
				})
				.state('blog',{
					abstract: true,
					url: '/blogs',
					template: '<ui-view />'
				})
				.state('blog.create',{
					url: '/create',
					templateUrl: '/static/partials/blog.create.html',
					controller: 'blogCreateCtrl',
					data: { requireLogin: true }
				})
				.state('blog.detail',{
					url: '/detail/:blogId',
					templateUrl: '/static/partials/blog.detail.html',
					controller: 'blogDetailCtrl',
					data: { requireLogin: false }
				})
				.state('blog.page',{
					url: '/page/:page',
					templateUrl: '/static/partials/blog.list.html',
					controller: 'blogAllListCtrl',
					data: { requireLogin: false }
				})
				.state('user-blogs',{
					url: '/user/:userId/blogs/page/:page',
					templateUrl: '/static/partials/blog.list.html',
					controller: 'userBlogCtrl',
					data: { requireLogin: false }
				})
				.state('tag-blogs',{
					url: '/tag/:tag/blogs/page/:page',
					templateUrl: '/static/partials/blog.list.html',
					controller: 'tagBlogCtrl',
					data: { requireLogin: false }
				});
		});
});