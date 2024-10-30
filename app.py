#------------IMPORTS AND INITIALIZATIONS--------------

from flask import Flask, request, Response, json, make_response, send_file
from flask_restful import Api, Resource
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from functools import wraps
from datetime import timedelta, date, datetime
import secrets
import os
from PIL import Image
from celery import Celery
from celery.schedules import crontab
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from dateutil.relativedelta import relativedelta
from flask_caching import Cache
from werkzeug.utils import secure_filename
from flask import url_for
import pytz
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sqlalchemy import func
from sqlalchemy import and_



app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///libapp.db'
app.config['JWT_SECRET_KEY'] = 'readingisgood'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
app.config['SECRET_KEY']='sweetesthoney'
app.config['CELERY_BROKER_URL'] = 'redis://127.0.0.1:6379/1'
app.config['result_backend'] = 'redis://127.0.0.1:6379/2'
app.config['REDIS_URL'] = 'redis://127.0.0.1:6379'
app.config['CACHE_TYPE'] = 'RedisCache'
app.config['CACHE_REDIS_HOST'] = '127.0.0.1'
app.config['CACHE_REDIS_PORT'] = 6379
app.config['CACHE_DEFAULT_TIMEOUT'] = 300
app.config['UPLOAD_FOLDER'] = 'static/uploads'


db = SQLAlchemy(app)
api = Api(app)
jwt = JWTManager(app)

def make_celery(app):
	celery = Celery(
		app.import_name,
		broker=app.config['CELERY_BROKER_URL'], result_backend=app.config['result_backend'])
	celery.conf.update(app.config)
	class ContextTask(celery.Task):
		def __call__(self, *args, **kwargs):
			with app.app_context():
				return self.run(*args, **kwargs)
	celery.Task = ContextTask
	return celery
celery=make_celery(app)
app.app_context().push()
celery.conf.enable_utc = True
cache=Cache(app)
app.app_context().push()

#------------MODELS AND DECORATORS--------------

class User(db.Model):
    user_id=db.Column(db.Integer,primary_key=True,autoincrement=True)
    username=db.Column(db.String(25), unique=True,nullable=False)
    password=db.Column(db.String(50),nullable=False)
    role=db.Column(db.String,nullable=False)
    login_time=db.Column(db.DateTime)

book_section_association = db.Table('book_section_association',
    db.Column('book_id', db.Integer, db.ForeignKey('book.book_id'), primary_key=True),
    db.Column('section_id', db.Integer, db.ForeignKey('section.section_id'), primary_key=True)
)



class Book(db.Model):
    book_id=db.Column(db.Integer,primary_key=True,autoincrement=True)
    bookname=db.Column(db.String, nullable=False)
    file_path=db.Column(db.String,nullable=False)
    author=db.Column(db.String,nullable=False)
    description=db.Column(db.String, nullable=False)
    image=db.Column(db.String, nullable=False)
    date=db.Column(db.DateTime,nullable=False)
    sections = db.relationship('Section', secondary=book_section_association, back_populates='books')

class BookRequest(db.Model):
    request_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('book.book_id'), nullable=False)
    status = db.Column(db.String, nullable=False, default='requested')
    request_date = db.Column(db.DateTime)
    granted_date=db.Column(db.DateTime)
    user = db.relationship('User', back_populates='book_requests')
    book = db.relationship('Book', back_populates='book_requests')

User.book_requests = db.relationship('BookRequest', order_by=BookRequest.request_id, back_populates='user')
Book.book_requests = db.relationship('BookRequest', order_by=BookRequest.request_id, back_populates='book')


class Section(db.Model):
    section_id=db.Column(db.Integer,primary_key=True,autoincrement=True)
    section_name=db.Column(db.String, nullable=False, unique=True)
    s_description=db.Column(db.String, nullable=False)
    s_image=db.Column(db.String, nullable=False)
    s_date=db.Column(db.DateTime,nullable=False)
    books = db.relationship('Book', secondary=book_section_association, back_populates='sections')

class Feedback(db.Model):
    feedback_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('book.book_id'), nullable=False)
    feedback_text = db.Column(db.String, nullable=False)
    feedback_date = db.Column(db.DateTime)
    user = db.relationship('User', back_populates='feedbacks')
    book = db.relationship('Book', back_populates='feedbacks')

User.feedbacks = db.relationship('Feedback', back_populates='user')
Book.feedbacks = db.relationship('Feedback', back_populates='book')

class ArchivedBookRequest(db.Model):
    request_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('book.book_id'), nullable=False)
    status = db.Column(db.String, nullable=False, default='requested')
    request_date = db.Column(db.DateTime)
    granted_date = db.Column(db.DateTime)
    
    user = db.relationship('User', back_populates='archived_book_requests')
    book = db.relationship('Book', back_populates='archived_book_requests')

# Update User and Book models to include relationships to the new model
User.archived_book_requests = db.relationship('ArchivedBookRequest', order_by=ArchivedBookRequest.request_id, back_populates='user')
Book.archived_book_requests = db.relationship('ArchivedBookRequest', order_by=ArchivedBookRequest.request_id, back_populates='book')




def librarian_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user = User.query.get(get_jwt_identity())
        if current_user.role != 'librarian':
            message = json.dumps({'message': 'Access denied! Librarian privileges required'})
            return Response(message, status=403, mimetype='application/json')
        return fn(*args, **kwargs)
    return wrapper


