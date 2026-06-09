# Online School Management System - Backend API

یک سیستم مدیریت مدرسه آنلاین با FastAPI و SQL Server

## پیش‌نیازها

- Python 3.10 یا بالاتر
- SQL Server 2022 (یا Docker)
- ODBC Driver 18 for SQL Server

## نصب و راه‌اندازی

### 1. کلون کردن پروژه

```bash
git clone https://github.com/kasrafouladi/LMS
cd LMS/online_school_backend
```

### 2. ایجاد محیط مجازی (توصیه شده)

```bash
python -m venv venv
source venv/bin/activate  # در لینوکس/Mac
# یا
venv\Scripts\activate  # در ویندوز
```

### 3. نصب وابستگی‌ها

```bash
pip install -r requirements.txt
```

### 4. نصب SQL Server و درایورها

#### در لینوکس (اوبونتو):

```bash
# نصب unixODBC
sudo apt update
sudo apt install -y unixodbc unixodbc-dev

# نصب درایور Microsoft ODBC
curl https://packages.microsoft.com/keys/microsoft.asc | sudo tee /etc/apt/trusted.gpg.d/microsoft.asc
curl https://packages.microsoft.com/config/ubuntu/22.04/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list
sudo apt update
sudo ACCEPT_EULA=Y apt install -y msodbcsql18
```

#### با Docker:

```bash
cd ../online_school_db
sudo docker run -e "ACCEPT_EULA=Y" \
  -e "MSSQL_SA_PASSWORD=YourStrongPassword123" \
  -e "MSSQL_PID=Developer" \
  -p 1433:1433 \
  --name sqlserver_lms \
  -d mcr.microsoft.com/mssql/server:2022-latest
```

### 5. ایجاد دیتابیس

فایل SQL را اجرا کنید:

```bash
sqlcmd -S localhost -U SA -P 'YourStrong!Password123' -i online_school_full_project.sql
```

### 6. تنظیم فایل محیطی

فایل `.env` را با محتوای زیر ایجاد کنید:

```env
DB_DRIVER=ODBC Driver 18 for SQL Server
DB_SERVER=localhost
DB_NAME=OnlineSchoolDB
DB_TRUSTED_CONNECTION=no
DB_USER=sa
DB_PASSWORD=YourStrongPassword123
JWT_SECRET_KEY=YourSuperSecretKeyAtLeast32CharactersLong
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=720
```

### 7. اجرای سرور

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## ساختار پروژه

```
online_school_backend/
├── app/
│   ├── __init__.py
│   ├── database.py
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

### احراز هویت
- `POST /auth/login` - ورود به سیستم
- `POST /auth/register` - ثبت نام کاربر جدید
- `GET /auth/me` - اطلاعات کاربر جاری

### کاربران
- `GET /users/profile` - پروفایل کاربر
- `PUT /users/profile` - ویرایش پروفایل
- `GET /users/payments` - پرداخت‌های من
- `GET /users/grades` - نمرات من
- `GET /users/admin/users` - لیست کاربران (فقط ادمین)
- `PUT /users/admin/users/{user_id}/status` - تغییر وضعیت کاربر (فقط ادمین)

### دوره‌ها
- `GET /courses/` - لیست دوره‌ها
- `GET /courses/{course_id}` - جزئیات دوره
- `POST /courses/` - ایجاد دوره (فقط استاد)
- `PUT /courses/{course_id}` - ویرایش دوره (استاد/ادمین)
- `DELETE /courses/{course_id}` - حذف دوره (استاد/ادمین)
- `GET /courses/{course_id}/assignments` - تکالیف دوره

### ثبت نام
- `POST /enrollments/enroll` - ثبت نام در دوره
- `POST /enrollments/cancel` - انصراف از دوره

### تکالیف
- `POST /assignments/submit` - ارسال تکلیف
- `POST /assignments/grade` - نمره دهی (فقط استاد)
- `POST /assignments/create` - ایجاد تکلیف (فقط استاد)
- `PUT /assignments/update/{assignment_id}` - ویرایش تکلیف (فقط استاد)
- `DELETE /assignments/delete/{assignment_id}` - حذف تکلیف (فقط استاد)

### حضور و غیاب
- `POST /attendance/record` - ثبت حضور و غیاب (فقط استاد/ادمین)

### گواهی‌ها
- `POST /certificates/issue` - صادر کردن گواهی (فقط استاد/ادمین)

### پرداخت‌ها
- `GET /payments/` - لیست پرداخت‌ها
- `GET /payments/{payment_id}` - جزئیات پرداخت
- `POST /payments/retry/{payment_id}` - تلاش مجدد پرداخت
- `GET /payments/admin/all` - همه پرداخت‌ها (فقط ادمین)
- `GET /payments/admin/summary` - خلاصه مالی (فقط ادمین)

### گزارشات
- `GET /reports/top-students` - دانشجویان برتر
- `GET /reports/teacher-income` - درآمد اساتید
- `GET /reports/popular-courses` - دوره‌های محبوب
- `GET /reports/course-enrollments` - آمار ثبت نام
- `GET /reports/inactive-students` - دانشجویان غیرفعال
- `GET /reports/failed-payments` - پرداخت‌های ناموفق
- `GET /reports/course-grades` - نمرات دوره
- `GET /reports/attendance` - گزارش حضور و غیاب
- `GET /reports/monthly-income` - درآمد ماهانه
- `GET /reports/teacher-ranking` - رتبه‌بندی اساتید

### ویوها
- `GET /views/student-transcript` - کارنامه دانشجو
- `GET /views/teacher-dashboard` - داشبورد استاد
- `GET /views/course-statistics` - آمار دوره‌ها
- `GET /views/financial-summary` - خلاصه مالی
- `GET /views/student-certificates` - گواهی‌های دانشجو

## نقش‌ها و دسترسی‌ها

- **Admin**: دسترسی کامل به همه امکانات
- **Teacher**: مدیریت دوره‌های خود، نمره دهی، ثبت حضور و غیاب
- **Student**: ثبت نام در دوره، ارسال تکلیف، مشاهده نمرات و گواهی‌ها

## عیب‌یابی

### خطای `libodbc.so.2: cannot open shared object file`

```bash
sudo apt install -y unixodbc unixodbc-dev
sudo ACCEPT_EULA=Y apt install -y msodbcsql18
```

### خطای `No module named '_cffi_backend'`

```bash
pip uninstall cryptography cffi -y
pip install --force-reinstall cryptography==41.0.7 cffi==1.16.0
```

### خطای اتصال به دیتابیس

- مطمئن شوید SQL Server در حال اجراست:
  ```bash
  sudo systemctl status mssql-server  # برای نصب مستقیم
  sudo docker ps  # برای داکر
  ```
- بررسی کنید رمز عبور در `.env` درست باشد

## تست API

می‌توانید با استفاده از Swagger UI تست کنید:
```
http://localhost:8000/docs
```

## لاگین با کاربران نمونه

- **ادمین**: `admin@onlineschool.test` / `HASH_ADMIN_001` (توجه: این پسورد هش شده است، باید از دیتابیس هش واقعی را ببینید یا کاربر جدید بسازید)
- **استاد**: `alice.teacher@onlineschool.test`
- **دانشجو**: `john.student@onlineschool.test`

> **نکته**: پسوردهای نمونه در دیتابیس به صورت هش ذخیره شده‌اند. برای لاگین بهتر است اول یک کاربر جدید ثبت نام کنید.

## توسعه

برای اجرا در حالت توسعه:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```