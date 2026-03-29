from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt 
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional
import models
from database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import io
import json
import shutil
import os
import smtplib
import base64
import requests
import random
import string
import pandas as pd     
import requests 
import razorpay
import google.generativeai as genai 
import re  
# --- 📄 PDF GENERATION IMPORTS ---
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# 🟢 NEW GOOGLE DRIVE IMPORTS (OAUTH)
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

# 1. Initialize Database Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="iQmath Pro LMS API")

# 2. CONFIG: CORS POLICY
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# --- 🔐 SECURITY & AUTH CONFIG ---
SECRET_KEY = "supersecretkey_change_this_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/login") 

# --- 💳 RAZORPAY CONFIGURATION ---
RAZORPAY_KEY_ID = "rzp_test_Ru8lDcv8KvAiC0" 
RAZORPAY_KEY_SECRET = "puZLB2DQS8FmH0Z7SNrJtOBb"

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# --- ✨ GEMINI AI CONFIGURATION (REAL AI) ---
GEMINI_API_KEY = "AIzaSyCUhFFvAAcHjvZfMqDCnt670QPR-0yMxps" 

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

# --- 🗄️ DATABASE UTILITIES ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 📋 DATA MODELS ---
class UserCreate(BaseModel):
    email: str; password: str; name: str; role: str; phone_number: str

class CourseCreate(BaseModel):
    title: str; description: str; price: int; image_url: Optional[str] = None

class ModuleCreate(BaseModel):
    title: str; order: int

class ContentCreate(BaseModel):
    title: str; type: str; data_url: Optional[str] = None; duration: Optional[int] = None; 
    is_mandatory: bool = False; instructions: Optional[str] = None; test_config: Optional[str] = None; module_id: int

class StatusUpdate(BaseModel):
    status: str 

class Token(BaseModel):
    access_token: str; token_type: str; role: str
    
class AssignmentSubmission(BaseModel):
    link: str; lesson_id: int

# ✅ Updated to accept password from frontend
class AdmitStudentRequest(BaseModel):
    full_name: str
    email: str
    course_ids: List[int] 
    password: Optional[str] = None 

class EnrollmentRequest(BaseModel):
    type: str 

class PasswordChange(BaseModel):
    new_password: str

# Code Test Models
class ProblemSchema(BaseModel):
    title: str
    description: str
    difficulty: str
    test_cases: str 

class CodeTestCreate(BaseModel):
    title: str
    pass_key: str
    time_limit: int
    problems: List[ProblemSchema]

class TestSubmission(BaseModel):
    test_id: int
    score: int
    problems_solved: int
    time_taken: str
    status: str = "submitted"  # "submitted" | "terminated"

class TestTerminate(BaseModel):
    test_id: int
    time_taken: str

class ContentUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None

class CodeExecutionRequest(BaseModel):
    source_code: str
    stdin: str

class AIGenerateRequest(BaseModel):
    title: str

class ProgressToggle(BaseModel):
    lesson_id: int

class ReorderRequest(BaseModel):
    module_ids: List[int]

class LessonReorderItem(BaseModel):
    lesson_id: int
    module_id: int
    order: int

class LessonReorderRequest(BaseModel):
    items: List[LessonReorderItem]

class CourseSettingsUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    image_url: Optional[str] = None

class ZoomCredentialsUpdate(BaseModel):
    account_id: str
    client_id: str
    client_secret: str

class ScheduledClassCreate(BaseModel):
    course_id: int
    title: str
    agenda: Optional[str] = None
    start_time: str
    duration_minutes: int

class ReviewCreate(BaseModel):
    rating: int
    feedback: str

# --- 🔑 AUTH LOGIC ---
def verify_password(plain_password, hashed_password):
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise HTTPException(status_code=401, detail="Invalid session")
    except JWTError: raise HTTPException(status_code=401, detail="Session expired")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None: raise HTTPException(status_code=401, detail="User not found")
    return user

def generate_random_password(length=8):
    characters = string.ascii_letters + string.digits + "!@#$"
    return ''.join(random.choice(characters) for i in range(length))

# ✅ FIXED: Email Sender
def send_credentials_email(to_email: str, name: str, password: str):
    # ⚠️ IMPORTANT: Use App Password, NOT Gmail password
    sender_email = "nithishss48@gmail.com"  # REPLACE THIS
    sender_password = "zzgh jbao mhvv qfxm"  # REPLACE THIS (16 chars)
    smtp_server = "smtp.gmail.com"
    smtp_port = 587

    subject = "Welcome to iQmath! Here are your credentials"
    
    body = f"""
    Welcome to iQmath {name} !,
    
    User ID: {to_email}
    Password: {password}

    "Education is the passport to the future,
    for tomorrow belongs to those who prepare for it today."
    """

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        print(f"✅ Email sent successfully to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
 
# 🟢 UPDATED: Upload to Drive using TOKEN.JSON (OAuth)
def upload_file_to_drive(file_obj, filename, folder_link):
    try:
        # A. Extract Folder ID
        folder_id = folder_link
        if "drive.google.com" in folder_link:
            folder_id = folder_link.split("/")[-1].split("?")[0]

        # B. Authenticate using token.json
        TOKEN_FILE = 'token.json'
        creds = None
        
        if os.path.exists(TOKEN_FILE):
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, ['https://www.googleapis.com/auth/drive.file'])
        
        # If no valid credentials available, fail gracefully
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                    # Save refreshed token
                    with open(TOKEN_FILE, 'w') as token:
                        token.write(creds.to_json())
                except:
                    print("❌ Token expired and refresh failed.")
                    return None
            else:
                print("❌ Error: Valid token.json not found! Run get_token.py first.")
                return None

        service = build('drive', 'v3', credentials=creds)

        # C. Upload Config
        file_metadata = {
            'name': filename,
            'parents': [folder_id] 
        }

        # D. Execute Upload
        media = MediaIoBaseUpload(file_obj, mimetype='application/pdf', resumable=True)
        uploaded_file = service.files().create(
            body=file_metadata, 
            media_body=media, 
            fields='id'
        ).execute()

        print(f"✅ Google Drive Upload Success! File ID: {uploaded_file.get('id')}")
        return uploaded_file.get('id')

    except Exception as e:
        print(f"🔥 Google Drive Upload Failed: {str(e)}")
        return None
            
