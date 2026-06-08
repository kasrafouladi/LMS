from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import SubmitAssignmentRequest, GradeSubmissionRequest
from app.dependencies import role_required
from app.database import call_stored_procedure, execute_query

router = APIRouter(prefix="/assignments", tags=["Assignments"])

@router.post("/submit")
def submit_assignment(req: SubmitAssignmentRequest, current_user: dict = Depends(role_required(["Student"]))):
    if int(current_user["sub"]) != req.student_id:
        raise HTTPException(403, "You can only submit your own assignments")
    result = call_stored_procedure("sp_SubmitAssignment", {
        "@AssignmentID": req.assignment_id,
        "@StudentID": req.student_id,
        "@FileURL": req.file_url
    })
    return {"success": True, "data": result}

@router.post("/grade")
def grade_submission(req: GradeSubmissionRequest, current_user: dict = Depends(role_required(["Teacher"]))):
    # Optionally, verify teacher is assigned to the course of this submission
    submission = execute_query("SELECT a.CourseID, c.TeacherID FROM Submission s JOIN Assignment a ON s.AssignmentID = a.AssignmentID JOIN Course c ON a.CourseID = c.CourseID WHERE s.SubmissionID = ?", {"id": req.submission_id})
    if not submission:
        raise HTTPException(404, "Submission not found")
    if current_user["role"] == "Teacher" and submission[0]["TeacherID"] != int(current_user["sub"]):
        raise HTTPException(403, "You can only grade submissions for your own courses")
    result = call_stored_procedure("sp_GradeSubmission", {
        "@SubmissionID": req.submission_id,
        "@Score": req.score,
        "@Feedback": req.feedback
    })
    return {"success": True, "data": result}