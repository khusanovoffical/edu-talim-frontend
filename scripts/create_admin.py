#!/usr/bin/env python3
"""
EduAI + IT Yoshlar — Xavfsiz birinchi administrator hisobini yaratish skripti (CLI)
Ishlatish:
  python scripts/create_admin.py --email admin@maktab.uz --name "Ism Familiya"
"""
import argparse
import getpass
import sqlite3
import secrets
import hashlib
from datetime import datetime, timezone


def hash_pw(password: str) -> str:
    salt = secrets.token_hex(16)
    derived = hashlib.scrypt(password.encode("utf-8"), salt=salt.encode("utf-8"), n=16384, r=8, p=1, dklen=64)
    return f"scrypt${salt}${derived.hex()}"


def main():
    parser = argparse.ArgumentParser(description="EduAI birinchi administrator hisobini xavfsiz yaratish")
    parser.add_argument("--db", default="./data/eduai.sqlite", help="SQLite baza fayli manzili")
    parser.add_argument("--email", required=True, help="Administrator elektron pochtasi")
    parser.add_argument("--name", required=True, help="Administrator ism va familiyasi")
    args = parser.parse_args()

    password = getpass.getpass("Yangi administrator parolini kiriting (kamida 8 ta belgi): ")
    if len(password) < 8:
        raise SystemExit("Xatolik: Parol kamida 8 ta belgidan iborat bo'lishi shart!")

    conn = sqlite3.connect(args.db)
    cur = conn.cursor()
    admin_id = f"user-admin-{secrets.token_hex(4)}"
    now = datetime.now(timezone.utc).isoformat()
    cur.execute(
        """
        INSERT INTO users (id, school_id, district_id, email, full_name, password_hash, role, is_active, created_at)
        VALUES (?, 'school-145', 'dist-chilonzor', ?, ?, ?, 'admin', 1, ?)
        """,
        (admin_id, args.email.lower(), args.name, hash_pw(password), now),
    )
    conn.commit()
    conn.close()
    print(f"Muvaffaqiyatli! Administrator yaratildi: {args.email} (ID: {admin_id})")


if __name__ == "__main__":
    main()
