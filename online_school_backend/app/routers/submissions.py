from fastapi import APIRouter, Depends, Query, HTTPException
from app.dependencies import role_required
from app.database import call_stored_procedure, execute_query
from app.models.schemas import GradeSubmissionRequest

router = APIRouter(prefix="/submissions", tags=["Submissions"])

@router.get("/list")
def get_submissions_for_grading(
    course_id: int = Query(None),
    assignment_id: int = Query(None),
    current_user: dict = Depends(role_required(["Teacher"]))
):
    """
    Teacher gets list of submissions for their courses.
    Optional filters: course_id, assignment_id.
    """
    teacher_id = int(current_user["sub"])
    # Verify teacher exists
    teacher_check = execute_query("SELECT 1 FROM dbo.Teacher WHERE TeacherID = ?", {"id": teacher_id})
    if not teacher_check:
        raise HTTPException(403, "User is not a teacher")
    
    submissions = call_stored_procedure("sp_GetSubmissionsForGrading", {
        "@TeacherID": teacher_id,
        "@CourseID": course_id,
        "@AssignmentID": assignment_id
    })
    return submissions

# Note: grading endpoint already exists in assignments.py (POST /assignments/grade)
# We keep it there for consistency.