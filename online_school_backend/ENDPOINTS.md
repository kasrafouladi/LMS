# Online School API Documentation (Final)

**Base URL:** `http://localhost:8000`  
**Authentication:** JWT Bearer token (except for public endpoints).  
**Token header:** `Authorization: Bearer <your_access_token>`

All endpoints that require a token will return `401` if token missing/invalid.  
Role-based access (`Admin`, `Teacher`, `Student`) is enforced as described.

---

## Authentication (No token required)

### `POST /auth/register`
Register a new user. Only `Student` or `Teacher` roles are allowed (Admin cannot register via API).

**curl:**
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "secret123",
    "phone_number": "09123456789",
    "role": "Student",
    "date_of_birth": "2000-01-01"
  }'
```

**Response (200 OK):**
```json
{
  "message": "User registered successfully",
  "user_id": 13,
  "role": "Student"
}
```

---

### `POST /auth/login`
Login and receive an access token.

**curl:**
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secret123"
  }'
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "role": "Student"
}
```

---

### `GET /auth/me`
Get current user info from token.

**curl:**
```bash
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "sub": "13",
  "email": "john@example.com",
  "fullname": "John Doe",
  "role": "Student",
  "exp": 1781120836
}
```

---

## Users

### `GET /users/profile`
Get profile of logged-in user.

**curl:**
```bash
curl -X GET "http://localhost:8000/users/profile" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "UserID": 13,
  "FullName": "John Doe",
  "Email": "john@example.com",
  "Role": "Student",
  "PhoneNumber": "09123456789",
  "RegistrationDate": "2025-06-10T12:00:00"
}
```

---

### `PUT /users/profile`
Update profile (all fields optional).

**curl:**
```bash
curl -X PUT "http://localhost:8000/users/profile" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Updated",
    "phone_number": "09876543210",
    "password": "newpass123"
  }'
```

**Response (200 OK):**
```json
{
  "message": "Profile updated"
}
```

---

### `GET /users/payments`
Get payments of logged-in student (or all if admin).

**curl:**
```bash
curl -X GET "http://localhost:8000/users/payments" \
  -H "Authorization: Bearer <student_token>"
```

**Response (200 OK):**
```json
[
  {
    "PaymentID": 1,
    "CourseID": 5,
    "CourseTitle": "Algorithms",
    "Amount": 1400.00,
    "PaymentDate": "2025-06-10T10:00:00",
    "Status": "Successful",
    "TransactionID": "TXN-123"
  }
]
```

---

### `GET /users/grades`
Get grades (courses and assignments) for logged-in student.

**curl:**
```bash
curl -X GET "http://localhost:8000/users/grades" \
  -H "Authorization: Bearer <student_token>"
```

**Response (200 OK):**
```json
{
  "courses": [
    {
      "CourseID": 5,
      "CourseTitle": "Algorithms",
      "FinalScore": 18.5,
      "EnrollmentStatus": "Successful"
    }
  ],
  "assignments": [
    {
      "AssignmentID": 5,
      "AssignmentTitle": "Homework 1",
      "CourseID": 5,
      "CourseTitle": "Algorithms",
      "Score": 19.0,
      "Feedback": "Great work",
      "SubmissionDate": "2025-06-09T23:00:00"
    }
  ]
}
```

---

### Admin-only user management

#### `GET /users/admin/users`
List all users (filters optional).

**curl:**
```bash
curl -X GET "http://localhost:8000/users/admin/users?role=Student&include_deleted=false" \
  -H "Authorization: Bearer <admin_token>"
```

**Response (200 OK):**
```json
[
  {
    "UserID": 4,
    "FullName": "John Student",
    "Email": "john@example.com",
    "Role": "Student",
    "PhoneNumber": "09123456789",
    "RegistrationDate": "2025-02-11T10:34:59",
    "IsDeleted": 0,
    "StudentStatus": "Active",
    "GPA": 17.00,
    "Expertise": null,
    "TotalIncome": null
  }
]
```

