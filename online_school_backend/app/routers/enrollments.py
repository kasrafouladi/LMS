from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import EnrollRequest, CancelEnrollmentRequest
from app.dependencies import role_required
from app.database import call_stored_procedure

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])

@router.post("/enroll")
def enroll_student(req: EnrollRequest, current_user: dict = Depends(role_required(["Student"]))):
    # Ensure student_id matches logged-in user
    if int(current_user["sub"]) != req.student_id:
        raise HTTPException(403, "You can only enroll yourself")
    result = call_stored_procedure("sp_EnrollStudentInCourse", {
        "@StudentID": req.student_id,
        "@CourseID": req.course_id,
        "@Amount": req.amount,
        "@TransactionID": req.transaction_id
    })
    return {"success": True, "data": result}

@router.post("/cancel")
def cancel_enrollment(req: CancelEnrollmentRequest, current_user: dict = Depends(role_required(["Student", "Admin"]))):
    # Additional check: student can cancel only their own enrollment
    if current_user["role"] == "Student":
        # verify that enrollment belongs to this student
        enrollments = call_stored_procedure("sp_GetCourseDetails", {"@CourseID": 0, "@IncludeAssignments": 0, "@IncludeStudents": 0}) # quick hack: we need a check. Simpler: query
        from app.database import execute_query
        enroll = execute_query("SELECT StudentID FROM Enrollment WHERE EnrollmentID = ?", {"id": req.enrollment_id})
        if not enroll or enroll[0]["StudentID"] != int(current_user["sub"]):
            raise HTTPException(403, "You can only cancel your own enrollment")
    result = call_stored_procedure("sp_CancelEnrollment", {"@EnrollmentID": req.enrollment_id})
    return {"success": True, "data": result}