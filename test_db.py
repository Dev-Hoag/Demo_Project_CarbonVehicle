#!/usr/bin/env python3
import pymysql
import os

print("Testing MySQL connection...")
print(f"DB_HOST: {os.getenv('DB_HOST', 'mysql')}")
print(f"DB_USER: {os.getenv('DB_USER', 'certuser')}")
print(f"DB_NAME: {os.getenv('DB_NAME', 'certificate_service_db')}")

try:
    conn = pymysql.connect(
        host=os.getenv('DB_HOST', 'mysql'),
        port=int(os.getenv('DB_PORT', '3306')),
        user=os.getenv('DB_USER', 'certuser'),
        password=os.getenv('DB_PASSWORD', 'certpassword'),
        database=os.getenv('DB_NAME', 'certificate_service_db')
    )
    print("✅ Connection successful!")
    cursor = conn.cursor()
    cursor.execute("SELECT VERSION()")
    version = cursor.fetchone()
    print(f"MySQL version: {version[0]}")
    conn.close()
except Exception as e:
    print(f"❌ Connection failed: {e}")
    import traceback
    traceback.print_exc()
