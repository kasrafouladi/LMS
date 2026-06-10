from fastapi import APIRouter, Depends, Query, HTTPException
from app.dependencies import role_required
from app.database import call_stored_procedure, execute_query

router = APIRouter(prefix="/submissions", tags=["Submissions"])

@router.get("/")   # به جای "/list"
def get_submissions(
    course_id: int = Query(None),
    assignment_id: int = Query(None),
    current_user: dict = Depends(role_required(["Teacher"]))
):
    teacher_id = int(current_user["sub"])
    teacher_check = execute_query("SELECT 1 FROM Teacher WHERE TeacherID = %s", {"id": teacher_id})
    if not teacher_check:
        raise HTTPException(403, "User is not a teacher")
    
    submissions = call_stored_procedure("sp_GetSubmissionsForGrading", {
        "@TeacherID": teacher_id,
        "@CourseID": course_id,
        "@AssignmentID": assignment_id
    })
    if submissions and len(submissions) > 0:
        return submissions[0]
    return []