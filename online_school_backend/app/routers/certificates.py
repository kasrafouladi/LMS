from fastapi import APIRouter, Depends, Query
from app.dependencies import role_required
from app.database import call_stored_procedure

router = APIRouter(prefix="/certificates", tags=["Certificates"])

@router.post("/issue")
def issue_certificates(course_id: int = Query(None), current_user: dict = Depends(role_required(["Teacher", "Admin"]))):
    # Teacher can only issue for their own courses
    if current_user["role"] == "Teacher" and course_id is not None:
        from app.database import execute_query
        owner = execute_query("SELECT TeacherID FROM Course WHERE CourseID = ?", {"id": course_id})
        if not owner or owner[0]["TeacherID"] != int(current_user["sub"]):
            from fastapi import HTTPException
            raise HTTPException(403, "You can only issue certificates for your own courses")
    result = call_stored_procedure("sp_IssueCertificatesForCourse", {"@CourseID": course_id})
    return {"success": True, "data": result}