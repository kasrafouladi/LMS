from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import AttendanceRequest
from app.dependencies import role_required
from app.database import call_stored_procedure, execute_query
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.post("/record")
def record_attendance(req: AttendanceRequest, current_user: dict = Depends(role_required(["Teacher", "Admin"]))):
    user_id = int(current_user["sub"])
    role = current_user["role"]
    logger.info(f"{role} {user_id} recording attendance for student {req.student_id} in course {req.course_id}: {req.status}")
    if role == "Teacher":
        course_owner = execute_query("SELECT TeacherID FROM Course WHERE CourseID = %s", {"id": req.course_id})
        if not course_owner or course_owner[0]["TeacherID"] != user_id:
            logger.warning(f"Teacher {user_id} not owner of course {req.course_id}")
            raise HTTPException(403, "You can only record attendance for your own courses")
    result_sets = call_stored_procedure("sp_RecordAttendance", {
        "@StudentID": req.student_id,
        "@CourseID": req.course_id,
        "@SessionDate": req.session_date,
        "@Status": req.status
    })
    data = result_sets[0] if result_sets else []
    if data:
        logger.info(f"Attendance recorded: ID {data[0].get('AttendanceID', 'N/A')}")
    else:
        logger.warning(f"Attendance recording returned no data for student {req.student_id}, course {req.course_id}")
    return {"success": True, "data": data}