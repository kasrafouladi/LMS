from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from app.database import call_stored_procedure, execute_query
from app.dependencies import role_required, get_current_user, optional_user
from app.models.schemas import CourseCreateRequest, CourseUpdateRequest
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.get("/")
def list_courses(
    status: Optional[str] = Query(None, pattern="^(Upcoming|Active|Completed|Cancelled)$"),
    teacher_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(optional_user)
):
    # Determine requesting teacher ID (to allow seeing own Draft courses)
    requesting_teacher_id = None
    if current_user and current_user.get("role") == "Teacher":
        requesting_teacher_id = int(current_user["sub"])

    courses = call_stored_procedure("sp_GetCourses", {
        "@Status": status,
        "@TeacherID": teacher_id,
        "@MinPrice": min_price,
        "@MaxPrice": max_price,
        "@SearchTitle": search,
        "@RequestingTeacherID": requesting_teacher_id
    })
    data = courses[0] if courses else []
    return data

@router.get("/{course_id}")
def get_course_details(
    course_id: int,
    current_user: dict = Depends(optional_user)
):
    include_students = 0
    if current_user and current_user.get("role") in ["Admin", "Teacher"]:
        if current_user["role"] == "Teacher":
            course_owner = execute_query("SELECT TeacherID FROM Course WHERE CourseID = %s", {"id": course_id})
            if course_owner and course_owner[0]["TeacherID"] == int(current_user["sub"]):
                include_students = 1
        else:
            include_students = 1
    result_sets = call_stored_procedure("sp_GetCourseDetails", {
        "@CourseID": course_id,
        "@IncludeAssignments": 1,
        "@IncludeStudents": include_students
    })
    if not result_sets or len(result_sets) == 0 or not result_sets[0]:
        raise HTTPException(404, "Course not found")
    course = result_sets[0][0] if result_sets[0] else None
    assignments = result_sets[1] if len(result_sets) > 1 else []
    students = result_sets[2] if len(result_sets) > 2 else []
    return {"course": course, "assignments": assignments, "students": students}

@router.post("/")
def create_course(req: CourseCreateRequest, current_user: dict = Depends(role_required(["Teacher"]))):
    teacher_id = int(current_user["sub"])
    logger.info(f"Teacher {teacher_id} creating course: {req.title}")
    result = call_stored_procedure("sp_CreateCourse", {
        "@TeacherID": teacher_id,
        "@Title": req.title,
        "@Description": req.description,
        "@Price": req.price,
        "@StartDate": req.start_date,
        "@EndDate": req.end_date,
        "@Capacity": req.capacity
    })
    if result and len(result) > 0 and result[0]:
        course_data = result[0][0]
        return course_data
    return {"message": "Course created"}

@router.put("/{course_id}")
def update_course(course_id: int, req: CourseUpdateRequest, current_user: dict = Depends(role_required(["Teacher", "Admin"]))):
    user_id = int(current_user["sub"])
    role = current_user["role"]
    if role == "Teacher":
        owner = execute_query("SELECT TeacherID FROM Course WHERE CourseID = %s", {"id": course_id})
        if not owner or owner[0]["TeacherID"] != user_id:
            raise HTTPException(403, "You can only update your own courses")
    call_stored_procedure("sp_UpdateCourse", {
        "@CourseID": course_id,
        "@Title": req.title,
        "@Description": req.description,
        "@Price": req.price,
        "@StartDate": req.start_date,
        "@EndDate": req.end_date,
        "@Capacity": req.capacity,
        "@Status": req.status
    })
    return {"message": "Course updated"}

@router.delete("/{course_id}")
def delete_course(course_id: int, current_user: dict = Depends(role_required(["Teacher", "Admin"]))):
    user_id = int(current_user["sub"])
    role = current_user["role"]
    if role == "Teacher":
        owner = execute_query("SELECT TeacherID FROM Course WHERE CourseID = %s", {"id": course_id})
        if not owner or owner[0]["TeacherID"] != user_id:
            raise HTTPException(403, "You can only delete your own courses")
    call_stored_procedure("sp_DeleteCourse", {"@CourseID": course_id})
    return {"message": "Course deleted (soft)"}

@router.get("/{course_id}/assignments")
def get_course_assignments(course_id: int, current_user: dict = Depends(get_current_user)):
    student_id = None
    if current_user["role"] == "Student":
        student_id = int(current_user["sub"])
    assignments = call_stored_procedure("sp_GetAssignmentsByCourse", {
        "@CourseID": course_id,
        "@StudentID": student_id
    })
    data = assignments[0] if assignments else []
    return data

@router.post("/refresh-status")
def refresh_course_status(current_user: dict = Depends(role_required(["Admin", "Teacher"]))):
    """Manually run sp_UpdateCourseStatus to transition courses based on dates."""
    call_stored_procedure("sp_UpdateCourseStatus")
    logger.info(f"Course statuses refreshed by {current_user['role']} {current_user['sub']}")
    return {"message": "Course statuses updated"}