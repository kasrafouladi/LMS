from fastapi import FastAPI
from app.routers import auth, users, courses, enrollments, assignments, attendance, certificates, reports, views, submissions
app = FastAPI(title="Online School API", version="2.0.0")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(enrollments.router)
app.include_router(assignments.router)
app.include_router(attendance.router)
app.include_router(certificates.router)
app.include_router(reports.router)
app.include_router(views.router)
app.include_router(submissions.router)

@app.get("/")
def root():
    return {"message": "Online School API (Full Version) is running"}