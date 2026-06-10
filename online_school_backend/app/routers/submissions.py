from fastapi import APIRouter, Depends, Query, HTTPException
from app.dependencies import role_required
from app.database import call_stored_procedure, execute_query
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/submissions", tags=["Submissions"])

@router.get("/")
def get_submissions(
    course_id: int = Query(None),
    assignment_id: int = Query(None),
    current_user: dict = Depends(role_required(["Teacher"]))
):
    teacher_id = int(current_user["sub"])
    logger.info(f"Teacher {teacher_id} fetching submissions (course={course_id}, assignment={assignment_id})")
    teacher_check = execute_query("SELECT 1 FROM Teacher WHERE TeacherID = %s", {"id": teacher_id})
    if not teacher_check:
        logger.warning(f"User {teacher_id} is not a teacher")
        raise HTTPException(403, "User is not a teacher")
    submissions = call_stored_procedure("sp_GetSubmissionsForGrading", {
        "@TeacherID": teacher_id,
        "@CourseID": course_id,
        "@AssignmentID": assignment_id
    })
    data = submissions[0] if submissions else []
    logger.info(f"Returned {len(data)} submissions for teacher {teacher_id}")
    return data