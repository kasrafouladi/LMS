from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import date
from app.dependencies import role_required
from app.database import call_stored_procedure, execute_query

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/")
def get_my_payments(
    current_user: dict = Depends(role_required(["Student", "Admin"]))
):
    """
    دریافت لیست پرداخت‌ها.
    - دانشجو: فقط پرداخت‌های خود را می‌بیند.
    - ادمین: تمام پرداخت‌ها را می‌بیند (بدون فیلتر اضافی – در صورت نیاز فیلترهای پیشرفته در endpoint جداگانه).
    """
    user_id = int(current_user["sub"])
    user_role = current_user["role"]

    if user_role == "Student":
        payments = call_stored_procedure("sp_GetStudentPayments", {"@StudentID": user_id})
        return payments
    elif user_role == "Admin":
        # ادمین می‌تواند همه پرداخت‌ها را بدون فیلتر ببیند
        payments = execute_query("""
            SELECT p.PaymentID, p.StudentID, u.FullName AS StudentName,
                   p.CourseID, c.Title AS CourseTitle,
                   p.Amount, p.PaymentDate, p.Status, p.TransactionID
            FROM dbo.Payment p
            INNER JOIN dbo.[User] u ON p.StudentID = u.UserID
            INNER JOIN dbo.Course c ON p.CourseID = c.CourseID
            ORDER BY p.PaymentDate DESC
        """)
        return payments


@router.get("/admin/all")
def list_all_payments_admin(
    student_id: Optional[int] = Query(None),
    course_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None, regex="^(Pending|Successful|Failed|Refunded)$"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: dict = Depends(role_required(["Admin"]))
):
    """
    ادمین: دریافت همه پرداخت‌ها با فیلترهای پیشرفته.
    """
    query = """
        SELECT p.PaymentID, p.StudentID, u.FullName AS StudentName,
               p.CourseID, c.Title AS CourseTitle,
               p.Amount, p.PaymentDate, p.Status, p.TransactionID
        FROM dbo.Payment p
        INNER JOIN dbo.[User] u ON p.StudentID = u.UserID
        INNER JOIN dbo.Course c ON p.CourseID = c.CourseID
        WHERE 1=1
    """
    params = {}
    conditions = []

    if student_id:
        conditions.append("p.StudentID = @StudentID")
        params["@StudentID"] = student_id
    if course_id:
        conditions.append("p.CourseID = @CourseID")
        params["@CourseID"] = course_id
    if status:
        conditions.append("p.Status = @Status")
        params["@Status"] = status
    if start_date:
        conditions.append("p.PaymentDate >= @StartDate")
        params["@StartDate"] = start_date
    if end_date:
        conditions.append("p.PaymentDate <= @EndDate")
        params["@EndDate"] = end_date

    if conditions:
        query += " AND " + " AND ".join(conditions)

    query += " ORDER BY p.PaymentDate DESC"

    payments = execute_query(query, params)
    return payments


@router.get("/{payment_id}")
def get_payment_detail(
    payment_id: int,
    current_user: dict = Depends(role_required(["Student", "Admin"]))
):
    """
    مشاهده جزئیات یک پرداخت خاص.
    - دانشجو: فقط در صورتی که مالک آن باشد.
    - ادمین: هر پرداختی را می‌تواند ببیند.
    """
    user_id = int(current_user["sub"])
    user_role = current_user["role"]

    payment = execute_query(
        """
        SELECT p.PaymentID, p.StudentID, u.FullName AS StudentName,
               p.CourseID, c.Title AS CourseTitle,
               p.Amount, p.PaymentDate, p.Status, p.TransactionID
        FROM dbo.Payment p
        INNER JOIN dbo.[User] u ON p.StudentID = u.UserID
        INNER JOIN dbo.Course c ON p.CourseID = c.CourseID
        WHERE p.PaymentID = @PaymentID
        """,
        {"@PaymentID": payment_id}
    )

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment = payment[0]

    if user_role == "Student" and payment["StudentID"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied to this payment")

    return payment


@router.post("/retry/{payment_id}")
def retry_failed_payment(
    payment_id: int,
    current_user: dict = Depends(role_required(["Student"]))
):
    """
    تلاش مجدد برای پرداخت ناموفق (فقط دانشجو برای پرداخت خودش).
    توجه: این فقط یک نمونه ساده است. در عمل باید با درگاه پرداخت ارتباط برقرار کنید.
    """
    user_id = int(current_user["sub"])

    # بررسی وجود پرداخت و تعلق آن به کاربر
    payment = execute_query(
        "SELECT StudentID, Status, Amount, CourseID FROM dbo.Payment WHERE PaymentID = @PaymentID",
        {"@PaymentID": payment_id}
    )
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    payment = payment[0]

    if payment["StudentID"] != user_id:
        raise HTTPException(status_code=403, detail="You can only retry your own payments")
    if payment["Status"] != "Failed":
        raise HTTPException(status_code=400, detail="Only failed payments can be retried")

    # شبیه‌سازی درخواست جدید به درگاه پرداخت (در اینجا فقط وضعیت را به Pending تغییر می‌دهیم)
    execute_query(
        "UPDATE dbo.Payment SET Status = 'Pending' WHERE PaymentID = @PaymentID",
        {"@PaymentID": payment_id}
    )

    return {"message": "Payment retry initiated. Please complete the payment process.", "payment_id": payment_id}


@router.get("/admin/summary")
def payment_summary(
    current_user: dict = Depends(role_required(["Admin"]))
):
    """
    خلاصه آماری از وضعیت پرداخت‌ها (فقط ادمین).
    """
    summary = execute_query("""
        SELECT
            SUM(CASE WHEN Status = 'Successful' THEN Amount ELSE 0 END) AS TotalSuccessful,
            SUM(CASE WHEN Status = 'Refunded' THEN Amount ELSE 0 END) AS TotalRefunded,
            COUNT(CASE WHEN Status = 'Successful' THEN 1 END) AS SuccessfulCount,
            COUNT(CASE WHEN Status = 'Failed' THEN 1 END) AS FailedCount,
            COUNT(CASE WHEN Status = 'Pending' THEN 1 END) AS PendingCount,
            COUNT(CASE WHEN Status = 'Refunded' THEN 1 END) AS RefundedCount
        FROM dbo.Payment
    """)
    return summary[0] if summary else {}