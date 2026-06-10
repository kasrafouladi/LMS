from fastapi import APIRouter, Depends
from app.dependencies import role_required
from app.database import execute_query
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/views", tags=["Views"])

@router.get("/student-transcript")
def student_transcript(current_user: dict = Depends(role_required(["Admin", "Teacher", "Student"]))):
    user_id = int(current_user["sub"])
    role = current_user["role"]
    if role == "Student":
        data = execute_query("SELECT * FROM vw_StudentTranscript WHERE StudentID = %s", {"id": user_id})
    else:
        data = execute_query("SELECT * FROM vw_StudentTranscript")
    logger.info(f"{role} {user_id} fetched student transcript: {len(data)} rows")
    return data

@router.get("/teacher-dashboard")
def teacher_dashboard(current_user: dict = Depends(role_required(["Teacher", "Admin"]))):
    user_id = int(current_user["sub"])
    role = current_user["role"]
    if role == "Teacher":
        data = execute_query("SELECT * FROM vw_TeacherDashboard WHERE TeacherID = %s", {"id": user_id})
    else:
        data = execute_query("SELECT * FROM vw_TeacherDashboard")
    logger.info(f"{role} {user_id} fetched teacher dashboard: {len(data)} rows")
    return data

@router.get("/course-statistics")
def course_statistics(current_user: dict = Depends(role_required(["Admin", "Teacher"]))):
    user_id = int(current_user["sub"])
    role = current_user["role"]
    data = execute_query("SELECT * FROM vw_CourseStatistics")
    logger.info(f"{role} {user_id} fetched course statistics: {len(data)} rows")
    return data

@router.get("/financial-summary")
def financial_summary(current_user: dict = Depends(role_required(["Admin"]))):
    admin_id = int(current_user["sub"])
    data = execute_query("SELECT * FROM vw_FinancialSummary")
    logger.info(f"Admin {admin_id} fetched financial summary: {len(data)} rows")
    return data

@router.get("/student-certificates")
def student_certificates(current_user: dict = Depends(role_required(["Student", "Admin"]))):
    user_id = int(current_user["sub"])
    role = current_user["role"]
    if role == "Student":
        data = execute_query("SELECT * FROM vw_StudentCertificates WHERE StudentID = %s", {"id": user_id})
    else:
        data = execute_query("SELECT * FROM vw_StudentCertificates")
    logger.info(f"{role} {user_id} fetched certificates: {len(data)} rows")
    return data