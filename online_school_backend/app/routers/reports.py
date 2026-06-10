from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from app.dependencies import role_required
from app.database import call_stored_procedure, execute_query
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["Reports"])

def _first_result_set(result_sets):
    return result_sets[0] if result_sets else []

@router.get("/top-students")
def top_students(top_n: int = 10, current_user: dict = Depends(role_required(["Admin", "Teacher"]))):
    user_id = int(current_user["sub"])
    logger.info(f"User {user_id} requesting top {top_n} students")
    result_sets = call_stored_procedure("sp_ReportTopStudents", {"@TopN": top_n})
    data = _first_result_set(result_sets)
    logger.info(f"Returned {len(data)} top students")
    return data

@router.get("/teacher-income")
def teacher_income(start_date: str, end_date: str, current_user: dict = Depends(role_required(["Admin", "Teacher"]))):
    user_id = int(current_user["sub"])
    logger.info(f"User {user_id} requesting teacher income from {start_date} to {end_date}")
    result_sets = call_stored_procedure("sp_ReportTeacherIncome", {"@StartDate": start_date, "@EndDate": end_date})
    data = _first_result_set(result_sets)
    logger.info(f"Returned {len(data)} income records")
    return data

@router.get("/popular-courses")
def popular_courses(current_user: dict = Depends(role_required(["Admin", "Teacher"]))):
    user_id = int(current_user["sub"])
    logger.info(f"User {user_id} requesting popular courses")
    result_sets = call_stored_procedure("sp_ReportPopularCourses")
    data = _first_result_set(result_sets)
    logger.info(f"Returned {len(data)} popular courses")
    return data

@router.get("/course-enrollments")
def course_enrollments(course_id: Optional[int] = None, current_user: dict = Depends(role_required(["Admin", "Teacher"]))):
    user_id = int(current_user["sub"])
    logger.info(f"User {user_id} requesting course enrollments for course {course_id if course_id else 'all'}")
    result_sets = call_stored_procedure("sp_ReportCourseEnrollments", {"@CourseID": course_id})
    data = _first_result_set(result_sets)
    logger.info(f"Returned {len(data)} enrollment records")
    return data

@router.get("/inactive-students")
def inactive_students(days: int = 60, current_user: dict = Depends(role_required(["Admin"]))):
    user_id = int(current_user["sub"])
    logger.info(f"Admin {user_id} requesting inactive students for {days} days")
    result_sets = call_stored_procedure("sp_ReportInactiveStudents", {"@Days": days})
    data = _first_result_set(result_sets)
    logger.info(f"Returned {len(data)} inactive students")
    return data

@router.get("/failed-payments")
def failed_payments(start_date: str, end_date: str, current_user: dict = Depends(role_required(["Admin"]))):
    user_id = int(current_user["sub"])
    logger.info(f"Admin {user_id} requesting failed payments from {start_date} to {end_date}")
    result_sets = call_stored_procedure("sp_ReportFailedPayments", {"@StartDate": start_date, "@EndDate": end_date})
    data = _first_result_set(result_sets)
    logger.info(f"Returned {len(data)} failed payments")
    return data

@router.get("/course-grades")
def course_grades(course_id: Optional[int] = None, current_user: dict = Depends(role_required(["Teacher", "Student"]))):
    user_id = int(current_user["sub"])
    logger.info(f"User {user_id} requesting course grades for course {course_id if course_id else 'all'}")
    result_sets = call_stored_procedure("sp_ReportCourseGrades", {"@CourseID": course_id})
    data = _first_result_set(result_sets)
    logger.info(f"Returned {len(data)} grade records")
    return data

@router.get("/attendance")
def attendance_report(student_id: int, course_id: int, current_user: dict = Depends(role_required(["Student", "Teacher", "Admin"]))):
    user_id = int(current_user["sub"])
    role = current_user["role"]
    logger.info(f"{role} {user_id} requesting attendance for student {student_id}, course {course_id}")
    if role == "Student" and user_id != student_id:
        logger.warning(f"Student {user_id} attempted to view attendance of student {student_id}")
        raise HTTPException(403, "You can only view your own attendance")
    if role == "Teacher":
        owner = execute_query("SELECT TeacherID FROM Course WHERE CourseID = %s", {"id": course_id})
        if not owner or owner[0]["TeacherID"] != user_id:
            logger.warning(f"Teacher {user_id} not owner of course {course_id}")
            raise HTTPException(403, "You can only view attendance for your own courses")
    result_sets = call_stored_procedure("sp_ReportAttendance", {"@StudentID": student_id, "@CourseID": course_id})
    data = _first_result_set(result_sets)
    logger.info(f"Returned {len(data)} attendance records")
    return data

@router.get("/monthly-income")
def monthly_income(year: Optional[int] = None, current_user: dict = Depends(role_required(["Admin"]))):
    admin_id = int(current_user["sub"])
    logger.info(f"Admin {admin_id} requesting monthly income for year {year if year else 'current'}")
    result_sets = call_stored_procedure("sp_ReportMonthlyIncome", {"@Year": year})
    data = _first_result_set(result_sets)
    logger.info(f"Returned {len(data)} monthly income records")
    return data

@router.get("/teacher-ranking")
def teacher_ranking(basis: str = "Income", current_user: dict = Depends(role_required(["Admin"]))):
    admin_id = int(current_user["sub"])
    logger.info(f"Admin {admin_id} requesting teacher ranking by {basis}")
    result_sets = call_stored_procedure("sp_ReportTeacherRanking", {"@Basis": basis})
    data = _first_result_set(result_sets)
    logger.info(f"Returned {len(data)} ranking records")
    return data