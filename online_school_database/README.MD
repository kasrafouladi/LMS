# Online School Database – MySQL Setup Guide

This guide explains how to set up the MySQL database for the Online School Management System from zero.

## Prerequisites

- **MySQL Server 8.0** or higher (or Docker)
- **Command line** (Linux/macOS/Windows WSL)
- **Git** (to clone the repository) or direct download of the SQL script

## Step 1: Install MySQL Server

### Option A: Native installation on Ubuntu/Debian

```bash
sudo apt update
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Option B: Using Docker (any OS)

```bash
sudo docker run --name mysql_online_school -e MYSQL_ROOT_PASSWORD=YourStrongPassword123 -p 3306:3306 -d mysql:8.0
```

> **Note:** The default MySQL port is `3306`. The backend uses port `3306` (not `1433`). If you need a different port, adjust the `DB_PORT` in the backend `.env` file.

## Step 2: Download the SQL script

Clone the repository (or download `online_school.sql` manually):

```bash
git clone https://github.com/kasrafouladi/LMS
cd LMS/online_school_database
```

The file `online_school.sql` contains all tables, stored procedures, triggers, views, sample data, and test cases.

## Step 3: Run the SQL script

### If you have a root password (or empty)

```bash
mysql -u root -p < online_school.sql
```

Press Enter when prompted for password (if none, just press Enter).

### If you are using `sudo` (Ubuntu default with auth_socket)

```bash
sudo mysql < online_school.sql
```

### With Docker (container running)

```bash
sudo docker exec -i mysql_online_school mysql -u root -pYourStrongPassword123 < online_school.sql
```

## Step 4: Verify the database

Connect to MySQL and check:

```bash
sudo mysql -u root
```

Then run:

```sql
USE OnlineSchoolDB;
SHOW TABLES;
SELECT COUNT(*) FROM `User`;
SELECT COUNT(*) FROM Course;
CALL sp_UpdateCourseStatus();
```

You should see the tables and some sample data.

## Step 5: Create a dedicated application user (recommended)

For security, create a MySQL user that the backend will use (instead of `root`).

```sql
CREATE USER 'lms_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Lms@2024Secure!';
GRANT ALL PRIVILEGES ON OnlineSchoolDB.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
```

If your MySQL password policy rejects the password, use a stronger one or lower the policy temporarily (for testing only):

```sql
SET GLOBAL validate_password.policy = LOW;
SET GLOBAL validate_password.length = 4;
-- then create user
```

## Step 6: Test connection from Python (backend)

Create a test script `test_db.py`:

```python
import mysql.connector
conn = mysql.connector.connect(
    host="127.0.0.1",
    port=3306,
    user="lms_user",
    password="Lms@2024Secure!",
    database="OnlineSchoolDB"
)
print("Connected successfully")
conn.close()
```

Run it:

```bash
python3 test_db.py
```

## Step 7: Backend environment variables

Create a `.env` file in the backend folder with these values:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=lms_user
DB_PASSWORD=Lms@2024Secure!
DB_NAME=OnlineSchoolDB

JWT_SECRET_KEY=YourSuperSecretKeyAtLeast32CharactersLong
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=720
```

> **Important:** Use `127.0.0.1` instead of `localhost` to avoid Unix socket issues.

## Common issues and solutions

### `ERROR 1819 (HY000): Your password does not satisfy current policy requirements`

Use a stronger password (e.g., `Lms@2024Secure!`) or lower the policy:

```sql
SET GLOBAL validate_password.policy = LOW;
SET GLOBAL validate_password.length = 4;
```

### `Access denied for user 'root'@'localhost'`

This happens on Ubuntu because root uses `auth_socket`. Either use `sudo mysql` or create a dedicated user as shown in Step 5.

### `ERROR 2003: Can't connect to MySQL server on 'localhost:3306'`

Ensure MySQL is running:

```bash
sudo systemctl status mysql   # native
sudo docker ps                 # Docker
```

### `ERROR 1045: Access denied for user 'lms_user'`

Recreate the user with `mysql_native_password`:

```sql
DROP USER IF EXISTS 'lms_user'@'localhost';
CREATE USER 'lms_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Lms@2024Secure!';
GRANT ALL PRIVILEGES ON OnlineSchoolDB.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
```

## What the SQL script does

- Drops any existing `OnlineSchoolDB` and creates a fresh one.
- Creates all tables (`User`, `Student`, `Teacher`, `Course`, `Enrollment`, `Assignment`, `Submission`, `Attendance`, `Payment`, `Certificate`, `FinancialReportLog`).
- Inserts sample data (users, courses, enrollments, payments, submissions, attendance).
- Creates stored procedures (e.g., `sp_EnrollStudentInCourse`, `sp_SubmitAssignment`, `sp_GradeSubmission`, all reports and views).
- Creates triggers (validation of scores, capacity, GPA recalculation, attendance date).
- Creates views (`vw_StudentTranscript`, `vw_TeacherDashboard`, etc.).
- Runs test cases automatically at the end.

## Next steps

After the database is set up, go to the `online_school_backend` folder and run the FastAPI server:

```bash
cd ../online_school_backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Then open `http://localhost:8000/docs` to test the API.