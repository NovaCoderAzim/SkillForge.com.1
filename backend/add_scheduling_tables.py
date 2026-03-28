import sqlite3
import os
import sys

# Ensure models are loaded to create tables
try:
    from database import engine, Base
    import models
    # This will safely create any new tables (like scheduled_classes)
    Base.metadata.create_all(bind=engine)
    print("Base metadata check passed. New tables like `scheduled_classes` created if they didn't exist.")
except Exception as e:
    print(f"Error creating metadata tables: {e}")

def alter_db():
    try:
        db_path = os.path.join(os.path.dirname(__file__), 'lms.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        columns_to_add = [
            ("zoom_account_id", "VARCHAR"),
            ("zoom_client_id", "VARCHAR"),
            ("zoom_client_secret", "VARCHAR")
        ]

        for col_name, col_type in columns_to_add:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                print(f"Added {col_name} column to users")
            except Exception as e:
                # Typically means column already exists
                print(f"Column {col_name} add result: {e}")
                
        conn.commit()
        conn.close()
        print("Success adding Zoom columns to users table.")
    except Exception as e:
        print("Global Error:", e)

if __name__ == "__main__":
    alter_db()
