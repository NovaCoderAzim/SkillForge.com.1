# Save this file as: backend/force_instructor.py
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from passlib.context import CryptContext

# 1. Ensure tables exist
models.Base.metadata.create_all(bind=engine)

# 2. Setup Password Hashing (Same as your app)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin_direct():
    db = SessionLocal()
    
    target_email = "instructor@iqmath.com"
    target_password = "password123"
    
    print(f"Checking for user: {target_email}...")

    # 3. Check if user already exists
    user = db.query(models.User).filter(models.User.email == target_email).first()
    
    if user:
        print("User found! Updating role to 'instructor'...")
        user.role = "instructor"  # <--- FORCE THE ROLE
        db.commit()
        print("✅ Success! User role updated.")
    else:
        print("User not found. Creating new Instructor...")
        hashed_pw = pwd_context.hash(target_password)
        
        new_user = models.User(
            email=target_email,
            full_name="Head Instructor",
            hashed_password=hashed_pw,
            role="instructor" # <--- FORCE THE ROLE
        )
        db.add(new_user)
        db.commit()
        print("✅ Success! New Instructor account created.")
        print(f"Login details: {target_email} / {target_password}")

    db.close()

if __name__ == "__main__":
    create_admin_direct()