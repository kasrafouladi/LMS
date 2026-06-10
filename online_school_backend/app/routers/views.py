from fastapi import APIRouter, Depends
from app.dependencies import role_required
from app.database import execute_query

router = APIRouter(prefix="/views", tags=["Views"])

@router.get("/student-transcript")
def student_transcript(current_user: dict = Depends(role_required(["Admin", "Teacher", "Student"]))):
    if current_user["role"] == "Student":
        user_id = int(current_user["sub"])
        data = execute_query("SELECT * FROM vw_StudentTranscript WHERE StudentID = %s", {"id": user_id})
    else:
        data = execute_query("SELECT * FROM vw_StudentTranscript")
    return data

@router.get("/teacher-dashboard")
def teacher_dashboard(current_user: dict = Depends(role_required(["Teacher", "Admin"]))):
    if current_user["role"] == "Teacher":
        user_id = int(current_user["sub"])
        data = execute_query("SELECT * FROM vw_TeacherDashboard WHERE TeacherID = %s", {"id": user_id})
    else:
        data = execute_query("SELECT * FROM vw_TeacherDashboard")
    return data

@router.get("/course-statistics")
def course_statistics(current_user: dict = Depends(role_required(["Admin", "Teacher"]))):
    return execute_query("SELECT * FROM vw_CourseStatistics")

@router.get("/financial-summary")
def financial_summary(current_user: dict = Depends(role_required(["Admin"]))):
    return execute_query("SELECT * FROM vw_FinancialSummary")

@router.get("/student-certificates")
def student_certificates(current_user: dict = Depends(role_required(["Student", "Admin"]))):
    if current_user["role"] == "Student":
        user_id = int(current_user["sub"])
        return execute_query("SELECT * FROM vw_StudentCertificates WHERE StudentID = %s", {"id": user_id})
    return execute_query("SELECT * FROM vw_StudentCertificates")