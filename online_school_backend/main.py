from fastapi import FastAPI
from app.routers import auth, users, courses, enrollments, assignments, attendance, certificates, payments, reports, views, submissions, announcements

import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)

app = FastAPI(title="Online School API", version="2.0.0")

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(enrollments.router)
app.include_router(assignments.router)
app.include_router(attendance.router)
app.include_router(certificates.router)
app.include_router(payments.router)
app.include_router(reports.router)
app.include_router(views.router)
app.include_router(submissions.router)
app.include_router(announcements.router)   # <-- NEW

@app.get("/")
def root():
    return {"message": "Online School API (Full Version) is running"}