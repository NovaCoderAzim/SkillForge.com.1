from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    phone_number = Column(String, nullable=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(String) 
    status = Column(String, default="Active")
    temp_password = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    enrollments = relationship("Enrollment", back_populates="student")
    submissions = relationship("Submission", back_populates="student")
    test_results = relationship("TestResult", back_populates="student")

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    price = Column(Integer)
    image_url = Column(String, nullable=True)
    is_published = Column(Boolean, default=False)
    is_finalized = Column(Boolean, default=False)
    instructor_id = Column(Integer, ForeignKey("users.id"))
    
    modules = relationship("Module", back_populates="course")
    enrollments = relationship("Enrollment", back_populates="course")

class Module(Base):
    __tablename__ = "modules"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    order = Column(Integer)
    course_id = Column(Integer, ForeignKey("courses.id"))
    
    course = relationship("Course", back_populates="modules")
    items = relationship("ContentItem", back_populates="module")

class ContentItem(Base):
    __tablename__ = "content_items"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    type = Column(String) 
    content = Column(String, nullable=True) 
    duration = Column(Integer, nullable=True)
    is_mandatory = Column(Boolean, default=False)
    order = Column(Integer)
    module_id = Column(Integer, ForeignKey("modules.id"))
    
    instructions = Column(Text, nullable=True) 
    test_config = Column(Text, nullable=True) 
    
    module = relationship("Module", back_populates="items")

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    
    enrollment_type = Column(String, default="paid") 
    expiry_date = Column(DateTime, nullable=True)    
    
    student = relationship("User", back_populates="enrollments") 
    course = relationship("Course", back_populates="enrollments") 

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content_item_id = Column(Integer, ForeignKey("content_items.id"))
    drive_link = Column(String)
    status = Column(String, default="Pending")
    submitted_at = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("User", back_populates="submissions")
    assignment = relationship("ContentItem")

# ✅ NEW: CODE ARENA MODELS
class CodeTest(Base):
    __tablename__ = "code_tests"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    pass_key = Column(String)
    time_limit = Column(Integer) # In minutes
    instructor_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    problems = relationship("Problem", back_populates="test")
    results = relationship("TestResult", back_populates="test")

class Problem(Base):
    __tablename__ = "problems"
    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("code_tests.id"))
    title = Column(String)
    description = Column(Text)
    difficulty = Column(String)
    test_cases = Column(Text) # Stored as JSON string
    
    test = relationship("CodeTest", back_populates="problems")

class TestResult(Base):
    __tablename__ = "test_results"
    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("code_tests.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer)
    problems_solved = Column(Integer)
    time_taken = Column(String) # "45 mins"
    submitted_at = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("User", back_populates="test_results")
    test = relationship("CodeTest", back_populates="results")


# Add this to the bottom of models.py
class LessonProgress(Base):
    __tablename__ = "lesson_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content_item_id = Column(Integer, ForeignKey("content_items.id"))
    completed_at = Column(DateTime, default=datetime.utcnow)