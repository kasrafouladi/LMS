from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import SubmitAssignmentRequest, GradeSubmissionRequest
from app.dependencies import role_required
from app.database import call_stored_procedure, execute_query
from app.models.schemas import AssignmentCreateRequest, AssignmentUpdateRequest

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

@router.post("/create")
def create_assignment(
    req: AssignmentCreateRequest,
    current_user: dict = Depends(role_required(["Teacher"]))
):
    """Teacher creates a new assignment for one of their courses."""
    teacher_id = int(current_user["sub"])
    # Check that course belongs to this teacher
    course_owner = execute_query(
        "SELECT TeacherID FROM dbo.Course WHERE CourseID = ? AND IsDeleted = 0",
        {"id": req.course_id}
    )
    if not course_owner:
        raise HTTPException(404, "Course not found")
    if course_owner[0]["TeacherID"] != teacher_id:
        raise HTTPException(403, "You can only create assignments for your own courses")
    
    result = call_stored_procedure("sp_CreateAssignment", {
        "@CourseID": req.course_id,
        "@Title": req.title,
        "@DueDate": req.due_date,
        "@MaxScore": req.max_score
    })
    return {"success": True, "data": result[0] if result else {"message": "Assignment created"}}

@router.put("/update/{assignment_id}")
def update_assignment(
    assignment_id: int,
    req: AssignmentUpdateRequest,
    current_user: dict = Depends(role_required(["Teacher"]))
):
    """Teacher updates an existing assignment (only if course belongs to them)."""
    teacher_id = int(current_user["sub"])
    # Get course owner via assignment
    course_owner = execute_query(
        """SELECT c.TeacherID 
           FROM dbo.Assignment a 
           INNER JOIN dbo.Course c ON a.CourseID = c.CourseID 
           WHERE a.AssignmentID = ?""",
        {"id": assignment_id}
    )
    if not course_owner:
        raise HTTPException(404, "Assignment not found")
    if course_owner[0]["TeacherID"] != teacher_id:
        raise HTTPException(403, "You can only update assignments for your own courses")
    
    result = call_stored_procedure("sp_UpdateAssignment", {
        "@AssignmentID": assignment_id,
        "@Title": req.title,
        "@DueDate": req.due_date,
        "@MaxScore": req.max_score
    })
    return {"success": True, "message": "Assignment updated"}

@router.delete("/delete/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    current_user: dict = Depends(role_required(["Teacher"]))
):
    """Teacher deletes an assignment (only if no submissions exist)."""
    teacher_id = int(current_user["sub"])
    # Check ownership and if submissions exist
    info = execute_query(
        """SELECT c.TeacherID, 
                  (SELECT COUNT(*) FROM dbo.Submission WHERE AssignmentID = a.AssignmentID) AS SubmissionCount
           FROM dbo.Assignment a
           INNER JOIN dbo.Course c ON a.CourseID = c.CourseID
           WHERE a.AssignmentID = ?""",
        {"id": assignment_id}
    )
    if not info:
        raise HTTPException(404, "Assignment not found")
    if info[0]["TeacherID"] != teacher_id:
        raise HTTPException(403, "You can only delete assignments for your own courses")
    if info[0]["SubmissionCount"] > 0:
        raise HTTPException(400, "Cannot delete assignment because submissions already exist")
    
    result = call_stored_procedure("sp_DeleteAssignment", {"@AssignmentID": assignment_id})
    return {"success": True, "message": "Assignment deleted"}