#### `PUT /users/admin/users/{user_id}/status`
Update user status (soft delete or student active/inactive).

**curl:**
```bash
curl -X PUT "http://localhost:8000/users/admin/users/13/status" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "is_deleted": false,
    "student_status": "Inactive"
  }'
```

**Response (200 OK):**
```json
{
  "message": "User status updated"
}
```

---

## Courses

### `GET /courses/`
List courses with filters (public, no token required).

**curl:**
```bash
curl -X GET "http://localhost:8000/courses/?status=Active&min_price=1000"
```

**Response (200 OK):**
```json
[
  {
    "CourseID": 5,
    "Title": "Algorithms",
    "Description": "Advanced algorithms",
    "Price": 1400.00,
    "StartDate": "2025-06-01T00:00:00",
    "EndDate": "2025-07-01T00:00:00",
    "Capacity": 5,
    "Status": "Active",
    "TeacherID": 2,
    "TeacherName": "Alice Teacher",
    "EnrolledCount": 3
  }
]
```

---

### `GET /courses/{course_id}`
Get course details (including assignments and students if authorized).

**curl:**
```bash
curl -X GET "http://localhost:8000/courses/5" \
  -H "Authorization: Bearer <teacher_token>"
```

**Response (200 OK):**
```json
{
  "course": {
    "CourseID": 5,
    "Title": "Algorithms",
    "Description": "...",
    "Price": 1400.00,
    "StartDate": "2025-06-01T00:00:00",
    "EndDate": "2025-07-01T00:00:00",
    "Capacity": 5,
    "Status": "Active",
    "TeacherID": 2,
    "TeacherName": "Alice Teacher"
  },
  "assignments": [
    {
      "AssignmentID": 5,
      "Title": "Homework 1",
      "DueDate": "2025-06-15T23:59:59",
      "MaxScore": 20,
      "SubmissionCount": 2
    }
  ],
  "students": []   // only for teacher/admin of this course
}
```

---

### `POST /courses/`
Create a new course (teacher only).

**curl:**
```bash
curl -X POST "http://localhost:8000/courses/" \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python Basics",
    "description": "Learn Python",
    "price": 1000.00,
    "start_date": "2025-07-01T00:00:00",
    "end_date": "2025-08-01T00:00:00",
    "capacity": 20
  }'
```

**Response (200 OK):**
```json
{
  "CourseID": 6,
  "Message": "Course created"
}
```

---

### `PUT /courses/{course_id}`
Update a course (teacher only for own course, or admin).

**curl:**
```bash
curl -X PUT "http://localhost:8000/courses/5" \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python Advanced",
    "price": 1200.00,
    "status": "Active"
  }'
```

**Response (200 OK):**
```json
{
  "message": "Course updated"
}
```

---

### `DELETE /courses/{course_id}`
Soft delete a course (teacher own course or admin).

**curl:**
```bash
curl -X DELETE "http://localhost:8000/courses/5" \
  -H "Authorization: Bearer <teacher_token>"
```

**Response (200 OK):**
```json
{
  "message": "Course deleted (soft)"
}
```

---

### `GET /courses/{course_id}/assignments`
Get assignments of a course, with submission status for the logged-in student.

**curl:**
```bash
curl -X GET "http://localhost:8000/courses/5/assignments" \
  -H "Authorization: Bearer <student_token>"
```

**Response (200 OK):**
```json
[
  {
    "AssignmentID": 5,
    "Title": "Homework 1",
    "DueDate": "2025-06-15T23:59:59",
    "MaxScore": 20,
    "SubmissionID": 10,
    "SubmissionDate": "2025-06-10T14:00:00",
    "Score": null,
    "Feedback": null,
    "SubmissionStatus": "Submitted"
  }
]
```

---

## Enrollments

