import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'eduai.db'))

def migrate():
    print(f"Connecting to {DB_PATH}")
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    
    # 1. Existing tables
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cur.fetchall()]
    print(f"Existing tables: {tables}")
    
    # 2. Check and add columns to users
    cur.execute("PRAGMA table_info(users);")
    user_cols = [row[1] for row in cur.fetchall()]
    for col, col_type in [
        ("username", "VARCHAR(100)"),
        ("father_name", "VARCHAR(255)"),
        ("document_number", "VARCHAR(100)"),
        ("pinfl", "VARCHAR(50)"),
        ("student_id_code", "VARCHAR(100)"),
        ("education_level", "VARCHAR(50)"),
        ("position", "VARCHAR(100)"),
        ("salary", "FLOAT"),
        ("phone", "VARCHAR(50)")
    ]:
        if col not in user_cols:
            print(f"Adding {col} to users...")
            cur.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type};")

    # Eski rollarni yangi 4 ta rolga o'tkazish
    cur.execute("UPDATE users SET role='school_admin' WHERE role IN ('school_coordinator', 'district_coordinator');")

    # 3. Check and add columns to schools
    cur.execute("PRAGMA table_info(schools);")
    school_cols = [row[1] for row in cur.fetchall()]
    for col, col_type in [
        ("region", "VARCHAR(100)"),
        ("district_name", "VARCHAR(120)"),
        ("address", "VARCHAR(255)"),
        ("director_name", "VARCHAR(200)"),
        ("director_phone", "VARCHAR(50)"),
        ("phone", "VARCHAR(50)"),
        ("student_quota", "INTEGER"),
        ("teacher_quota", "INTEGER")
    ]:
        if col not in school_cols:
            print(f"Adding {col} to schools...")
            cur.execute(f"ALTER TABLE schools ADD COLUMN {col} {col_type};")

    # 4. Check and add columns to assignments
    if "assignments" in tables:
        cur.execute("PRAGMA table_info(assignments);")
        assign_cols = [row[1] for row in cur.fetchall()]
        for col, col_type in [
            ("instructions", "TEXT"),
            ("start_date", "DATETIME"),
            ("due_date", "DATETIME")
        ]:
            if col not in assign_cols:
                print(f"Adding {col} to assignments...")
                cur.execute(f"ALTER TABLE assignments ADD COLUMN {col} {col_type};")

    # 5. Check and add columns to assignment_questions
    if "assignment_questions" in tables:
        cur.execute("PRAGMA table_info(assignment_questions);")
        aq_cols = [row[1] for row in cur.fetchall()]
        for col, col_type in [
            ("question_text", "TEXT"),
            ("question_type", "VARCHAR(50)"),
            ("options_json", "TEXT"),
            ("correct_answer", "VARCHAR(255)"),
            ("image_url", "VARCHAR(500)"),
            ("points", "INTEGER")
        ]:
            if col not in aq_cols:
                print(f"Adding {col} to assignment_questions...")
                cur.execute(f"ALTER TABLE assignment_questions ADD COLUMN {col} {col_type};")

    # 6. Check and add columns to submissions
    if "submissions" in tables:
        cur.execute("PRAGMA table_info(submissions);")
        sub_cols = [row[1] for row in cur.fetchall()]
        for col, col_type in [
            ("percentage", "FLOAT"),
            ("teacher_grade", "FLOAT"),
            ("teacher_feedback", "TEXT")
        ]:
            if col not in sub_cols:
                print(f"Adding {col} to submissions...")
                cur.execute(f"ALTER TABLE submissions ADD COLUMN {col} {col_type};")

    # 7. Check and add columns to notifications
    if "notifications" in tables:
        cur.execute("PRAGMA table_info(notifications);")
        notif_cols = [row[1] for row in cur.fetchall()]
        if "link" not in notif_cols:
            print("Adding link to notifications...")
            cur.execute("ALTER TABLE notifications ADD COLUMN link VARCHAR(255);")

    # 8. Check and add columns to account_requests
    if "account_requests" in tables:
        cur.execute("PRAGMA table_info(account_requests);")
        req_cols = [row[1] for row in cur.fetchall()]
        for col, col_type in [
            ("region", "VARCHAR(100)"),
            ("district", "VARCHAR(100)"),
            ("school_name", "VARCHAR(255)")
        ]:
            if col not in req_cols:
                print(f"Adding {col} to account_requests...")
                cur.execute(f"ALTER TABLE account_requests ADD COLUMN {col} {col_type};")

    # 9. Check and add columns to teacher_contents
    if "teacher_contents" in tables:
        cur.execute("PRAGMA table_info(teacher_contents);")
        tc_cols = [row[1] for row in cur.fetchall()]
        for col, col_type in [
            ("class_id", "INTEGER"),
            ("is_for_all_classes", "BOOLEAN")
        ]:
            if col not in tc_cols:
                print(f"Adding {col} to teacher_contents...")
                cur.execute(f"ALTER TABLE teacher_contents ADD COLUMN {col} {col_type};")

    con.commit()
    con.close()
    print("Migration check complete.")

if __name__ == "__main__":
    migrate()
