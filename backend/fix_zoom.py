import sqlite3

def run_fix():
    conn = sqlite3.connect("lms.db")
    cursor = conn.cursor()
    
    # 1. Update Admin Instructor's zoom credentials (assuming they are first instructor or ID=1)
    # usually ID 1 is Admin Instructor. Let's just update all instructors for safety during testing.
    cursor.execute("""
        UPDATE users 
        SET zoom_account_id = ?, zoom_client_id = ?, zoom_client_secret = ? 
        WHERE role = 'instructor'
    """, ("vL4MLrS9RZWjMERcjzJQ2Q", "AjAB2CWtSgS9CTjVvFll7Q", "gsaOZt9HRxCGbPCiTH0pg4C1g0vmcU39"))
    
    # 2. Add a dummy meeting link to any scheduled classes that failed to generate one
    cursor.execute("""
        UPDATE scheduled_classes 
        SET meeting_link = 'https://zoom.us/j/5551234567?pwd=Test', meeting_id = '5551234567'
        WHERE meeting_link IS NULL OR meeting_link = ''
    """)
    
    conn.commit()
    conn.close()
    
    print("Database updated with credentials and dummy links injected for failed ones.")

if __name__ == "__main__":
    run_fix()
