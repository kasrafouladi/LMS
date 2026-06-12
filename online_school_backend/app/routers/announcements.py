from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.dependencies import role_required, get_current_user
from app.database import call_stored_procedure, execute_query
from app.models.schemas import AnnouncementCreateRequest, AnnouncementUpdateRequest
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/announcements", tags=["Announcements"])

@router.post("/")
def create_announcement(
    req: AnnouncementCreateRequest,
    course_id: int = Query(...),
    current_user: dict = Depends(role_required(["Teacher"]))
):
    teacher_id = int(current_user["sub"])
    logger.info(f"Teacher {teacher_id} creating announcement for course {course_id}")
    
    # Verify teacher owns the course
    course = execute_query(
        "SELECT TeacherID, Status FROM Course WHERE CourseID = %s AND IsDeleted = 0",
        {"id": course_id}
    )
    if not course:
        raise HTTPException(404, "Course not found")
    if course[0]["TeacherID"] != teacher_id:
        raise HTTPException(403, "You can only post announcements for your own courses")
    if course[0]["Status"] in ("Completed", "Cancelled"):
        raise HTTPException(400, "Cannot post announcements for a finished course")

    result_sets = call_stored_procedure("sp_CreateAnnouncement", {
        "@CourseID": course_id,
        "@TeacherID": teacher_id,
        "@Title": req.title,
        "@Content": req.content
    })
    data = result_sets[0][0] if (result_sets and result_sets[0]) else {}
    logger.info(f"Announcement created: {data.get('AnnouncementID')}")
    return {"success": True, "data": data}

@router.put("/{announcement_id}")
def update_announcement(
    announcement_id: int,
    req: AnnouncementUpdateRequest,
    current_user: dict = Depends(role_required(["Teacher"]))
):
    teacher_id = int(current_user["sub"])
    logger.info(f"Teacher {teacher_id} updating announcement {announcement_id}")
    result_sets = call_stored_procedure("sp_UpdateAnnouncement", {
        "@AnnouncementID": announcement_id,
        "@TeacherID": teacher_id,
        "@Title": req.title,
        "@Content": req.content
    })
    if not result_sets or not result_sets[0]:
        raise HTTPException(404, "Announcement not found or you don't have permission")
    logger.info(f"Announcement {announcement_id} updated")
    return {"success": True, "message": "Announcement updated"}

@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    current_user: dict = Depends(role_required(["Teacher"]))
):
    teacher_id = int(current_user["sub"])
    logger.info(f"Teacher {teacher_id} deleting announcement {announcement_id}")
    result_sets = call_stored_procedure("sp_DeleteAnnouncement", {
        "@AnnouncementID": announcement_id,
        "@TeacherID": teacher_id
    })
    if not result_sets or not result_sets[0]:
        raise HTTPException(404, "Announcement not found or you don't have permission")
    logger.info(f"Announcement {announcement_id} deleted")
    return {"success": True, "message": "Announcement deleted"}

@router.get("/course/{course_id}")
def get_announcements_for_course(
    course_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Students can view announcements of courses they are enrolled in (Successful).
    Teachers can view announcements of their own courses.
    Admins can view any."""
    user_id = int(current_user["sub"])
    role = current_user["role"]

    # Permission check
    if role == "Student":
        enrolled = execute_query(
            "SELECT 1 FROM Enrollment WHERE StudentID = %s AND CourseID = %s AND Status = 'Successful'",
            {"sid": user_id, "cid": course_id}
        )
        if not enrolled:
            raise HTTPException(403, "You are not enrolled in this course")
    elif role == "Teacher":
        owns = execute_query(
            "SELECT 1 FROM Course WHERE CourseID = %s AND TeacherID = %s AND IsDeleted = 0",
            {"cid": course_id, "tid": user_id}
        )
        if not owns:
            raise HTTPException(403, "You do not teach this course")
    # Admin can always view

    result_sets = call_stored_procedure("sp_GetAnnouncementsByCourse", {"@CourseID": course_id})
    announcements = result_sets[0] if result_sets else []
    logger.info(f"User {user_id} ({role}) fetched {len(announcements)} announcements for course {course_id}")
    return announcements