import sys
import os
sys.path.append(os.path.dirname(__file__))
from database import SessionLocal
import models
from main import admit_single_student, AdmitStudentRequest

db = SessionLocal()
try:
    req = AdmitStudentRequest(full_name="Azim", email="azim@gmail.com", course_ids=[], password="password123")
    user = db.query(models.User).filter_by(email="instructor@iqmath.com").first()
    res = admit_single_student(req, db, current_user=user)
    print("SUCCESS", res)
except Exception as e:
    print("ERROR", str(e))