### `POST /enrollments/enroll`
Enroll logged-in student into a course (student ID from token).

**curl:**
```bash
curl -X POST "http://localhost:8000/enrollments/enroll" \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 5,
    "amount": 1400.00,
    "transaction_id": "TXN-12345"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "EnrollmentID": 12,
      "PaymentID": 12,
      "TransactionID": "TRX-20250610-123456",
      "StudentName": "John Doe",
      "CourseTitle": "Algorithms",
      "Message": "Enrollment completed successfully."
    }
  ]
}
```

---

### `POST /enrollments/cancel`
Cancel an enrollment (student can cancel only own, admin any).

**curl:**
```bash
curl -X POST "http://localhost:8000/enrollments/cancel" \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "enrollment_id": 12
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "EnrollmentID": 12,
      "RefundTransactionID": "RFN-20250610-654321",
      "Message": "Enrollment canceled successfully."
    }
  ]
}
```

---

## Assignments

### `POST /assignments/submit`
Submit or update an assignment (student ID from token).

**curl:**
```bash
curl -X POST "http://localhost:8000/assignments/submit" \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "assignment_id": 5,
    "file_url": "https://example.com/homework.pdf"
  }'
```

**Response (200 OK) (new submission):**
```json
{
  "success": true,
  "data": [
    {
      "SubmissionID": 10,
      "Message": "Submission stored. Waiting for grading."
    }
  ]
}
```

**Response (200 OK) (update existing):**
```json
{
  "success": true,
  "data": [
    {
      "SubmissionID": 10,
      "Message": "Submission updated successfully."
    }
  ]
}
```

---

### `POST /assignments/grade`
Grade a submission (teacher only for own course).

**curl:**
```bash
curl -X POST "http://localhost:8000/assignments/grade" \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": 10,
    "score": 18.5,
    "feedback": "Well done!"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "SubmissionID": 10,
      "StudentID": 13,
      "CourseID": 5,
      "CourseFinalScore": 18.5,
      "Message": "Submission graded successfully."
    }
  ]
}
```

---

### `POST /assignments/create`
Create a new assignment (teacher only for own course).

**curl:**
```bash
curl -X POST "http://localhost:8000/assignments/create" \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 5,
    "title": "Homework 2",
    "due_date": "2025-07-01T23:59:59",
    "max_score": 20
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "AssignmentID": 6,
    "Message": "Assignment created successfully."
  }
}
```

---

### `PUT /assignments/update/{assignment_id}`
Update an assignment (teacher only for own course).

**curl:**
```bash
curl -X PUT "http://localhost:8000/assignments/update/6" \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Homework 2 - Revised",
    "due_date": "2025-07-05T23:59:59",
    "max_score": 20
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Assignment updated"
}
```

---

### `DELETE /assignments/delete/{assignment_id}`
Delete an assignment (only if no submissions exist, teacher only for own course).

**curl:**
```bash
curl -X DELETE "http://localhost:8000/assignments/delete/6" \
  -H "Authorization: Bearer <teacher_token>"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Assignment deleted"
}
```

---

### `GET /submissions/` (was `/submissions/list`)
Teacher gets list of submissions for their courses (with filters).

**curl:**
```bash
curl -X GET "http://localhost:8000/submissions/?course_id=5&assignment_id=5" \
  -H "Authorization: Bearer <teacher_token>"
```

**Response (200 OK):**
```json
[
  {
    "SubmissionID": 10,
    "AssignmentID": 5,
    "AssignmentTitle": "Homework 1",
    "CourseID": 5,
    "CourseTitle": "Algorithms",
    "StudentID": 13,
    "StudentName": "John Doe",
    "StudentEmail": "john@example.com",
    "SubmissionDate": "2025-06-10T14:00:00",
    "FileURL": "https://example.com/homework.pdf",
    "Score": null,
    "Feedback": null,
    "MaxScore": 20,
    "DueDate": "2025-06-15T23:59:59"
  }
]
```