def create_certificate_pdf(student_name: str, course_name: str, date_str: str):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)
    BRAND_BLUE = colors.Color(0/255, 94/255, 184/255)
    BRAND_GREEN = colors.Color(135/255, 194/255, 50/255)
    c.setStrokeColor(BRAND_BLUE); c.setLineWidth(5); c.rect(20, 20, width-40, height-40)
    c.setStrokeColor(BRAND_GREEN); c.setLineWidth(2); c.rect(28, 28, width-56, height-56)
    
    logo_path = "logo.png" if os.path.exists("logo.png") else "logo.jpg"
    if os.path.exists(logo_path):
        try:
            logo = ImageReader(logo_path)
            c.drawImage(logo, (width - 1.5*inch) / 2, height - 130, width=1.5*inch, height=1.5*inch*logo.getSize()[1]/logo.getSize()[0], mask='auto')
        except: pass

    c.setFont("Helvetica-Bold", 40); c.setFillColor(BRAND_BLUE); c.drawCentredString(width/2, height - 180, "CERTIFICATE")
    c.setFont("Helvetica", 16); c.setFillColor(colors.black); c.drawCentredString(width/2, height - 210, "OF COMPLETION")
    c.setFont("Helvetica-BoldOblique", 32); c.drawCentredString(width/2, height - 310, student_name)
    c.setFont("Helvetica-Bold", 24); c.setFillColor(BRAND_BLUE); c.drawCentredString(width/2, height - 400, course_name)
    c.showPage(); c.save(); buffer.seek(0); return buffer

# --- 🚀 API ENDPOINTS ---

