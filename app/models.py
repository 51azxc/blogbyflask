from app import db, app
from itsdangerous import TimedJSONWebSignatureSerializer as Serializer
from itsdangerous import SignatureExpired, BadSignature
import hashlib

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), index=True, unique=True)
    password = db.Column(db.String(80), nullable=False)
    aboutMe = db.Column('about_me',db.String(140))
    avatar = db.Column(db.String(200))
    blogs = db.relationship('Blog', backref='author', lazy='dynamic')
    comments = db.relationship('Comment', backref='author', lazy='dynamic')
    
    def __init__(self, username, password):
        self.username = username
        md5 = hashlib.md5()
        md5.update(password.encode('utf-8'))
        self.password = md5.hexdigest()

    def __repr__(self):
        return '<User %r>' % (self.username)

    @property
    def passwd(self):
        return self.password

    @passwd.setter
    def passwd(self, password):
        md5 = hashlib.md5()
        md5.update(password.encode('utf-8'))
        self.password = md5.hexdigest()
    
    def generate_auth_token(self, expiration = 24*3600):
        s = Serializer(app.config['SECRET_KEY'], expires_in=expiration)
        return s.dumps({'id':self.id})
    
    @staticmethod
    def verify_auth_token(token):
        s = Serializer(app.config['SECRET_KEY'])
        try:
            data = s.loads(token)
        except SignatureExpired:
            return None # 过期token
        except BadSignature:
            return None # 无效token
        user = User.query.get(data['id'])
        return user

blog_tag = db.Table('blog_tag',
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id')),
    db.Column('blog_id', db.Integer, db.ForeignKey('blog.id'))
)

class Blog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    content = db.Column(db.Text, nullable=False)
    createAt = db.Column('create_at',db.DateTime, default=db.func.now())
    totalSeen = db.Column('total_seen', db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    comments = db.relationship('Comment', backref='article', lazy='dynamic')
    tags = db.relationship('Tag', secondary=blog_tag, backref=db.backref('blogs', lazy='dynamic'))

    def __repr__(self):
        return '<BLog %r>' % (self.title)

    @property
    def ccount(self):
        return self.comments.count()

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    detail = db.Column(db.String(200), nullable=False)
    createAt = db.Column('create_at', db.DateTime, default=db.func.now())
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    blog_id = db.Column(db.Integer, db.ForeignKey('blog.id'))

    def __repr__(self):
        return '<Comment %r>' % (self.detail)
    
class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))

    def __repr__(self):
        return '<Tag %r>' % (self.name)

    @property
    def toJson(self):
        return {
            'id': self.id,
            'name': self.name
        }

