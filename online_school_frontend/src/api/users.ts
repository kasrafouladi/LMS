import { request } from './client';

export function getProfile() {
  return request('/users/profile');
}

export function updateProfile(data: {
  full_name?: string;
  phone_number?: string;
  password?: string;
}) {
  return request('/users/profile', { method: 'PUT', body: data });
}

export function getMyPayments() {
  return request('/users/payments');
}

export function getMyGrades() {
  return request<{ courses: unknown[]; assignments: unknown[] }>('/users/grades');
}

// ── Admin ──────────────────────────────────────────────────────────────────────
export function listUsers(role?: string, include_deleted = false) {
  return request('/users/admin/users', { params: { role, include_deleted } });
}

export function updateUserStatus(
  userId: number,
  data: { is_deleted?: boolean; student_status?: string }
) {
  return request(`/users/admin/users/${userId}/status`, { method: 'PUT', body: data });
}