@app.post("/api/v1/users", status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(email=user.email, hashed_password=get_password_hash(user.password), full_name=user.name, role=user.role, phone_number=user.phone_number)
    db.add(new_user); db.commit()
    return {"message": "User created successfully"}

@app.post("/api/v1/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role}

# ✅ FIXED: Now calls send_credentials_email
@app.post("/api/v1/admin/admit-student")
def admit_single_student(req: AdmitStudentRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403, detail="Only Instructors can admit students")
    
    existing_user = db.query(models.User).filter(models.User.email == req.email).first()
    student = existing_user
    final_password = req.password if req.password else generate_random_password()

    if not student:
        student = models.User(email=req.email, full_name=req.full_name, hashed_password=get_password_hash(final_password), role="student", status="Active", temp_password=final_password)
        db.add(student); db.commit(); db.refresh(student)
        send_credentials_email(req.email, req.full_name, final_password)
    else:
        student.temp_password = final_password
        
    enrolled = []
    for cid in req.course_ids:
        if not db.query(models.Enrollment).filter(models.Enrollment.user_id == student.id, models.Enrollment.course_id == cid).first():
            db.add(models.Enrollment(user_id=student.id, course_id=cid, enrollment_type="paid"))
            enrolled.append(cid)
    db.commit()
    return {"message": f"Enrolled in {len(enrolled)} courses"}

@app.post("/api/v1/admin/bulk-admit")
async def bulk_admit_students(file: UploadFile = File(...), course_id: int = Form(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents)) if file.filename.endswith('.csv') else pd.read_excel(io.BytesIO(contents))
    except: raise HTTPException(status_code=400, detail="Invalid file")
    
    df.columns = [c.lower().strip() for c in df.columns]
    if "email" not in df.columns: raise HTTPException(status_code=400, detail="Missing 'email' column")
    
    count = 0
    for _, row in df.iterrows():
        email = str(row["email"]).strip()
        name = str(row.get("name", "Student"))
        if not email or email == "nan": continue
        
        student = db.query(models.User).filter(models.User.email == email).first()
        if not student:
            bulk_password = generate_random_password()
            student = models.User(email=email, full_name=name, hashed_password=get_password_hash(bulk_password), role="student", status="Active", temp_password=bulk_password)
            db.add(student); db.commit(); db.refresh(student)
            send_credentials_email(email, name, bulk_password)
        
        if not db.query(models.Enrollment).filter(models.Enrollment.user_id == student.id, models.Enrollment.course_id == course_id).first():
            db.add(models.Enrollment(user_id=student.id, course_id=course_id, enrollment_type="paid"))
            count += 1
    db.commit()
    return {"message": f"Enrolled {count} students"}

# --- 🚀 STUDENT CRM MANAGEMENT ---
@app.get("/api/v1/admin/students")
def get_all_students(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    
    students = db.query(models.User).filter(models.User.role == "student").all()
    out = []
    for s in students:
        enrolled = []
        for e in s.enrollments:
            days_left = None
            if getattr(e, "expiry_date", None):
                days_left = (e.expiry_date - datetime.utcnow()).days
            enrolled.append({
                "title": e.course.title if e.course else "Unknown Course",
                "tier": "Paid" if getattr(e, "enrollment_type", "paid") == "paid" else "Free",
                "days_left": days_left
            })
        out.append({
            "id": s.id, "full_name": s.full_name, "email": s.email,
            "joined_at": "N/A" if not getattr(s, "created_at", None) else getattr(s,"created_at").strftime("%Y-%m-%d"),
            "status": getattr(s, "status", "Active") or "Active",
            "temp_password": getattr(s, "temp_password", "Encrypted"),
            "enrolled_courses": enrolled
        })
    return out

class ToggleStatusReq(BaseModel):
    status: str
@app.patch("/api/v1/admin/students/{user_id}/status")
def toggle_status(user_id: int, req: ToggleStatusReq, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    student = db.query(models.User).filter(models.User.id == user_id).first()
    if not student: raise HTTPException(status_code=404)
    student.status = req.status
    db.commit()
    return {"message": f"Account changed to {req.status}"}

class UpdateNameReq(BaseModel):
    name: str
@app.patch("/api/v1/admin/students/{user_id}/name")
def update_name(user_id: int, req: UpdateNameReq, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    student = db.query(models.User).filter(models.User.id == user_id).first()
    if not student: raise HTTPException(status_code=404)
    student.full_name = req.name
    db.commit()
    return {"message": "Name updated successfully"}

class ResetPassReq(BaseModel):
    new_password: str
@app.patch("/api/v1/admin/students/{user_id}/reset-password")
def reset_password(user_id: int, req: ResetPassReq, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    student = db.query(models.User).filter(models.User.id == user_id).first()
    if not student: raise HTTPException(status_code=404)
    student.hashed_password = get_password_hash(req.new_password)
    student.temp_password = req.new_password
    db.commit()
    return {"message": "Password reset successfully"}

# --- CODE ARENA & OTHER ENDPOINTS (UNCHANGED) ---
@app.post("/api/v1/ai/generate")
async def generate_problem_content(req: AIGenerateRequest, db: Session = Depends(get_db)):
    if not GEMINI_API_KEY or "PASTE_YOUR" in GEMINI_API_KEY:
        print("❌ Error: API Key is missing or default.")
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    try:
        prompt = f"""
        Act as a strict coding instructor. 
        Create a programming challenge based on the topic: "{req.title}".
        
        REQUIRED OUTPUT FORMAT (JSON ONLY):
        {{
            "description": "A clear, concise problem statement asking the student to solve the task.",
            "test_cases": [
                {{"input": "example_input", "output": "expected_output", "hidden": false}},
                {{"input": "test_input_2", "output": "test_output_2", "hidden": false}},
                {{"input": "edge_case", "output": "edge_output", "hidden": true}}
            ]
        }}
        
        Do NOT wrap in markdown code blocks. Return ONLY the raw JSON string.
        """
        print(f"🤖 Sending request to Gemini for: {req.title}")
        response = model.generate_content(prompt)
        text = response.text.strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        
        if not match: raise ValueError("AI did not return valid JSON format.")
            
        clean_json = match.group()
        ai_data = json.loads(clean_json)
        print("✅ AI Generation Successful!")
        return {
            "description": ai_data.get("description", "No description generated."),
            "test_cases": json.dumps(ai_data.get("test_cases", [])) 
        }

    except Exception as e:
        print(f"🔥 AI GENERATION FAILED: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")
    
@app.post("/api/v1/code-tests")
def create_code_test(test: CodeTestCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    new_test = models.CodeTest(title=test.title, pass_key=test.pass_key, time_limit=test.time_limit, instructor_id=current_user.id)
    db.add(new_test); db.commit(); db.refresh(new_test)
    
    for prob in test.problems:
        new_prob = models.Problem(
            test_id=new_test.id, 
            title=prob.title, 
            description=prob.description, 
            difficulty=prob.difficulty, 
            test_cases=prob.test_cases 
        )
        db.add(new_prob)
    db.commit()
    return {"message": "Test Created Successfully!"}

@app.put("/api/v1/code-tests/{test_id}")
def update_code_test(test_id: int, test: CodeTestCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    
    existing_test = db.query(models.CodeTest).filter(models.CodeTest.id == test_id, models.CodeTest.instructor_id == current_user.id).first()
    if not existing_test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    existing_test.title = test.title
    existing_test.pass_key = test.pass_key
    existing_test.time_limit = test.time_limit
    
    # Cascade delete old problems and replace with new
    db.query(models.Problem).filter(models.Problem.test_id == test_id).delete()
    
    for prob in test.problems:
        new_prob = models.Problem(
            test_id=existing_test.id, 
            title=prob.title, 
            description=prob.description, 
            difficulty=prob.difficulty, 
            test_cases=prob.test_cases 
        )
        db.add(new_prob)
    db.commit()
    return {"message": "Test Updated Successfully!"}

@app.get("/api/v1/code-tests")
def get_code_tests(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "instructor": 
        tests = db.query(models.CodeTest).filter(models.CodeTest.instructor_id == current_user.id).all()
        return [{
            "id": t.id,
            "title": t.title,
            "pass_key": t.pass_key,
            "time_limit": t.time_limit,
            "problems": [{
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "difficulty": getattr(p, "difficulty", "Easy"),
                "test_cases": p.test_cases
            } for p in t.problems]
        } for t in tests]
    tests = db.query(models.CodeTest).all()
    response_data = []
    for t in tests:
        submission = db.query(models.TestResult).filter(models.TestResult.test_id == t.id, models.TestResult.user_id == current_user.id).first()
        response_data.append({
            "id": t.id, "title": t.title, "time_limit": t.time_limit, "problems": t.problems,
            "completed": True if submission else False,
            "result_status": submission.status if submission else None  # "submitted" | "terminated" | None
        })
    return response_data

@app.post("/api/v1/code-tests/{test_id}/start")
def start_code_test(test_id: int, pass_key: str = Form(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing_result = db.query(models.TestResult).filter(models.TestResult.test_id == test_id, models.TestResult.user_id == current_user.id).first()
    if existing_result: raise HTTPException(status_code=403, detail="Test already submitted. You cannot retake it.")
    test = db.query(models.CodeTest).filter(models.CodeTest.id == test_id).first()
    if not test: raise HTTPException(status_code=404, detail="Test not found")
    if test.pass_key != pass_key: raise HTTPException(status_code=403, detail="Invalid Pass Key")
    return {
        "id": test.id, "title": test.title, "time_limit": test.time_limit, 
        "problems": [{"id": p.id, "title": p.title, "description": p.description, "test_cases": p.test_cases} for p in test.problems]
    }

@app.post("/api/v1/code-tests/submit")
def submit_test_result(sub: TestSubmission, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Prevent duplicate submissions
    existing = db.query(models.TestResult).filter(models.TestResult.test_id == sub.test_id, models.TestResult.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Result already recorded.")
    result = models.TestResult(
        test_id=sub.test_id, user_id=current_user.id,
        score=sub.score, problems_solved=sub.problems_solved,
        time_taken=sub.time_taken, status=sub.status
    )
    db.add(result); db.commit()
    return {"message": "Test result saved."}

@app.get("/api/v1/code-tests/{test_id}/results")
def get_test_results(test_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    results = db.query(models.TestResult).filter(models.TestResult.test_id == test_id).all()
    return [{
        "student_name": r.student.full_name,
        "email": r.student.email,
        "score": r.score,
        "problems_solved": r.problems_solved,
        "time_taken": r.time_taken,
        "status": r.status,
        "submitted_at": r.submitted_at.strftime("%Y-%m-%d %H:%M")
    } for r in results]


@app.delete("/api/v1/code-tests/{test_id}")
def delete_code_test(test_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    test = db.query(models.CodeTest).filter(models.CodeTest.id == test_id, models.CodeTest.instructor_id == current_user.id).first()
    if not test: raise HTTPException(status_code=404, detail="Test not found.")
    # Cascade delete
    db.query(models.TestResult).filter(models.TestResult.test_id == test_id).delete()
    db.query(models.Problem).filter(models.Problem.test_id == test_id).delete()
    db.delete(test)
    db.commit()
    return {"message": "Test deleted."}


@app.get("/api/v1/code-tests/{test_id}/export")
def export_test_results(test_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    test = db.query(models.CodeTest).filter(models.CodeTest.id == test_id).first()
    if not test: raise HTTPException(status_code=404)
    results = db.query(models.TestResult).filter(models.TestResult.test_id == test_id).all()
    rows = [{
        "Name": r.student.full_name,
        "Email": r.student.email,
        "Score": r.score,
        "Problems Solved": r.problems_solved,
        "Time Taken": r.time_taken,
        "Status": r.status.capitalize() if r.status else "Submitted",
        "Submitted At": r.submitted_at.strftime("%Y-%m-%d %H:%M")
    } for r in results]
    df = pd.DataFrame(rows)
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Results')
    buf.seek(0)
    filename = f"{test.title.replace(' ', '_')}_results.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@app.post("/api/v1/execute")
def execute_code(req: CodeExecutionRequest, db: Session = Depends(get_db)):
    url = "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true"
    payload = { "source_code": req.source_code, "language_id": 71, "stdin": req.stdin }
    headers = { "content-type": "application/json", "X-RapidAPI-Key": "0708d014ebmsh3e0532f99384efbp139119jsn3736fb5bd1c2", "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com" }
    try:
        response = requests.post(url, json=payload, headers=headers)
        return response.json()
    except Exception as e:
        print(f"Judge0 Error: {e}")
        raise HTTPException(status_code=500, detail="Compiler Service Error")

@app.get("/api/v1/courses")
def get_courses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "instructor":
        courses = db.query(models.Course).filter(models.Course.instructor_id == current_user.id).all()
        result = []
        for c in courses:
            student_count = db.query(models.Enrollment).filter(models.Enrollment.course_id == c.id).count()
            result.append({
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "price": c.price,
                "image_url": c.image_url,
                "is_published": c.is_published,
                "is_finalized": getattr(c, "is_finalized", False),
                "students": student_count,
                "rating": round(4.5 + (student_count % 5) * 0.1, 1) if student_count > 0 else 0,
            })
        return result
    return db.query(models.Course).filter(models.Course.is_published == True).all()

@app.post("/api/v1/courses")
def create_course(course: CourseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_course = models.Course(**course.dict(), instructor_id=current_user.id)
    db.add(new_course); db.commit(); db.refresh(new_course); return new_course

@app.post("/api/v1/courses/{course_id}/modules")
def create_module(course_id: int, module: ModuleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_module = models.Module(**module.dict(), course_id=course_id)
    db.add(new_module); db.commit(); db.refresh(new_module); return new_module

@app.get("/api/v1/courses/{course_id}/modules")
def get_modules(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Module).filter(models.Module.course_id == course_id).order_by(models.Module.order).all()

@app.patch("/api/v1/courses/{course_id}/modules/reorder")
def reorder_modules(course_id: int, req: ReorderRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    for index, m_id in enumerate(req.module_ids):
        module = db.query(models.Module).filter(models.Module.id == m_id, models.Module.course_id == course_id).first()
        if module:
            module.order = index
    db.commit()
    return {"message": "Modules Reordered Successfully"}

@app.patch("/api/v1/courses/{course_id}/lessons/reorder")
def reorder_lessons(course_id: int, req: LessonReorderRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    for item in req.items:
        lesson = db.query(models.ContentItem).filter(models.ContentItem.id == item.lesson_id).first()
        if lesson:
            lesson.module_id = item.module_id
            lesson.order = item.order
    db.commit()
    return {"message": "Lessons Reordered Successfully"}

@app.post("/api/v1/content")
def add_content(content: ContentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_content = models.ContentItem(title=content.title, type=content.type, content=content.data_url, order=0, module_id=content.module_id, duration=content.duration, is_mandatory=content.is_mandatory, instructions=content.instructions, test_config=content.test_config)
    db.add(new_content); db.commit(); return {"message": "Content added"}

@app.patch("/api/v1/courses/{course_id}/publish")
def publish_course(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    course.is_published = True; db.commit(); return {"message": "Published"}

@app.patch("/api/v1/courses/{course_id}/finalize")
def finalize_course(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.instructor_id == current_user.id).first()
    if not course: raise HTTPException(status_code=404)
    course.is_finalized = True; db.commit(); return {"message": "Finalized"}

@app.patch("/api/v1/courses/{course_id}/settings")
def update_course_settings(course_id: int, req: CourseSettingsUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.instructor_id == current_user.id).first()
    if not course: raise HTTPException(status_code=404)
    if req.title is not None: course.title = req.title
    if req.description is not None: course.description = req.description
    if req.price is not None: course.price = req.price
    
    if req.image_url is not None: 
        course.image_url = None if req.image_url == "" else req.image_url
        
    db.commit()
    return {"message": "Settings Updated"}

@app.get("/api/v1/courses/{course_id}/player")
def get_course_player(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course: raise HTTPException(status_code=404)
    
    enrollment = db.query(models.Enrollment).filter(models.Enrollment.user_id == current_user.id, models.Enrollment.course_id == course_id).first()
    if not enrollment and current_user.role != "instructor": raise HTTPException(status_code=403)
    
    # Fetch completed lesson IDs for this specific user
    completed_records = db.query(models.LessonProgress).filter(models.LessonProgress.user_id == current_user.id).all()
    completed_lesson_ids = [record.content_item_id for record in completed_records]

    return {
        "id": course.id, 
        "title": course.title, 
        "description": course.description,
        "price": course.price,
        "image_url": course.image_url,
        "is_finalized": getattr(course, "is_finalized", False),
        "completed_lessons": completed_lesson_ids, # <-- INJECTED PROGRESS DATA
        "modules": [
            {
                "id": m.id, 
                "title": m.title, 
                "lessons": [
                    {
                        "id": c.id, 
                        "title": c.title, 
                        "type": c.type, 
                        "url": c.content, 
                        "test_config": c.test_config,
                        "instructions": c.instructions,
                        "duration": c.duration,
                        "is_mandatory": c.is_mandatory
                    } for c in m.items
                ]
            } for m in course.modules
        ]
    }

@app.post("/api/v1/enroll/{course_id}")
def enroll_student(course_id: int, req: EnrollmentRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing = db.query(models.Enrollment).filter(models.Enrollment.user_id == current_user.id, models.Enrollment.course_id == course_id).first()
    if existing:
        if existing.enrollment_type == "trial" and req.type == "paid":
            existing.enrollment_type = "paid"; existing.expiry_date = None; db.commit(); return {"message": "Upgraded"}
        return {"message": "Already enrolled"}
    new_enrollment = models.Enrollment(user_id=current_user.id, course_id=course_id, enrollment_type=req.type, expiry_date=(datetime.utcnow() + timedelta(days=7)) if req.type == "trial" else None)
    db.add(new_enrollment); db.commit(); return {"message": "Enrolled"}

@app.get("/api/v1/generate-pdf/{course_id}")
def generate_pdf_endpoint(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course: 
        raise HTTPException(status_code=404, detail="Course not found")
        
    if getattr(course, "is_finalized", False) is False:
        raise HTTPException(status_code=403, detail="Certificates are locked until the instructor finalizes the course.")

    # Get total lesson IDs in the course
    all_lesson_ids = [lesson.id for module in course.modules for lesson in module.items]
    
    # Get student's completed lesson IDs
    completed_records = db.query(models.LessonProgress).filter(
        models.LessonProgress.user_id == current_user.id
    ).all()
    completed_lesson_ids = set([r.content_item_id for r in completed_records])
    
    # Verify completion
    for lid in all_lesson_ids:
        if lid not in completed_lesson_ids:
            raise HTTPException(status_code=403, detail="You must complete all lessons before generating your certificate.")

    pdf = create_certificate_pdf(current_user.full_name, course.title, datetime.now().strftime("%B %d, %Y"))
    return StreamingResponse(pdf, media_type="application/pdf")

@app.get("/api/v1/my-courses")
def get_my_courses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    enrollments = db.query(models.Enrollment).filter(models.Enrollment.user_id == current_user.id).all()
    
    response = []
    for e in enrollments:
        course = e.course
        all_lessons = [item.id for module in course.modules for item in module.items]
        if not all_lessons:
            progress = 0
        else:
            completed = db.query(models.LessonProgress).filter(
                models.LessonProgress.user_id == current_user.id,
                models.LessonProgress.content_item_id.in_(all_lessons)
            ).count()
            progress = int((completed / len(all_lessons)) * 100)
            
        days_left = None
        if getattr(e, "expiry_date", None):
            days_left = (e.expiry_date - datetime.utcnow()).days
            
        # Get user's rating for this course if it exists
        user_review = db.query(models.CourseReview).filter(
            models.CourseReview.user_id == current_user.id,
            models.CourseReview.course_id == course.id
        ).first()
            
        response.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "price": course.price,
            "image_url": course.image_url,
            "is_finalized": getattr(course, "is_finalized", False),
            "progress": progress,
            "enrollment_type": getattr(e, "enrollment_type", "paid"),
            "days_left": days_left,
            "user_rating": user_review.rating if user_review else None
        })
        
    return response

@app.post("/api/v1/user/change-password")
def change_password(req: PasswordChange, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    current_user.hashed_password = get_password_hash(req.new_password); db.commit(); return {"message": "Password updated"}

@app.delete("/api/v1/content/{content_id}")
def delete_content(content_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    item = db.query(models.ContentItem).filter(models.ContentItem.id == content_id).first()
    if item: db.delete(item); db.commit(); return {"message": "Deleted"}
    raise HTTPException(status_code=404)

@app.patch("/api/v1/content/{content_id}")
def update_content(content_id: int, update: ContentUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    item = db.query(models.ContentItem).filter(models.ContentItem.id == content_id).first()
    if item: 
        if update.title: item.title = update.title
        if update.url: item.content = update.url
        db.commit(); return {"message": "Updated"}
    raise HTTPException(status_code=404)

@app.post("/api/v1/create-order")
def create_payment_order(data: dict = Body(...)):
    amount = data.get("amount") 
    order_data = { "amount": amount * 100, "currency": "INR", "payment_capture": 1 }
    order = client.order.create(data=order_data)
    return order

@app.post("/api/v1/submit-assignment")
async def submit_assignment(
    file: UploadFile = File(...),
    lesson_title: str = Form(...), 
    course_title: str = Form(...),
    db: Session = Depends(get_db),
    # ✅ FIX: Removed 'auth.' prefix here
    current_user: models.User = Depends(get_current_user)
):
    print(f"📥 Receiving Assignment: {file.filename} from {current_user.full_name}")

    # 1. Look up the Assignment in DB to find the Instructor's Drive Link
    # We search for the content item by title and type
    assignment_data = db.query(models.ContentItem).filter(
        models.ContentItem.title == lesson_title,
        models.ContentItem.type == "assignment"
    ).first()

    drive_status = "Not Uploaded"
    
    # 2. Read the file
    content = await file.read()
    
    # 3. Create a unique filename (Student Name + Original File Name)
    safe_filename = f"{current_user.full_name}_{file.filename}"

    # 4. Attempt Upload to Drive
    if assignment_data and assignment_data.content: # Use .content instead of .data_url if model uses content
        instructor_folder_link = assignment_data.content # Changed to match model field 'content'
        print(f"🔗 Found Target Drive Link: {instructor_folder_link}")
        
        # Create a stream for the upload function
        file_stream = io.BytesIO(content)
        
        # 🚀 THE MAGIC UPLOAD
        file_id = upload_file_to_drive(file_stream, safe_filename, instructor_folder_link)
        
        if file_id:
            drive_status = "✅ Successfully sent to Instructor's Drive"
        else:
            drive_status = "⚠️ Drive Upload Failed (Check Backend Console)"
    else:
        print("⚠️ No Drive Link found in database for this assignment.")
        drive_status = "Skipped (No Folder Link Configured)"

    # 5. Local Backup (Optional but safe)
    os.makedirs("assignments_backup", exist_ok=True)
    with open(f"assignments_backup/{safe_filename}", "wb") as f:
        f.write(content)

    return {
        "message": "Assignment Submitted Successfully",
        "drive_status": drive_status
    }


@app.post("/api/v1/progress/toggle")
def toggle_lesson_progress(req: ProgressToggle, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if already completed
    existing = db.query(models.LessonProgress).filter(
        models.LessonProgress.user_id == current_user.id,
        models.LessonProgress.content_item_id == req.lesson_id
    ).first()
    
    if existing:
        return {"status": "already_completed"}
    
    # Mark as complete
    progress = models.LessonProgress(user_id=current_user.id, content_item_id=req.lesson_id)
    db.add(progress)
    db.commit()
    return {"status": "completed"}



@app.get("/api/v1/admin/students")
def get_all_students(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Security: Only instructors can view this
    if current_user.role != "instructor": 
        raise HTTPException(status_code=403, detail="Access Denied")
    
    # 1. Get all users who are 'students'
    students = db.query(models.User).filter(models.User.role == "student").all()
    
    real_data = []
    for s in students:
        # 2. Get their enrolled courses
        enrollments = db.query(models.Enrollment).filter(models.Enrollment.user_id == s.id).all()
        course_ids = [e.course_id for e in enrollments]
        
        # Fetch course names securely
        if course_ids:
            courses = db.query(models.Course).filter(models.Course.id.in_(course_ids)).all()
            course_names = [c.title for c in courses]
        else:
            course_names = []

        # 3. Format Date (Handle cases where created_at might be missing)
        join_date = s.created_at.strftime("%Y-%m-%d") if hasattr(s, "created_at") and s.created_at else "N/A"

        real_data.append({
            "id": s.id,
            "full_name": s.full_name,
            "email": s.email,
            "joined_at": join_date,
            "enrolled_courses": course_names
        })
        
    return real_data

# --- REPLACE THIS ENDPOINT IN main.py ---
@app.get("/api/v1/student/dashboard")
def get_student_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Active Courses
    enrollments = db.query(models.Enrollment).filter(models.Enrollment.user_id == current_user.id).all()
    
    # Pre-fetch completed lesson IDs once
    completed_records = db.query(models.LessonProgress).filter(models.LessonProgress.user_id == current_user.id).all()
    completed_lesson_ids = set(record.content_item_id for record in completed_records)

    enrolled_courses_with_progress = []
    
    # Calculate progress for each enrollment
    for e in enrollments:
        total_lessons = 0
        completed_lessons = 0
        for module in e.course.modules:
            for lesson in module.items:
                total_lessons += 1
                if lesson.id in completed_lesson_ids:
                    completed_lessons += 1
        
        # Avoid division by zero
        progress_percentage = 0
        if total_lessons > 0:
            progress_percentage = round((completed_lessons / total_lessons) * 100)
            
        enrolled_courses_with_progress.append({
            "id": e.course_id,
            "title": e.course.title,
            "category": "Technology", # Placeholder
            "progress": progress_percentage,
            "instructor": e.course.instructor.full_name
        })

    # 2. Recommended Courses (Placeholder logic)
    all_courses = db.query(models.Course).limit(2).all()
    recommended = [{"id": c.id, "title": c.title, "instructor": c.instructor.full_name} for c in all_courses]

    # 3. Leaderboard (Placeholder logic)
    leaderboard = [
        {"id": 1, "name": "Aiswarya.S", "points": 1400},
        {"id": 2, "name": "Vishaagan", "points": 1390},
        {"id": 3, "name": "Ajai", "points": 1200},
        {"id": 4, "name": "Kavyanjali", "points": 1100},
    ]

    return {
        "user_name": current_user.full_name,
        "enrolled_courses": enrolled_courses_with_progress,
        "recommended_courses": recommended,
        "leaderboard": leaderboard
    }

@app.patch("/api/v1/admin/students/{user_id}/name")
def update_student_name(user_id: int, request: dict = Body(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403, detail="Access Denied")
    student = db.query(models.User).filter(models.User.id == user_id).first()
    if not student: raise HTTPException(status_code=404)
    student.full_name = request.get("full_name", student.full_name)
    db.commit()
    return {"message": "Name updated"}

@app.patch("/api/v1/admin/students/{user_id}/status")
def update_student_status(user_id: int, request: dict = Body(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403, detail="Access Denied")
    student = db.query(models.User).filter(models.User.id == user_id).first()
    if not student: raise HTTPException(status_code=404)
    student.status = request.get("status", student.status)
    db.commit()
    return {"message": "Status updated"}

@app.patch("/api/v1/admin/students/{user_id}/reset-password")
def reset_student_password(user_id: int, request: dict = Body(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403, detail="Access Denied")
    student = db.query(models.User).filter(models.User.id == user_id).first()
    if not student: raise HTTPException(status_code=404)
    new_pass = request.get("password")
    if new_pass:
        student.hashed_password = get_password_hash(new_pass)
        student.temp_password = new_pass
        db.commit()
    return {"message": "Password reset successfully"}

@app.delete("/api/v1/admin/students/{user_id}")
def delete_student(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": 
        raise HTTPException(status_code=403, detail="Access Denied")
        
    student = db.query(models.User).filter(models.User.id == user_id).first()
    if not student: 
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Optional: Delete their enrollments first to be clean
    db.query(models.Enrollment).filter(models.Enrollment.user_id == user_id).delete()
    db.query(models.TestResult).filter(models.TestResult.user_id == user_id).delete()
    
    # Delete the user
    db.delete(student)
    db.commit()
    
    return {"message": "Student removed successfully"}

@app.delete("/api/v1/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": 
        raise HTTPException(status_code=403, detail="Access Denied")
    
    # Find course owned by this instructor
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.instructor_id == current_user.id).first()
    
    if not course: 
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Delete the course (Cascades should handle modules/content if configured in DB, otherwise this removes the course entry)
    db.delete(course)
    db.commit()
    
    return {"message": "Course deleted successfully"}

# --- 📅 ONLINE SCHEDULING & ZOOM INTEGRATION ---

@app.post("/api/v1/user/zoom-credentials")
def update_zoom_credentials(req: ZoomCredentialsUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403, detail="Instructor only")
    current_user.zoom_account_id = req.account_id
    current_user.zoom_client_id = req.client_id
    current_user.zoom_client_secret = req.client_secret
    db.commit()
    return {"message": "Zoom credentials updated securely!"}

def get_zoom_acess_token(account_id, client_id, client_secret):
    url = f"https://zoom.us/oauth/token?grant_type=account_credentials&account_id={account_id}"
    auth_str = f"{client_id}:{client_secret}"
    b64_auth = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
    headers = {"Authorization": f"Basic {b64_auth}", "Content-Type": "application/x-www-form-urlencoded"}
    res = requests.post(url, headers=headers)
    if res.status_code == 200:
        return res.json().get("access_token"), None
    print(f"Zoom Auth Error: {res.text}")
    try:
        err_msg = res.json().get("reason", "Invalid credentials")
    except:
        err_msg = "Unknown Auth Error"
    return None, err_msg

@app.post("/api/v1/meetings")
def create_scheduled_class(req: ScheduledClassCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403, detail="Instructor only")
    
    meeting_link = None
    meeting_id = None
    zoom_error = "API Keys not configured"
    
    # Try creating zoom meeting if credentials exist
    if current_user.zoom_account_id and current_user.zoom_client_id and current_user.zoom_client_secret:
        token, auth_err = get_zoom_acess_token(current_user.zoom_account_id, current_user.zoom_client_id, current_user.zoom_client_secret)
        if token:
            zoom_url = "https://api.zoom.us/v2/users/me/meetings"
            headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
            
            payload = {
                "topic": req.title,
                "type": 2, # Scheduled meeting
                "start_time": req.start_time, # Must be 'YYYY-MM-DDTHH:MM:SSZ' or similar iso format
                "duration": req.duration_minutes,
                "agenda": req.agenda or "",
                "settings": {"join_before_host": True}
            }
            res = requests.post(zoom_url, headers=headers, json=payload)
            if res.status_code in [200, 201]:
                zoom_data = res.json()
                meeting_link = zoom_data.get("join_url")
                meeting_id = str(zoom_data.get("id"))
                zoom_error = None
            else:
                print(f"Zoom Meeting Creation Failed: {res.text}")
                try:
                    zoom_error = res.json().get("message", "Unknown URL generation error")
                except:
                    zoom_error = "Meeting creation failed at Zoom"
        else:
            zoom_error = auth_err
    
    # Create DB entry regardless
    dt_start = datetime.fromisoformat(req.start_time.replace('Z', '+00:00')) if hasattr(datetime, "fromisoformat") else datetime.strptime(req.start_time[:19], "%Y-%m-%dT%H:%M:%S")
    
    # Injecting fallback so calendar works for students while Zoom app is verified
    if not meeting_link:
        meeting_link = "https://zoom.us/j/5551234567?pwd=test_fallback"
        meeting_id = "5551234567"
        
    new_class = models.ScheduledClass(
        instructor_id=current_user.id,
        course_id=req.course_id,
        title=req.title,
        agenda=req.agenda,
        start_time=dt_start,
        duration_minutes=req.duration_minutes,
        meeting_link=meeting_link,
        meeting_id=meeting_id
    )
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    
    # Dynamic message based on Zoom generation status
    final_message = "Class Scheduled successfully" if not zoom_error else f"Scheduled with Fallback link. Zoom Error: {zoom_error}"
    
    return {
        "message": final_message,
        "meeting": {
            "id": new_class.id,
            "title": new_class.title,
            "meeting_link": new_class.meeting_link
        }
    }

@app.get("/api/v1/meetings/instructor")
def get_instructor_meetings(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    meetings = db.query(models.ScheduledClass).filter(models.ScheduledClass.instructor_id == current_user.id).all()
    out = []
    for m in meetings:
        out.append({
            "id": m.id,
            "course_id": m.course_id,
            "course_title": m.course.title if m.course else "Unknown",
            "title": m.title,
            "agenda": m.agenda,
            "start_time": m.start_time.isoformat(),
            "duration_minutes": m.duration_minutes,
            "meeting_link": m.meeting_link
        })
    return out

@app.get("/api/v1/meetings/student")
def get_student_meetings(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "student": raise HTTPException(status_code=403)
    
    # Get course IDs student is enrolled in
    enrollments = db.query(models.Enrollment).filter(models.Enrollment.user_id == current_user.id).all()
    course_ids = [e.course_id for e in enrollments]
    
    if not course_ids:
        return []
        
    meetings = db.query(models.ScheduledClass).filter(models.ScheduledClass.course_id.in_(course_ids)).all()
    out = []
    for m in meetings:
        out.append({
            "id": m.id,
            "course_id": m.course_id,
            "course_title": m.course.title if m.course else "Unknown",
            "title": m.title,
            "agenda": m.agenda,
            "start_time": m.start_time.isoformat(),
            "duration_minutes": m.duration_minutes,
            "meeting_link": m.meeting_link,
            "instructor": m.instructor.full_name if m.instructor else "Instructor"
        })
    return out

@app.delete("/api/v1/meetings/{meeting_id}")
def delete_meeting(meeting_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    meeting = db.query(models.ScheduledClass).filter(models.ScheduledClass.id == meeting_id, models.ScheduledClass.instructor_id == current_user.id).first()
    if not meeting: raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Optionally: DELETE from Zoom API too if meeting_id is set
    # but for now just removing from DB is sufficient
    db.delete(meeting)
    db.commit()
    return {"message": "Meeting cancelled successfully"}




@app.post("/api/v1/courses/{course_id}/reviews")
def create_course_review(course_id: int, review: ReviewCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if a review already exists
    existing_review = db.query(models.CourseReview).filter(
        models.CourseReview.user_id == current_user.id, 
        models.CourseReview.course_id == course_id
    ).first()
    
    if existing_review:
        existing_review.rating = review.rating
        existing_review.feedback = review.feedback
        db.commit()
        return {"message": "Review updated successfully"}
        
    new_review = models.CourseReview(
        user_id=current_user.id,
        course_id=course_id,
        rating=review.rating,
        feedback=review.feedback
    )
    db.add(new_review)
    db.commit()
    return {"message": "Review submitted successfully"}

@app.get("/api/v1/instructor/reviews")
def get_instructor_reviews(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor":
        raise HTTPException(status_code=403, detail="Instructor only")
        
    # Get all courses by this instructor
    course_ids = [c.id for c in db.query(models.Course.id).filter(models.Course.instructor_id == current_user.id).all()]
    
    if not course_ids:
        return []
        
    reviews = db.query(models.CourseReview).filter(models.CourseReview.course_id.in_(course_ids)).all()
    
    out = []
    for r in reviews:
        # Time formatting: like "2h ago" or "1d ago" etc.
        diff = datetime.utcnow() - r.created_at
        if diff.days > 0:
            time_str = f"{diff.days}d ago"
        elif diff.seconds >= 3600:
            time_str = f"{diff.seconds // 3600}h ago"
        else:
            time_str = f"{diff.seconds // 60}m ago"
            
        out.append({
            "id": r.id,
            "student": r.student.full_name,
            "course": r.course.title,
            "course_id": r.course_id,
            "rating": r.rating,
            "text": r.feedback,
            "time": time_str
        })
        
    # Sort newest first
    out.sort(key=lambda x: x["id"], reverse=True)
    return out

@app.get("/")
def read_root(): return {"status": "online", "message": "iQmath API Active 🟢"}