---

## Attendance

### `POST /attendance/record`
Record attendance for a student (teacher only for own course, or admin).

**curl:**
```bash
curl -X POST "http://localhost:8000/attendance/record" \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 13,
    "course_id": 5,
    "session_date": "2025-06-10",
    "status": "Present"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "AttendanceID": 8,
      "Message": "Attendance recorded."
    }
  ]
}
```

---

## Certificates

### `POST /certificates/issue`
Issue certificates to eligible students (teacher only for own course, or admin).

**curl:**
```bash
curl -X POST "http://localhost:8000/certificates/issue?course_id=1" \
  -H "Authorization: Bearer <admin_token>"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "CertificatesIssued": 3,
      "Message": "Certificate issuance completed."
    }
  ]
}
```

---

## Payments

### `GET /payments/`
Student sees own payments, admin sees all.

**curl:**
```bash
curl -X GET "http://localhost:8000/payments/" \
  -H "Authorization: Bearer <student_token>"
```

**Response (200 OK):**
```json
[
  {
    "PaymentID": 12,
    "StudentID": 13,
    "StudentName": "John Doe",
    "CourseID": 5,
    "CourseTitle": "Algorithms",
    "Amount": 1400.00,
    "PaymentDate": "2025-06-10T10:00:00",
    "Status": "Successful",
    "TransactionID": "TRX-20250610-123456"
  }
]
```

---

### `GET /payments/{payment_id}`
Get details of a specific payment.

**curl:**
```bash
curl -X GET "http://localhost:8000/payments/12" \
  -H "Authorization: Bearer <student_token>"
```

**Response (200 OK):**
```json
{
  "PaymentID": 12,
  "StudentID": 13,
  "StudentName": "John Doe",
  "CourseID": 5,
  "CourseTitle": "Algorithms",
  "Amount": 1400.00,
  "PaymentDate": "2025-06-10T10:00:00",
  "Status": "Successful",
  "TransactionID": "TRX-20250610-123456"
}
```

---

### `POST /payments/retry/{payment_id}`
Retry a failed payment (student only for own payment).

**curl:**
```bash
curl -X POST "http://localhost:8000/payments/retry/12" \
  -H "Authorization: Bearer <student_token>"
```

**Response (200 OK):**
```json
{
  "message": "Payment retry initiated. Please complete the payment process.",
  "payment_id": 12
}
```

---

### Admin-only payment endpoints

#### `GET /payments/admin/all`
Admin view all payments with advanced filters.

**curl:**
```bash
curl -X GET "http://localhost:8000/payments/admin/all?status=Failed&start_date=2025-01-01&end_date=2025-12-31" \
  -H "Authorization: Bearer <admin_token>"
```

**Response:** same as `GET /payments/` but with filters applied.

#### `GET /payments/admin/summary`
Admin financial summary.

**curl:**
```bash
curl -X GET "http://localhost:8000/payments/admin/summary" \
  -H "Authorization: Bearer <admin_token>"
```

**Response (200 OK):**
```json
{
  "TotalSuccessful": 15000.00,
  "TotalRefunded": 2000.00,
  "SuccessfulCount": 12,
  "FailedCount": 2,
  "PendingCount": 1,
  "RefundedCount": 2
}
```

---

## Reports

### `GET /reports/top-students`
Top students by GPA.

**curl:**
```bash
curl -X GET "http://localhost:8000/reports/top-students?top_n=5" \
  -H "Authorization: Bearer <teacher_token>"
```

**Response (200 OK):**
```json
[
  {
    "StudentID": 4,
    "FullName": "John Student",
    "Email": "john@example.com",
    "GPA": 18.5,
    "Status": "Active"
  }
]
```

---

### `GET /reports/teacher-income`
Teacher income within date range.

