import sqlite3

conn = sqlite3.connect('lms.db')
cur = conn.cursor()

cur.execute("PRAGMA table_info(test_results)")
cols = [r[1] for r in cur.fetchall()]
print("Existing columns:", cols)

if 'status' not in cols:
    cur.execute("ALTER TABLE test_results ADD COLUMN status TEXT DEFAULT 'submitted'")
    conn.commit()
    print("✅ Added 'status' column to test_results")
else:
    print("✅ Column 'status' already exists")

conn.close()
