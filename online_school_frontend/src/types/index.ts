// ─── Domain 1: User ───────────────────────────────────────────────────────────
export type UserRole = 'Admin' | 'Teacher' | 'Student';
export type UserStatus = 'Active' | 'Inactive';

export interface User {
  userID: number;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phoneNumber?: string;
  registrationDate: string;
}

// ─── Domain 2: Student ────────────────────────────────────────────────────────
export interface Student {
  studentID: number; // FK → UserID
  fullName: string;
  email: string;
  dateOfBirth?: string;
  gpa: number; // 0–20
  status: UserStatus;
}

// ─── Domain 3: Teacher ────────────────────────────────────────────────────────
export interface Teacher {
  teacherID: number; // FK → UserID
  fullName: string;
  email: string;
  expertise: string;
  hireDate: string;
  totalIncome: number;
}

// ─── Domain 4: Course ─────────────────────────────────────────────────────────
export type CourseStatus = 'Active' | 'Completed' | 'Cancelled';

export interface Course {
  courseID: number;
  title: string;
  description: string;
  teacherID: number;
  teacherName?: string;
  price: number;
  startDate: string;
  endDate: string;
  capacity: number;
  enrolledCount?: number;
  status?: CourseStatus;
}

// ─── Domain 5: Enrollment ─────────────────────────────────────────────────────
export type EnrollmentStatus = 'Pending' | 'Successful' | 'Failed';

export interface Enrollment {
  enrollmentID: number;
  studentID: number;
  studentName?: string;
  courseID: number;
  courseTitle?: string;
  enrollmentDate: string;
  status: EnrollmentStatus;
  finalScore?: number;
}

// ─── Domain 6: Assignment ─────────────────────────────────────────────────────
export interface Assignment {
  assignmentID: number;
  courseID: number;
  courseTitle?: string;
  title: string;
  dueDate: string;
  maxScore: number;
}

// ─── Domain 7: Submission ─────────────────────────────────────────────────────
export interface Submission {
  submissionID: number;
  assignmentID: number;
  assignmentTitle?: string;
  studentID: number;
  studentName?: string;
  submissionDate: string;
  fileURL: string;
  score?: number;
  feedback?: string;
}

// ─── Domain 8: Payment ────────────────────────────────────────────────────────
export type PaymentStatus = 'Successful' | 'Failed' | 'Pending';

export interface Payment {
  paymentID: number;
  studentID: number;
  studentName?: string;
  courseID: number;
  courseTitle?: string;
  amount: number;
  paymentDate: string;
  status: PaymentStatus;
  transactionID: string;
}

// ─── Domain 9: Attendance ─────────────────────────────────────────────────────
export type AttendanceStatus = 'Present' | 'Absent';

export interface Attendance {
  attendanceID: number;
  studentID: number;
  studentName?: string;
  courseID: number;
  courseTitle?: string;
  date: string;
  status: AttendanceStatus;
}

// ─── Domain 10: Certificate ───────────────────────────────────────────────────
export interface Certificate {
  certificateID: number;
  studentID: number;
  studentName?: string;
  courseID: number;
  courseTitle?: string;
  issueDate: string;
  certificateCode: string;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

export interface StatCardData {
  title: string;
  value: string | number;
  icon: string;
  trend?: number;
  color: 'blue' | 'green' | 'amber' | 'rose' | 'violet' | 'teal';
}
