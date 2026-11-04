#!/usr/bin/env python3
"""
Change the password for the Academic Admin Portal
"""

import sqlite3
import hashlib
import secrets
import getpass
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'publications.db')

def change_password():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    username = input("Enter admin username [default: prithish]: ").strip() or "prithish"
    password = getpass.getpass("Enter new password: ")
    confirm = getpass.getpass("Confirm new password: ")

    if password != confirm:
        print("❌ Passwords do not match!")
        return

    if len(password) < 6:
        print("❌ Password must be at least 6 characters.")
        return

    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

    cur.execute('''
    INSERT INTO admin_users (username, password_hash, salt) 
    VALUES (?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash, salt=excluded.salt
    ''', (username, hashed, salt))

    conn.commit()
    conn.close()
    print(f"✔ Password for user '{username}' updated successfully.")

if __name__ == '__main__':
    change_password()

