from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import LoginRequest, UserRegisterRequest
from app.auth import verify_password, create_access_token, get_password_hash
from app.database import call_stored_procedure, execute_query
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login")
def login(req: LoginRequest):
    users = execute_query(
        "SELECT UserID, FullName, Email, Role, PasswordHash FROM [User] WHERE Email = ? AND IsDeleted = 0",
        {"email": req.email}
    )
    if not users:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = users[0]
    if not verify_password(req.password, user["PasswordHash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token_data = {
        "sub": str(user["UserID"]),
        "email": user["Email"],
        "fullname": user["FullName"],
        "role": user["Role"]
    }
    token = create_access_token(token_data)
    return {"access_token": token, "token_type": "bearer", "role": user["Role"]}

@router.post("/register")
def register(req: UserRegisterRequest):
    # Call stored procedure to register user
    hashed = get_password_hash(req.password)
    result = call_stored_procedure("sp_RegisterUser", {
        "@FullName": req.full_name,
        "@Email": req.email,
        "@PasswordHash": hashed,
        "@PhoneNumber": req.phone_number,
        "@Role": req.role,
        "@DateOfBirth": req.date_of_birth
    })
    if result:
        return {"message": "User registered successfully", "user_id": result[0]["UserID"], "role": result[0]["Role"]}
    raise HTTPException(status_code=500, detail="Registration failed")

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user