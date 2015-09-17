from flask import g, request, jsonify, render_template, make_response
from flask.ext import restful
from flask.ext.restful import reqparse, fields, marshal_with
from app import db, api, auth, app
from app.models import User, Blog, Comment, Tag
import hashlib, json
from datetime import datetime, timedelta
from config import PAGE_SIZE
from html.parser import HTMLParser

@app.route('/')
def index():
    return render_template('index.html')

# 登陆获取token
@app.route('/token', methods=['POST'])
@auth.login_required
def get_auth_token():
    token = g.user.generate_auth_token()
    return jsonify({ 'token': token.decode('ascii'), 'userId': g.user.id })

# 验证，会自动进行base64转码，因此需要将传入的参数以"base64(email_or_token:password)"
# 进行编码
@auth.verify_password
def verify_password(username_or_token, password):
    user = User.verify_auth_token(username_or_token)
    # 不是token登陆则以正常用户名密码登录
    if not user:
        md5 = hashlib.md5()
        md5.update(password.encode('utf-8'))
        hash_password = md5.hexdigest()
        user = User.query.filter_by(username=username_or_token)\
               .filter_by(password=hash_password).first()
        if not user:
            return False
    g.user = user
    return True

#@auth.error_handler
#def unauthorized():
#    return make_response(jsonify({'error': 'Unauthorized access'}), 403)

@app.route('/check', methods=['POST'])
def check():
    name = request.json['name']
    user = User.query.filter_by(username=name).first()
    return jsonify({'isUnique': '1' if user else '0'})

@app.route('/blog/create', methods=['POST'])
@auth.login_required
def creaetBlog():
    blog = Blog()
    blog.title = request.json['title']
    blog.content = request.json['content']
    tags_json = request.json['tags']
    if isinstance(tags_json, list):
        tags = []
        for tag_json in tags_json:
            tag_id = 0
            if not 'id' in tag_json:
                newTag = Tag()
                newTag.name = tag_json['name']
                db.session.add(newTag)
                db.session.commit()
                tag_id = newTag.id
            else:
                tag_id = tag_json['id']
            tag = Tag.query.get(tag_id)
            tags.append(tag)
        blog.tags = tags
    blog.author = g.user
    blog.createAt = datetime.now()
    db.session.add(blog)
    db.session.commit()
    return make_response(jsonify({'blog_id': blog.id}), 201)

@app.route('/tags')
def getTags():
    query = request.args.get('query','')
    tags = Tag.query.filter(Tag.name.like('%'+query+'%')).all()
    return json.dumps([tag.toJson for tag in tags])

# 格式化时间
class DateFormat(fields.Raw):
    def format(self, dt):
        if isinstance(dt,datetime):
            return dt.strftime('%b %d, %Y')
        return datetime.now().strftime('%m %d, %Y')

class TimeFormat(fields.Raw):
    def format(self, dt):
        interval = datetime.now() - dt;
        if interval.days > 0:
            return str(int(interval.days)) + ' days ago'
        elif interval.seconds > 3600:
            return str(int(interval.seconds / 3600)) + ' hours ago'
        elif interval.seconds > 60:
            return str(int(interval.seconds / 60)) + ' minutes ago'
        else:
            return str(int(interval.seconds)) + ' seconds ago'

class AuthorFormat(fields.Raw):
    def format(self, user):
        return user.username

class MyHTMLParser(HTMLParser):
    def __init__(self):
        HTMLParser.__init__(self)
        self.content = []
    # 获取网页中的文本内容
    def handle_data(self, data):
        self.content.append(data)

# 去除网页中的标签
class ContentFormat(fields.Raw):
    def format(self, content):
        parser = MyHTMLParser()
        parser.feed(content)
        content = ' '.join(parser.content)
        if len(content) >= 150:
            content = content[0:147]+'...'
        return content

user_fields = {
    'id': fields.Integer,
    'username': fields.String,
    'about_me': fields.String(attribute='aboutMe'),
    'avatar': fields.String
}

tag_fields = {
    'id': fields.Integer,
    'name': fields.String
}

comment_fields = {
    'id': fields.Integer,
    'detail': fields.String,
    'create_at': TimeFormat(attribute='createAt'),
    'author': fields.Nested(user_fields)
}

comment_page_fields = {
    'total': fields.Integer,
    'has_prev': fields.Boolean,
    'prev_num': fields.Integer,
    'page': fields.Integer,
    'pages': fields.Integer,
    'has_next': fields.Boolean,
    'next_num': fields.Integer,
    'items': fields.List(fields.Nested(comment_fields))
}

