define(['app'], function(app) {
    'use strict';
    app.factory('AuthHttpService', ['$q', '$timeout', '$http', function($q, $timeout, $http){
        var sendData = function(url, method, username,password, data){
            var deferred = $q.defer();
            var req = {
                method: method,
                url: url,
                data: data,
                headers: {
                    Accept: 'application/json',
                    Authorization: 'Basic ' + btoa(username + ':' + password)
                }
            };
            $timeout(function(){
                $http(req).then(function(response){
                    deferred.resolve(response);
                }, function(response){
                    deferred.reject(response);
                });
            },1000);
            return deferred.promise;
        };
        return {
            'sendData': sendData
        }
    }]);

    app.factory('AuthService',
    ['$q', 'localStorageService', 'AuthHttpService',
    function($q, localStorageService, AuthHttpService){
        
        var login = function(user){
            var deferred = $q.defer();
            AuthHttpService.sendData('/token', 'POST', user.username, user.password, user)
                .then(function(response){
                    if(response.status === 200){
                        setToken(response.data);
                        deferred.resolve();
                    }else{
                        deferred.reject();
                    }
                },function(response){
                    deferred.reject();
                });
            return deferred.promise;
        };

        var logout = function(){
            removeToken();
        };

        var setToken = function(data){
            localStorageService.set('token', data.token);
            localStorageService.set('userId', data.userId);
        };

        var getToken = function(){
            return localStorageService.get('token');
        };

        var getUserId = function(){
            return localStorageService.get('userId');
        };

        var removeToken = function(){
            localStorageService.remove('token');
            localStorageService.remove('userId');
        };

        var isAuth = function(){
            if (getToken()) {
                return true;
            }else{
                return false;
            }
        };

        return ({
            isAuth: isAuth,
            login: login,
            logout: logout,
            getToken: getToken,
            getUserId: getUserId
        });
    }]);

    app.factory('User', ['Restangular', function(Restangular){
        var User = {
            create: function(user){
                return Restangular.all('users').customPOST(user);
            },
            get: function(userId){
                return Restangular.one('users', userId).get();
            },
            getBlogs: function(userId,page){
                return Restangular.one('users', userId).all('blogs').one('page',page).get();
            }
        };
        return User;
    }]);

    app.factory('Blog', 
    ['Restangular', '$http', 'AuthService', '$q', 'AuthHttpService', 
    function(Restangular, $http, AuthService, $q, AuthHttpService){
        var Blog = {
            create: function(blog){
                return AuthHttpService.sendData('/blog/create', 'POST', AuthService.getToken(), 'unused', blog);
            },
            get: function(blogId){
                return Restangular.one('blogs', blogId).get();
            },
            getPage: function(page){
                return Restangular.all('blogs').one('page',page).get();
            }
        };
        return Blog;
    }]);

    app.factory('Comment', ['Restangular', 'AuthService', function(Restangular, AuthService){
        var Comment = {
            create: function(blogId, comment, page){
                var userId = 0;
                if(AuthService.getUserId()){
                    userId = AuthService.getUserId();
                }
                var newComment = { 'id': 0, 'user_id':userId, 'detail': comment };
                return Restangular.one('blogs', blogId).all('comments').one('page',page).customPOST(newComment);
            },
            getPage: function(blogId, page){
                return Restangular.one('blogs', blogId).all('comments').one('page',page).get();
            }
        };
        return Comment;
    }]);

    app.factory('Tag', ['Restangular', '$http', function(Restangular, $http){
        var Tag = {
            get: function(query){
                return $http.get('/tags?query='+query);
            },
            getBlogs: function(tag,page){
                return Restangular.one('tags',tag).all('blogs').one('page',page).get();
            }
        };
        return Tag;
    }]);
});