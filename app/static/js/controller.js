myApp.controller('appCtrl',
	['$scope', '$location', 'AuthService', '$http', '$modal',
	function($scope, $location, AuthService, $http, $modal){
		$scope.home = {};
		$scope.home.title = '';
		$scope.$on('$stateChangeStart', function (event, next){
			$scope.home.title = '';
			if(AuthService.isAuth()){
				$scope.isAuth = true;
			}else{
				$scope.isAuth = false;
			}
		});
		$scope.openLogin = function(){
			var modalInstance = $modal.open({
				animation: true,
				templateUrl: 'loginModal.html',
				controller: 'loginCtrl',
				size: 'sm'
			});
			
			modalInstance.result.then(function(result){
				if(result === 'login success'){
					$scope.isAuth = result;
				}else if(result === 'open register'){
					$scope.openRegister();
				}
			}, function(error){
				console.log('error: '+error);
			});
		};
		
		$scope.openRegister = function(){
			var modalInstance = $modal.open({
				animation: true,
				templateUrl: 'registerModal.html',
				controller: 'registerCtrl',
				size: 'sm'
			});
			modalInstance.result.then(function(result){
				if(result === 'open login'){
					$scope.openLogin();
				}
			}, function(error){
				console.log('error: '+error);
			});
		};
		
		$scope.$on('sign_in', function(e, d){
			$scope.isAuth = d;
		});
		
		$scope.$on('token timeout', function(e,d){
			$scope.isAuth = d;
			$scope.openLogin();
		});
	}]);

myApp.controller('loginCtrl',
	['$scope', '$state', 'AuthService', '$modalInstance', '$modal',
	function($scope, $state, AuthService, $modalInstance, $modal){
		$scope.isLogin = false;
		$scope.login = function(){
			if ($scope.loginForm.$valid) {
			  $scope.error = false;
			  $scope.disabled = true;
			  AuthService.login($scope.user)
				.then(function(){
					$modalInstance.close('login success');
					$state.go('home');
					$scope.disabled = false;
					$scope.user = {};
				})
				.catch(function(){
					$scope.error = true;
					$scope.errorMessage = "Invalid username or password";
					$scope.disabled = false;
				});
			}
		};
		
		$scope.openRegister = function(){
			$modalInstance.close('open register');
		};
	}]);

myApp.controller('logoutCtrl',
	['$scope', '$state', 'AuthService',
	function($scope, $state, AuthService){
		AuthService.logout();
		$scope.$emit('sign_in', false);
		$state.go('home');
	}]);

myApp.controller('registerCtrl',
	['$scope', '$location', 'User', '$modalInstance', '$modal',
	function($scope, $location, User, $modalInstance, $modal){
		$scope.register = function(){
			if ($scope.registerForm.$valid) {
				$scope.error = false;
				$scope.disabled = true;

				User.create($scope.user).then(function(data){
					$modalInstance.close('open login');
					$location.path('/');
					$scope.disabled = false;
					$scope.user = {};
				}).catch(function(error){
					$scope.error = true;
					$scope.errorMessage = "Something went wrong";
					$scope.disabled = false;
					$scope.user = {};
				});
			}
		};
	}]);

myApp.controller('userCtrl', 
  ['$scope', 'User', 'AuthService', function($scope, User, AuthService){
	$scope.home.title = 'About Me';
  	$scope.show = false;
  	User.get(AuthService.getUserId()).then(function(data){
  		$scope.user = data;
  	});
	
	$scope.updateUser = function(){
		$scope.disabled = true;
		$scope.user.put().then(function(data){
			$scope.show = true;
			$scope.success = true;
			$scope.message = "Submission Successful";
			$scope.disabled = false;
		}).catch(function(error){
			$scope.show = true;
			$scope.success = false;
			$scope.message = "Something wrong";
			$scope.disabled = false;
		});
	};
}]);

myApp.controller('blogCreateCtrl',
  ['$scope', '$location', 'Blog', 'Tag',
  function($scope, $location, Blog, Tag){
	$scope.loadTags = function(query){
		return Tag.get(query);
	};
	$scope.error = false;
	$scope.createBlog = function(){
	  if ($scope.blogForm.$valid) {
		  $scope.disabled = true;
		  Blog.create($scope.blog).then(function(data){
			$location.path('/');
		  }, function(error){
			$scope.error = true;
			$scope.errorMessage = "Something went wrong";
			$scope.disabled = false;
		  });
	   }
	};
}]);

myApp.controller('blogDetailCtrl',
  ['$scope', 'Blog', '$stateParams', 'Comment', 
  	function($scope, Blog, $stateParams, Comment){
	Blog.get($stateParams.blogId).then(function(data){
		$scope.blog = data;
		$scope.home.title = $scope.blog.title;
	});
	Comment.getPage($stateParams.blogId, $stateParams.page=1).then(function(data){
		$scope.paginate = data;
	});
	$scope.addComment = function(){
		if ($scope.commentForm.$valid) {
			Comment.create($scope.blog.id, $scope.detail, $scope.paginate.page)
			.then(function(data){
				$scope.paginate = data;
				$scope.detail = '';
			}, function(error){
				$scope.detail = '';
			});
		}
	};
	$scope.prevComment = function(){
		Comment.getPage($stateParams.blogId, $scope.paginate.prev_num).then(function(data){
			$scope.paginate = data;
		});
	};
	$scope.nextComment = function(){
		Comment.getPage($stateParams.blogId, $scope.paginate.next_num).then(function(data){
			$scope.paginate = data;
		});
	};
}]);

myApp.controller('blogAllListCtrl',
  ['$scope', 'Blog', '$stateParams', '$state', 
  	function($scope, Blog, $stateParams, $state){
	var page = $stateParams.page?$stateParams.page:1;
	Blog.getPage(page).then(function(result){
		$scope.paginate = result;
	});
	$scope.prevBlog = function(prevNum){
		$state.go('blog.page',{ 'page':prevNum });
	};
	$scope.nextBlog = function(nextNum){
		$state.go('blog.page',{ 'page':nextNum });
	};
}]);

myApp.controller('userBlogCtrl',
  ['$scope', 'User', '$stateParams', 'AuthService', '$state', 
  	function($scope, User, $stateParams, AuthService, $state){
	var page = $stateParams.page?$stateParams.page:1;
	var userId = $stateParams.userId?$stateParams.userId:AuthService.getUserId();
	User.getBlogs(userId,page).then(function(result){
		$scope.paginate = result;
		$scope.home.title = 'Hello, I am '+$scope.paginate.items[0].author;
	});
	$scope.prevBlog= function(prevNum){
		$state.go('user-blogs',{ 'page':prevNum });
	};
	$scope.nextBlog = function(nextNum){
		$state.go('user-blogs',{ 'page':nextNum });
	};
}]);

myApp.controller('tagBlogCtrl',
  ['$scope', 'Tag', '$stateParams', 'AuthService', '$state', 
  	function($scope, Tag, $stateParams, AuthService, $state){
	var page = $stateParams.page?$stateParams.page:1;
	Tag.getBlogs($stateParams.tag,page).then(function(result){
		$scope.paginate = result;
	});
	$scope.prevBlog = function(prevNum){
		$state.go('tag-blogs',{ 'page':prevNum });
	};
	$scope.nextBlog = function(nextNum){
		$state.go('tag-blogs',{ 'page':nextNum });
	};
}]);