**curl:**
```bash
curl -X GET "http://localhost:8000/reports/teacher-income?start_date=2025-01-01&end_date=2025-12-31" \
  -H "Authorization: Bearer <admin_token>"
```

**Response (200 OK):**
```json
[
  {
    "TeacherID": 2,
    "TeacherName": "Alice Teacher",
    "CourseID": 5,
    "CourseTitle": "Algorithms",
    "Income": 4200.00
  }
]
```

---

### `GET /reports/popular-courses`
Courses ordered by number of successful enrollments.

**curl:**
```bash
curl -X GET "http://localhost:8000/reports/popular-courses" \
  -H "Authorization: Bearer <teacher_token>"
```

**Response (200 OK):**
```json
[
  {
    "CourseID": 1,
    "Title": "SQL Basics",
    "Status": "Completed",
    "SuccessfulEnrollments": 15
  }
]
```

---

### `GET /reports/course-enrollments`
Enrollment statistics per course.

**curl:**
```bash
curl -X GET "http://localhost:8000/reports/course-enrollments?course_id=5" \
  -H "Authorization: Bearer <teacher_token>"
```

**Response (200 OK):**
```json
[
  {
    "CourseID": 5,
    "Title": "Algorithms",
    "SuccessfulCount": 8,
    "PendingCount": 2,
    "FailedCount": 1,
    "DroppedCount": 1
  }
]
```

---

### `GET /reports/inactive-students`
Students inactive for more than `days` (admin only).

**curl:**
```bash
curl -X GET "http://localhost:8000/reports/inactive-students?days=30" \
  -H "Authorization: Bearer <admin_token>"
```

**Response (200 OK):**
```json
[
  {
    "StudentID": 11,
    "FullName": "Eva Student",
    "Email": "eva@example.com",
    "Status": "Inactive",
    "LastActivityDate": "2025-04-01T12:00:00"
  }
]
```

---

### `GET /reports/failed-payments`
Failed payments within date range (admin only).

**curl:**
```bash
curl -X GET "http://localhost:8000/reports/failed-payments?start_date=2025-05-01&end_date=2025-05-31" \
  -H "Authorization: Bearer <admin_token>"
```

**Response (200 OK):**
```json
[
  {
    "PaymentID": 7,
    "StudentName": "Paul Student",
    "CourseTitle": "Algorithms",
    "Amount": 1400.00,
    "PaymentDate": "2025-05-27T10:00:00",
    "TransactionID": "TXN-000007",
    "Status": "Failed"
  }
]
```

---

### `GET /reports/course-grades`
Course grade statistics (average, median, pass/fail counts).

**curl:**
```bash
curl -X GET "http://localhost:8000/reports/course-grades?course_id=5" \
  -H "Authorization: Bearer <teacher_token>"
```

**Response (200 OK):**
```json
[
  {
    "CourseID": 5,
    "Title": "Algorithms",
    "AverageScore": 16.5,
    "MedianScore": 17.0,
    "PassedCount": 7,
    "FailedCount": 2
  }
]
```

---

### `GET /reports/attendance`
Attendance report for a student in a course.

**curl:**
```bash
curl -X GET "http://localhost:8000/reports/attendance?student_id=4&course_id=1" \
  -H "Authorization: Bearer <student_token>"
```

**Response (200 OK):**
```json
[
  {
    "StudentName": "John Doe",
    "CourseTitle": "Algorithms",
    "SessionDate": "2025-06-10",
    "Status": "Present",
    "AttendancePercent": 85.50
  }
]
```

---

### `GET /reports/monthly-income`
Monthly income report for a given year (admin only).

**curl:**
```bash
curl -X GET "http://localhost:8000/reports/monthly-income?year=2025" \
  -H "Authorization: Bearer <admin_token>"
```

**Response (200 OK):**
```json
[
  {
    "ReportMonth": 6,
    "TransactionCount": 15,
    "SuccessfulAmount": 21000.00,
    "RefundedAmount": 1400.00
  }
]
```

