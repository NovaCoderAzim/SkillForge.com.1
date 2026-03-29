import sqlite3
import os

def create_reviews_table():
    try:
        db_path = os.path.join(os.path.dirname(__file__), 'lms.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS course_reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                course_id INTEGER,
                rating INTEGER,
                feedback TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(course_id) REFERENCES courses(id)
            )
        """)
        
        # Check if table already had data or not, just safely creating it
        print("course_reviews table ensured safely without disturbing existing data.")
        
        conn.commit()
        conn.close()
    except Exception as e:
        print("Error creating reviews table:", e)

if __name__ == "__main__":
    create_reviews_table()
