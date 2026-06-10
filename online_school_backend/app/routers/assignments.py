from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import SubmitAssignmentRequest, GradeSubmissionRequest
from app.dependencies import role_required
from app.database import call_stored_procedure, execute_query
from app.models.schemas import AssignmentCreateRequest, AssignmentUpdateRequest
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assignments", tags=["Assignments"])

@router.post("/submit")
def submit_assignment(req: SubmitAssignmentRequest, current_user: dict = Depends(role_required(["Student"]))):
    student_id = int(current_user["sub"])
    logger.info(f"Student {student_id} submitting assignment {req.assignment_id}")
    try:
        result_sets = call_stored_procedure("sp_SubmitAssignment", {
            "@AssignmentID": req.assignment_id,
            "@StudentID": student_id,
            "@FileURL": req.file_url
        })
        data = result_sets[0] if result_sets else []
        if data:
            logger.info(f"Student {student_id} submitted assignment {req.assignment_id} (SubmissionID: {data[0].get('SubmissionID', 'N/A')})")
        else:
            logger.warning(f"Student {student_id} submission for assignment {req.assignment_id} returned no data")
        return {"success": True, "data": data}
    except Exception as e:
        logger.error(f"Error in submit_assignment for student {student_id}, assignment {req.assignment_id}: {e}")
        raise

@router.post("/grade")
def grade_submission(req: GradeSubmissionRequest, current_user: dict = Depends(role_required(["Teacher"]))):
    teacher_id = int(current_user["sub"])
    logger.info(f"Teacher {teacher_id} grading submission {req.submission_id}")
    submission = execute_query(
        "SELECT a.CourseID, c.TeacherID FROM Submission s JOIN Assignment a ON s.AssignmentID = a.AssignmentID JOIN Course c ON a.CourseID = c.CourseID WHERE s.SubmissionID = %s",
        {"id": req.submission_id}
    )
    if not submission:
        logger.warning(f"Submission {req.submission_id} not found")
        raise HTTPException(404, "Submission not found")
    if submission[0]["TeacherID"] != teacher_id:
        logger.warning(f"Teacher {teacher_id} not authorized to grade submission {req.submission_id}")
        raise HTTPException(403, "You can only grade submissions for your own courses")
    result_sets = call_stored_procedure("sp_GradeSubmission", {
        "@SubmissionID": req.submission_id,
        "@Score": req.score,
        "@Feedback": req.feedback
    })
    data = result_sets[0] if result_sets else []
    logger.info(f"Teacher {teacher_id} graded submission {req.submission_id} with score {req.score}")
    return {"success": True, "data": data}

@router.post("/create")
def create_assignment(req: AssignmentCreateRequest, current_user: dict = Depends(role_required(["Teacher"]))):
    teacher_id = int(current_user["sub"])
    logger.info(f"Teacher {teacher_id} creating assignment for course {req.course_id}")
    course_owner = execute_query(
        "SELECT TeacherID FROM Course WHERE CourseID = %s AND IsDeleted = 0",
        {"id": req.course_id}
    )
    if not course_owner:
        logger.warning(f"Course {req.course_id} not found")
        raise HTTPException(404, "Course not found")
    if course_owner[0]["TeacherID"] != teacher_id:
        logger.warning(f"Teacher {teacher_id} not owner of course {req.course_id}")
        raise HTTPException(403, "You can only create assignments for your own courses")
    result_sets = call_stored_procedure("sp_CreateAssignment", {
        "@CourseID": req.course_id,
        "@Title": req.title,
        "@DueDate": req.due_date,
        "@MaxScore": req.max_score
    })
    data = result_sets[0][0] if (result_sets and result_sets[0]) else {"message": "Assignment created"}
    logger.info(f"Assignment created with ID {data.get('AssignmentID', '?')} for course {req.course_id}")
    return {"success": True, "data": data}

@router.put("/update/{assignment_id}")
def update_assignment(assignment_id: int, req: AssignmentUpdateRequest, current_user: dict = Depends(role_required(["Teacher"]))):
    teacher_id = int(current_user["sub"])
    logger.info(f"Teacher {teacher_id} updating assignment {assignment_id}")
    course_owner = execute_query(
        "SELECT c.TeacherID FROM Assignment a INNER JOIN Course c ON a.CourseID = c.CourseID WHERE a.AssignmentID = %s",
        {"id": assignment_id}
    )
    if not course_owner:
        logger.warning(f"Assignment {assignment_id} not found")
        raise HTTPException(404, "Assignment not found")
    if course_owner[0]["TeacherID"] != teacher_id:
        logger.warning(f"Teacher {teacher_id} not owner of assignment {assignment_id}")
        raise HTTPException(403, "You can only update assignments for your own courses")
    call_stored_procedure("sp_UpdateAssignment", {
        "@AssignmentID": assignment_id,
        "@Title": req.title,
        "@DueDate": req.due_date,
        "@MaxScore": req.max_score
    })
    logger.info(f"Assignment {assignment_id} updated")
    return {"success": True, "message": "Assignment updated"}

@router.delete("/delete/{assignment_id}")
def delete_assignment(assignment_id: int, current_user: dict = Depends(role_required(["Teacher"]))):
    teacher_id = int(current_user["sub"])
    logger.info(f"Teacher {teacher_id} deleting assignment {assignment_id}")
    info = execute_query(
        "SELECT c.TeacherID, (SELECT COUNT(*) FROM Submission WHERE AssignmentID = a.AssignmentID) AS SubmissionCount FROM Assignment a INNER JOIN Course c ON a.CourseID = c.CourseID WHERE a.AssignmentID = %s",
        {"id": assignment_id}
    )
    if not info:
        logger.warning(f"Assignment {assignment_id} not found")
        raise HTTPException(404, "Assignment not found")
    if info[0]["TeacherID"] != teacher_id:
        logger.warning(f"Teacher {teacher_id} not owner of assignment {assignment_id}")
        raise HTTPException(403, "You can only delete assignments for your own courses")
    if info[0]["SubmissionCount"] > 0:
        logger.warning(f"Cannot delete assignment {assignment_id} because {info[0]['SubmissionCount']} submissions exist")
        raise HTTPException(400, "Cannot delete assignment because submissions already exist")
    call_stored_procedure("sp_DeleteAssignment", {"@AssignmentID": assignment_id})
    logger.info(f"Assignment {assignment_id} deleted")
    return {"success": True, "message": "Assignment deleted"}