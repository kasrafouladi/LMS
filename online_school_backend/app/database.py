import pyodbc
import os
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

def get_connection_string():
    if os.getenv("DB_TRUSTED_CONNECTION", "").lower() == "yes":
        return (
            f"DRIVER={{{os.getenv('DB_DRIVER')}}};"
            f"SERVER={os.getenv('DB_SERVER')};"
            f"DATABASE={os.getenv('DB_NAME')};"
            "Trusted_Connection=yes;"
            "TrustServerCertificate=yes;"
        )
    else:
        return (
            f"DRIVER={{{os.getenv('DB_DRIVER')}}};"
            f"SERVER={os.getenv('DB_SERVER')};"
            f"DATABASE={os.getenv('DB_NAME')};"
            f"UID={os.getenv('DB_USER')};"
            f"PWD={os.getenv('DB_PASSWORD')};"
            "TrustServerCertificate=yes;"
        )

def get_db_connection():
    try:
        conn = pyodbc.connect(get_connection_string(), timeout=5)
        return conn
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def call_stored_procedure(proc_name: str, params: dict = None, return_single: bool = False):
    """Execute a stored procedure and return list of dicts."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if params:
            placeholders = ",".join(["?"] * len(params))
            sql = f"SET NOCOUNT ON; EXEC {proc_name} {placeholders};"
            cursor.execute(sql, tuple(params.values()))
        else:
            cursor.execute(f"SET NOCOUNT ON; EXEC {proc_name};")
        
        # Fetch all result sets (multiple SELECTs)
        results = []
        while True:
            if cursor.description:
                columns = [col[0] for col in cursor.description]
                rows = cursor.fetchall()
                for row in rows:
                    results.append(dict(zip(columns, row)))
            if not cursor.nextset():
                break
        if return_single and results:
            return results[0]
        return results

def execute_query(query: str, params: dict = None):
    """Execute a raw SQL query (for simple SELECTs)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if params:
            cursor.execute(query, tuple(params.values()))
        else:
            cursor.execute(query)
        if cursor.description:
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            return [dict(zip(columns, row)) for row in rows]
        return []