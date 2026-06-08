from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import UpdateProfileRequest, UpdateUserStatusRequest
from app.database import call_stored_procedure, execute_query
from app.dependencies import role_required, get_current_user
from app.auth import get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/profile")
def get_profile(current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["sub"])
    users = execute_query("SELECT UserID, FullName, Email, Role, PhoneNumber, RegistrationDate FROM [User] WHERE UserID = ?", {"id": user_id})
    if not users:
        raise HTTPException(404, "User not found")
    return users[0]

@router.put("/profile")
def update_profile(req: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["sub"])
    hashed = get_password_hash(req.password) if req.password else None
    result = call_stored_procedure("sp_UpdateUserProfile", {
        "@UserID": user_id,
        "@FullName": req.full_name,
        "@PhoneNumber": req.phone_number,
        "@PasswordHash": hashed
    })
    return {"message": "Profile updated"}

@router.get("/payments")
def get_my_payments(current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["sub"])
    # only students have payments, but we check role in SP
    payments = call_stored_procedure("sp_GetStudentPayments", {"@StudentID": user_id})
    return payments

@router.get("/grades")
def get_my_grades(current_user: dict = Depends(role_required(["Student"]))):
    user_id = int(current_user["sub"])
    grades = call_stored_procedure("sp_GetStudentGrades", {"@StudentID": user_id})
    # The procedure returns two result sets; we combine them
    return {"courses": grades[:len(grades)//2] if grades else [], "assignments": grades[len(grades)//2:] if grades else []}

# Admin endpoints
@router.get("/admin/users")
def list_users(role: str = None, include_deleted: bool = False, current_user: dict = Depends(role_required(["Admin"]))):
    users = call_stored_procedure("sp_GetUsers", {"@Role": role, "@IncludeDeleted": include_deleted})
    return users

@router.put("/admin/users/{user_id}/status")
def update_user_status(user_id: int, req: UpdateUserStatusRequest, current_user: dict = Depends(role_required(["Admin"]))):
    result = call_stored_procedure("sp_UpdateUserStatus", {
        "@UserID": user_id,
        "@IsDeleted": req.is_deleted,
        "@StudentStatus": req.student_status
    })
    return {"message": "User status updated"}