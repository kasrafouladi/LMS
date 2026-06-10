from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import LoginRequest, UserRegisterRequest
from app.auth import verify_password, create_access_token, get_password_hash
from app.database import call_stored_procedure, execute_query
from app.dependencies import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login")
def login(req: LoginRequest):
    logger.info(f"Login attempt for email: {req.email}")
    users = execute_query(
        "SELECT UserID, FullName, Email, Role, PasswordHash FROM `User` WHERE Email = %s AND IsDeleted = 0",
        {"email": req.email}
    )
    if not users:
        logger.warning(f"Login failed: user not found - {req.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = users[0]
    if not verify_password(req.password, user["PasswordHash"]):
        logger.warning(f"Login failed: wrong password for {req.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token_data = {
        "sub": str(user["UserID"]),
        "email": user["Email"],
        "fullname": user["FullName"],
        "role": user["Role"]
    }
    token = create_access_token(token_data)
    logger.info(f"Login successful for {req.email} (UserID: {user['UserID']})")
    return {"access_token": token, "token_type": "bearer", "role": user["Role"]}

@router.post("/register")
def register(req: UserRegisterRequest):
    if req.role not in ["Student", "Teacher"]:
        logger.warning(f"Registration rejected: invalid role {req.role} for email {req.email}")
        raise HTTPException(status_code=400, detail="Invalid role for registration")
    
    hashed = get_password_hash(req.password)
    result_sets = call_stored_procedure("sp_RegisterUser", {
        "@FullName": req.full_name,
        "@Email": req.email,
        "@PasswordHash": hashed,
        "@PhoneNumber": req.phone_number,
        "@Role": req.role,
        "@DateOfBirth": req.date_of_birth
    })
    if result_sets and len(result_sets) > 0 and len(result_sets[0]) > 0:
        user_data = result_sets[0][0]
        logger.info(f"User registered successfully: {req.email} (UserID: {user_data['UserID']}, Role: {user_data['Role']})")
        return {
            "message": "User registered successfully",
            "user_id": user_data["UserID"],
            "role": user_data["Role"]
        }
    logger.error(f"Registration failed for {req.email}")
    raise HTTPException(status_code=500, detail="Registration failed")

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    logger.info(f"Profile requested for user {current_user.get('email')} (ID: {current_user.get('sub')})")
    return current_user