import mysql.connector
import mysql.connector.pooling
import os
from dotenv import load_dotenv
from fastapi import HTTPException
import logging

load_dotenv()

# تنظیم لاگینگ ساده
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Connection Pool
pool = None

def get_pool():
    global pool
    if pool is None:
        try:
            pool = mysql.connector.pooling.MySQLConnectionPool(
                pool_name="mypool",
                pool_size=5,
                pool_reset_session=True,
                host=os.getenv("DB_HOST", "localhost"),
                port=int(os.getenv("DB_PORT", "3306")),
                user=os.getenv("DB_USER", "root"),
                password=os.getenv("DB_PASSWORD", ""),
                database=os.getenv("DB_NAME", "OnlineSchoolDB"),
                use_pure=True,
                autocommit=True  # <-- FIX: auto-commit each statement/procedure call
            )
            logger.info("Connection pool created successfully")
        except Exception as e:
            logger.error(f"Failed to create connection pool: {e}")
            raise
    return pool

def get_connection():
    try:
        pool = get_pool()
        conn = pool.get_connection()
        conn.autocommit = True  # <-- FIX: ensure each pooled connection also has autocommit on
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")

def call_stored_procedure(proc_name: str, params: dict = None, return_single: bool = False):
    """
    Execute a stored procedure and return a list of result sets.
    Each result set is a list of dicts.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    all_results = []  # list of result sets (each result set is a list of rows)
    try:
        if params:
            placeholders = ",".join(["%s"] * len(params))
            sql = f"CALL {proc_name}({placeholders})"
            results_gen = cursor.execute(sql, tuple(params.values()), multi=True)
        else:
            results_gen = cursor.execute(f"CALL {proc_name}()", multi=True)

        for result in results_gen:
            if result.with_rows:
                rows = result.fetchall()
                all_results.append(rows)   # هر result set به عنوان یک لیست مجزا اضافه می‌شود
            else:
                # برای دستورات UPDATE/INSERT که ردیف ندارند، یک لیست خالی اضافه می‌کنیم
                all_results.append([])

        # FIX: commit so writes performed inside the procedure are persisted
        conn.commit()

        if return_single and all_results and all_results[0]:
            return all_results[0][0]   # اولین ردیف از اولین result set
        return all_results
    except mysql.connector.Error as err:
        conn.rollback()
        logger.error(f"Procedure error: {err}")
        raise HTTPException(status_code=500, detail=f"Procedure error: {err}")
    finally:
        cursor.close()
        conn.close()

def execute_query(query: str, params: dict = None):
    """
    Execute a raw SQL query (for simple SELECTs).
    Use %s placeholders. Returns list of dicts.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if params:
            cursor.execute(query, list(params.values()))
        else:
            cursor.execute(query)

        if cursor.description:
            rows = cursor.fetchall()
        else:
            rows = []

        # FIX: commit so UPDATE/INSERT/DELETE raw queries are persisted
        conn.commit()
        return rows
    except mysql.connector.Error as err:
        conn.rollback()
        logger.error(f"Query error: {err}")
        raise HTTPException(status_code=500, detail=f"Query error: {err}")
    finally:
        cursor.close()
        conn.close()