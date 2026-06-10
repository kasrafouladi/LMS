from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import AttendanceRequest
from app.dependencies import role_required
from app.database import call_stored_procedure, execute_query

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.post("/record")
def record_attendance(req: AttendanceRequest, current_user: dict = Depends(role_required(["Teacher", "Admin"]))):
    if current_user["role"] == "Teacher":
        course_owner = execute_query("SELECT TeacherID FROM Course WHERE CourseID = %s", {"id": req.course_id})
        if not course_owner or course_owner[0]["TeacherID"] != int(current_user["sub"]):
            raise HTTPException(403, "You can only record attendance for your own courses")
    result = call_stored_procedure("sp_RecordAttendance", {
        "@StudentID": req.student_id,
        "@CourseID": req.course_id,
        "@SessionDate": req.session_date,
        "@Status": req.status
    })
    return {"success": True, "data": result}