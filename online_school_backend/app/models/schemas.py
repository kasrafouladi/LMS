from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import date, datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone_number: Optional[str] = None
    role: str = "Student"
    date_of_birth: Optional[date] = None

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=3, max_length=100)
    phone_number: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)

class CourseCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = None
    price: float = Field(..., ge=0)
    start_date: datetime
    end_date: datetime
    capacity: int = Field(..., gt=0)

class CourseUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=150)
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    capacity: Optional[int] = Field(None, gt=0)
    status: Optional[str] = None

class EnrollRequest(BaseModel):
    course_id: int
    amount: float
    transaction_id: Optional[str] = None
    # student_id حذف شد – از توکن گرفته می‌شود

class SubmitAssignmentRequest(BaseModel):
    assignment_id: int
    file_url: str = Field(..., max_length=500)
    # student_id حذف شد – از توکن گرفته می‌شود

class GradeSubmissionRequest(BaseModel):
    submission_id: int
    score: float = Field(..., ge=0, le=20)
    feedback: Optional[str] = None

class AttendanceRequest(BaseModel):
    student_id: int  # استاد برای دانشجوی دیگر ثبت می‌کند – باید ارسال شود
    course_id: int
    session_date: date
    status: str = Field(..., pattern="^(Present|Absent)$")

class CancelEnrollmentRequest(BaseModel):
    enrollment_id: int

class UpdateUserStatusRequest(BaseModel):
    is_deleted: Optional[bool] = None
    student_status: Optional[str] = Field(None, pattern="^(Active|Inactive)$")

class AssignmentCreateRequest(BaseModel):
    course_id: int
    title: str = Field(..., min_length=3, max_length=150)
    due_date: datetime
    max_score: float = Field(..., gt=0, le=20)

class AssignmentUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=150)
    due_date: Optional[datetime] = None
    max_score: Optional[float] = Field(None, gt=0, le=20)