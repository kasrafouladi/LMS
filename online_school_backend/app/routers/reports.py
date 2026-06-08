from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.dependencies import role_required
from app.database import call_stored_procedure

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/top-students")
def top_students(top_n: int = 10, current_user: dict = Depends(role_required(["Admin", "Teacher"]))):
    return call_stored_procedure("sp_ReportTopStudents", {"@TopN": top_n})

@router.get("/teacher-income")
def teacher_income(start_date: str, end_date: str, current_user: dict = Depends(role_required(["Admin", "Teacher"]))):
    return call_stored_procedure("sp_ReportTeacherIncome", {"@StartDate": start_date, "@EndDate": end_date})

@router.get("/popular-courses")
def popular_courses(current_user: dict = Depends(role_required(["Admin", "Teacher"]))):
    return call_stored_procedure("sp_ReportPopularCourses")

@router.get("/course-enrollments")
def course_enrollments(course_id: Optional[int] = None, current_user: dict = Depends(role_required(["Admin", "Teacher"]))):
    return call_stored_procedure("sp_ReportCourseEnrollments", {"@CourseID": course_id})

@router.get("/inactive-students")
def inactive_students(days: int = 60, current_user: dict = Depends(role_required(["Admin"]))):
    return call_stored_procedure("sp_ReportInactiveStudents", {"@Days": days})

@router.get("/failed-payments")
def failed_payments(start_date: str, end_date: str, current_user: dict = Depends(role_required(["Admin"]))):
    return call_stored_procedure("sp_ReportFailedPayments", {"@StartDate": start_date, "@EndDate": end_date})

@router.get("/course-grades")
def course_grades(course_id: Optional[int] = None, current_user: dict = Depends(role_required(["Teacher", "Student"]))):
    return call_stored_procedure("sp_ReportCourseGrades", {"@CourseID": course_id})

@router.get("/attendance")
def attendance_report(student_id: int, course_id: int, current_user: dict = Depends(role_required(["Student", "Teacher", "Admin"]))):
    # enforce permission: student can only see own attendance
    if current_user["role"] == "Student" and int(current_user["sub"]) != student_id:
        from fastapi import HTTPException
        raise HTTPException(403, "You can only view your own attendance")
    if current_user["role"] == "Teacher":
        from app.database import execute_query
        owner = execute_query("SELECT TeacherID FROM Course WHERE CourseID = ?", {"id": course_id})
        if not owner or owner[0]["TeacherID"] != int(current_user["sub"]):
            raise HTTPException(403, "You can only view attendance for your own courses")
    return call_stored_procedure("sp_ReportAttendance", {"@StudentID": student_id, "@CourseID": course_id})

@router.get("/monthly-income")
def monthly_income(year: Optional[int] = None, current_user: dict = Depends(role_required(["Admin"]))):
    return call_stored_procedure("sp_ReportMonthlyIncome", {"@Year": year})

@router.get("/teacher-ranking")
def teacher_ranking(basis: str = "Income", current_user: dict = Depends(role_required(["Admin"]))):
    return call_stored_procedure("sp_ReportTeacherRanking", {"@Basis": basis})