#------------RESOURCES--------------

class APIMessage(Resource):
    def get(self):
        message = json.dumps({'message': 'Saying hello from the API endpoint'})
        return Response(message, status=200, mimetype='application/json')
    
class Registration(Resource):
    def post(self):
        data=request.get_json()
        username=data.get('username')
        password=data.get('password')
        role="user"
        if not username or not password:
            message = json.dumps({'message': 'Username and Password are required'})
            return Response(message, status=400, mimetype='application/json')
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            message = json.dumps({'message': 'Username already exists'})
            return Response(message, status=409, mimetype='application/json')
        else:
            hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
            new_user = User(username=username, password=hashed_password, role=role)
            db.session.add(new_user)
            db.session.commit()
            message = json.dumps({'message': 'User registered successfully!'})
            return Response(message, status=200, mimetype='application/json')
        
class UserLogin(Resource):
    def post(self):
        data = request.get_json()
        user = User.query.filter_by(username=data['username']).first()
        if not user:
            message = json.dumps({'message': 'Invalid credentials'})
            return Response(message, status=401, mimetype='application/json')
        else:
            if not check_password_hash(user.password, data['password']):
                message = json.dumps({'message': 'Invalid credentials'})
                return Response(message, status=401, mimetype='application/json')
        user.login_time = datetime.now()
        db.session.commit()
        token = create_access_token(identity=user.user_id)
        response_data = {'token': token, 'role': user.role, 'name':user.username, 'login_time':user.login_time.strftime('%Y-%m-%d %H:%M:%S')}
        message = json.dumps(response_data)
        return Response(message, status=200, mimetype='application/json')
    
class LibrarianLogin(Resource):
    def post(self):
        try:
            data = request.get_json()
            print(f"Received data: {data}")  # Debugging line
            
            user = User.query.filter_by(username=data['username']).first()
            if not user:
                message = json.dumps({'message': 'Invalid credentials'})
                return Response(message, status=401, mimetype='application/json')
            else:
                if user.role == 'librarian':
                    if user.password != data['password']:
                        message = json.dumps({'message': 'Invalid credentials'})
                        return Response(message, status=401, mimetype='application/json')
                elif user.role == 'user':
                    if not check_password_hash(user.password, data['password']):
                        message = json.dumps({'message': 'Invalid credentials'})
                        return Response(message, status=401, mimetype='application/json')
                    else:
                        message = json.dumps({'message': 'You are not allowed to access the librarian page. Please log in as a user.'})
                        return Response(message, status=403, mimetype='application/json')
            
            token = create_access_token(identity=user.user_id)
            response_data = {'token': token, 'role': user.role, 'name': user.username}
            message = json.dumps(response_data)
            return Response(message, status=200, mimetype='application/json')
        except Exception as e:
            print(f"Error: {e}")  # Debugging line
            message = json.dumps({'message': 'Internal server error'})
            return Response(message, status=500, mimetype='application/json')

    
class LibFeed(Resource):
    @jwt_required()
    @librarian_required
    @cache.cached(timeout=300, key_prefix='libfeed')
    def get(self):
        books = Book.query.order_by(Book.book_id.desc()).all()
        sections = Section.query.order_by(Section.section_id.desc()).all()
        requests = BookRequest.query.order_by(BookRequest.request_date.desc()).all()
        
        book_list = []
        section_list = []
        request_list = []

        for book in books:
            image_url = url_for('static', filename='bookimages/' + book.image, _external=True)
            book_list.append({
                'book_id': book.book_id,
                'title': book.bookname,
                'image': image_url,
                'description': book.description[:15] + ('...' if len(book.description) > 15 else ''),
                'author': book.author
            })
        
        for section in sections:
            img_url = url_for('static', filename='bookimages/' + section.s_image, _external=True)
            section_list.append({
                'section_id': section.section_id,
                's_title': section.section_name,
                's_image': img_url,
                's_description': section.s_description[:15] + ('...' if len(section.s_description) > 15 else '')
            })

        for request in requests:
            user = User.query.get(request.user_id)
            book = Book.query.get(request.book_id)
            request_list.append({
                'request_id': request.request_id,
                'username': user.username,
                'bookname': book.bookname,
                'status': request.status
            })

        return {'books': book_list, 'sections': section_list, 'requests': request_list}, 200

    
