from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import EnrollRequest, CancelEnrollmentRequest
from app.dependencies import role_required
from app.database import call_stored_procedure, execute_query

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])

@router.post("/enroll")
def enroll_student(req: EnrollRequest, current_user: dict = Depends(role_required(["Student"]))):
    student_id = int(current_user["sub"])  # استخراج از توکن
    result = call_stored_procedure("sp_EnrollStudentInCourse", {
        "@StudentID": student_id,
        "@CourseID": req.course_id,
        "@Amount": req.amount,
        "@TransactionID": req.transaction_id
    })
    return {"success": True, "data": result}

@router.post("/cancel")
def cancel_enrollment(req: CancelEnrollmentRequest, current_user: dict = Depends(role_required(["Student", "Admin"]))):
    if current_user["role"] == "Student":
        # بررسی تعلق ثبت‌نام به دانشجو
        enroll = execute_query("SELECT StudentID FROM Enrollment WHERE EnrollmentID = %s", {"id": req.enrollment_id})
        if not enroll or enroll[0]["StudentID"] != int(current_user["sub"]):
            raise HTTPException(403, "You can only cancel your own enrollment")
    result = call_stored_procedure("sp_CancelEnrollment", {"@EnrollmentID": req.enrollment_id})
    return {"success": True, "data": result}