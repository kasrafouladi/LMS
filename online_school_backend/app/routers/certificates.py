from fastapi import APIRouter, Depends, Query, HTTPException
from app.dependencies import role_required
from app.database import call_stored_procedure, execute_query

router = APIRouter(prefix="/certificates", tags=["Certificates"])

@router.post("/issue")
def issue_certificates(course_id: int = Query(None), current_user: dict = Depends(role_required(["Teacher", "Admin"]))):
    if current_user["role"] == "Teacher" and course_id is not None:
        owner = execute_query("SELECT TeacherID FROM Course WHERE CourseID = %s", {"id": course_id})
        if not owner or owner[0]["TeacherID"] != int(current_user["sub"]):
            raise HTTPException(403, "You can only issue certificates for your own courses")
    result_sets = call_stored_procedure("sp_IssueCertificatesForCourse", {"@CourseID": course_id})
    data = result_sets[0] if result_sets else []
    return {"success": True, "data": data}