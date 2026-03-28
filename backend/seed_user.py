import sys
import os

# Ensure we can import from backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User
from main import get_password_hash

def seed_users():
    db = SessionLocal()
    
    # Check instructor
    instructor = db.query(User).filter(User.email == "instructor@skillforge.com").first()
    if not instructor:
        print("Creating instructor...")
        instructor = User(
            email="instructor@skillforge.com",
            full_name="Test Instructor",
            hashed_password=get_password_hash("password123"),
            role="instructor",
            status="Active"
        )
        db.add(instructor)
    else:
        # Reset password just in case
        instructor.hashed_password = get_password_hash("password123")
        
    # Check student
    student = db.query(User).filter(User.email == "student@skillforge.com").first()
    if not student:
        print("Creating student...")
        student = User(
            email="student@skillforge.com",
            full_name="Test Student",
            hashed_password=get_password_hash("password123"),
            role="student",
            status="Active"
        )
        db.add(student)
    else:
        # Reset password just in case
        student.hashed_password = get_password_hash("password123")

    db.commit()
    db.close()
    print("Seeding complete.")

if __name__ == "__main__":
    seed_users()