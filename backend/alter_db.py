import sqlite3
import os

def alter_db():
    try:
        db_path = os.path.join(os.path.dirname(__file__), 'lms.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN status VARCHAR DEFAULT 'Active'")
            print("Added status column")
        except Exception as e:
            print("Status:", e)
            
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN temp_password VARCHAR")
            print("Added temp_password column")
        except Exception as e:
            print("temp_password:", e)
            
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP")
        except Exception as e:
            pass

        try:
            cursor.execute("UPDATE users SET status = 'Active' WHERE status IS NULL")
        except:
            pass

        conn.commit()
        conn.close()
        print("Success")
    except Exception as e:
        print("Global Error:", e)

if __name__ == "__main__":
    alter_db()
