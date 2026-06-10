from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import EnrollRequest, CancelEnrollmentRequest
from app.dependencies import role_required
from app.database import call_stored_procedure, execute_query
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])

@router.post("/enroll")
def enroll_student(req: EnrollRequest, current_user: dict = Depends(role_required(["Student"]))):
    student_id = int(current_user["sub"])
    logger.info(f"Student {student_id} enrolling in course {req.course_id} with amount {req.amount}")
    result_sets = call_stored_procedure("sp_EnrollStudentInCourse", {
        "@StudentID": student_id,
        "@CourseID": req.course_id,
        "@Amount": req.amount,
        "@TransactionID": req.transaction_id
    })
    data = result_sets[0] if result_sets else []
    if data:
        logger.info(f"Student {student_id} successfully enrolled in course {req.course_id}, EnrollmentID: {data[0].get('EnrollmentID', 'N/A')}")
    else:
        logger.warning(f"Enrollment failed for student {student_id} in course {req.course_id}")
    return {"success": True, "data": data}

@router.post("/cancel")
def cancel_enrollment(req: CancelEnrollmentRequest, current_user: dict = Depends(role_required(["Student", "Admin"]))):
    user_id = int(current_user["sub"])
    role = current_user["role"]
    logger.info(f"{role} {user_id} cancelling enrollment {req.enrollment_id}")
    if role == "Student":
        enroll = execute_query("SELECT StudentID FROM Enrollment WHERE EnrollmentID = %s", {"id": req.enrollment_id})
        if not enroll or enroll[0]["StudentID"] != user_id:
            logger.warning(f"Student {user_id} tried to cancel enrollment {req.enrollment_id} but not owner")
            raise HTTPException(403, "You can only cancel your own enrollment")
    result_sets = call_stored_procedure("sp_CancelEnrollment", {"@EnrollmentID": req.enrollment_id})
    data = result_sets[0] if result_sets else []
    logger.info(f"Enrollment {req.enrollment_id} cancelled by {role} {user_id}")
    return {"success": True, "data": data}