class CreateBook(Resource):
    @jwt_required()
    @librarian_required
    def post(self):
        data=request.form
        bookname=data.get('bookname')
        existing_book=Book.query.filter_by(bookname=bookname).first()
        if existing_book:
            return Response(json.dumps({'message':f'Book {bookname} already exists'}), status=409, mimetype='application/json')
        author=data.get('author')
        description=data.get('description')
        image=request.files['image']
        book_file=request.files['file_path']
        if bookname and author and description and image and book_file:
            random = secrets.token_hex(8)
            _, exten = os.path.splitext(image.filename)
            newname = random + exten
            picpath = os.path.join(app.root_path, 'static/bookimages', newname)
            size=(128,128)
            i = Image.open(image)
            i.thumbnail(size)
            i.save(picpath)

            filename = secure_filename(book_file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            book_file.save(file_path)
            new_book=Book(bookname=bookname,author=author,description=description,image=newname,file_path=filename,date=datetime.now())
            db.session.add(new_book)
            db.session.commit()
            cache.delete('feed')
            cache.delete('profile')
            cache.delete('stats')
            message = json.dumps({'message': 'New book created successfully!'})
            return Response(message, status=201, mimetype='application/json')
        else:
            message = json.dumps({'message': 'Invalid request'})
            return Response(message, status=400, mimetype='application/json')
        
class CreateSection(Resource):
    @jwt_required()
    @librarian_required
    def post(self):
        data=request.form
        section_name=data.get('section_name')
        existing_sec=Section.query.filter_by(section_name=section_name).first()
        if existing_sec:
            return Response(json.dumps({'message':f'Section {section_name} already exists'}), status=409, mimetype='application/json')
        s_description=data.get('s_description')
        s_image=request.files['s_image']
        if section_name and s_description and s_image:
            random = secrets.token_hex(8)
            _, exten = os.path.splitext(s_image.filename)
            newname = random + exten
            picpath = os.path.join(app.root_path, 'static/bookimages', newname)
            size=(128,128)
            i = Image.open(s_image)
            i.thumbnail(size)
            i.save(picpath)

            new_section=Section(section_name=section_name,s_description=s_description,s_image=newname,s_date=datetime.now())
            db.session.add(new_section)
            db.session.commit()
            cache.delete('libfeed')
            cache.delete('feed')
            message = json.dumps({'message': 'New Section created successfully!'})
            return Response(message, status=201, mimetype='application/json')
        else:
            message = json.dumps({'message': 'Invalid request'})
            return Response(message, status=400, mimetype='application/json')


class Lbook(Resource):
        @jwt_required()
        @librarian_required
        @cache.memoize(timeout=180)
        def get(self, b_id):
            book=Book.query.filter_by(book_id=b_id).first()
            user_id=get_jwt_identity()
            user=User.query.filter_by(user_id=user_id).first()
            feedbacks = Feedback.query.filter_by(book_id=b_id).all()
            feedback_list = [{'username': fb.user.username, 'feedback_text': fb.feedback_text, 'feedback_date': fb.feedback_date.strftime("%Y-%m-%d")} for fb in feedbacks]
            if book:
                if user.role=="librarian":
                    image_url = url_for('static', filename='bookimages/' + book.image, _external=True)
                    content=url_for('static',filename='uploads/'+book.file_path,_external=True)
                    book_view={
                        'bookname':book.bookname,
                        'author':book.author,
                        'description':book.description,
                        'image':image_url,
                        'file_path':content,
                        'date':book.date.strftime("%Y-%m-%d"),
                        'feedbacks': feedback_list
                    }
                    bw = json.dumps(book_view)
                    return Response(bw, status=200, mimetype='application/json')
                else:
                    return Response(json.dumps({'message': 'You are not allowed to view this page'}), status=403, mimetype='application/json')
            else:
                return Response(json.dumps({'message': 'Book not found'}), status=404, mimetype='application/json')
            
        @jwt_required()
        @librarian_required
        def delete(self, b_id):
            book=Book.query.filter_by(book_id=b_id).first()
            if not book:
                return Response(json.dumps({'message': 'Book not found'}), status=404, mimetype='application/json')
            try:
                a=BookRequest.query.filter_by(book_id=b_id).all()
                b=ArchivedBookRequest.query.filter_by(book_id=b_id).all()
                feedbacks = db.session.query(Feedback).filter_by(book_id=b_id).all()
                if len(a)!=0:
                    for i in a:
                        db.session.delete(i)
                        db.session.commit()
                if len(b)!=0:
                    for k in b:
                        db.session.delete(k)
                        db.session.commit()
                if len(feedbacks)!=0:
                    for j in feedbacks:
                        db.session.delete(j)
                        db.session.commit()
                
                db.session.delete(book)
                db.session.commit()
                cache.delete_memoized(Lbook.get, b_id)
                cache.delete_memoized(Ubook.get, b_id)
                cache.delete('libfeed')
                cache.delete('feed')
                cache.delete('profile')
                cache.delete('stats')
                return Response(json.dumps({'message': f'Book {book.bookname} deleted successfully'}), status=200, mimetype='application/json')
            except Exception as e:
                db.session.rollback()
                return Response(json.dumps({'message': f'Failed to delete book: {str(e)}'}), status=500, mimetype='application/json')

            

class Lsection(Resource):
    @jwt_required()
    @librarian_required
    @cache.memoize(timeout=180)
    def get(self, s_id):
        section = Section.query.filter_by(section_id=s_id).first()
        user = User.query.get(get_jwt_identity())
        if section:
            if user.role == 'librarian':
                image_url = url_for('static', filename='bookimages/' + section.s_image, _external=True)
                section_view = {
                    'section_name': section.section_name,
                    's_description': section.s_description,
                    's_image': image_url,
                    's_date': section.s_date.strftime("%Y-%m-%d"),
                    'books': [{'book_id': book.book_id, 'bookname': book.bookname} for book in section.books]
                }
                sw = json.dumps(section_view)
                return Response(sw, status=200, mimetype='application/json')
            else:
                return Response(json.dumps({'message': 'You are not allowed to view this page'}), status=403, mimetype='application/json')
        else:
            return Response(json.dumps({'message': 'Section not found'}), status=404, mimetype='application/json')
    @jwt_required()
    @librarian_required
    def delete(self, s_id):
        section=Section.query.get(s_id)
        if not section:
            return Response(json.dumps({'message': 'Section not found'}), status=404, mimetype='application/json')
        try:
            db.session.delete(section)
            db.session.commit()
            cache.delete_memoized(Lsection.get, s_id)
            cache.delete_memoized(Usection.get, s_id)
            cache.delete('libfeed')
            cache.delete('feed')
            cache.delete('profile')
            cache.delete('stats')
            return Response(json.dumps({'message': f'Section {section.section_name} deleted successfully'}), status=200, mimetype='application/json')
        except Exception as e:
            db.session.rollback()
            return Response(json.dumps({'message': f'Failed to delete section: {str(e)}'}), status=500, mimetype='application/json')



class AddBookToSection(Resource):
    @jwt_required()
    @librarian_required
    def post(self, s_id):
        data = request.get_json()
        book_id = data.get('book_id')

        section = Section.query.filter_by(section_id=s_id).first()
        book = Book.query.filter_by(book_id=book_id).first()

        if section and book:
            section.books.append(book)
            db.session.commit()
            cache.delete_memoized(Lsection.get, s_id)
            cache.delete_memoized(Usection.get, s_id)
            cache.delete('profile')
            cache.delete('stats')
            return Response(json.dumps({'message': 'Book added to section'}), status=200, mimetype='application/json')
        else:
            return Response(json.dumps({'message': 'Section or Book not found'}), status=404, mimetype='application/json')
        
class EditBook(Resource):
    @jwt_required()
    @librarian_required
    def get(self,b_id):
        book=Book.query.get(b_id)
        if not book:
            return Response(json.dumps({'message': 'Book not found'}), status=404, mimetype='application/json')
        book_data={
            'bookname':book.bookname,
            'description':book.description,
            'author':book.author,
            'date':book.date
        }
        resp = json.dumps(book_data)
        return Response(resp, status=200, mimetype='application/json')
    @jwt_required()
    @librarian_required
    def put(self,b_id):
        data=request.form
        book=Book.query.get(b_id)
        if not book:
            return Response(json.dumps({'message': 'Book not found'}), status=404, mimetype='application/json')
        if data.get('description'):
            book.description=data.get('description')
            db.session.commit()
            cache.delete_memoized(Lbook.get, b_id)
            cache.delete_memoized(Ubook.get, b_id)
            cache.delete('libfeed')
            cache.delete('feed')
        if data.get('author'):
            book.author=data.get('author')
            db.session.commit()
            cache.delete_memoized(Lbook.get, b_id)
            cache.delete_memoized(Ubook.get, b_id)
            cache.delete('libfeed')
            cache.delete('feed')
        if 'image' in request.files:
            image=request.files['image']
            if image.filename!='':
                random = secrets.token_hex(8)
                _, exten = os.path.splitext(image.filename)
                newname = random + exten
                picpath = os.path.join(app.root_path, 'static/bookimages', newname)
                size = (128, 128)
                i = Image.open(image)
                i.thumbnail(size)
                i.save(picpath)
                book.image = newname
                db.session.commit()
                cache.delete_memoized(Lbook.get, b_id)
                cache.delete_memoized(Ubook.get, b_id)
                cache.delete('libfeed')
                cache.delete('feed')
        if 'file_path' in request.files:
            book_file=request.files['file_path']
            if book_file.filename!='':
                filename = secure_filename(book_file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                book_file.save(file_path)
                book.file_path=filename
                db.session.commit()
                cache.delete_memoized(Lbook.get, b_id)
                cache.delete_memoized(Ubook.get, b_id)
        return Response(json.dumps({'message': 'Book updated successfully'}), status=200, mimetype='application/json')
    
class EditSection(Resource):
    @jwt_required()
    @librarian_required
    def get(self,s_id):
        section=Section.query.get(s_id)
        if not section:
            return Response(json.dumps({'message': 'Section not found'}), status=404, mimetype='application/json')
        section_data={
            'section_name':section.section_name,
            's_description':section.s_description,
            'date':section.s_date
        }
        resp = json.dumps(section_data)
        return Response(resp, status=200, mimetype='application/json')
    @jwt_required()
    @librarian_required
    def put(self,s_id):
        data=request.form
        section=Section.query.get(s_id)
        if not section:
            return Response(json.dumps({'message': 'Section not found'}), status=404, mimetype='application/json')
        if data.get('s_description'):
            section.s_description=data.get('s_description')
            db.session.commit()
            cache.delete_memoized(Lsection.get, s_id)
            cache.delete_memoized(Usection.get, s_id)
            cache.delete('libfeed')
            cache.delete('feed')
        if 's_image' in request.files:
            s_image=request.files['s_image']
            if s_image.filename!='':
                random = secrets.token_hex(8)
                _, exten = os.path.splitext(s_image.filename)
                newname = random + exten
                picpath = os.path.join(app.root_path, 'static/bookimages', newname)
                size = (128, 128)
                i = Image.open(s_image)
                i.thumbnail(size)
                i.save(picpath)
                section.s_image = newname
                db.session.commit()
                cache.delete_memoized(Lsection.get, s_id)
                cache.delete_memoized(Usection.get, s_id)
                cache.delete('libfeed')
                cache.delete('feed')
        return Response(json.dumps({'message': 'Section updated successfully'}), status=200, mimetype='application/json')




class Feed(Resource):
    @jwt_required()
    @cache.cached(timeout=300, key_prefix='feed')
    def get(self):
        books = Book.query.order_by(Book.book_id.desc()).all()
        sections=Section.query.order_by(Section.section_id.desc()).all()
        user_id = get_jwt_identity()
        granted_books = Book.query.join(BookRequest).filter(
            BookRequest.user_id == user_id,
            BookRequest.status == 'granted'
        ).all()
        granted_books_list = [
            {
                'book_id': book.book_id,
                'title': book.bookname
            } for book in granted_books
        ]
        book_list = []
        section_list=[]
        for book in books:
            image_url = url_for('static', filename='bookimages/' + book.image, _external=True)
            book_list.append({
                'book_id':book.book_id,
                'title': book.bookname,
                'image': image_url,
                'description': book.description[:15] + ('...' if len(book.description) > 15 else ''),
                'author': book.author
            })
        for section in sections:
            img_url=url_for('static',filename='bookimages/' + section.s_image, _external=True)
            section_list.append({
                'section_id':section.section_id,
                's_title':section.section_name,
                's_image':img_url,
                's_description': section.s_description[:15] + ('...' if len(section.s_description) > 15 else '')
            })
        return {'books': book_list, 'sections':section_list, 'granted_books': granted_books_list}, 200
    
class Ubook(Resource):
    @jwt_required()
    @cache.memoize(timeout=180)
    def get(self, b_id):
        book = Book.query.filter_by(book_id=b_id).first()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if book:
            request = BookRequest.query.filter_by(user_id=user_id, book_id=b_id).first()
            feedbacks = Feedback.query.filter_by(book_id=b_id).all()
            feedback_list = [{'username': fb.user.username, 'feedback_text': fb.feedback_text, 'feedback_date': fb.feedback_date.strftime("%Y-%m-%d")} for fb in feedbacks]
            image_url = url_for('static', filename='bookimages/' + book.image, _external=True)
            content = None
            if request and request.status == 'granted':
                content = url_for('static', filename='uploads/' + book.file_path, _external=True)
            book_view = {
                'book_id':book.book_id,
                'bookname': book.bookname,
                'author': book.author,
                'description': book.description,
                'image': image_url,
                'file_path': content,
                'date': book.date.strftime("%Y-%m-%d"),
                'request_status': request.status if request else 'none',
                'feedbacks': feedback_list
            }
            bw = json.dumps(book_view)
            return Response(bw, status=200, mimetype='application/json')
        else:
            return Response(json.dumps({'message': 'Book not found'}), status=404, mimetype='application/json')

    @jwt_required()
    def post(self, b_id):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        book = Book.query.filter_by(book_id=b_id).first()
        if book:
            existing_request = BookRequest.query.filter_by(user_id=user_id, book_id=b_id).first()
            book_count = BookRequest.query.filter_by(user_id=user_id).filter(BookRequest.status.in_(['requested', 'granted'])).count()
            if book_count >= 5 and not existing_request:
                return Response(json.dumps({'message': 'You reached the maximum limit of 5 books. If you hold any book, you can return it to request more.'}), status=400, mimetype='application/json')
            if existing_request:
                if existing_request.status == 'requested':
                    db.session.delete(existing_request)
                    db.session.commit()
                    cache.delete_memoized(Ubook.get, b_id)
                    cache.delete('libfeed')
                    cache.delete('profile')
                    cache.delete('stats')
                    return Response(json.dumps({'message': 'Book request cancelled'}), status=200, mimetype='application/json')
                elif existing_request.status == 'granted':
                    db.session.delete(existing_request)
                    db.session.commit()
                    cache.delete_memoized(Ubook.get, b_id)
                    cache.delete('libfeed')
                    cache.delete('feed')
                    cache.delete('profile')
                    cache.delete('stats')
                    return Response(json.dumps({'message': 'Book returned'}), status=200, mimetype='application/json')
            else:
                new_request = BookRequest(user_id=user_id, book_id=b_id, request_date=datetime.now())
                request2=ArchivedBookRequest(user_id=user_id, book_id=b_id, request_date=datetime.now(), status='requested')
                db.session.add(request2)
                db.session.add(new_request)
                db.session.commit()
                cache.delete_memoized(Ubook.get, b_id)
                cache.delete('libfeed')
                cache.delete('profile')
                cache.delete('stats')
                return Response(json.dumps({'message': 'Book requested'}), status=200, mimetype='application/json')
        else:
            return Response(json.dumps({'message': 'Book not found'}), status=404, mimetype='application/json')
        

class UbookFeedback(Resource):
    @jwt_required()
    def post(self, b_id):
        data = request.get_json()
        feedback_text = data.get('feedback_text')
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        book = Book.query.filter_by(book_id=b_id).first()
        if not book:
            return Response(json.dumps({'message': 'Book not found'}), status=404, mimetype='application/json')

        book_request = BookRequest.query.filter_by(user_id=user_id, book_id=b_id).first()
        if book_request and book_request.status == 'granted':
            new_feedback = Feedback(user_id=user_id, book_id=b_id, feedback_text=feedback_text, feedback_date=datetime.now())
            db.session.add(new_feedback)
            db.session.commit()
            cache.delete_memoized(Ubook.get, b_id)
            cache.delete_memoized(Lbook.get, b_id)
            return Response(json.dumps({'message': 'Feedback submitted successfully'}), status=201, mimetype='application/json')
        else:
            return Response(json.dumps({'message': 'Feedback can only be submitted if the book is granted'}), status=403, mimetype='application/json')

        
class GrantBookRequest(Resource):
    @jwt_required()
    @librarian_required
    def post(self, request_id):
        request = BookRequest.query.get(request_id)
        b_id=request.book_id
        request2=ArchivedBookRequest.query.get(request_id)
        if request:
            request.status = 'granted'
            request.granted_date=datetime.now()
            request2.status = 'granted'
            request2.granted_date=datetime.now()
            db.session.commit()
            cache.delete('libfeed')
            cache.delete('feed')
            cache.delete('profile')
            cache.delete('stats')
            cache.delete_memoized(Ubook.get, b_id)
            return Response(json.dumps({'message': 'Book request granted'}), status=200, mimetype='application/json')
        else:
            return Response(json.dumps({'message': 'Request not found'}), status=404, mimetype='application/json')

class RevokeBookRequest(Resource):
    @jwt_required()
    @librarian_required
    def post(self, request_id):
        request = BookRequest.query.get(request_id)
        b_id=request.book_id
        if request:
            db.session.delete(request)
            db.session.commit()
            cache.delete('libfeed')
            cache.delete('feed')
            cache.delete('profile')
            cache.delete('stats')
            cache.delete_memoized(Ubook.get, b_id)
            return Response(json.dumps({'message': 'Book request revoked'}), status=200, mimetype='application/json')
        else:
            return Response(json.dumps({'message': 'Request not found'}), status=404, mimetype='application/json')
        
class RejectBookRequest(Resource):
    @jwt_required()
    @librarian_required
    def post(self, request_id):
        book_request = BookRequest.query.filter_by(request_id=request_id).first()
        b_id=book_request.book_id
        if not book_request:
            return {'message': 'Request not found'}, 404
        
        if book_request.status != 'requested':
            return {'message': 'Only requested books can be rejected'}, 400
        
        db.session.delete(book_request)
        db.session.commit()
        cache.delete('libfeed')
        cache.delete_memoized(Ubook.get, b_id)
        cache.delete('profile')
        cache.delete('stats')
        return {'message': 'Request rejected successfully'}, 200

            
class Usection(Resource):
    @jwt_required()
    @cache.memoize(timeout=180)
    def get(self, s_id):
        section=Section.query.filter_by(section_id=s_id).first()
        if section:
            image_url = url_for('static', filename='bookimages/' + section.s_image, _external=True)
            section_view={
                        'section_name':section.section_name,
                        's_description':section.s_description,
                        's_image':image_url,
                        's_date':section.s_date.strftime("%Y-%m-%d"),
                        'books': [{'book_id': book.book_id, 'bookname': book.bookname} for book in section.books]
                }
            sw = json.dumps(section_view)
            return Response(sw, status=200, mimetype='application/json')
        else:
            return Response(json.dumps({'message': 'Section not found'}), status=404, mimetype='application/json')
        
class BookList(Resource):
    @jwt_required()
    def get(self):
        books = Book.query.all()
        books_list = [{
            'book_id': book.book_id,
            'bookname': book.bookname
        } for book in books]

        return Response(json.dumps(books_list), status=200, mimetype='application/json')
    
class Search(Resource):
    @jwt_required()
    def get(self):
        query = request.args.get('q', '')
        if not query:
            return Response(json.dumps({'message': 'No search query provided'}), status=400, mimetype='application/json')
        
        books = Book.query.filter(Book.bookname.ilike(f'%{query}%')).all()
        book_results = [
            {
                'book_id':book.book_id,
                'bookname': book.bookname
            } for book in books
        ]
        
        sections = Section.query.filter(Section.section_name.ilike(f'%{query}%')).all()
        section_results = [
            {
                'section_id':section.section_id,
                'section_name': section.section_name,
            } for section in sections
        ]
        
        response_data = {
            'books': book_results,
            'sections': section_results
        }
        
        return Response(json.dumps(response_data), status=200, mimetype='application/json')
    
class Profile(Resource):
    @jwt_required()
    @cache.cached(timeout=300,key_prefix='profile')
    def get(self):
        user_id = get_jwt_identity()
        user = User.query.filter_by(user_id=user_id).first()
        total_books = len(Book.query.all())
        my_books = Book.query.join(BookRequest).filter(
            BookRequest.user_id == user_id,
            BookRequest.status == 'granted'
        ).all()
        books_requested = Book.query.join(BookRequest).filter(
            BookRequest.user_id == user_id,
            BookRequest.status == 'requested'
        ).all()

        section_book_count = db.session.query(
            Section.section_name, func.count(Book.book_id).label('book_count')
        ).select_from(book_section_association).join(Section).join(Book).group_by(Section.section_name).all()

        section_names = [row.section_name for row in section_book_count]
        book_counts = [row.book_count for row in section_book_count]

        image_url1 = None
        image_url2 = None

        if any(counts := [total_books, len(my_books), len(books_requested)]):
            plt.bar(['Total Books', 'My Books', 'Books Requested'], counts, color=['blue', 'green', 'orange'])
            plt.xlabel('Categories', fontweight='bold')
            plt.ylabel('Counts', fontweight='bold')
            plt.title('Counts of Total Books, My Books, and Requested Books')
            plt.grid(axis='y')
            plt.yticks(range(0, max(counts) + 4))

            save_dir = 'static/bookimages'
            if not os.path.exists(save_dir):
                os.makedirs(save_dir)

            image_path1 = os.path.join(save_dir, 'bar_chart.png')
            plt.savefig(image_path1)
            plt.close()
            image_url1 = url_for('static', filename='bookimages/bar_chart.png', _external=True)

        if book_counts:
            plt.figure(figsize=(8, 8))
            plt.pie(book_counts, labels=section_names, autopct='%1.1f%%', startangle=140)
            plt.title('Section Spread')
            image_path2 = os.path.join(save_dir, 'pie_chart.png')
            plt.savefig(image_path2)
            plt.close()
            image_url2 = url_for('static', filename='bookimages/pie_chart.png', _external=True)

        profile_view = {
            'username': user.username,
            'img1': image_url1,
            'img2': image_url2
        }
        pw = json.dumps(profile_view)
        return Response(pw, status=200, mimetype='application/json')
    
class Statspage(Resource):
    @jwt_required()
    @librarian_required
    @cache.cached(timeout=300,key_prefix='stats')
    def get(self):
        total_books=len(Book.query.all())
        book_requests=len(BookRequest.query.filter_by(status='requested').all())
        books_issued=len(BookRequest.query.filter_by(status='granted').all())
        book_request_counts = db.session.query(
            Book.bookname, func.count(BookRequest.request_id).label('request_count')
            ).join(BookRequest).group_by(Book.bookname).all()
        section_book_count = db.session.query(
            Section.section_name, func.count(Book.book_id).label('book_count')
        ).select_from(book_section_association).join(Section).join(Book).group_by(Section.section_name).all()

        section_names = [row.section_name for row in section_book_count]
        book_counts = [row.book_count for row in section_book_count]

        image_url1 = None
        image_url2 = None
        image_url3 = None
        if any(counts:= [total_books, book_requests, books_issued]):
            plt.bar(['Total Books', 'Book Requests', 'Books Issued'], counts, color=['blue', 'green', 'orange'])
            plt.xlabel('Categories', fontweight='bold')
            plt.ylabel('Counts', fontweight='bold')
            plt.title('Counts of Total Books, Book Requests, and Books Issued')
            plt.grid(axis='y')
            plt.yticks(range(0, max(counts) + 4))

            save_dir = 'static/bookimages'
            if not os.path.exists(save_dir):
                os.makedirs(save_dir)

            image_path1 = os.path.join(save_dir, 'bar_chart1.png')
            plt.savefig(image_path1)
            plt.close()
            image_url1 = url_for('static', filename='bookimages/bar_chart1.png', _external=True)
        b_names = [item[0] for item in book_request_counts]
        counts2 = [item[1] for item in book_request_counts]
        if len(book_request_counts)!=0:
            plt.figure(figsize=(10, 6))
            plt.bar(b_names, counts2)
            plt.xlabel('Book Names', fontweight='bold')
            plt.ylabel('Number of books requested/received by users', fontweight='bold')
            plt.title('Book Management')
            plt.yticks(range(0, max(counts) + 4))
            image_path2 = os.path.join(save_dir, 'bar_chart2.png')
            plt.savefig(image_path2)
            plt.close()
            image_url2 = url_for('static', filename='bookimages/bar_chart2.png', _external=True)
        if book_counts:
            plt.figure(figsize=(8, 8))
            plt.pie(book_counts, labels=section_names, autopct='%1.1f%%', startangle=140)
            plt.title('Section Spread')
            image_path3 = os.path.join(save_dir, 'pie_chart1.png')
            plt.savefig(image_path3)
            plt.close()
            image_url3 = url_for('static', filename='bookimages/pie_chart1.png', _external=True)
        stats_view = {
            'img1': image_url1,
            'img2': image_url2,
            'img3': image_url3
        }
        pw = json.dumps(stats_view)
        return Response(pw, status=200, mimetype='application/json')
    

#------------CELERY TASKS--------------
        

@celery.task
def login_reminder():
    last_24_hours = datetime.now() - timedelta(minutes=1)
    users_to_remind = User.query.filter(User.login_time<last_24_hours).all()
    for user in users_to_remind:
        sender='saisrikar5260@gmail.com'
        recipient='erehjaeger265@gmail.com' #user's email
        subject='A Reminder from the Library Web Application'
        message=f'Hi, {user.username}! Log in to request and read books of your choice.'
        msg = MIMEMultipart()
        msg['From']=sender
        msg['To']=recipient
        msg['Subject']=subject
        msg.attach(MIMEText(message))
        smtp_server = 'smtp.gmail.com'
        smtp_port = 587
        smtp_username='saisrikar5260@gmail.com'
        smtp_password='xzoqefyfjfmtfdtp'
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(sender, recipient, msg.as_string())

def create_report(user_id):
    books_granted = ArchivedBookRequest.query.filter_by(user_id=user_id,status='granted').all()
    user = User.query.get(user_id)
    last_month = datetime.now() - relativedelta(months=1)
    all_books=[]
    for i in books_granted:
        all_books.append(i)
    html_content = f'''
    <html>
    <head>
        <title>{user.username}'s Monthly Report</title>
    </head>
    <body>
        <h1>{user.username}'s Monthly Report</h1>
        <h2>Books you read in the last month:</h2>
    '''
    for j in books_granted:
        book=j.book
        html_content += f'''
        <div>
            <h4>Book ID: {book.book_id}</h4>
            <p>Name of the Book: {book.bookname}</p>
            <p>Author: {book.author}</p>
            <p>Description: Rs.{book.description}</p>
        </div>
        '''
    html_content += f'''
        <h3>Total Books Read: {len(all_books)}</h3>
        <p>Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
    </body>
    </html>
    '''
    return html_content

@celery.task
def monthly_report():
    last_month = datetime.now() - relativedelta(months=1)
    ArchivedBookRequest.query.filter(
        and_(
            ArchivedBookRequest.granted_date < last_month,
            ArchivedBookRequest.status == 'granted'
        )
    ).delete()
    db.session.commit()
    unique_combinations = db.session.query(
        ArchivedBookRequest.user_id,
        ArchivedBookRequest.book_id
    ).filter(ArchivedBookRequest.status == 'granted').distinct()
    
    for user_id, book_id in unique_combinations:
        rows = ArchivedBookRequest.query.filter_by(
            user_id=user_id,
            book_id=book_id,
            status='granted'
        ).order_by(ArchivedBookRequest.granted_date.desc()).all()
        if len(rows) > 1:
            for row in rows[1:]: 
                db.session.delete(row)
    
    db.session.commit()
    
    remaining_user_ids = db.session.query(ArchivedBookRequest.user_id).filter_by(status='granted').distinct().all()
    user_ids = [user_id for (user_id,) in remaining_user_ids]
    
    users_to_report = User.query.filter(User.user_id.in_(user_ids)).all()
    for user in users_to_report:
        sender = 'saisrikar5260@gmail.com'
        recipient = 'erehjaeger265@gmail.com'  # user's email
        subject = 'Your Monthly Report from the Library Web Application'
        message = f'Hi, {user.username}! Here is the monthly reading report:'
        msg = MIMEMultipart()
        msg['From'] = sender
        msg['To'] = recipient
        msg['Subject'] = subject
        msg.attach(MIMEText(message))
        html_report = create_report(user.user_id)
        attachment = MIMEText(html_report, 'html')
        attachment.add_header('Content-Disposition', f'attachment; filename=user_report{user.user_id}.html')
        msg.attach(attachment)
        smtp_server = 'smtp.gmail.com'
        smtp_port = 587
        smtp_username = 'saisrikar5260@gmail.com'
        smtp_password = 'xzoqefyfjfmtfdtp'
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(sender, recipient, msg.as_string())



@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        crontab(hour=7, minute=34),
        login_reminder.s(),
    )
    sender.add_periodic_task(
        crontab(day_of_month=7, hour=7, minute=34),
        monthly_report.s(),
    )


@celery.task(name='revoke_overdue_books')
def revoke_overdue_books():
    seven_days_ago = datetime.now() - timedelta(days=7)
    overdue_requests = BookRequest.query.filter(
        BookRequest.status == 'granted',
        BookRequest.granted_date < seven_days_ago
    ).all()

    for request in overdue_requests:
        db.session.delete(request)
    db.session.commit()

revoke_overdue_books.apply_async()


#------------ADD RESOURCES--------------


api.add_resource(APIMessage, '/api')
api.add_resource(Registration, '/api/register')
api.add_resource(UserLogin, '/api/login')
api.add_resource(LibrarianLogin,'/api/liblogin')
api.add_resource(Feed,'/api/feed')
api.add_resource(LibFeed,'/api/libfeed')
api.add_resource(CreateBook,'/api/addbook')
api.add_resource(Lbook,'/api/lbook/<int:b_id>')
api.add_resource(Ubook,'/api/book/<int:b_id>')
api.add_resource(CreateSection,'/api/addsection')
api.add_resource(Lsection,'/api/lsection/<int:s_id>')
api.add_resource(Usection,'/api/section/<int:s_id>')
api.add_resource(AddBookToSection, '/api/addbooktosection/<int:s_id>')
api.add_resource(BookList, '/api/books')
api.add_resource(GrantBookRequest, '/api/grantbookrequest/<int:request_id>')
api.add_resource(RevokeBookRequest, '/api/revokebookrequest/<int:request_id>')
api.add_resource(RejectBookRequest, '/api/rejectbookrequest/<int:request_id>')
api.add_resource(EditBook,'/api/editbook/<int:b_id>')
api.add_resource(EditSection,'/api/editsection/<int:s_id>')
api.add_resource(Search,'/api/search')
api.add_resource(UbookFeedback,'/api/book/<int:b_id>/feedback')
api.add_resource(Profile, '/api/profile')
api.add_resource(Statspage,'/api/statspage')

#------------RUN--------------

if __name__ == '__main__':
    app.run(debug=True)