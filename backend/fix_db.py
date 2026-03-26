import sqlite3
import os
import bcrypt
import string
import random

def generate_random_password(length=8):
    characters = string.ascii_letters + string.digits + "!@#$"
    return ''.join(random.choice(characters) for i in range(length))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def fix_passwords():
    db_path = os.path.join(os.path.dirname(__file__), 'lms.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all users with NULL or empty temp_password
    cursor.execute("SELECT id, email FROM users WHERE temp_password IS NULL OR temp_password = '' OR temp_password = 'None'")
    users = cursor.fetchall()
    
    for user_id, email in users:
        new_pass = generate_random_password()
        hashed = get_password_hash(new_pass)
        print(f"Assigning new pass for {email}: {new_pass}")
        
        cursor.execute("UPDATE users SET temp_password = ?, hashed_password = ? WHERE id = ?", (new_pass, hashed, user_id))
        
    conn.commit()
    conn.close()
    print("Database passwords seeded successfully.")

if __name__ == "__main__":
    fix_passwords()
