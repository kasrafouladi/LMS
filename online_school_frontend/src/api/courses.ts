import { request } from './client';

export interface Course {
  CourseID: number;
  Title: string;
  Description?: string;
  TeacherID: number;
  TeacherName?: string;
  Price: number;
  StartDate: string;
  EndDate: string;
  Capacity: number;
  EnrolledCount?: number;
  Status?: string;
}

export interface CourseAssignment {
  AssignmentID: number;
  Title: string;
  Description?: string;
  DueDate: string;
  MaxScore: number;
  SubmissionID?: number | null;
  SubmissionDate?: string | null;
  SubmissionURL?: string | null;
  Score?: number | null;
  Feedback?: string | null;
  SubmissionStatus?: 'Submitted' | 'Missed' | 'Pending';
  SubmissionCount?: number;
}

export interface CourseStudent {
  StudentID: number;
  FullName: string;
  Email: string;
  EnrollmentDate: string;
  EnrollmentStatus: string;
  FinalScore?: number | null;
  ProgressPercent: number;
  GPA?: number;
}

export function listCourses(params?: {
  status?: string;
  teacher_id?: number;
  min_price?: number;
  max_price?: number;
  search?: string;
}) {
  return request<Course[]>('/courses/', { params });
}

export function getCourseDetails(courseId: number) {
  return request<{ course: Course; assignments: CourseAssignment[]; students: CourseStudent[] }>(
    `/courses/${courseId}`
  );
}

export function createCourse(data: {
  title: string;
  description?: string;
  price: number;
  start_date: string;
  end_date: string;
  capacity: number;
}) {
  return request('/courses/', { method: 'POST', body: data });
}

export function updateCourse(
  courseId: number,
  data: {
    title?: string;
    description?: string;
    price?: number;
    start_date?: string;
    end_date?: string;
    capacity?: number;
    status?: string;
  }
) {
  return request(`/courses/${courseId}`, { method: 'PUT', body: data });
}

export function deleteCourse(courseId: number) {
  return request(`/courses/${courseId}`, { method: 'DELETE' });
}

export function getCourseAssignments(courseId: number) {
  return request<CourseAssignment[]>(`/courses/${courseId}/assignments`);
}