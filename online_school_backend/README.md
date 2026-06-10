# Online School Management System - Backend API

An online school management system with FastAPI and MySQL.

## Prerequisites

- Python 3.10 or higher
- MySQL Server 8.0 (or Docker)
- MySQL Connector (installed via `requirements.txt`)

## Installation & Setup

### 1. Clone the project

```bash
git clone https://github.com/kasrafouladi/LMS
cd LMS/online_school_backend
```

### 2. Create a virtual environment (recommended)

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Install MySQL Server

#### On Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation   # set root password
```

#### Using Docker

```bash
sudo docker run --name mysql_lms -e MYSQL_ROOT_PASSWORD=YourStrongPassword123 -p 1433:3306 -d mysql:8.0
```

### 5. Create the database

Run the provided SQL script (the MySQL version you already have):

```bash
mysql -h localhost -P 1433 -u root -p < online_school.sql
```

> If you set a different port or password, adjust accordingly.

### 6. Environment configuration

Create a `.env` file in the project root with the following content:

```env
DB_HOST=localhost
DB_PORT=1433
DB_USER=root
DB_PASSWORD=YourMySQLPassword
DB_NAME=OnlineSchoolDB

JWT_SECRET_KEY=YourSuperSecretKeyAtLeast32CharactersLong
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=720
```

### 7. Run the server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Project Structure

```
online_school_backend/
├── app/
│   ├── __init__.py
│   ├── database.py          # MySQL connector
│   ├── auth.py
│   ├── dependencies.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── courses.py
│   │   ├── enrollments.py
│   │   ├── assignments.py
│   │   ├── attendance.py
│   │   ├── certificates.py
│   │   ├── payments.py
│   │   ├── reports.py
│   │   └── views.py
│   └── models/
│       └── schemas.py
├── main.py
├── requirements.txt
├── .env
└── README.md
```

## API Endpoints

### Authentication
- `POST /auth/login` – Login
- `POST /auth/register` – Register new user
- `GET /auth/me` – Current user info

### Users
- `GET /users/profile` – Profile
- `PUT /users/profile` – Update profile
- `GET /users/payments` – My payments
- `GET /users/grades` – My grades
- `GET /users/admin/users` – List users (admin only)
- `PUT /users/admin/users/{user_id}/status` – Update user status (admin only)

### Courses
- `GET /courses/` – List courses
- `GET /courses/{course_id}` – Course details
- `POST /courses/` – Create course (teacher only)
- `PUT /courses/{course_id}` – Update course (teacher/admin)
- `DELETE /courses/{course_id}` – Delete course (teacher/admin)
- `GET /courses/{course_id}/assignments` – Course assignments

### Enrollments
- `POST /enrollments/enroll` – Enroll in course
- `POST /enrollments/cancel` – Cancel enrollment

### Assignments
- `POST /assignments/submit` – Submit assignment
- `POST /assignments/grade` – Grade submission (teacher only)
- `POST /assignments/create` – Create assignment (teacher only)
- `PUT /assignments/update/{assignment_id}` – Update assignment (teacher only)
- `DELETE /assignments/delete/{assignment_id}` – Delete assignment (teacher only)

### Attendance
- `POST /attendance/record` – Record attendance (teacher/admin)

### Certificates
- `POST /certificates/issue` – Issue certificates (teacher/admin)

### Payments
- `GET /payments/` – List payments
- `GET /payments/{payment_id}` – Payment details
- `POST /payments/retry/{payment_id}` – Retry failed payment
- `GET /payments/admin/all` – All payments (admin only)
- `GET /payments/admin/summary` – Financial summary (admin only)

### Reports
- `GET /reports/top-students` – Top students
- `GET /reports/teacher-income` – Teacher income
- `GET /reports/popular-courses` – Popular courses
- `GET /reports/course-enrollments` – Enrollment statistics
- `GET /reports/inactive-students` – Inactive students
- `GET /reports/failed-payments` – Failed payments
- `GET /reports/course-grades` – Course grades
- `GET /reports/attendance` – Attendance report
- `GET /reports/monthly-income` – Monthly income
- `GET /reports/teacher-ranking` – Teacher ranking

### Views
- `GET /views/student-transcript` – Student transcript
- `GET /views/teacher-dashboard` – Teacher dashboard
- `GET /views/course-statistics` – Course statistics
- `GET /views/financial-summary` – Financial summary
- `GET /views/student-certificates` – Student certificates

## Roles & Permissions

- **Admin**: Full access to everything.
- **Teacher**: Manage own courses, grade submissions, record attendance.
- **Student**: Enroll in courses, submit assignments, view grades and certificates.

## Troubleshooting

### MySQL connection refused
- Ensure MySQL is running: `sudo systemctl status mysql` (or `docker ps`)
- Check the port (default 3306, but you configured 1433). Use correct port in `.env`.

### Module `mysql.connector` not found
- Install the connector: `pip install mysql-connector-python`

### Access denied for user
- Verify credentials in `.env`
- If you have no password, set `DB_PASSWORD=` (empty) and ensure the MySQL user allows empty password.

### Stored procedure not found
- Make sure you executed the complete MySQL script (`online_school.sql`) that creates all procedures.

## Testing the API

Swagger UI is available at:
```
http://localhost:8000/docs
```

## Sample Login Credentials

> Note: Passwords in the sample database are hashed. It's easier to register a new user first.

- **Admin**: `admin@onlineschool.test` (password is hashed – register a new admin or check the hash in DB)
- **Teacher**: `alice.teacher@onlineschool.test`
- **Student**: `john.student@onlineschool.test`

## Development

To run in development mode with auto-reload:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```