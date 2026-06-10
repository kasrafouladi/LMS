from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from app.database import call_stored_procedure, execute_query
from app.dependencies import role_required, get_current_user, optional_user
from app.models.schemas import CourseCreateRequest, CourseUpdateRequest

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.get("/")
def list_courses(
    status: Optional[str] = Query(None, regex="^(Upcoming|Active|Completed|Cancelled)$"),
    teacher_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(optional_user)
):
    courses = call_stored_procedure("sp_GetCourses", {
        "@Status": status,
        "@TeacherID": teacher_id,
        "@MinPrice": min_price,
        "@MaxPrice": max_price,
        "@SearchTitle": search
    })
    # courses اکنون لیستی از result set هاست. اولین result set را برمی‌گردانیم
    if courses and len(courses) > 0:
        return courses[0]
    return []

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
    
    # result_sets[0] = course info
    # result_sets[1] = assignments
    # result_sets[2] = students (if requested)
    course = result_sets[0][0] if result_sets[0] else None
    assignments = result_sets[1] if len(result_sets) > 1 else []
    students = result_sets[2] if len(result_sets) > 2 else []
    
    response = {
        "course": course,
        "assignments": assignments,
        "students": students
    }
    return response

@router.post("/")
def create_course(req: CourseCreateRequest, current_user: dict = Depends(role_required(["Teacher"]))):
    teacher_id = int(current_user["sub"])
    result = call_stored_procedure("sp_CreateCourse", {
        "@TeacherID": teacher_id,
        "@Title": req.title,
        "@Description": req.description,
        "@Price": req.price,
        "@StartDate": req.start_date,
        "@EndDate": req.end_date,
        "@Capacity": req.capacity
    })
    # result[0] اولین result set است
    if result and len(result) > 0 and result[0]:
        return result[0][0]
    return {"message": "Course created"}

@router.put("/{course_id}")
def update_course(course_id: int, req: CourseUpdateRequest, current_user: dict = Depends(role_required(["Teacher", "Admin"]))):
    if current_user["role"] == "Teacher":
        owner = execute_query("SELECT TeacherID FROM Course WHERE CourseID = %s", {"id": course_id})
        if not owner or owner[0]["TeacherID"] != int(current_user["sub"]):
            raise HTTPException(403, "You can only update your own courses")
    result = call_stored_procedure("sp_UpdateCourse", {
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
    if current_user["role"] == "Teacher":
        owner = execute_query("SELECT TeacherID FROM Course WHERE CourseID = %s", {"id": course_id})
        if not owner or owner[0]["TeacherID"] != int(current_user["sub"]):
            raise HTTPException(403, "You can only delete your own courses")
    result = call_stored_procedure("sp_DeleteCourse", {"@CourseID": course_id})
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
    if assignments and len(assignments) > 0:
        return assignments[0]
    return []