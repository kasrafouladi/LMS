from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import date
from app.dependencies import role_required
from app.database import call_stored_procedure, execute_query
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.get("/")
def get_my_payments(current_user: dict = Depends(role_required(["Student", "Admin"]))):
    user_id = int(current_user["sub"])
    user_role = current_user["role"]
    logger.info(f"{user_role} {user_id} fetching payments")
    if user_role == "Student":
        result_sets = call_stored_procedure("sp_GetStudentPayments", {"@StudentID": user_id})
        payments = result_sets[0] if result_sets else []
        logger.info(f"Found {len(payments)} payments for student {user_id}")
        return payments
    elif user_role == "Admin":
        payments = execute_query("""
            SELECT p.PaymentID, p.StudentID, u.FullName AS StudentName,
                   p.CourseID, c.Title AS CourseTitle,
                   p.Amount, p.PaymentDate, p.Status, p.TransactionID
            FROM Payment p
            INNER JOIN `User` u ON p.StudentID = u.UserID
            INNER JOIN Course c ON p.CourseID = c.CourseID
            ORDER BY p.PaymentDate DESC
        """)
        logger.info(f"Admin {user_id} fetched {len(payments)} payments")
        return payments

@router.get("/admin/all")
def list_all_payments_admin(
    student_id: Optional[int] = Query(None),
    course_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None, pattern="^(Pending|Successful|Failed|Refunded)$"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: dict = Depends(role_required(["Admin"]))
):
    admin_id = int(current_user["sub"])
    logger.info(f"Admin {admin_id} listing all payments with filters")
    query = """
        SELECT p.PaymentID, p.StudentID, u.FullName AS StudentName,
               p.CourseID, c.Title AS CourseTitle,
               p.Amount, p.PaymentDate, p.Status, p.TransactionID
        FROM Payment p
        INNER JOIN `User` u ON p.StudentID = u.UserID
        INNER JOIN Course c ON p.CourseID = c.CourseID
        WHERE 1=1
    """
    params = {}
    conditions = []

    if student_id:
        conditions.append("p.StudentID = %s")
        params["StudentID"] = student_id
    if course_id:
        conditions.append("p.CourseID = %s")
        params["CourseID"] = course_id
    if status:
        conditions.append("p.Status = %s")
        params["Status"] = status
    if start_date:
        conditions.append("p.PaymentDate >= %s")
        params["StartDate"] = start_date
    if end_date:
        conditions.append("p.PaymentDate <= %s")
        params["EndDate"] = end_date

    if conditions:
        query += " AND " + " AND ".join(conditions)

    query += " ORDER BY p.PaymentDate DESC"

    payments = execute_query(query, params)
    logger.info(f"Admin {admin_id} fetched {len(payments)} payments with filters")
    return payments

@router.get("/{payment_id}")
def get_payment_detail(payment_id: int, current_user: dict = Depends(role_required(["Student", "Admin"]))):
    user_id = int(current_user["sub"])
    user_role = current_user["role"]
    logger.info(f"{user_role} {user_id} fetching payment detail for {payment_id}")
    payment = execute_query(
        """
        SELECT p.PaymentID, p.StudentID, u.FullName AS StudentName,
               p.CourseID, c.Title AS CourseTitle,
               p.Amount, p.PaymentDate, p.Status, p.TransactionID
        FROM Payment p
        INNER JOIN `User` u ON p.StudentID = u.UserID
        INNER JOIN Course c ON p.CourseID = c.CourseID
        WHERE p.PaymentID = %s
        """,
        {"PaymentID": payment_id}
    )
    if not payment:
        logger.warning(f"Payment {payment_id} not found")
        raise HTTPException(status_code=404, detail="Payment not found")
    payment = payment[0]
    if user_role == "Student" and payment["StudentID"] != user_id:
        logger.warning(f"Student {user_id} attempted to access payment {payment_id} belonging to student {payment['StudentID']}")
        raise HTTPException(status_code=403, detail="Access denied to this payment")
    logger.info(f"Payment {payment_id} details returned to {user_role} {user_id}")
    return payment

@router.post("/retry/{payment_id}")
def retry_failed_payment(payment_id: int, current_user: dict = Depends(role_required(["Student"]))):
    user_id = int(current_user["sub"])
    logger.info(f"Student {user_id} retrying payment {payment_id}")
    payment = execute_query(
        "SELECT StudentID, Status, Amount, CourseID FROM Payment WHERE PaymentID = %s",
        {"PaymentID": payment_id}
    )
    if not payment:
        logger.warning(f"Payment {payment_id} not found")
        raise HTTPException(status_code=404, detail="Payment not found")
    payment = payment[0]
    if payment["StudentID"] != user_id:
        logger.warning(f"Student {user_id} attempted to retry payment {payment_id} belonging to student {payment['StudentID']}")
        raise HTTPException(status_code=403, detail="You can only retry your own payments")
    if payment["Status"] != "Failed":
        logger.warning(f"Payment {payment_id} status is {payment['Status']}, not Failed")
        raise HTTPException(status_code=400, detail="Only failed payments can be retried")
    execute_query(
        "UPDATE Payment SET Status = 'Pending' WHERE PaymentID = %s",
        {"PaymentID": payment_id}
    )
    logger.info(f"Payment {payment_id} retry initiated")
    return {"message": "Payment retry initiated. Please complete the payment process.", "payment_id": payment_id}

@router.get("/admin/summary")
def payment_summary(current_user: dict = Depends(role_required(["Admin"]))):
    admin_id = int(current_user["sub"])
    logger.info(f"Admin {admin_id} fetching payment summary")
    summary = execute_query("""
        SELECT
            SUM(CASE WHEN Status = 'Successful' THEN Amount ELSE 0 END) AS TotalSuccessful,
            SUM(CASE WHEN Status = 'Refunded' THEN Amount ELSE 0 END) AS TotalRefunded,
            COUNT(CASE WHEN Status = 'Successful' THEN 1 END) AS SuccessfulCount,
            COUNT(CASE WHEN Status = 'Failed' THEN 1 END) AS FailedCount,
            COUNT(CASE WHEN Status = 'Pending' THEN 1 END) AS PendingCount,
            COUNT(CASE WHEN Status = 'Refunded' THEN 1 END) AS RefundedCount
        FROM Payment
    """)
    result = summary[0] if summary else {}
    logger.info(f"Payment summary returned to admin {admin_id}")
    return result