blog_list_fields = {
    'id': fields.Integer,
    'title': fields.String,
    'content': ContentFormat,
    'create_at': DateFormat(attribute='createAt'),  #重命名属性
    'author': AuthorFormat, #格式化属性
    'ccount': fields.Integer
}

blog_fields = {
    'id': fields.Integer,
    'title': fields.String,
    'content': fields.String,
    'create_at': DateFormat(attribute='createAt'),
    'author': fields.Nested(user_fields),
    'tags': fields.List(fields.Nested(tag_fields)),
    'comments': fields.List(fields.Nested(comment_fields))
}

blog_page_fields = {
    'has_prev': fields.Boolean,
    'prev_num': fields.Integer,
    'page': fields.Integer,
    'pages': fields.Integer,
    'has_next': fields.Boolean,
    'next_num': fields.Integer,
    'items': fields.List(fields.Nested(blog_list_fields))
}

class UserView(restful.Resource):
    @auth.login_required
    @marshal_with(user_fields)
    def get(self, user_id=0):
        if int(user_id) == 0:
            user_id = g.user.id
        user = User.query.get(user_id)
        if user:
            return user
        return None
    
    @auth.login_required
    @marshal_with(user_fields)
    def put(self, user_id=0):
        if user_id == 0:
            user = g.user
        user = User.query.get(user_id)
        args = request.json
        user.username = args['username']
        user.aboutMe = args['about_me']
        user.avatar = args['avatar']
        db.session.add(user)
        db.session.commit()
        return user, 201
    
    @auth.login_required
    def delete(self, user_id=0):
        user = User.query.get(user_id)
        db.session.delete(user)
        db.session.commit()

class UserListView(restful.Resource):
    def post(self):
        args = request.json
        user = User(username=args['username'],password=args['password'])
        db.session.add(user)
        db.session.commit()
        return user.id, 201

class BlogView(restful.Resource):
    @marshal_with(blog_fields)
    def get(self, blog_id=1):
        blog = Blog.query.get(blog_id)
        return blog

class BlogPageView(restful.Resource):
    @marshal_with(blog_page_fields)
    def get(self, page=1):
        blogs = Blog.query.order_by(Blog.createAt.desc()).paginate(page, PAGE_SIZE, False)
        return blogs

class UserBlogPageView(restful.Resource):
    @marshal_with(blog_page_fields)
    def get(self, user_id=1, page=1):
        user = User.query.get(user_id)
        blogs = Blog.query.filter_by(author=user)\
                .order_by(Blog.createAt.desc()).paginate(page, PAGE_SIZE, False)
        return blogs

class BlogCommentView(restful.Resource):
    @marshal_with(comment_page_fields)
    def post(self, blog_id=1, page=1):
        data = request.json
        blog = Blog.query.get(blog_id)
        comment = Comment()
        comment.detail = data['detail']
        user_id = data['user_id']
        user = User.query.get(user_id)
        if user:
            comment.author = user
        else:
            guest = User('guest','unused')
            guest.id = 0
            comment.author = guest
        comment.article = blog
        comment.createAt = datetime.now()
        db.session.add(comment)
        db.session.commit()

        comments = Comment.query.filter_by(article=blog).paginate(page, PAGE_SIZE, False)
        return comments

    @marshal_with(comment_page_fields)
    def get(self, blog_id=1, page=1):
        blog = Blog.query.get(blog_id)
        comments = Comment.query.filter_by(article=blog).paginate(page, PAGE_SIZE, False)
        return comments

class TagBlogListView(restful.Resource):
    @marshal_with(blog_page_fields)
    def get(self,tag_id,page=1):
        blogs = Blog.query.filter(Blog.tags.any(id=tag_id))\
                .order_by(Blog.createAt.desc()).paginate(page, 5, False)
        return blogs

api.add_resource(UserListView, '/users')
api.add_resource(UserView, '/users/<user_id>')
api.add_resource(BlogView, '/blogs/<int:blog_id>')
api.add_resource(BlogPageView, '/blogs/page/<int:page>')
api.add_resource(UserBlogPageView, '/users/<int:user_id>/blogs/page/<int:page>')
api.add_resource(BlogCommentView, '/blogs/<int:blog_id>/comments/page/<int:page>')
api.add_resource(TagBlogListView, '/tags/<int:tag_id>/blogs/page/<int:page>')

