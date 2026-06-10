from fastapi import APIRouter, Depends, Query, HTTPException
from app.dependencies import role_required
from app.database import call_stored_procedure, execute_query
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/certificates", tags=["Certificates"])

@router.post("/issue")
def issue_certificates(course_id: int = Query(None), current_user: dict = Depends(role_required(["Teacher", "Admin"]))):
    user_id = int(current_user["sub"])
    role = current_user["role"]
    logger.info(f"{role} {user_id} issuing certificates for course {course_id if course_id else 'all'}")
    if role == "Teacher" and course_id is not None:
        owner = execute_query("SELECT TeacherID FROM Course WHERE CourseID = %s", {"id": course_id})
        if not owner or owner[0]["TeacherID"] != user_id:
            logger.warning(f"Teacher {user_id} not owner of course {course_id}")
            raise HTTPException(403, "You can only issue certificates for your own courses")
    result_sets = call_stored_procedure("sp_IssueCertificatesForCourse", {"@CourseID": course_id})
    data = result_sets[0] if result_sets else []
    if data:
        issued = data[0].get('CertificatesIssued', 0)
        logger.info(f"Issued {issued} certificates")
    else:
        logger.info("No certificates issued (possibly no eligible students)")
    return {"success": True, "data": data}