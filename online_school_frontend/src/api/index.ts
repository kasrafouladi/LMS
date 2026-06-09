import { request } from './client';

// ─── Enrollments ──────────────────────────────────────────────────────────────
export function enrollStudent(data: {
  student_id: number;
  course_id: number;
  amount: number;
  transaction_id?: string;
}) {
  return request('/enrollments/enroll', { method: 'POST', body: data });
}

export function cancelEnrollment(enrollment_id: number) {
  return request('/enrollments/cancel', { method: 'POST', body: { enrollment_id } });
}

// ─── Assignments ──────────────────────────────────────────────────────────────
export function createAssignment(data: {
  course_id: number;
  title: string;
  due_date: string;
  max_score: number;
}) {
  return request('/assignments/create', { method: 'POST', body: data });
}

export function updateAssignment(
  assignmentId: number,
  data: { title?: string; due_date?: string; max_score?: number }
) {
  return request(`/assignments/update/${assignmentId}`, { method: 'PUT', body: data });
}

export function deleteAssignment(assignmentId: number) {
  return request(`/assignments/delete/${assignmentId}`, { method: 'DELETE' });
}

export function submitAssignment(data: {
  assignment_id: number;
  student_id: number;
  file_url: string;
}) {
  return request('/assignments/submit', { method: 'POST', body: data });
}

export function gradeSubmission(data: {
  submission_id: number;
  score: number;
  feedback?: string;
}) {
  return request('/assignments/grade', { method: 'POST', body: data });
}

export function getSubmissionsForGrading(params: {
  course_id?: number;
  assignment_id?: number;
}) {
  return request('/submissions/list', { params });
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export function recordAttendance(data: {
  student_id: number;
  course_id: number;
  session_date: string;
  status: 'Present' | 'Absent';
}) {
  return request('/attendance/record', { method: 'POST', body: data });
}

// ─── Certificates ─────────────────────────────────────────────────────────────
export function issueCertificates(course_id?: number) {
  return request('/certificates/issue', { method: 'POST', params: { course_id } });
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export function reportTopStudents(top_n = 10) {
  return request('/reports/top-students', { params: { top_n } });
}

export function reportTeacherIncome(start_date: string, end_date: string) {
  return request('/reports/teacher-income', { params: { start_date, end_date } });
}

export function reportPopularCourses() {
  return request('/reports/popular-courses');
}

export function reportCourseEnrollments(course_id?: number) {
  return request('/reports/course-enrollments', { params: { course_id } });
}

export function reportInactiveStudents(days = 60) {
  return request('/reports/inactive-students', { params: { days } });
}

export function reportFailedPayments(start_date: string, end_date: string) {
  return request('/reports/failed-payments', { params: { start_date, end_date } });
}

export function reportMonthlyIncome(year?: number) {
  return request('/reports/monthly-income', { params: { year } });
}

export function reportTeacherRanking(basis = 'Income') {
  return request('/reports/teacher-ranking', { params: { basis } });
}

export function reportAttendance(student_id: number, course_id: number) {
  return request('/reports/attendance', { params: { student_id, course_id } });
}

// ─── Views ────────────────────────────────────────────────────────────────────
export function getStudentTranscript() {
  return request('/views/student-transcript');
}

export function getTeacherDashboard() {
  return request('/views/teacher-dashboard');
}

export function getCourseStatistics() {
  return request('/views/course-statistics');
}

export function getFinancialSummary() {
  return request('/views/financial-summary');
}

export function getStudentCertificates() {
  return request('/views/student-certificates');
}