---

### `GET /reports/teacher-ranking`
Rank teachers based on a criterion.

**curl:**
```bash
curl -X GET "http://localhost:8000/reports/teacher-ranking?basis=Income" \
  -H "Authorization: Bearer <admin_token>"
```

**Response (200 OK):**
```json
[
  {
    "TeacherID": 2,
    "TeacherName": "Alice Teacher",
    "Score": 15000.00
  }
]
```

---

## Views (Direct database views)

### `GET /views/student-transcript`
Student transcript (students see only own, teachers/admin see all).

**curl:**
```bash
curl -X GET "http://localhost:8000/views/student-transcript" \
  -H "Authorization: Bearer <student_token>"
```

**Response (200 OK):**
```json
[
  {
    "StudentID": 4,
    "FullName": "John Student",
    "Email": "john@example.com",
    "CourseID": 1,
    "CourseTitle": "SQL Basics",
    "EnrollmentDate": "2025-02-11T10:34:59",
    "EnrollmentStatus": "Successful",
    "FinalScore": 18.00,
    "GPA": 17.00
  }
]
```

---

### `GET /views/teacher-dashboard`
Teacher dashboard (teachers see only own, admin sees all).

**curl:**
```bash
curl -X GET "http://localhost:8000/views/teacher-dashboard" \
  -H "Authorization: Bearer <teacher_token>"
```

**Response (200 OK):**
```json
[
  {
    "TeacherID": 2,
    "TeacherName": "Alice Teacher",
    "CourseCount": 3,
    "StudentCount": 12,
    "TotalIncome": 6400.00
  }
]
```

---

### `GET /views/course-statistics`
Course statistics (admin/teacher only).

**curl:**
```bash
curl -X GET "http://localhost:8000/views/course-statistics" \
  -H "Authorization: Bearer <teacher_token>"
```

**Response (200 OK):**
```json
[
  {
    "CourseID": 5,
    "Title": "Algorithms",
    "Status": "Active",
    "Capacity": 5,
    "SuccessfulEnrollments": 3,
    "PendingEnrollments": 0,
    "FailedEnrollments": 1,
    "DroppedEnrollments": 1,
    "AverageScore": 16.0
  }
]
```

---

### `GET /views/financial-summary`
Financial summary by month (admin only).

**curl:**
```bash
curl -X GET "http://localhost:8000/views/financial-summary" \
  -H "Authorization: Bearer <admin_token>"
```

**Response (200 OK):**
```json
[
  {
    "ReportYear": 2025,
    "ReportMonth": 6,
    "TransactionCount": 10,
    "SuccessfulAmount": 14000.00,
    "RefundedAmount": 1400.00
  }
]
```

---

### `GET /views/student-certificates`
Student certificates (students see only own, admin sees all).

**curl:**
```bash
curl -X GET "http://localhost:8000/views/student-certificates" \
  -H "Authorization: Bearer <student_token>"
```

**Response (200 OK):**
```json
[
  {
    "CertificateID": 1,
    "CertificateCode": "CERT-1-4-20250610-123456",
    "IssueDate": "2025-06-10T12:00:00",
    "StudentID": 4,
    "StudentName": "John Student",
    "CourseID": 1,
    "CourseTitle": "SQL Basics"
  }
]
```

---

## Error Responses
All endpoints may return standard HTTP errors:

- `400 Bad Request` – Invalid input or business logic violation.
- `401 Unauthorized` – Missing or invalid token.
- `403 Forbidden` – Insufficient permissions.
- `404 Not Found` – Resource not found.
- `500 Internal Server Error` – Database or server error.

**Example error:**
```json
{
  "detail": "The student has already submitted this assignment."
}
```

---

**Swagger UI:** `http://localhost:8000/docs` after starting the server.  
**Server start command:** `uvicorn main:app --reload --host 0.0.0.0 --port 8000`