from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import UpdateProfileRequest, UpdateUserStatusRequest
from app.database import call_stored_procedure, execute_query
from app.dependencies import role_required, get_current_user
from app.auth import get_password_hash
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/profile")
def get_profile(current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["sub"])
    users = execute_query("SELECT UserID, FullName, Email, Role, PhoneNumber, RegistrationDate FROM `User` WHERE UserID = %s", {"id": user_id})
    if not users:
        raise HTTPException(404, "User not found")
    return users[0]

@router.put("/profile")
def update_profile(req: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["sub"])
    logger.info(f"User {user_id} updating profile")
    hashed = get_password_hash(req.password) if req.password else None
    call_stored_procedure("sp_UpdateUserProfile", {
        "@UserID": user_id,
        "@FullName": req.full_name,
        "@PhoneNumber": req.phone_number,
        "@PasswordHash": hashed
    })
    logger.info(f"User {user_id} profile updated")
    return {"message": "Profile updated"}

@router.get("/payments")
def get_my_payments(current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["sub"])
    result_sets = call_stored_procedure("sp_GetStudentPayments", {"@StudentID": user_id})
    payments = result_sets[0] if result_sets else []
    logger.info(f"User {user_id} fetched {len(payments)} payments")
    return payments

@router.get("/grades")
def get_my_grades(current_user: dict = Depends(role_required(["Student"]))):
    user_id = int(current_user["sub"])
    result_sets = call_stored_procedure("sp_GetStudentGrades", {"@StudentID": user_id})
    courses = result_sets[0] if len(result_sets) > 0 else []
    assignments = result_sets[1] if len(result_sets) > 1 else []
    logger.info(f"Student {user_id} fetched grades: {len(courses)} courses, {len(assignments)} assignments")
    return {"courses": courses, "assignments": assignments}

@router.get("/admin/users")
def list_users(role: str = None, include_deleted: bool = False, current_user: dict = Depends(role_required(["Admin"]))):
    admin_id = int(current_user["sub"])
    result_sets = call_stored_procedure("sp_GetUsers", {"@Role": role, "@IncludeDeleted": include_deleted})
    users = result_sets[0] if result_sets else []
    logger.info(f"Admin {admin_id} listed {len(users)} users")
    return users

@router.put("/admin/users/{user_id}/status")
def update_user_status(user_id: int, req: UpdateUserStatusRequest, current_user: dict = Depends(role_required(["Admin"]))):
    admin_id = int(current_user["sub"])
    logger.info(f"Admin {admin_id} updating status of user {user_id}: is_deleted={req.is_deleted}, student_status={req.student_status}")
    call_stored_procedure("sp_UpdateUserStatus", {
        "@UserID": user_id,
        "@IsDeleted": req.is_deleted,
        "@StudentStatus": req.student_status
    })
    logger.info(f"User {user_id} status updated by admin {admin_id}")
    return {"message": "User status updated"}